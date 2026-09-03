import { describe, expect, it } from "vitest";

import { Game } from "./game.js";
import type { GameConfig } from "./game.js";
import { asPlayerId } from "./primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const deck = (n: number): string[] =>
  Array.from({ length: n }, (_, i) => (i % 2 === 0 ? "Forest" : "Grizzly Bears"));

const newGame = (overrides: Partial<GameConfig> = {}): Game =>
  Game.create({
    seed: 42,
    decks: [
      { player: A, cards: deck(40) },
      { player: B, cards: deck(40) },
    ],
    ...overrides,
  });

const names = (game: Game, ids: readonly string[]): string[] =>
  ids.map((id) => game.state.objects[id as never].cardName);

describe("setup", () => {
  it("deals opening hands and orders the turn", () => {
    const game = newGame();
    expect(game.handOf(A)).toHaveLength(7);
    expect(game.handOf(B)).toHaveLength(7);
    expect(game.libraryOf(A)).toHaveLength(33);
    expect(game.state.startingPlayer).toBe(A);
    expect(game.state.turn.number).toBe(1);
    expect(game.state.turn.step).toBe("untap");
    expect(game.activePlayer).toBe(A);
  });

  it("records game-started as the first event", () => {
    const game = newGame();
    expect(game.events[0].type).toBe("game-started");
  });

  it("is deterministic for a given seed", () => {
    const a = newGame();
    const b = newGame();
    expect(names(a, [...a.handOf(A)])).toEqual(names(b, [...b.handOf(A)]));
    expect(names(a, [...a.libraryOf(B)])).toEqual(names(b, [...b.libraryOf(B)]));
  });

  it("rejects anything but two players", () => {
    expect(() =>
      Game.create({ decks: [{ player: A, cards: deck(40) }] }),
    ).toThrow();
  });

  it("rejects an unknown card in a deck list", () => {
    expect(() =>
      Game.create({
        decks: [
          { player: A, cards: ["Black Lotus"] },
          { player: B, cards: deck(40) },
        ],
      }),
    ).toThrow(/unknown card/);
  });
});

describe("turn and step progression", () => {
  it("walks every step of turn 1 in order", () => {
    const game = newGame();
    game.advanceUntil((s) => s.turn.number === 2);
    const steps = game
      .eventsOfType("step-began")
      .slice(0, 12)
      .map((event) => event.step);
    expect(steps).toEqual([
      "untap",
      "upkeep",
      "draw",
      "precombat-main",
      "begin-combat",
      "declare-attackers",
      "declare-blockers",
      "combat-damage",
      "end-combat",
      "postcombat-main",
      "end",
      "cleanup",
    ]);
  });

  it("alternates the active player each turn", () => {
    const game = newGame();
    game.advanceUntil((s) => s.turn.number === 4);
    const turns = game.eventsOfType("turn-began").slice(0, 3);
    expect(turns.map((t) => t.activePlayer)).toEqual([A, B, A]);
  });
});

describe("priority", () => {
  it("gives the active player priority first in each step", () => {
    const game = newGame();
    game.advanceUntil((s) => s.turn.step === "upkeep");
    const first = game.eventsOfType("priority-received")[0];
    expect(first.player).toBe(A);
  });

  it("ends the step once both players pass in succession", () => {
    const game = newGame();
    game.advanceUntil((s) => s.turn.step === "draw" && s.turn.number === 1);
    // Reaching the draw step means upkeep's priority round resolved on its own.
    const upkeepStart = game
      .eventsOfType("step-began")
      .findIndex((e) => e.step === "upkeep");
    const drawStart = game
      .eventsOfType("step-began")
      .findIndex((e) => e.step === "draw");
    expect(upkeepStart).toBeGreaterThanOrEqual(0);
    expect(drawStart).toBeGreaterThan(upkeepStart);
  });

  it("rejects a pass from a player who does not hold priority", () => {
    const game = newGame();
    game.advanceUntil((s) => s.turn.step === "upkeep");
    expect(() => game.dispatch({ type: "pass-priority", player: B })).toThrow(
      /does not have priority/,
    );
  });
});

describe("turn-based actions", () => {
  it("has the starting player skip only their first draw", () => {
    const game = newGame();
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    const draws = game.eventsOfType("card-drawn").filter((e) => e.player === A);
    // Opening hand = 7 draws. Turn 1 skipped. Turn 3 draw has just happened.
    expect(draws).toHaveLength(7 + 1);
    expect(game.eventsOfType("draw-from-empty-library")).toHaveLength(0);
  });

  it("does not skip the first draw when the rule is disabled", () => {
    const game = newGame({ rules: { skipFirstDraw: false } });
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "draw");
    const draws = game.eventsOfType("card-drawn").filter((e) => e.player === A);
    expect(draws).toHaveLength(7 + 1);
  });

  it("discards down to maximum hand size in the cleanup step", () => {
    const game = newGame();
    // Turn 2 is Bob's: he draws to 8, then discards 1 in his cleanup.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "cleanup");
    expect(game.handOf(B)).toHaveLength(7);
    const discards = game.eventsOfType("cards-discarded");
    expect(discards).toHaveLength(1);
    expect(discards[0].player).toBe(B);
    expect(discards[0].objects).toHaveLength(1);
    expect(game.graveyardOf(B)).toHaveLength(1);
  });
});

describe("loss conditions", () => {
  it("a player who draws from an empty library loses and the other wins", () => {
    const game = Game.create({
      seed: 1,
      decks: [
        { player: A, cards: deck(8) }, // 7 to hand, 1 left in library
        { player: B, cards: deck(40) },
      ],
    });
    game.advance();
    expect(game.isOver).toBe(true);
    expect(game.winner).toBe(B);
    expect(game.state.players[A].hasLost).toBe(true);
    expect(game.state.players[A].lossReason).toMatch(/empty library/);
    const last = game.events[game.events.length - 1];
    expect(last.type).toBe("game-ended");
    expect(game.eventsOfType("player-lost")).toHaveLength(1);
  });

  it("a player at 0 life loses", () => {
    const game = newGame();
    game.advanceUntil((s) => s.turn.number === 2);
    game.state.players[A].life = 0;
    game.advance();
    expect(game.winner).toBe(B);
    expect(game.state.players[A].lossReason).toMatch(/life total/);
  });

  it("every game terminates", () => {
    const game = newGame();
    game.advance();
    expect(game.isOver).toBe(true);
    expect(game.winner).not.toBeNull();
  });
});

describe("snapshot / restore", () => {
  it("restores to an identical state", () => {
    const game = newGame();
    game.advanceUntil((s) => s.turn.number === 3);
    const snap = game.snapshot();
    const restored = Game.fromSnapshot(snap);
    expect(restored.state).toEqual(snap);
  });

  it("replays deterministically from a snapshot", () => {
    const game = newGame();
    game.advanceUntil((s) => s.turn.number === 3);
    const snap = game.snapshot();

    game.advance();
    const restored = Game.fromSnapshot(snap);
    restored.advance();

    expect(restored.winner).toBe(game.winner);
    expect(restored.state.turn.number).toBe(game.state.turn.number);
    expect(restored.state.eventSeq).toBe(game.state.eventSeq);
  });

  it("does not share mutable state with its source game", () => {
    const game = newGame();
    const snap = game.snapshot();
    const restored = Game.fromSnapshot(snap);
    restored.advance();
    expect(game.state.turn.number).toBe(1);
    expect(game.isOver).toBe(false);
  });
});
