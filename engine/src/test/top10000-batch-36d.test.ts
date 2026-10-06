/**
 * Top-10000 batch 36d. Pins the clauses most likely to be wired wrong:
 * Haldir's "other Elves" pump read once per +1/+1 counter as it resolves,
 * Vile Mutilator's two nontoken edicts, Myr Galvanizer's "each other Myr",
 * Rakish Heir's counter on the Vampire that dealt the damage, Maelstrom
 * Archangel's free cast from hand, Shabraz's per-card draw trigger and
 * Plague Wind sparing your own creatures.
 */
import { describe, expect, it } from "vitest";

import { computeCharacteristics } from "../characteristics.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (hand: readonly string[] = []): { game: Game; a: ScriptedController } => {
  const a = new ScriptedController(A);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: new ScriptedController(B) },
    decks: [
      { player: A, cards: [...hand, ...Array<string>(40).fill("Wastes")] },
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
const lands = (game: Game, name: string, n: number, player: PlayerId = A): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name, player);
};
const inHand = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.handOf(player).find((id) => game.state.objects[id].cardName === name)!;
const named = (game: Game, name: string): ObjectId[] =>
  game.battlefield.filter((id) => game.state.objects[id].cardName === name);
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const life = (game: Game, player: PlayerId): number => game.state.players[player].life;
const zone = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const pt = (game: Game, id: ObjectId): [number | undefined, number | undefined] => {
  const c = computeCharacteristics(game.state, registry, id);
  return [c.power, c.toughness];
};
const obj = (object: ObjectId) => ({ kind: "object" as const, object });

describe("top-10000 batch 36d — Haldir, Lórien Lieutenant", () => {
  it("enters with X counters; the pump gives other Elves you control +1/+1 per counter, fixed as it resolves", () => {
    const { game } = setUp(["Haldir, Lórien Lieutenant"]);
    lands(game, "Forest", 9);
    const elf = spawn(game, "Llanowar Elves");
    const bears = spawn(game, "Grizzly Bears");
    const theirElf = spawn(game, "Llanowar Elves", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Haldir, Lórien Lieutenant"), xValue: 2 });
    game.advanceUntil(quiet);
    const haldir = named(game, "Haldir, Lórien Lieutenant")[0];
    expect(counters(game, haldir)).toBe(2);
    game.dispatch({ type: "activate-ability", player: A, source: haldir, abilityIndex: 0 });
    game.advanceUntil(quiet);
    expect(pt(game, elf)).toEqual([3, 3]);
    expect(computeCharacteristics(game.state, registry, elf).keywords).toContain("vigilance");
    expect(pt(game, haldir)).toEqual([2, 2]);
    expect(pt(game, bears)).toEqual([2, 2]);
    expect(pt(game, theirElf)).toEqual([1, 1]);
    // A counter added afterwards doesn't grow the pump already applied.
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, [obj(haldir)]);
    game.advanceUntil(quiet);
    expect(pt(game, elf)).toEqual([3, 3]);
  });
});

describe("top-10000 batch 36d — Vile Mutilator", () => {
  const castMutilator = (game: Game): ObjectId => {
    lands(game, "Swamp", 7);
    const fodder = spawn(game, "Grizzly Bears");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Vile Mutilator"), sacrifice: fodder });
    game.advanceUntil(quiet);
    expect(named(game, "Vile Mutilator")).toHaveLength(1);
    return fodder;
  };

  it("each opponent sacrifices a nontoken enchantment — never a creature token", () => {
    const { game } = setUp(["Vile Mutilator"]);
    const anthem = spawn(game, "Glorious Anthem", B);
    game.debugApplyEffect(B, { kind: "create-token", token: "Soldier Token", count: 1 }, []);
    game.advanceUntil(quiet);
    const soldier = named(game, "Soldier Token")[0];
    const fodder = castMutilator(game);
    expect(zone(game, fodder)).toBe("graveyard");
    expect(zone(game, anthem)).toBe("graveyard");
    expect(named(game, "Soldier Token")).toContain(soldier);
  });

  it("then a nontoken creature — never an enchantment token", () => {
    const { game } = setUp(["Vile Mutilator"]);
    const tokenVirtue = spawn(game, "Intangible Virtue", B);
    game.state.objects[tokenVirtue].isToken = true;
    const dreadmaw = spawn(game, "Colossal Dreadmaw", B);
    castMutilator(game);
    expect(zone(game, tokenVirtue)).toBe("battlefield");
    expect(zone(game, dreadmaw)).toBe("graveyard");
  });
});

