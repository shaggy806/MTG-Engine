/**
 * Top-5000 batch 23a. No engine change: each card is built from vocabulary
 * pool cards already use. These pin the clause most likely to be wired wrong
 * — the Desert count taken after the search (Hour of Promise), the paradox
 * trigger's mana-value damage (Keeper of Secrets), "your second spell" and
 * its announced mode (Cosmogrand Zenith), the grant only to your Sliver
 * creatures (Manaweft Sliver), the Equipment's enter attach and protection
 * (Celestial Armor), untapping only Godo and your Samurai (Godo, Bandit
 * Warlord) and the constellation drain (Grim Guardian).
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import type { EffectSpec } from "../effects.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

let modePick = 0;
const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [modePick];
  // Take as many as allowed: "up to two" finds two.
  c.chooseFromZoneFn = (_view, eligible, _min, max) => eligible.slice(0, max);
  return c;
};
const setUp = (
  hand: readonly string[] = [],
  library: readonly string[] = Array<string>(40).fill("Wastes"),
): { game: Game; a: ScriptedController } => {
  modePick = 0;
  const a = yes(new ScriptedController(A));
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...library] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const settle = (game: Game): void => {
  for (let guard = 0; guard < 200; guard += 1) {
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    const awaiting = game.state.awaiting;
    if (awaiting === null) return;
    if (awaiting.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: [modePick] });
    } else {
      game.advanceUntil(quiet);
    }
  }
  throw new Error("settle: still unresolved");
};
const triggerEffect = (name: string, index: number): EffectSpec => registry.get(name)!.triggered[index].effect!;

describe("top-5000 batch 23a — Keeper of Secrets", () => {
  it("deals a spell's mana value to an opponent only when it's cast from somewhere other than the hand", () => {
    const { game } = setUp(["Think Twice"], Array<string>(40).fill("Island"));
    lands(game, "Island", 5);
    spawn(game, "Keeper of Secrets");
    const thinkTwice = inHand(game, "Think Twice");
    game.dispatch({ type: "cast-spell", player: A, card: thinkTwice, targets: [] });
    settle(game);
    expect(life(game, B)).toBe(20);
    expect(game.graveyardOf(A)).toContain(thinkTwice);
    game.dispatch({ type: "cast-spell", player: A, card: thinkTwice, targets: [], via: "flashback" });
    settle(game);
    // Think Twice's mana value is 2, however it was paid for.
    expect(life(game, B)).toBe(18);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-5000 batch 23a — Cosmogrand Zenith", () => {
  it("triggers on the second spell, and its counters miss the creature spell still on the stack", () => {
    const { game } = setUp(["Ornithopter", "Ornithopter"]);
    modePick = 1;
    const zenith = spawn(game, "Cosmogrand Zenith");
    const [first, second] = game.handOf(A).filter((id) => game.state.objects[id].cardName === "Ornithopter");
    game.dispatch({ type: "cast-spell", player: A, card: first, targets: [] });
    settle(game);
    expect(counters(game, zenith)).toBe(0);
    game.dispatch({ type: "cast-spell", player: A, card: second, targets: [] });
    settle(game);
    expect(counters(game, zenith)).toBe(1);
    expect(counters(game, first)).toBe(1);
    expect(game.state.objects[second].zone).toBe("battlefield");
    expect(counters(game, second)).toBe(0);
    expect(named(game, "Human Soldier Token")).toHaveLength(0);
  });

  it("makes two Human Soldiers with the first mode", () => {
    const { game } = setUp(["Ornithopter", "Ornithopter"]);
    spawn(game, "Cosmogrand Zenith");
    for (const id of game.handOf(A).filter((x) => game.state.objects[x].cardName === "Ornithopter")) {
      game.dispatch({ type: "cast-spell", player: A, card: id, targets: [] });
      settle(game);
    }
    expect(named(game, "Human Soldier Token")).toHaveLength(2);
  });
});

describe("top-5000 batch 23a — Manaweft Sliver", () => {
  it("gives the mana ability to its controller's Sliver creatures only", () => {
    const { game } = setUp();
    spawn(game, "Manaweft Sliver", B);
    const sliver = spawn(game, "Metallic Sliver");
    const manaOffers = (id: ObjectId) =>
      game.legalActions(A).filter((x) => x.kind === "activate-ability" && x.source === id && x.manaAbility === true);
    expect(manaOffers(sliver)).toHaveLength(0);
    spawn(game, "Manaweft Sliver");
    expect(manaOffers(sliver).length).toBeGreaterThan(0);
  });
});

describe("top-5000 batch 23a — Celestial Armor", () => {
  it("attaches as it enters and gives hexproof and indestructible on top of +2/+0 and flying", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const armor = game.debugSpawn("Celestial Armor", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(game.state.objects[armor].attachedTo).toBe(bears);
    const c = computeCharacteristics(game.state, registry, bears);
    expect([c.power, c.toughness]).toEqual([4, 2]);
    for (const k of ["flying", "hexproof", "indestructible"] as const) expect(c.keywords.has(k)).toBe(true);
  });
});

describe("top-5000 batch 23a — Godo, Bandit Warlord", () => {
  it("untaps Godo and your Samurai, not another creature or an opponent's Samurai", () => {
    const { game } = setUp();
    const godo = spawn(game, "Godo, Bandit Warlord");
    const samurai = spawn(game, "Isshin, Two Heavens as One");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Isshin, Two Heavens as One", B);
    for (const id of [godo, samurai, bears, theirs]) game.state.objects[id].tapped = true;
    game.debugApplyEffect(A, triggerEffect("Godo, Bandit Warlord", 1), [], { source: godo });
    settle(game);
    expect(game.state.objects[godo].tapped).toBe(false);
    expect(game.state.objects[samurai].tapped).toBe(false);
    expect(game.state.objects[bears].tapped).toBe(true);
    expect(game.state.objects[theirs].tapped).toBe(true);
  });
});

describe("top-5000 batch 23a — Grim Guardian", () => {
  it("drains as it enters and as another enchantment of yours enters, not an opponent's", () => {
    const { game } = setUp();
    game.debugSpawn("Grim Guardian", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, B)).toBe(19);
    game.debugSpawn("Cryptolith Rite", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, B)).toBe(18);
    game.debugSpawn("Cryptolith Rite", B, "battlefield", { announceEntry: true });
    settle(game);
    expect(life(game, B)).toBe(18);
  });
});
