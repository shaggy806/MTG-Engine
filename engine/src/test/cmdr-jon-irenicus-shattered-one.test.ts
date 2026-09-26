/**
 * Jon Irenicus, Shattered One — {2}{U}{B} legendary 3/3 Elf Wizard.
 *
 *   At the beginning of your end step, target opponent gains control of up to
 *   one target creature you control. Put two +1/+1 counters on it and tap it.
 *   It's goaded for the rest of the game and it gains "This creature can't be
 *   sacrificed."
 *   Whenever a creature you own but don't control attacks, you draw a card.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { goadersOf } from "../goad.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

/** Jon and a Hill Giant for Alice, the end step's targets scripted. */
const setUp = (giveGiant: boolean) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: Array<string>(40).fill("Island") },
      { player: B, cards: Array<string>(40).fill("Island") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  game.debugSpawn("Jon Irenicus, Shattered One", A, "battlefield", { summoningSick: false });
  const giant = game.debugSpawn("Hill Giant", A, "battlefield", { summoningSick: false });
  a.chooseTargetsFn = () => [{ kind: "player", player: B }, giveGiant ? { kind: "object", object: giant } : undefined];
  return { game, a, b, giant };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const endStepDone = (game: Game) =>
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "end" && quiet(s));
/** Bob, now its controller, is told to sacrifice a creature. The sacrifice
 * is made at the priority check the resolution ends in, which
 * `advanceUntil(quiet)` would skip with nothing else pending. */
const cantBeSacrificed = (game: Game, id: ObjectId): boolean => {
  game.debugApplyEffect(B, { kind: "sacrifice", who: "you", filter: { type: "creature" }, count: 1 }, []);
  (game as unknown as { prepareForPriority(p: PlayerId): void }).prepareForPriority(A);
  return game.state.objects[id].zone === "battlefield";
};

describe("Jon Irenicus, Shattered One", () => {
  it("at your end step gives the creature away with two counters, tapped, goaded for good and unsacrificeable", () => {
    const { game, giant } = setUp(true);
    endStepDone(game);
    const g = game.state.objects[giant];
    expect(g.controller).toBe(B);
    expect(g.counters["+1/+1"]).toBe(2);
    expect(g.tapped).toBe(true);
    expect(g.goadedForGameBy).toContain(A);
    expect(cantBeSacrificed(game, giant)).toBe(true);
  });

  it("with no creature chosen, nothing changes hands", () => {
    const { game, giant } = setUp(false);
    endStepDone(game);
    expect(game.state.objects[giant].controller).toBe(A);
    expect(game.state.objects[giant].counters["+1/+1"]).toBeUndefined();
  });

  it("draws you a card when a creature you own but don't control attacks", () => {
    const { game, b, giant } = setUp(true);
    endStepDone(game);
    b.declareAttackersFn = () => [{ attacker: giant, defender: A }];
    const hand = game.handOf(A).length;
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "declare-blockers");
    game.advanceUntil(quiet);
    expect(game.state.objects[giant].attacking).toBe(A);
    expect(game.handOf(A)).toHaveLength(hand + 1);
    // Goaded by Alice: it attacks a player other than her if able — there is
    // none at two players, so it attacks her.
    expect(goadersOf(game.state, registry, giant)).toContain(A);
  });

  it("an opponent gone illegal keeps the creature where it is, but it gets the rest (rule 608.2b)", () => {
    const { game, giant } = setUp(true);
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "end" && s.zones.shared.stack.length > 0);
    game.state.hexproofPlayers = [...(game.state.hexproofPlayers ?? []), B];
    game.advanceUntil(quiet);
    const g = game.state.objects[giant];
    expect(g.controller).toBe(A);
    expect(g.counters["+1/+1"]).toBe(2);
    expect(g.tapped).toBe(true);
    expect(g.goadedForGameBy).toContain(A);
  });
});
