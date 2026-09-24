/**
 * Conditions on player and game state: a life total — Bilbo, Birthday
 * Celebrant's "activate only if you have 111 or more life", "at most half
 * your starting life total", an opponent's or every opponent's — and the
 * cards in exile, every player's — Ketramose, the New Dawn's "unless there
 * are seven or more cards in exile".
 */

import { describe, expect, it } from "vitest";

import type { StaticCondition } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");

const setUp = () => {
  const players = [A, B, C];
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry: createDefaultRegistry(),
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99, startingLife: 40 },
    controllers: Object.fromEntries(players.map((p) => [p, new ScriptedController(p)])),
    decks: players.map((player) => ({ player, cards: Array<string>(40).fill("Island") })),
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return game;
};
/** Whether `condition` holds for Alice right now. */
const holds = (game: Game, condition: StaticCondition): boolean => {
  const source = game.debugSpawn("Island", A, "battlefield");
  const before = game.state.players[A].life;
  game.debugApplyEffect(A, { kind: "conditional", condition, then: { kind: "gain-life", amount: 1 } }, [], {
    source,
  });
  const met = game.state.players[A].life > before;
  game.state.players[A].life = before;
  return met;
};

describe("life totals", () => {
  it("at least, and at most half the starting life total", () => {
    const game = setUp();
    expect(holds(game, { kind: "life-total", atLeast: 40 })).toBe(true);
    expect(holds(game, { kind: "life-total", atLeast: 111 })).toBe(false);
    expect(holds(game, { kind: "life-total", atMost: "half-starting" })).toBe(false);
    game.state.players[A].life = 20;
    expect(holds(game, { kind: "life-total", atMost: "half-starting" })).toBe(true);
  });

  it("an opponent's, or every opponent's", () => {
    const game = setUp();
    game.state.players[B].life = 10;
    expect(holds(game, { kind: "life-total", who: "opponent", atMost: 10 })).toBe(true);
    expect(holds(game, { kind: "life-total", who: "each-opponent", atMost: 10 })).toBe(false);
    game.state.players[C].life = 5;
    expect(holds(game, { kind: "life-total", who: "each-opponent", atMost: 10 })).toBe(true);
  });
});

describe("cards in exile", () => {
  it("counts every player's exiled cards", () => {
    const game = setUp();
    for (let i = 0; i < 4; i += 1) game.debugSpawn("Island", A, "exile");
    for (let i = 0; i < 2; i += 1) game.debugSpawn("Island", B, "exile");
    expect(holds(game, { kind: "cards-in-exile", atLeast: 7 })).toBe(false);
    game.debugSpawn("Island", C, "exile");
    expect(holds(game, { kind: "cards-in-exile", atLeast: 7 })).toBe(true);
    expect(holds(game, { kind: "cards-in-exile", atLeast: 3, filter: { ownedBy: "opponent" } })).toBe(true);
    expect(holds(game, { kind: "cards-in-exile", atLeast: 4, filter: { ownedBy: "opponent" } })).toBe(false);
  });
});
