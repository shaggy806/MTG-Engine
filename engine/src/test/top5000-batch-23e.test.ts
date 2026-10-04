/**
 * Top-5000 batch 23e. No engine change: each card here is an existing
 * vocabulary's shape. The tests pin the clause most likely to be wired wrong
 * on each — an intervening "if" on life gained (Angelic Accord), a granted
 * land ability (Squirrel Nest), an aggregate pump on an attack trigger
 * (Pathbreaker Ibex), a kicker that takes two (Consult the Star Charts), a
 * summed-mana-value reduction (Earthquake Dragon), an anthem plus a batched
 * combat-damage trigger (Feline Sovereign), a granted "dealt damage"
 * trigger (Strength of Will) and the second draw of a turn (Prince Imrahil).
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
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const chars = (game: Game, id: ObjectId) => computeCharacteristics(game.state, registry, id);
const obj = (object: ObjectId) => ({ kind: "object" as const, object });
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

describe("top-5000 batch 23e — Angelic Accord", () => {
  it("makes an Angel at the end step after 4 life gained this turn", () => {
    const { game } = setUp();
    spawn(game, "Angelic Accord");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 4 }, []);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(named(game, "4/4 Angel Token")).toHaveLength(1);
  });

  it("doesn't trigger after only 3", () => {
    const { game } = setUp();
    spawn(game, "Angelic Accord");
    game.debugApplyEffect(A, { kind: "gain-life", amount: 3 }, []);
    game.advanceUntil((s) => s.turn.number === 2);
    expect(named(game, "4/4 Angel Token")).toHaveLength(0);
  });
});

describe("top-5000 batch 23e — Squirrel Nest", () => {
  it("gives the enchanted land a tap ability that makes a Squirrel", () => {
    const { game } = setUp(["Squirrel Nest"], "Forest");
    lands(game, "Forest", 3);
    const target = spawn(game, "Wastes");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Squirrel Nest"), targets: [obj(target)] });
    settle(game);
    expect(game.state.objects[named(game, "Squirrel Nest")[0]].attachedTo).toBe(target);
    // Whatever the auto-payer tapped, the enchanted land starts untapped.
    game.state.objects[target].tapped = false;
    const offer = game
      .legalActions(A)
      .find((x) => x.kind === "activate-ability" && x.source === target && x.text.startsWith("{T}: Create"));
    if (offer?.kind !== "activate-ability") throw new Error("not offered");
    game.dispatch({ type: "activate-ability", player: A, source: target, abilityIndex: offer.abilityIndex });
    settle(game);
    expect(named(game, "Squirrel Token")).toHaveLength(1);
    expect(game.state.objects[target].tapped).toBe(true);
  });
});

describe("top-5000 batch 23e — Pathbreaker Ibex", () => {
  it("gives every creature you control trample and +X/+X, X the greatest power", () => {
    const { game } = setUp();
    const ibex = spawn(game, "Pathbreaker Ibex");
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker: ibex, defender: B }] });
    settle(game);
    const i = chars(game, ibex);
    const b = chars(game, bears);
    expect([i.power, i.toughness]).toEqual([6, 6]);
    expect([b.power, b.toughness]).toEqual([5, 5]);
    expect(b.keywords.has("trample")).toBe(true);
    expect(chars(game, theirs).power).toBe(2);
  });
});

describe("top-5000 batch 23e — Consult the Star Charts", () => {
  it("unkicked, takes one card", () => {
    const { game } = setUp(["Consult the Star Charts"], "Island");
    lands(game, "Island", 2);
    const hand = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Consult the Star Charts"), targets: [] });
    settle(game);
    // The spell left the hand and one card came in.
    expect(game.handOf(A)).toHaveLength(hand);
  });

  it("kicked, takes two", () => {
    const { game } = setUp(["Consult the Star Charts"], "Island");
    lands(game, "Island", 4);
    const hand = game.handOf(A).length;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: inHand(game, "Consult the Star Charts"),
      targets: [],
      kicked: true,
    });
    settle(game);
    expect(game.handOf(A)).toHaveLength(hand + 1);
  });
});

describe("top-5000 batch 23e — Earthquake Dragon", () => {
  it("costs {X} less for the total mana value of Dragons you control, not an opponent's", () => {
    const { game } = setUp(["Earthquake Dragon"], "Forest");
    lands(game, "Forest", 9);
    const dragon = inHand(game, "Earthquake Dragon");
    const castable = (): boolean => game.legalActions(A).some((x) => x.kind === "cast-spell" && x.card === dragon);
    expect(castable()).toBe(false);
    spawn(game, "Akoum Hellkite", B);
    expect(castable()).toBe(false);
    // Mana value 6: {14}{G} becomes {8}{G}, nine Forests.
    spawn(game, "Akoum Hellkite");
    expect(castable()).toBe(true);
  });
});

describe("top-5000 batch 23e — Feline Sovereign", () => {
  it("pumps other Cats, and its combat damage destroys that player's artifact", () => {
    const { game, a } = setUp();
    const sovereign = spawn(game, "Feline Sovereign");
    const wildcat = spawn(game, "Canyon Wildcat");
    const ring = spawn(game, "Sol Ring", B);
    expect([chars(game, wildcat).power, chars(game, wildcat).toughness]).toEqual([3, 2]);
    expect([chars(game, sovereign).power, chars(game, sovereign).toughness]).toEqual([2, 3]);
    a.chooseTargetsFn = () => [obj(ring)];
    game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
    game.dispatch({
      type: "declare-attackers",
      player: A,
      attackers: [
        { attacker: sovereign, defender: B },
        { attacker: wildcat, defender: B },
      ],
    });
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(game.state.players[B].life).toBe(15);
    expect(zone(game, ring)).toBe("graveyard");
  });
});

describe("top-5000 batch 23e — Strength of Will", () => {
  it("survives the damage and grows by that much", () => {
    const { game } = setUp();
    const bears = spawn(game, "Grizzly Bears");
    const giant = spawn(game, "Hill Giant", B);
    game.debugApplyEffect(A, effectOf("Strength of Will"), [obj(bears)]);
    settle(game);
    game.debugApplyEffect(B, { kind: "damage", target: 0, amount: 3 }, [obj(bears)], { source: giant });
    settle(game);
    expect(zone(game, bears)).toBe("battlefield");
    expect(counters(game, bears)).toBe(3);
  });
});

describe("top-5000 batch 23e — Prince Imrahil the Fair", () => {
  it("makes a Soldier on the second card drawn this turn only", () => {
    const { game } = setUp();
    spawn(game, "Prince Imrahil the Fair");
    while (game.state.players[A].cardsDrawnThisTurn < 1) {
      game.debugApplyEffect(A, { kind: "draw", amount: 1 }, []);
      settle(game);
    }
    expect(named(game, "Human Soldier Token")).toHaveLength(0);
    game.debugApplyEffect(A, { kind: "draw", amount: 1 }, []);
    settle(game);
    expect(named(game, "Human Soldier Token")).toHaveLength(1);
    game.debugApplyEffect(A, { kind: "draw", amount: 1 }, []);
    settle(game);
    expect(named(game, "Human Soldier Token")).toHaveLength(1);
  });
});
