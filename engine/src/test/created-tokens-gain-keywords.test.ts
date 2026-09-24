/**
 * "Create three 1/1 Goblin tokens. **They gain haste until end of turn.**"
 * (Ovika, Enigma Goliath) — `create-token`'s `gainUntilEndOfTurn`, and the
 * same for a token copy ("It gains haste until end of turn" — Mishra,
 * Eminent One), where `gainsHaste` is the copy exception that lasts.
 *
 * The keywords are part of making the tokens: they reach exactly the tokens
 * this effect made, never ones already on the battlefield, and a token stack
 * made this way only folds with tokens made the same way.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

const setUp = () => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry: createDefaultRegistry(),
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const goblins = (game: Game): ObjectId[] =>
  game.state.zones.shared.battlefield.filter((id) => game.state.objects[id].cardName === "Goblin Token");
const tokenCount = (game: Game, ids: readonly ObjectId[]): number =>
  ids.reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const hasHaste = (game: Game, id: ObjectId): boolean => game.characteristics(id).keywords.has("haste");
const make = (game: Game, effect: EffectSpec): void => {
  game.debugApplyEffect(A, effect);
  game.advanceUntil(quiet);
};
const hastyGoblins = (count: number): EffectSpec => ({
  kind: "create-token",
  token: "Goblin Token",
  count,
  gainUntilEndOfTurn: ["haste"],
});

describe("tokens that gain a keyword until end of turn", () => {
  it("have it this turn, attack at once, and lose it as the turn ends", () => {
    const { game, a } = setUp();
    make(game, hastyGoblins(2));
    const made = goblins(game);
    expect(made).toHaveLength(2);
    expect(made.every((id) => hasHaste(game, id))).toBe(true);

    a.declareAttackersFn = () => made.map((attacker) => ({ attacker, defender: B }));
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(game.state.players[B].life).toBe(18);

    // Cleanup ends it — and, the two now being alike again, may fold them
    // into one stack, so ask whatever Goblins there are.
    game.advanceUntil((s) => s.turn.number === 2);
    expect(tokenCount(game, goblins(game))).toBe(2);
    expect(goblins(game).some((id) => hasHaste(game, id))).toBe(false);
  });

  it("reach only the tokens just made, not a stack already there", () => {
    const { game } = setUp();
    make(game, { kind: "create-token", token: "Goblin Token", count: 10 });
    const before = goblins(game);
    expect(tokenCount(game, before)).toBe(10);

    make(game, hastyGoblins(10));
    const all = goblins(game);
    expect(tokenCount(game, all)).toBe(20);
    const hasty = all.filter((id) => hasHaste(game, id));
    expect(tokenCount(game, hasty)).toBe(10);
    expect(before.every((id) => !hasHaste(game, id))).toBe(true);
  });

  it("two batches made the same way fold together", () => {
    const { game } = setUp();
    make(game, hastyGoblins(10));
    make(game, hastyGoblins(10));
    const all = goblins(game);
    expect(all).toHaveLength(1);
    expect(tokenCount(game, all)).toBe(20);
    expect(hasHaste(game, all[0])).toBe(true);
  });

  it("a token copy that gains haste until end of turn loses it the next turn", () => {
    const { game } = setUp();
    const bears = game.debugSpawn("Grizzly Bears", A, "battlefield");
    game.debugApplyEffect(A, { kind: "create-token-copy", of: 0, count: 1, gainUntilEndOfTurn: ["haste"] }, [
      { kind: "object", object: bears },
    ]);
    game.advanceUntil(quiet);
    const copy = game.state.zones.shared.battlefield.find(
      (id) => game.state.objects[id].isToken && game.state.objects[id].copyOf === "Grizzly Bears",
    );
    expect(copy).toBeDefined();
    expect(hasHaste(game, copy!)).toBe(true);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(hasHaste(game, copy!)).toBe(false);
  });
});
