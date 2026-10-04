/**
 * Top-5000 batch 28a. No engine change: each test pins the clause of one card
 * most likely to be wired wrong — Strixhaven Stadium's tenth point counter,
 * Crawling Infestation's "during your turn" held to once a turn, Grim
 * Reaper's Sprint's morbid discount and untap, Ghostfire Slice's discount,
 * Boon of the Spirit Realm's constellation count, and the rest.
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

const yes = (c: ScriptedController): ScriptedController => {
  c.chooseModesFn = () => [0];
  c.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  return c;
};
const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = yes(new ScriptedController(A));
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
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, announceEntry: true });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const pool = (game: Game, player: PlayerId = A): string[] =>
  game.state.players[player].manaPool.map((unit) => unit.type).sort();
const pt = (game: Game, id: ObjectId): [number, number] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power ?? 0, c.toughness ?? 0];
};
const settle = (game: Game): void => {
  for (let guard = 0; guard < 200; guard += 1) {
    game.advanceUntil((s) => quiet(s) || s.awaiting !== null);
    const awaiting = game.state.awaiting;
    if (awaiting === null) return;
    if (awaiting.kind === "choose-modes") {
      game.dispatch({ type: "choose-modes", player: awaiting.player, modes: [0] });
    } else {
      game.advanceUntil(quiet);
    }
  }
  throw new Error("settle: still unresolved");
};
const effectOf = (name: string): EffectSpec => registry.get(name)!.effect!;
const castable = (game: Game, card: ObjectId): boolean =>
  game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === card);

describe("top-5000 batch 28a — Strixhaven Stadium", () => {
  it("taps for {C} and adds a point counter", () => {
    const { game } = setUp();
    const stadium = spawn(game, "Strixhaven Stadium");
    game.dispatch({ type: "activate-ability", player: A, source: stadium, abilityIndex: 0 });
    expect(pool(game)).toEqual(["C"]);
    expect(counters(game, stadium, "point")).toBe(1);
  });

  it("on the tenth counter, removes them all and the player dealt damage loses", () => {
    const { game } = setUp();
    const stadium = spawn(game, "Strixhaven Stadium");
    game.state.objects[stadium].counters = { point: 9 };
    const bears = spawn(game, "Grizzly Bears");
    game.advanceUntil((s) => s.awaiting?.kind === "attackers" || s.result.over);
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: bears, defender: B }] });
    game.advanceUntil((s) => (s.turn.step === "postcombat-main" && quiet(s)) || s.result.over);
    expect(counters(game, stadium, "point")).toBe(0);
    expect(game.state.players[B].hasLost).toBe(true);
    expect(game.state.players[A].hasLost).not.toBe(true);
  });

  it("loses a counter when a creature deals combat damage to you", () => {
    const { game } = setUp();
    const stadium = spawn(game, "Strixhaven Stadium");
    game.state.objects[stadium].counters = { point: 3 };
    const bears = spawn(game, "Grizzly Bears", B);
    game.advanceUntil((s) => s.turn.number === 2 && s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: B, attackers: [{ attacker: bears, defender: A }] });
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "postcombat-main" && quiet(s));
    expect(counters(game, stadium, "point")).toBe(2);
  });
});

describe("top-5000 batch 28a — Crawling Infestation", () => {
  it("makes one Insect a turn on your turn, and none on an opponent's", () => {
    const { game } = setUp();
    spawn(game, "Crawling Infestation");
    const first = spawn(game, "Grizzly Bears");
    const second = spawn(game, "Hill Giant");
    const third = spawn(game, "Grizzly Bears");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: first }]);
    settle(game);
    expect(named(game, "Insect Token")).toHaveLength(1);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: second }]);
    settle(game);
    expect(named(game, "Insect Token")).toHaveLength(1);
    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && quiet(s));
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: third }]);
    settle(game);
    expect(zone(game, third)).toBe("graveyard");
    expect(named(game, "Insect Token")).toHaveLength(1);
  });
});

describe("top-5000 batch 28a — Grim Reaper's Sprint", () => {
  it("costs {3} less after a death, and untaps each creature you control", () => {
    const { game } = setUp(["Grim Reaper's Sprint"]);
    lands(game, "Mountain", 2);
    const sprint = inHand(game, "Grim Reaper's Sprint");
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant");
    const theirs = spawn(game, "Grizzly Bears", B);
    const victim = spawn(game, "Grizzly Bears", B);
    for (const id of [bears, giant, theirs]) game.state.objects[id].tapped = true;
    expect(castable(game, sprint)).toBe(false);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: victim }]);
    settle(game);
    expect(castable(game, sprint)).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: sprint, targets: [{ kind: "object", object: bears }] });
    settle(game);
    expect(zone(game, sprint)).toBe("battlefield");
    expect(game.state.objects[bears].tapped).toBe(false);
    expect(game.state.objects[giant].tapped).toBe(false);
    expect(game.state.objects[theirs].tapped).toBe(true);
    expect(pt(game, bears)).toEqual([4, 4]);
    // Cast in your main phase: an extra combat after it, then the usual one.
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "postcombat-main" && quiet(s));
    expect(game.state.turn.combatPhases).toBe(2);
  });
});

describe("top-5000 batch 28a — Ghostfire Slice", () => {
  it("costs {2} less while an opponent controls a multicolored permanent", () => {
    const { game } = setUp(["Ghostfire Slice"]);
    spawn(game, "Mountain");
    const slice = inHand(game, "Ghostfire Slice");
    expect(castable(game, slice)).toBe(false);
    // Your own multicolored permanent doesn't count.
    spawn(game, "Tifa, Martial Artist");
    expect(castable(game, slice)).toBe(false);
    spawn(game, "Tifa, Martial Artist", B);
    expect(castable(game, slice)).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: slice, targets: [{ kind: "player", player: B }] });
    settle(game);
    expect(game.state.players[B].life).toBe(16);
  });
});

describe("top-5000 batch 28a — Boon of the Spirit Realm", () => {
  it("counts itself and your other enchantments entering, not an opponent's", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const boon = enter(game, "Boon of the Spirit Realm");
    settle(game);
    expect(counters(game, boon, "blessing")).toBe(1);
    enter(game, "Aligned Heart");
    settle(game);
    expect(counters(game, boon, "blessing")).toBe(2);
    enter(game, "Aligned Heart", B);
    settle(game);
    expect(counters(game, boon, "blessing")).toBe(2);
    expect(pt(game, bears)).toEqual([4, 4]);
    const theirs = spawn(game, "Grizzly Bears", B);
    expect(pt(game, theirs)).toEqual([2, 2]);
  });
});

describe("top-5000 batch 28a — Grim Affliction", () => {
  it("puts a -1/-1 counter on, then proliferates it", () => {
    const { game } = setUp();
    const giant = spawn(game, "Hill Giant");
    game.debugApplyEffect(A, effectOf("Grim Affliction"), [{ kind: "object", object: giant }]);
    settle(game);
    expect(counters(game, giant, "-1/-1")).toBe(2);
    expect(pt(game, giant)).toEqual([1, 1]);
  });
});

describe("top-5000 batch 28a — Cryptic Caves", () => {
  it("draws only while you control five or more lands, the Caves among them", () => {
    const { game } = setUp();
    const caves = spawn(game, "Cryptic Caves");
    lands(game, "Wastes", 3);
    const canDraw = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === caves && x.abilityIndex === 1);
    expect(canDraw()).toBe(false);
    spawn(game, "Wastes");
    expect(canDraw()).toBe(true);
  });
});

describe("top-5000 batch 28a — Master of the Feast", () => {
  it("has each opponent draw a card", () => {
    const { game } = setUp();
    const master = spawn(game, "Master of the Feast");
    const mine = game.handOf(A).length;
    const theirs = game.handOf(B).length;
    const upkeep = registry.get("Master of the Feast")!.triggered[0].effect!;
    game.debugApplyEffect(A, upkeep, [], { source: master });
    settle(game);
    expect(game.handOf(A)).toHaveLength(mine);
    expect(game.handOf(B)).toHaveLength(theirs + 1);
  });
});

describe("top-5000 batch 28a — Hunted Horror", () => {
  it("gives the target opponent two 3/3 Centaurs with protection from black", () => {
    const { game } = setUp();
    enter(game, "Hunted Horror");
    settle(game);
    const centaurs = named(game, "Centaur Token");
    expect(centaurs).toHaveLength(2);
    for (const id of centaurs) {
      expect(game.state.objects[id].controller).toBe(B);
      expect(pt(game, id)).toEqual([3, 3]);
      expect(computeCharacteristics(game.state, registry, id).protectionFrom.colors.has("B")).toBe(true);
    }
  });
});

describe("top-5000 batch 28a — Théoden, King of Rohan", () => {
  it("triggers on itself entering, and not on a non-Human", () => {
    const { game } = setUp();
    const theoden = enter(game, "Théoden, King of Rohan");
    settle(game);
    expect(computeCharacteristics(game.state, registry, theoden).keywords.has("double-strike")).toBe(true);
    enter(game, "Grizzly Bears");
    expect(game.state.pendingTriggers).toHaveLength(0);
    expect(game.state.zones.shared.stack).toHaveLength(0);
  });
});
