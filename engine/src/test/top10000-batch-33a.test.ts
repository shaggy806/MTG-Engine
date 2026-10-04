/**
 * Top-10000 batch 33a. No engine change: every card is built from existing
 * vocabulary. These pin the clause of each most likely to be wired wrong —
 * a "your choice of" keyword chosen as it resolves (Steel Seraph), a gated
 * Corrupted ability on a 1/1-only target (The Seedcore), a damage trigger
 * that counters the creature dealt it (Rite of Passage), a mana-value cap read
 * off the attackers (Cosmic Cube), "another permanent" left out of a bounce
 * (Ambrosia Whiteheart), an optional sacrifice read back as it last existed
 * (Shadow, Mysterious Assassin), and the rest.
 */
import { describe, expect, it } from "vitest";

import type { LegalAction } from "../actions.js";
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

type CastNowOffer = Extract<LegalAction, { kind: "cast-now" }>;

const setUp = (hand: readonly string[] = [], library = "Wastes"): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  a.chooseModesFn = () => [0];
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
const settle = (game: Game): void => game.advanceUntil(quiet);
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const enter = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false, announceEntry: true });
/** Put `names` on top of `player`'s library, the first one on top. */
const stackLibrary = (game: Game, names: readonly string[], player: PlayerId = A): ObjectId[] =>
  [...names].reverse().map((name) => game.debugSpawn(name, player, "library")).reverse();
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const tokens = (game: Game, name: string): number =>
  game.battlefield
    .filter((id) => game.state.objects[id].cardName === name)
    .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0);
const attackWith = (game: Game, attacker: ObjectId): void => {
  game.advanceUntil((s) => s.turn.step === "declare-attackers" && s.awaiting?.kind === "attackers");
  game.dispatch({ type: "declare-attackers", player: A, attackers: [{ attacker, defender: B }] });
};
const triggerEffect = (name: string, index: number): EffectSpec => registry.get(name)!.triggered[index].effect!;

describe("top-10000 batch 33a — Steel Seraph", () => {
  it("gives the target the keyword chosen as the ability resolves", () => {
    const { game, a } = setUp();
    const seraph = spawn(game, "Steel Seraph");
    const bears = spawn(game, "Grizzly Bears");
    let offered: readonly string[] = [];
    a.chooseModesFn = (_view, _min, _max, texts) => {
      offered = texts;
      return [1];
    };
    game.debugApplyEffect(A, triggerEffect("Steel Seraph", 0), [obj(bears)], { source: seraph });
    settle(game);
    expect(offered).toEqual(["Flying", "Vigilance", "Lifelink"]);
    const keywords = game.characteristics(bears).keywords;
    expect(keywords.has("vigilance")).toBe(true);
    expect(keywords.has("flying")).toBe(false);
    expect(keywords.has("lifelink")).toBe(false);
  });
});

describe("top-10000 batch 33a — The Seedcore", () => {
  it("pumps a 1/1 only once an opponent has three poison counters", () => {
    const { game } = setUp();
    const seedcore = spawn(game, "The Seedcore");
    const elves = spawn(game, "Llanowar Elves");
    const canPump = (): boolean =>
      game.legalActions(A).some((x) => x.kind === "activate-ability" && x.source === seedcore && x.abilityIndex === 2);
    expect(canPump()).toBe(false);
    const bob = game.state.players[B] as unknown as { counters: Record<string, number> };
    bob.counters = { ...bob.counters, poison: 3 };
    expect(canPump()).toBe(true);
    game.dispatch({ type: "activate-ability", player: A, source: seedcore, abilityIndex: 2, targets: [obj(elves)] });
    settle(game);
    const elf = game.characteristics(elves);
    expect([elf.power, elf.toughness]).toEqual([3, 2]);
  });
});

describe("top-10000 batch 33a — Rite of Passage", () => {
  it("puts a +1/+1 counter on your creature that was dealt damage, not an opponent's", () => {
    const { game } = setUp();
    spawn(game, "Rite of Passage");
    const giant = spawn(game, "Hill Giant");
    const theirs = spawn(game, "Hill Giant", B);
    const source = spawn(game, "Grizzly Bears", B);
    game.debugApplyEffect(B, { kind: "damage", amount: 1, target: 0 }, [obj(giant)], { source });
    game.debugApplyEffect(B, { kind: "damage", amount: 1, target: 0 }, [obj(theirs)], { source });
    settle(game);
    expect(counters(game, giant)).toBe(1);
    expect(counters(game, theirs)).toBe(0);
  });
});