describe("top-10000 batch 36d — Myr Galvanizer", () => {
  it("untaps each other Myr you control, not itself or a non-Myr", () => {
    const { game } = setUp();
    const galvanizer = spawn(game, "Myr Galvanizer");
    const myr = spawn(game, "Copper Myr");
    const bears = spawn(game, "Grizzly Bears");
    const theirMyr = spawn(game, "Copper Myr", B);
    spawn(game, "Wastes");
    for (const id of [myr, bears, theirMyr]) game.state.objects[id].tapped = true;
    expect(pt(game, myr)).toEqual([2, 2]);
    expect(pt(game, galvanizer)).toEqual([2, 2]);
    game.dispatch({ type: "activate-ability", player: A, source: galvanizer, abilityIndex: 0 });
    game.advanceUntil(quiet);
    expect(game.state.objects[myr].tapped).toBe(false);
    expect(game.state.objects[galvanizer].tapped).toBe(true);
    expect(game.state.objects[bears].tapped).toBe(true);
    expect(game.state.objects[theirMyr].tapped).toBe(true);
  });
});

describe("top-10000 batch 36d — Rakish Heir", () => {
  it("puts a counter on each Vampire you control that dealt combat damage to a player, not a non-Vampire", () => {
    const { game, a } = setUp();
    const heir = spawn(game, "Rakish Heir");
    const nighthawk = spawn(game, "Vampire Nighthawk");
    const bears = spawn(game, "Grizzly Bears");
    a.declareAttackersFn = () => [heir, nighthawk, bears].map((attacker) => ({ attacker, defender: B }));
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(counters(game, heir)).toBe(1);
    expect(counters(game, nighthawk)).toBe(1);
    expect(counters(game, bears)).toBe(0);
  });
});

describe("top-10000 batch 36d — Maelstrom Archangel", () => {
  it("combat damage to a player lets you cast a spell from your hand for free", () => {
    const { game, a } = setUp(["Colossal Dreadmaw"]);
    const angel = spawn(game, "Maelstrom Archangel");
    const dreadmaw = inHand(game, "Colossal Dreadmaw");
    a.declareAttackersFn = () => [{ attacker: angel, defender: B }];
    a.chooseCastNowFn = (_v, offer) =>
      offer.casts.length === 0 ? null : { type: "cast-spell", player: A, card: dreadmaw, targets: [], via: "effect", free: true };
    game.advanceUntil((s) => s.turn.step === "postcombat-main" && quiet(s));
    expect(life(game, B)).toBe(15);
    expect(zone(game, dreadmaw)).toBe("battlefield");
  });
});

describe("top-10000 batch 36d — Shabraz, the Skyshark", () => {
  it("each card drawn puts a counter on Shabraz and gains 1 life", () => {
    const { game } = setUp();
    const shabraz = spawn(game, "Shabraz, the Skyshark");
    const before = life(game, A);
    game.debugApplyEffect(A, { kind: "draw", amount: 2 }, []);
    game.advanceUntil(quiet);
    expect(counters(game, shabraz)).toBe(2);
    expect(life(game, A)).toBe(before + 2);
  });
});

describe("top-10000 batch 36d — Plague Wind", () => {
  it("destroys only the creatures you don't control", () => {
    const { game } = setUp(["Plague Wind"]);
    lands(game, "Swamp", 9);
    const mine = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Plague Wind") });
    game.advanceUntil(quiet);
    expect(zone(game, mine)).toBe("battlefield");
    expect(zone(game, theirs)).toBe("graveyard");
  });
});
