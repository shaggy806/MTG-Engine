/**
 * Top-10000 batch 33c. Existing vocabulary only; each test pins the clause
 * most likely to be wired wrong: a reflexive "+1/+1 counter for each Shrine"
 * on any Shrine (Go-Shintai of Boundless Vigor), "hand minus 4" never a gain
 * of 0 (Ivory Tower), the dead creature's last-known toughness (South Wind
 * Avatar), every Locus on the battlefield (Cloudpost), the tapped return
 * under its owner's control (Fungal Fortitude), X from permanents sacrificed
 * this turn and its lifelink at three (Obsessive Pursuit), and the optional
 * reveal that draws only for a creature (Elven Farsight).
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
const lands = (game: Game, name: string, n: number, player: PlayerId = A): ObjectId[] =>
  Array.from({ length: n }, () => spawn(game, name, player));
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const pool = (game: Game, player: PlayerId = A): string[] =>
  game.state.players[player].manaPool.map((unit) => unit.type).sort();
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
const triggerOf = (name: string, index: number): EffectSpec => registry.get(name)!.triggered[index].effect!;

describe("top-10000 batch 33c — Go-Shintai of Boundless Vigor", () => {
  it("for {1}, puts a counter for each Shrine you control on the target Shrine, whoever controls it", () => {
    const { game, a } = setUp();
    const vigor = spawn(game, "Go-Shintai of Boundless Vigor");
    spawn(game, "Go-Shintai of Life's Origin");
    const theirs = spawn(game, "Go-Shintai of Life's Origin", B);
    const [wastes] = lands(game, "Wastes", 1);
    a.chooseTargetsFn = () => [{ kind: "object", object: theirs }];
    game.debugApplyEffect(A, triggerOf("Go-Shintai of Boundless Vigor", 0), [], { source: vigor });
    settle(game);
    expect(game.state.objects[wastes].tapped).toBe(true);
    // Two Shrines are yours (B's doesn't count), and B's Shrine is a legal
    // target.
    expect(counters(game, theirs)).toBe(2);
    expect(counters(game, vigor)).toBe(0);
  });
});

describe("top-10000 batch 33c — Ivory Tower", () => {
  it("gains hand size minus 4, and nothing at all with four or fewer cards", () => {
    const { game } = setUp();
    spawn(game, "South Wind Avatar");
    const hand = game.handOf(A).length;
    expect(hand).toBeGreaterThan(4);
    game.debugApplyEffect(A, triggerOf("Ivory Tower", 0), []);
    settle(game);
    expect(life(game, A)).toBe(20 + hand - 4);
    // A real gain: South Wind Avatar drains.
    expect(life(game, B)).toBe(19);
    game.debugApplyEffect(A, { kind: "discard", target: "you", amount: hand - 3 }, []);
    settle(game);
    expect(game.handOf(A).length).toBe(3);
    const before = life(game, A);
    game.debugApplyEffect(A, triggerOf("Ivory Tower", 0), []);
    settle(game);
    expect(life(game, A)).toBe(before);
    // No life gained, so no drain.
    expect(life(game, B)).toBe(19);
  });
});

describe("top-10000 batch 33c — South Wind Avatar", () => {
  it("gains the dead creature's toughness as it last existed, and drains on the gain", () => {
    const { game } = setUp();
    spawn(game, "South Wind Avatar");
    const giant = spawn(game, "Hill Giant");
    game.state.objects[giant].counters = { "+1/+1": 1 };
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: giant }]);
    settle(game);
    expect(life(game, A)).toBe(24);
    expect(life(game, B)).toBe(19);
  });
});

describe("top-10000 batch 33c — Cloudpost", () => {
  it("adds {C} for each Locus on the battlefield, the opponent's included", () => {
    const { game } = setUp();
    const post = spawn(game, "Cloudpost");
    game.state.objects[post].tapped = false;
    spawn(game, "Cloudpost", B);
    game.dispatch({ type: "activate-ability", player: A, source: post, abilityIndex: 0 });
    expect(pool(game)).toEqual(["C", "C"]);
  });
});

describe("top-10000 batch 33c — Fungal Fortitude", () => {
  it("pumps +2/+0, and returns the creature tapped when it dies", () => {
    const { game } = setUp(["Fungal Fortitude"], "Swamp");
    lands(game, "Swamp", 2);
    const bears = spawn(game, "Grizzly Bears");
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Fungal Fortitude"),
      targets: [{ kind: "object", object: bears }],
    });
    settle(game);
    const c = computeCharacteristics(game.state, registry, bears);
    expect([c.power, c.toughness]).toEqual([4, 2]);
    game.debugApplyEffect(B, { kind: "destroy", target: 0 }, [{ kind: "object", object: bears }]);
    settle(game);
    const back = named(game, "Grizzly Bears");
    expect(back).toHaveLength(1);
    expect(game.state.objects[back[0]].tapped).toBe(true);
    expect(game.state.objects[back[0]].controller).toBe(A);
  });
});

describe("top-10000 batch 33c — Obsessive Pursuit", () => {
  it("puts X counters on the attacker for permanents sacrificed this turn, with lifelink at three", () => {
    const { game } = setUp();
    spawn(game, "Obsessive Pursuit");
    for (const thopter of lands(game, "Ornithopter", 3)) {
      game.debugApplyEffect(A, { kind: "sacrifice-target", target: 0 }, [{ kind: "object", object: thopter }]);
      settle(game);
    }
    const bears = spawn(game, "Grizzly Bears");
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: bears, defender: B }] });
    settle(game);
    expect(counters(game, bears)).toBe(3);
    expect(computeCharacteristics(game.state, registry, bears).keywords.has("lifelink")).toBe(true);
  });

  it("gives no lifelink below three", () => {
    const { game } = setUp();
    spawn(game, "Obsessive Pursuit");
    const [thopter] = lands(game, "Ornithopter", 1);
    game.debugApplyEffect(A, { kind: "sacrifice-target", target: 0 }, [{ kind: "object", object: thopter }]);
    settle(game);
    const bears = spawn(game, "Grizzly Bears");
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: bears, defender: B }] });
    settle(game);
    expect(counters(game, bears)).toBe(1);
    expect(computeCharacteristics(game.state, registry, bears).keywords.has("lifelink")).toBe(false);
  });
});

describe("top-10000 batch 33c — Elven Farsight", () => {
  it("draws when the revealed top card is a creature", () => {
    const { game } = setUp([], "Grizzly Bears");
    const before = game.handOf(A).length;
    game.debugApplyEffect(A, effectOf("Elven Farsight"), []);
    settle(game);
    expect(game.handOf(A).length).toBe(before + 1);
  });

  it("doesn't draw when it isn't", () => {
    const { game } = setUp();
    const before = game.handOf(A).length;
    game.debugApplyEffect(A, effectOf("Elven Farsight"), []);
    settle(game);
    expect(game.handOf(A).length).toBe(before);
  });
});
