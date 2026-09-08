import { describe, expect, it } from "vitest";

import { Game } from "./game.js";
import type { GameConfig } from "./game.js";
import { asPlayerId } from "./primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const deck = (n: number): string[] =>
  Array.from({ length: n }, (_, i) => (i % 2 === 0 ? "Forest" : "Grizzly Bears"));

const newGame = (overrides: Partial<GameConfig> = {}): Game =>
  Game.create({
    seed: 42,
    mulligans: true,
    decks: [
      { player: A, cards: deck(40) },
      { player: B, cards: deck(40) },
    ],
    ...overrides,
  });

const deciding = (taken = 0) => ({ taken, step: "decide" as const });

describe("mulligans (opt-in via GameConfig.mulligans)", () => {
  it("does nothing to Game.create's default behavior when the flag is omitted", () => {
    const game = Game.create({
      seed: 42,
      decks: [
        { player: A, cards: deck(40) },
        { player: B, cards: deck(40) },
      ],
    });
    expect(game.state.awaiting).toBeNull();
    expect(game.state.turn.number).toBe(1);
    expect(game.state.turn.step).toBe("untap");
  });

  it("asks every player at once — parallel, not turn order", () => {
    const game = newGame();
    expect(game.state.turn.number).toBe(0);
    expect(game.state.awaiting).toEqual({
      kind: "mulligan",
      player: A,
      hands: { alice: deciding(), bob: deciding() },
    });
    expect(game.legalActions(A)).toEqual([{ kind: "mulligan", count: 0 }]);
    expect(game.legalActions(B)).toEqual([{ kind: "mulligan", count: 0 }]);
  });

  it("a player who has kept is removed from the phase; it ends when all have", () => {
    const game = newGame();
    game.dispatch({ type: "mulligan", player: A, keep: true });
    expect(game.state.awaiting).toEqual({
      kind: "mulligan",
      player: B,
      hands: { bob: deciding() },
    });
    expect(game.legalActions(A)).toEqual([]);

    game.dispatch({ type: "mulligan", player: B, keep: true });
    expect(game.state.awaiting).toBeNull();
    expect(game.state.turn.number).toBe(1);
    expect(game.state.turn.step).toBe("untap");
    expect(game.handOf(A)).toHaveLength(7);
    expect(game.handOf(B)).toHaveLength(7);
  });

  it("a later-seated player can keep before an earlier one has decided", () => {
    const game = newGame();
    game.dispatch({ type: "mulligan", player: B, keep: true });
    expect(game.state.awaiting).toEqual({
      kind: "mulligan",
      player: A,
      hands: { alice: deciding() },
    });

    game.dispatch({ type: "mulligan", player: A, keep: true });
    expect(game.state.awaiting).toBeNull();
    expect(game.state.turn.number).toBe(1);
  });

  it("one player mulliganing doesn't touch another player's hand or phase state", () => {
    const game = newGame();
    const bHand = [...game.handOf(B)];
    game.dispatch({ type: "mulligan", player: A, keep: false });
    expect(game.state.awaiting).toEqual({
      kind: "mulligan",
      player: A,
      hands: { alice: deciding(1), bob: deciding() },
    });
    expect(game.handOf(A)).toHaveLength(7);
    expect([...game.handOf(B)]).toEqual(bHand);
    const mulliganEvents = game.events.filter((e) => e.type === "mulligan-taken");
    expect(mulliganEvents).toEqual([
      { ...mulliganEvents[0], type: "mulligan-taken", player: A, count: 1 },
    ]);
  });

  it("is uncapped: repeated mulligans keep incrementing the count", () => {
    const game = newGame();
    game.dispatch({ type: "mulligan", player: A, keep: false });
    game.dispatch({ type: "mulligan", player: A, keep: false });
    game.dispatch({ type: "mulligan", player: A, keep: false });
    expect((game.state.awaiting as { hands: Record<string, unknown> }).hands.alice).toEqual(
      deciding(3),
    );
  });

  it("keeping after mulligans asks to put that many cards on the bottom", () => {
    const game = newGame();
    game.dispatch({ type: "mulligan", player: A, keep: false });
    game.dispatch({ type: "mulligan", player: A, keep: false });
    game.dispatch({ type: "mulligan", player: A, keep: true });

    expect(game.state.awaiting).toEqual({
      kind: "mulligan",
      player: A,
      hands: { alice: { taken: 2, step: "bottom" }, bob: deciding() },
    });
    expect(game.legalActions(A)).toEqual([
      { kind: "put-on-bottom", count: 2, from: [...game.handOf(A)] },
    ]);
    // The hand is still 7 until the bottoming actually happens.
    expect(game.handOf(A)).toHaveLength(7);
  });

  it("rejects putting the wrong number of cards, a duplicate, or a card not in hand", () => {
    const game = newGame();
    game.dispatch({ type: "mulligan", player: A, keep: false });
    game.dispatch({ type: "mulligan", player: A, keep: false });
    game.dispatch({ type: "mulligan", player: A, keep: true });
    const hand = [...game.handOf(A)];

    expect(() =>
      game.dispatch({ type: "put-on-bottom", player: A, cards: [] }),
    ).toThrow(/must put exactly 2/);
    expect(() =>
      game.dispatch({ type: "put-on-bottom", player: A, cards: [hand[0], hand[0]] }),
    ).toThrow(/same card twice/);
    expect(() =>
      game.dispatch({
        type: "put-on-bottom",
        player: A,
        cards: [hand[0], game.handOf(B)[0]],
      }),
    ).toThrow(/not in hand/);
  });

  it("bottoming moves the chosen cards to the library's bottom and finishes that player", () => {
    const game = newGame();
    game.dispatch({ type: "mulligan", player: A, keep: false });
    game.dispatch({ type: "mulligan", player: A, keep: true });
    const hand = [...game.handOf(A)];
    const bottomed = hand[0];

    game.dispatch({ type: "put-on-bottom", player: A, cards: [bottomed] });

    expect(game.handOf(A)).toHaveLength(6);
    expect(game.libraryOf(A)).toHaveLength(34);
    expect(game.libraryOf(A).at(-1)).toBe(bottomed);
    expect(game.state.awaiting).toEqual({
      kind: "mulligan",
      player: B,
      hands: { bob: deciding() },
    });

    game.dispatch({ type: "mulligan", player: B, keep: true });
    expect(game.state.awaiting).toBeNull();
    expect(game.state.turn.number).toBe(1);
  });

  it("a 3-player game — all three asked at once, resolved in any order", () => {
    const game = Game.create({
      seed: 7,
      mulligans: true,
      decks: [
        { player: A, cards: deck(40) },
        { player: B, cards: deck(40) },
        { player: C, cards: deck(40) },
      ],
    });
    for (const p of [A, B, C]) {
      expect(game.legalActions(p)).toEqual([{ kind: "mulligan", count: 0 }]);
    }
    game.dispatch({ type: "mulligan", player: C, keep: true });
    game.dispatch({ type: "mulligan", player: A, keep: true });
    expect(game.state.awaiting).toEqual({
      kind: "mulligan",
      player: B,
      hands: { bob: deciding() },
    });
    game.dispatch({ type: "mulligan", player: B, keep: true });
    expect(game.state.turn.number).toBe(1);
  });

  it("works alongside a configured commander, which stays in the command zone throughout", () => {
    const game = Game.create({
      seed: 1,
      mulligans: true,
      decks: [
        { player: A, cards: deck(40), commander: "Ashmark, Mardu Vanguard" },
        { player: B, cards: deck(40) },
      ],
    });
    const commanderId = game.state.zones.shared.command.find(
      (id) => game.state.objects[id].owner === A,
    )!;

    game.dispatch({ type: "mulligan", player: A, keep: false });
    game.dispatch({ type: "mulligan", player: A, keep: true });
    game.dispatch({ type: "put-on-bottom", player: A, cards: [game.handOf(A)[0]] });
    game.dispatch({ type: "mulligan", player: B, keep: true });

    expect(game.state.objects[commanderId].zone).toBe("command");
    expect(game.state.turn.number).toBe(1);
  });
});
