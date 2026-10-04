/**
 * Top-10000 batch 31b. No engine change: each card is built from existing
 * vocabulary. These pin the clause of each most likely to be wired wrong —
 * whose life a targeted gain lands on (Congregate), a Human spell entering
 * with counters only once a turn (Torgal), an intervening "if" on life gained
 * (Griffin Aerie), adapt firing a loot only when it adds a counter (Benthic
 * Biomancer), an anthem over every player's Slivers (Sinew Sliver), the second
 * mode's two targets (Opera Love Song), the unless price rising with a flier
 * (Lofty Denial), a discard punisher and its raid gate (Raiders' Wake), the
 * dead creature's power as damage (Stalking Vengeance), the active player's
 * upkeep put (Braids, Conjurer Adept), and the channel animation and landfall
 * (Roaring Earth).
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
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (
  hand: readonly string[] = [],
  library = "Wastes",
): { game: Game; a: ScriptedController; b: ScriptedController } => {
  const a = new ScriptedController(A);
  a.chooseModesFn = () => [0];
  a.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill(library)] },
      { player: B, cards: Array<string>(40).fill("Wastes") },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};
const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const settle = (game: Game): void => game.advanceUntil(quiet);
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, p: PlayerId): number => game.state.players[p].life;
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const player = (p: PlayerId): TargetRef => ({ kind: "player", player: p });
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power, c.toughness];
};

describe("top-10000 batch 31b — Congregate", () => {
  it("gives the target player 2 life for every creature on the battlefield, anyone's", () => {
    const { game } = setUp();
    spawn(game, "Grizzly Bears");
    spawn(game, "Grizzly Bears");
    spawn(game, "Hill Giant", B);
    game.debugApplyEffect(A, effectOf("Congregate"), [player(B)]);
    settle(game);
    expect(life(game, B)).toBe(26);
    expect(life(game, A)).toBe(20);
  });
});

describe("top-10000 batch 31b — Torgal, A Fine Hound", () => {
  it("puts a counter per Dog and Wolf on the first Human creature spell only", () => {
    const { game } = setUp(["Elite Vanguard", "Elite Vanguard"], "Plains");
    lands(game, "Plains", 2);
    spawn(game, "Torgal, A Fine Hound");
    spawn(game, "Alpine Watchdog");
    const first = inHand(game, "Elite Vanguard");
    game.dispatch({ type: "cast-spell", player: A, card: first, targets: [] });
    settle(game);
    expect(zone(game, first)).toBe("battlefield");
    // Torgal (a Wolf) and the Watchdog (a Dog).
    expect(counters(game, first)).toBe(2);
    const second = inHand(game, "Elite Vanguard");
    game.dispatch({ type: "cast-spell", player: A, card: second, targets: [] });
    settle(game);
    expect(zone(game, second)).toBe("battlefield");
    expect(counters(game, second)).toBe(0);
  });
});

describe("top-10000 batch 31b — Griffin Aerie", () => {
  const run = (gain: number): number => {
    const { game } = setUp();
    spawn(game, "Griffin Aerie");
    game.debugApplyEffect(A, { kind: "gain-life", amount: gain }, []);
    settle(game);
    game.advanceUntil((s) => s.turn.number === 2);
    return named(game, "Griffin Token").length;
  };
  it("makes a Griffin at your end step only after 3 or more life gained this turn", () => {
    expect(run(2)).toBe(0);
    expect(run(3)).toBe(1);
  });
});

describe("top-10000 batch 31b — Benthic Biomancer", () => {
  it("loots when adapt puts a counter on it, and not when adapt does nothing", () => {
    const { game } = setUp([], "Island");
    lands(game, "Island", 4);
    const biomancer = spawn(game, "Benthic Biomancer");
    const hand = game.handOf(A).length;
    const yard = game.state.zones.perPlayer[A].graveyard.length;
    game.dispatch({ type: "activate-ability", player: A, source: biomancer, abilityIndex: 0 });
    settle(game);
    expect(counters(game, biomancer)).toBe(1);
    expect(game.handOf(A).length).toBe(hand);
    expect(game.state.zones.perPlayer[A].graveyard.length).toBe(yard + 1);
    game.dispatch({ type: "activate-ability", player: A, source: biomancer, abilityIndex: 0 });
    settle(game);
    expect(counters(game, biomancer)).toBe(1);
    expect(game.state.zones.perPlayer[A].graveyard.length).toBe(yard + 1);
  });
});

describe("top-10000 batch 31b — Sinew Sliver", () => {
  it("pumps every Sliver creature, an opponent's and itself included, and nothing else", () => {
    const { game } = setUp();
    const mine = spawn(game, "Sinew Sliver");
    const theirs = spawn(game, "Sinew Sliver", B);
    const bears = spawn(game, "Grizzly Bears");
    expect(pt(game, mine)).toEqual([3, 3]);
    expect(pt(game, theirs)).toEqual([3, 3]);
    expect(pt(game, bears)).toEqual([2, 2]);
  });
});

describe("top-10000 batch 31b — Opera Love Song", () => {
  it("gives two target creatures +2/+0 in its second mode", () => {
    const { game } = setUp(["Opera Love Song"], "Mountain");
    lands(game, "Mountain", 2);
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant", B);
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Opera Love Song"),
      modes: [1],
      targets: [obj(bears), obj(giant)],
    });
    settle(game);
    expect(pt(game, bears)).toEqual([4, 2]);
    expect(pt(game, giant)).toEqual([5, 3]);
  });
});

describe("top-10000 batch 31b — Lofty Denial", () => {
  const priceAsked = (flier: boolean): string | undefined => {
    const { game } = setUp(["Hill Giant"], "Mountain");
    lands(game, "Mountain", 4);
    const giant = inHand(game, "Hill Giant");
    game.dispatch({ type: "cast-spell", player: A, card: giant, targets: [] });
    lands(game, "Wastes", 4);
    if (flier) spawn(game, "Ornithopter", B);
    // The condition is read from its source's controller's side: a real
    // object of Bob's stands in for the resolving spell.
    const anchor = spawn(game, "Wastes", B);
    game.debugApplyEffect(B, effectOf("Lofty Denial"), [obj(giant)], { source: anchor });
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-modes");
    if (awaiting?.kind !== "choose-modes") return undefined;
    expect(awaiting.player).toBe(A);
    return awaiting.cost;
  };
  it("asks {1}, or {4} while its caster controls a creature with flying", () => {
    expect(priceAsked(false)).toBe("{1}");
    expect(priceAsked(true)).toBe("{4}");
  });
});

describe("top-10000 batch 31b — Raiders' Wake", () => {
  it("drains an opponent who discards, and its raid needs an attack", () => {
    const { game } = setUp();
    spawn(game, "Raiders' Wake");
    const handB = game.handOf(B).length;
    game.debugApplyEffect(A, { kind: "discard", target: "each-opponent", amount: 1 }, []);
    settle(game);
    expect(game.handOf(B).length).toBe(handB - 1);
    expect(life(game, B)).toBe(18);
    // No attack this turn: the end step's raid trigger doesn't fire.
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "upkeep");
    expect(game.handOf(B).length).toBe(handB - 1);
    expect(life(game, B)).toBe(18);
  });
});

describe("top-10000 batch 31b — Stalking Vengeance", () => {
  it("has another creature of yours that dies deal its power to the target player", () => {
    const { game, a } = setUp();
    a.chooseTargetsFn = () => [player(B)];
    const vengeance = spawn(game, "Stalking Vengeance");
    const giant = spawn(game, "Hill Giant");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(giant)]);
    settle(game);
    expect(zone(game, giant)).toBe("graveyard");
    expect(life(game, B)).toBe(17);
    // An opponent's creature dying doesn't trigger it, nor does it itself.
    const theirs = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(theirs)]);
    settle(game);
    expect(life(game, B)).toBe(17);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(vengeance)]);
    settle(game);
    expect(life(game, B)).toBe(17);
  });
});

describe("top-10000 batch 31b — Braids, Conjurer Adept", () => {
  it("lets the player whose upkeep it is put a land from their hand onto the battlefield", () => {
    const { game, b } = setUp();
    b.chooseModesFn = () => [0];
    spawn(game, "Braids, Conjurer Adept");
    const bobsPermanents = (): number =>
      game.battlefield.filter((id) => game.state.objects[id].controller === B).length;
    expect(bobsPermanents()).toBe(0);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "draw");
    expect(bobsPermanents()).toBe(1);
  });
});

describe("top-10000 batch 31b — Roaring Earth", () => {
  it("channels X counters onto a land that becomes a green 0/0 Spirit creature with haste", () => {
    const { game } = setUp();
    lands(game, "Forest", 4);
    const target = spawn(game, "Wastes");
    const earth = game.debugSpawn("Roaring Earth", A, "hand");
    game.dispatch({
      type: "activate-ability",
      player: A,
      source: earth,
      abilityIndex: 0,
      targets: [obj(target)],
      xValue: 2,
    });
    expect(zone(game, earth)).toBe("graveyard");
    settle(game);
    expect(counters(game, target)).toBe(2);
    const c = computeCharacteristics(game.state, registry, target);
    expect(c.types).toEqual(expect.arrayContaining(["land", "creature"]));
    expect(c.subtypes).toContain("Spirit");
    expect([...c.colors]).toEqual(["G"]);
    expect(c.keywords.has("haste")).toBe(true);
    expect([c.power, c.toughness]).toEqual([2, 2]);
  });

  it("puts a +1/+1 counter on a creature you control whenever a land you control enters", () => {
    const { game } = setUp();
    spawn(game, "Roaring Earth");
    const bears = spawn(game, "Grizzly Bears");
    game.debugSpawn("Forest", A, "battlefield", { announceEntry: true });
    settle(game);
    expect(counters(game, bears)).toBe(1);
  });
});
