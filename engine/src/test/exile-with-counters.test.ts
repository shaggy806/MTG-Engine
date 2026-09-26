/**
 * The `exile` effect's two additions: `"trigger-object"` — a dies trigger's
 * "you may exile it", only while it's still the card that died (rule 400.7) —
 * and `withCounters`, "exile it with a croak counter on it": counters the card
 * gets there, after the move has cleared whatever it had (rule 400.7 again).
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = () => {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: new ScriptedController(A), [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
const exileWith = (game: Game, id: ObjectId, kind: string, amount: number): void =>
  game.debugApplyEffect(A, { kind: "exile", target: 0, withCounters: { kind, amount } }, [
    { kind: "object", object: id },
  ]);

describe("exile with counters", () => {
  it("a card from a graveyard arrives in exile with them", () => {
    const game = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    exileWith(game, bears, "croak", 1);
    expect(game.state.objects[bears].zone).toBe("exile");
    expect(game.state.objects[bears].counters).toEqual({ croak: 1 });
  });

  it("a permanent loses its own counters on the way and has only the new ones", () => {
    const game = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 }, [
      { kind: "object", object: bears },
    ]);
    exileWith(game, bears, "fetch", 2);
    expect(game.state.objects[bears].zone).toBe("exile");
    expect(game.state.objects[bears].counters).toEqual({ fetch: 2 });
  });

  it("nothing that didn't go to exile gets them", () => {
    const game = setUp();
    // Already in exile: an exile effect leaves it alone.
    const exiled = game.debugSpawn("Grizzly Bears", A, "exile");
    exileWith(game, exiled, "croak", 1);
    expect(game.state.objects[exiled].counters).toEqual({});
    // In a hand: not something this effect moves.
    const held = game.debugSpawn("Grizzly Bears", A, "hand");
    exileWith(game, held, "croak", 1);
    expect(game.state.objects[held].zone).toBe("hand");
    expect(game.state.objects[held].counters).toEqual({});
  });
});
