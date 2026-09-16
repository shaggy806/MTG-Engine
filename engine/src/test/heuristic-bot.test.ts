import { describe, expect, it } from "vitest";

import type { PlayerController } from "../controller.js";
import { AutomaticController, HeuristicBotController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { PlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const D = asPlayerId("dave");

const list = (entries: readonly (readonly [string, number])[]): string[] =>
  entries.flatMap(([name, count]) => Array<string>(count).fill(name));

// A lean, self-contained deck with a real mana curve (lands, mana dork,
// small/medium/big creatures, a pump spell, two removal spells) so the bot
// actually has land-drop / cast / attack / block decisions to make — a
// second fuzz target alongside random-demo.mjs's RandomController, not a
// "does the bot play well" test.
const deck = (): string[] =>
  list([
    ["Forest", 17],
    ["Sol Ring", 1],
    ["Llanowar Elves", 3],
    ["Grizzly Bears", 4],
    ["Elvish Visionary", 2],
    ["Rumbling Baloth", 3],
    ["Craw Wurm", 2],
    ["Giant Growth", 2],
    ["Beast Within", 2],
    ["Naturalize", 2],
    ["Prey Upon", 2],
  ]);

const seatsFor = (players: readonly PlayerId[]) =>
  players.map((player) => ({ player, cards: deck() }));

const botControllers = (
  players: readonly PlayerId[],
): Partial<Record<PlayerId, PlayerController>> =>
  Object.fromEntries(players.map((p) => [p, new HeuristicBotController(p)]));

describe("HeuristicBotController", () => {
  it("plays a full 2-player game against itself without throwing or hanging", () => {
    const players = [A, B];
    const game = Game.create({
      seed: 1,
      mulligans: true,
      controllers: botControllers(players),
      decks: seatsFor(players),
    });
    expect(() => game.advance()).not.toThrow();
    expect(game.state.result.over).toBe(true);
  });

  it("beats a passive AutomaticController opponent", () => {
    const game = Game.create({
      seed: 2,
      mulligans: true,
      controllers: { [A]: new HeuristicBotController(A), [B]: new AutomaticController(B) },
      decks: seatsFor([A, B]),
    });
    game.advance();
    expect(game.state.result.over).toBe(true);
    expect(game.winner).toBe(A);
  });

  it("plays lands and casts spells rather than sitting idle", () => {
    const game = Game.create({
      seed: 3,
      mulligans: true,
      controllers: { [A]: new HeuristicBotController(A), [B]: new HeuristicBotController(B) },
      decks: seatsFor([A, B]),
    });
    game.advanceUntil((s) => s.turn.number >= 6);
    const battlefield = game.state.zones.shared.battlefield.map(
      (id) => game.state.objects[id].cardName,
    );
    expect(battlefield.some((name) => name !== "Forest")).toBe(true);
  });

  it("never taps a land just to float mana", () => {
    // Casting auto-pays, so floating mana ahead of a spell gains this bot
    // nothing and strands the source — and, once bot moves are paced out one
    // at a time for the client, it shows up as a land flipping sideways for
    // no reason between a spell being cast and that spell resolving.
    const game = Game.create({
      seed: 3,
      mulligans: true,
      controllers: { [A]: new HeuristicBotController(A), [B]: new HeuristicBotController(B) },
      decks: seatsFor([A, B]),
    });
    game.advanceUntil((s) => s.turn.number >= 8);

    // A land is only ever tapped as part of paying for something, so no
    // ability-activated event should name one.
    const lands = new Set(
      Object.values(game.state.objects)
        .filter((o) => o.cardName === "Forest")
        .map((o) => o.id),
    );
    const floated = game.state.eventLog.filter(
      (e) => e.type === "ability-activated" && lands.has(e.source),
    );
    expect(floated).toEqual([]);
  });

  it("still casts the spells that mana pays for", () => {
    // The guard above must not have made the bot passive: it should still be
    // spending its lands via casts.
    const game = Game.create({
      seed: 3,
      mulligans: true,
      controllers: { [A]: new HeuristicBotController(A), [B]: new HeuristicBotController(B) },
      decks: seatsFor([A, B]),
    });
    game.advanceUntil((s) => s.turn.number >= 8);
    expect(game.state.eventLog.some((e) => e.type === "spell-cast")).toBe(true);
  });

  it("plays a full 3-player game without throwing or hanging", () => {
    const players = [A, B, C];
    const game = Game.create({
      seed: 4,
      mulligans: true,
      controllers: botControllers(players),
      decks: seatsFor(players),
    });
    expect(() => game.advance()).not.toThrow();
    expect(game.state.result.over).toBe(true);
  });

  it("plays a full 4-player game without throwing or hanging", () => {
    const players = [A, B, C, D];
    const game = Game.create({
      seed: 5,
      mulligans: true,
      controllers: botControllers(players),
      decks: seatsFor(players),
    });
    expect(() => game.advance()).not.toThrow();
    expect(game.state.result.over).toBe(true);
  });
});
