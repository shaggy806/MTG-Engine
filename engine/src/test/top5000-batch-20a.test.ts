/**
 * Top-5000 batch 20a. No engine change: each test pins the clause of one card
 * most likely to be wired wrong — a cost that returns an artifact before the
 * put-from-hand resolves (Master Transmuter), doubling and a counter-gated
 * trample (Primordial Hydra), X read off Swamps only (Consuming Corruption),
 * the instant-speed attach and the per-artifact pump (Cranial Plating), half
 * the Zombies rounded down (Endless Ranks of the Dead), artifact abilities
 * barred while the Ouphe is out (Collector Ouphe), and the board-wide
 * intervening-if (Pyrohemia).
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

const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
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
const tokenCount = (game: Game, name: string): number =>
  named(game, name).reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const canActivate = (game: Game, source: ObjectId, index = 0): boolean =>
  game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === source && x.abilityIndex === index);
const triggerEffect = (name: string, index = 0): EffectSpec => registry.get(name)!.triggered[index].effect!;

describe("top-5000 batch 20a — Master Transmuter", () => {
  it("returns an artifact as a cost, then puts an artifact card from hand onto the battlefield", () => {
    const { game, a } = setUp(["Ornithopter"]);
    lands(game, "Island", 1);
    const transmuter = spawn(game, "Master Transmuter");
    const ring = spawn(game, "Sol Ring");
    const thopter = inHand(game, "Ornithopter");
    a.choosePermanentsFn = (_view, eligible) => eligible.filter((id) => id === ring);
    a.chooseFromZoneFn = (_view, eligible) => eligible.filter((id) => id === thopter);
    expect(canActivate(game, transmuter)).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: transmuter, abilityIndex: 0, targets: [] });
    game.advanceUntil(quiet);
    expect(game.state.objects[transmuter].tapped).toBe(true);
    expect(game.handOf(A)).toContain(ring);
    expect(zone(game, thopter)).toBe("battlefield");
  });
});

describe("top-5000 batch 20a — Primordial Hydra", () => {
  it("enters with X counters, doubles them, and has trample only at ten or more", () => {
    const { game } = setUp(["Primordial Hydra"], "Forest");
    lands(game, "Forest", 5);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Primordial Hydra"), targets: [], xValue: 3 });
    game.advanceUntil(quiet);
    const hydra = named(game, "Primordial Hydra")[0];
    expect(counters(game, hydra)).toBe(3);
    game.state.objects[hydra].counters = { "+1/+1": 5 };
    expect(computeCharacteristics(game.state, registry, hydra).keywords.has("trample")).toBe(false);
    game.debugApplyEffect(A, triggerEffect("Primordial Hydra"), [], { source: hydra });
    game.advanceUntil(quiet);
    expect(counters(game, hydra)).toBe(10);
    expect(computeCharacteristics(game.state, registry, hydra).keywords.has("trample")).toBe(true);
  });
});

describe("top-5000 batch 20a — Consuming Corruption", () => {
  it("deals and gains X, counting only Swamps you control", () => {
    const { game } = setUp(["Consuming Corruption"]);
    lands(game, "Swamp", 2);
    lands(game, "Mountain", 1);
    lands(game, "Swamp", 3, B);
    const giant = spawn(game, "Hill Giant", B);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Consuming Corruption"),
      targets: [{ kind: "object", object: giant }],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[giant].damageMarked).toBe(2);
    expect(life(game, A)).toBe(22);
  });
});

describe("top-5000 batch 20a — Cranial Plating", () => {
  it("attaches for {B}{B} without being an equip ability, and pumps +1/+0 per artifact", () => {
    const { game } = setUp();
    lands(game, "Swamp", 2);
    const plating = spawn(game, "Cranial Plating");
    spawn(game, "Sol Ring");
    const bears = spawn(game, "Grizzly Bears");
    expect(registry.get("Cranial Plating")!.activated[0].sorcerySpeed).toBeFalsy();
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: plating,
      abilityIndex: 0,
      targets: [{ kind: "object", object: bears }],
    });
    game.advanceUntil(quiet);
    expect(game.state.objects[plating].attachedTo).toBe(bears);
    const c = computeCharacteristics(game.state, registry, bears);
    expect([c.power, c.toughness]).toEqual([4, 2]);
  });
});

describe("top-5000 batch 20a — Endless Ranks of the Dead", () => {
  it("makes half the Zombies you control, rounded down, counted as it resolves", () => {
    const { game } = setUp();
    const ranks = spawn(game, "Endless Ranks of the Dead");
    game.debugApplyEffect(A, { kind: "create-token", token: "Zombie Token", count: 3 });
    game.advanceUntil(quiet);
    game.debugApplyEffect(A, { kind: "create-token", token: "Zombie Token", count: 2 });
    // An opponent's Zombies don't count.
    game.debugApplyEffect(B, { kind: "create-token", token: "Zombie Token", count: 4 });
    game.advanceUntil(quiet);
    const mine = (): number =>
      named(game, "Zombie Token")
        .filter((id) => game.state.objects[id].controller === A)
        .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
    expect(mine()).toBe(5);
    game.debugApplyEffect(A, triggerEffect("Endless Ranks of the Dead"), [], { source: ranks });
    game.advanceUntil(quiet);
    expect(mine()).toBe(7);
    game.debugApplyEffect(A, triggerEffect("Endless Ranks of the Dead"), [], { source: ranks });
    game.advanceUntil(quiet);
    expect(mine()).toBe(10);
    expect(tokenCount(game, "Zombie Token")).toBe(14);
  });
});

describe("top-5000 batch 20a — Collector Ouphe", () => {
  it("bars activated abilities of artifacts, mana abilities included, while it's on the battlefield", () => {
    const { game } = setUp();
    const ouphe = spawn(game, "Collector Ouphe");
    const ring = spawn(game, "Sol Ring");
    const forest = spawn(game, "Forest");
    expect(canActivate(game, ring)).toBe(false);
    expect(canActivate(game, forest)).toBe(true);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: ouphe }]);
    game.advanceUntil(quiet);
    expect(canActivate(game, ring)).toBe(true);
  });
});

describe("top-5000 batch 20a — Pyrohemia", () => {
  it("deals 1 to each creature and each player, and is sacrificed only at an end step with no creatures", () => {
    const { game } = setUp();
    lands(game, "Mountain", 1);
    const pyrohemia = spawn(game, "Pyrohemia");
    const bears = spawn(game, "Grizzly Bears");
    const elves = spawn(game, "Llanowar Elves", B);
    game.dispatch({ type: "activate-ability", player: A, source: pyrohemia, abilityIndex: 0, targets: [] });
    game.advanceUntil(quiet);
    expect(life(game, A)).toBe(19);
    expect(life(game, B)).toBe(19);
    expect(game.state.objects[bears].damageMarked).toBe(1);
    // Turn 1's end step: the Bears are still there, so it doesn't trigger.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main");
    expect(zone(game, elves)).toBe("graveyard");
    expect(zone(game, pyrohemia)).toBe("battlefield");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    // Turn 2's end step is Bob's: "the end step" is every player's.
    game.advanceUntil((s) => s.turn.number === 3);
    expect(zone(game, pyrohemia)).toBe("graveyard");
  });
});