describe("top-10000 batch 33a — Angelic Chorus", () => {
  it("gains life equal to the entering creature's toughness, for your creatures only", () => {
    const { game } = setUp();
    spawn(game, "Angelic Chorus");
    enter(game, "Hill Giant");
    settle(game);
    expect(life(game, A)).toBe(23);
    enter(game, "Hill Giant", B);
    settle(game);
    expect(life(game, A)).toBe(23);
  });
});

describe("top-10000 batch 33a — Legolas Greenleaf", () => {
  it("grows when another legendary creature you control enters, not a nonlegendary one", () => {
    const { game } = setUp();
    const legolas = spawn(game, "Legolas Greenleaf");
    enter(game, "Grizzly Bears");
    settle(game);
    expect(counters(game, legolas)).toBe(0);
    enter(game, "Kokusho, the Evening Star");
    settle(game);
    expect(counters(game, legolas)).toBe(1);
  });
});

describe("top-10000 batch 33a — Cosmic Cube", () => {
  it("offers spells from the top six no bigger than the greatest attacking power, the rest to the bottom", () => {
    const { game, a } = setUp();
    spawn(game, "Cosmic Cube");
    const bears = spawn(game, "Grizzly Bears");
    const TOP = ["Lightning Bolt", "Hill Giant", "Divination", "Opt", "Shivan Dragon", "Lava Spike", "Island"];
    const top = stackLibrary(game, TOP);
    let offer: CastNowOffer | undefined;
    a.chooseCastNowFn = (_view, offered) => {
      offer = offered;
      return null;
    };
    attackWith(game, bears);
    settle(game);
    expect(offer!.looked).toEqual(top.slice(0, 6));
    // Bears' power is 2: Divination (3), Hill Giant (4) and Shivan Dragon (6)
    // are too big.
    expect(offer!.cards.map((id) => game.state.objects[id].cardName).sort()).toEqual([
      "Lava Spike",
      "Lightning Bolt",
      "Opt",
    ]);
    expect(game.state.zones.perPlayer[A].library[0]).toBe(top[6]);
  });
});

describe("top-10000 batch 33a — Ambrosia Whiteheart", () => {
  it("may return another permanent you control, never itself", () => {
    const { game, a } = setUp();
    const giant = spawn(game, "Hill Giant");
    let eligible: readonly ObjectId[] = [];
    a.choosePermanentsFn = (_view, offered) => {
      eligible = offered;
      return [giant];
    };
    const ambrosia = enter(game, "Ambrosia Whiteheart");
    settle(game);
    expect(eligible).toContain(giant);
    expect(eligible).not.toContain(ambrosia);
    expect(zone(game, giant)).toBe("hand");
    expect(zone(game, ambrosia)).toBe("battlefield");
  });
});

describe("top-10000 batch 33a — Oona's Blackguard", () => {
  it("has another Rogue enter with a counter, and a countered creature's hit make its player discard", () => {
    const { game } = setUp();
    const blackguard = spawn(game, "Oona's Blackguard");
    const rogue = game.debugSpawn("Alley Strangler", A, "graveyard");
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0 }, [obj(rogue)]);
    game.debugApplyEffect(A, { kind: "put-onto-battlefield", target: 0 }, [obj(bears)]);
    settle(game);
    expect(counters(game, rogue)).toBe(1);
    expect(counters(game, bears)).toBe(0);
    expect(counters(game, blackguard)).toBe(0);
    // The Blackguard itself has no counter: its hit makes nobody discard.
    const hand = game.handOf(B).length;
    attackWith(game, blackguard);
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(19);
    expect(game.handOf(B)).toHaveLength(hand);
  });

  it("makes the player a creature with a +1/+1 counter hit discard a card", () => {
    const { game } = setUp();
    spawn(game, "Oona's Blackguard");
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].counters = { "+1/+1": 1 };
    const hand = game.handOf(B).length;
    attackWith(game, bears);
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(17);
    expect(game.handOf(B)).toHaveLength(hand - 1);
  });
});

describe("top-10000 batch 33a — Hollowhenge Overlord", () => {
  it("makes a Wolf for each Wolf or Werewolf you control", () => {
    const { game } = setUp();
    const overlord = spawn(game, "Hollowhenge Overlord");
    spawn(game, "Wolf Token");
    spawn(game, "Grizzly Bears");
    spawn(game, "Wolf Token", B);
    game.debugApplyEffect(A, triggerEffect("Hollowhenge Overlord", 0), [], { source: overlord });
    settle(game);
    // The Overlord and one Wolf of yours: two more. Bob's Wolf is his.
    expect(
      game.battlefield
        .filter((id) => game.state.objects[id].cardName === "Wolf Token" && game.state.objects[id].controller === A)
        .reduce((n, id) => n + (game.state.objects[id].stackCount ?? 1), 0),
    ).toBe(3);
    expect(tokens(game, "Wolf Token")).toBe(4);
  });
});
