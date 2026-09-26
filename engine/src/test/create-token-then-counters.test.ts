/**
 * `create-token`'s `thenCounters`: "create a token, then put N counters on
 * it". The counters go on the tokens this made and no others. Such tokens
 * are never folded into a token stack as they're made: an existing stack of
 * the same token would otherwise absorb the new one and take its counters
 * whole.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const makeGame = (): Game => {
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

const soldiers = (game: Game) =>
  game.state.zones.shared.battlefield
    .map((id) => game.state.objects[id])
    .filter((o) => o.cardName === "Soldier Token");

describe("create-token, then put counters on it", () => {
  it("puts them on the new token alone, beside a stack of the same token", () => {
    const game = makeGame();
    game.debugApplyEffect(A, { kind: "create-token", token: "Soldier Token", count: 10 });
    const stack = soldiers(game);
    expect(stack).toHaveLength(1);
    expect(stack[0].stackCount).toBe(10);

    game.debugApplyEffect(A, {
      kind: "create-token",
      token: "Soldier Token",
      count: 1,
      thenCounters: { kind: "+1/+1", amount: 2 },
    });
    const all = soldiers(game);
    const old = all.find((o) => o.id === stack[0].id)!;
    const fresh = all.filter((o) => o.id !== stack[0].id);
    expect(old.stackCount).toBe(10);
    expect(old.counters["+1/+1"]).toBeUndefined();
    expect(fresh).toHaveLength(1);
    expect(fresh[0].counters["+1/+1"]).toBe(2);
  });

  it("reads its amount as the effect resolves", () => {
    const game = makeGame();
    for (let i = 0; i < 3; i += 1) game.debugSpawn("Island", A, "battlefield");
    game.debugApplyEffect(A, {
      kind: "create-token",
      token: "Soldier Token",
      count: 2,
      thenCounters: { kind: "+1/+1", amount: { countOf: { type: "land", controlledBy: "you" } } },
    });
    const made = soldiers(game);
    expect(made).toHaveLength(2);
    for (const o of made) expect(o.counters["+1/+1"]).toBe(3);
  });
});
