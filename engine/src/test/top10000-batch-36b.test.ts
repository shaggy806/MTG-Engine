/**
 * Top-10000 batch 36b. Pins the clauses most likely to be wired wrong:
 * Raff Capashen's flash for historic spells only; Defabricate exiling the
 * artifact spell it counters; Vivien, Monsters' Advocate's chosen keyword
 * counter and her −2 finding only a lesser mana value; Cathedral Acolyte's
 * ward reaching only creatures with a counter; Hungry Lynx's opponent-made
 * Rat and its counters on Cats when any Rat dies; Court of Bounty's
 * creature-or-land only while you're the monarch; Five Hundred Year Diary
 * counting the Clues you control, itself included;
 * Sentinel's Eyes escaping; Price of Freedom's search going to the land's
 * controller; Forerunner of the Empire's optional ping on a Dinosaur.
 */
import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards/registry.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

interface Table {
  game: Game;
  a: ScriptedController;
  b: ScriptedController;
}

const setUp = (
  hand: readonly string[] = [],
  handB: readonly string[] = [],
  library: readonly string[] = [],
): Table => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  a.chooseModesFn = () => [0];
  b.chooseModesFn = () => [0];
  a.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  b.chooseFromZoneFn = (_view, eligible, min, max) => eligible.slice(0, Math.max(min, Math.min(max, 1)));
  const fill = (cards: readonly string[]): string[] => [
    ...cards,
    ...Array<string>(7 - Math.min(7, cards.length)).fill("Wastes"),
  ];
  const game = Game.create({
    seed: 1,
    shuffle: false,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...fill(hand), ...library, ...Array<string>(40).fill("Wastes")] },
      { player: B, cards: [...fill(handB), ...Array<string>(40).fill("Wastes")] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
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
const zoneOf = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const counters = (game: Game, id: ObjectId, kind = "+1/+1"): number => game.state.objects[id].counters?.[kind] ?? 0;
const obj = (object: ObjectId) => ({ kind: "object" as const, object });
const castable = (game: Game, player: PlayerId, card: ObjectId): boolean =>
  game.legalActions(player).some((o) => o.kind === "cast-spell" && o.card === card);

describe("top-10000 batch 36b — Raff Capashen, Ship's Mage", () => {
  it("lets you cast artifact and legendary spells at instant speed, not other spells", () => {
    const { game } = setUp([], ["Sol Ring", "Isamaru, Hound of Konda", "Savannah Lions"]);
    lands(game, "Plains", 2, B);
    const ring = inHand(game, "Sol Ring", B);
    const isamaru = inHand(game, "Isamaru, Hound of Konda", B);
    const lions = inHand(game, "Savannah Lions", B);
    game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === B);
    expect(castable(game, B, ring)).toBe(false);
    spawn(game, "Raff Capashen, Ship's Mage", B);
    expect(castable(game, B, ring)).toBe(true);
    expect(castable(game, B, isamaru)).toBe(true);
    expect(castable(game, B, lions)).toBe(false);
  });
});

describe("top-10000 batch 36b — Defabricate", () => {
  it("counters an artifact spell into exile", () => {
    const { game } = setUp(["Sol Ring"], ["Defabricate"]);
    spawn(game, "Wastes");
    lands(game, "Island", 2, B);
    const ring = inHand(game, "Sol Ring");
    game.dispatch({ type: "cast-spell", player: A, card: ring, targets: [] });
    game.advanceUntil((s) => s.priority.holder === B);
    game.dispatch({ type: "cast-spell", player: B, card: inHand(game, "Defabricate", B), targets: [obj(ring)], modes: [0] });
    game.advanceUntil(quiet);
    expect(zoneOf(game, ring)).toBe("exile");
  });
});

describe("top-10000 batch 36b — Vivien, Monsters' Advocate", () => {
  it("+1 puts the chosen keyword counter on the Beast", () => {
    const { game, a } = setUp();
    const vivien = spawn(game, "Vivien, Monsters' Advocate");
    a.chooseModesFn = () => [2];
    game.dispatch({ type: "activate-ability", player: A, source: vivien, abilityIndex: 0 });
    game.advanceUntil(quiet);
    const [beast] = named(game, "3/3 Beast Token");
    expect(beast).toBeDefined();
    expect(counters(game, beast, "trample")).toBe(1);
    expect(counters(game, beast, "reach")).toBe(0);
    expect(game.characteristics(beast).keywords.has("trample")).toBe(true);
  });

  it("−2: the next creature spell finds a creature card with lesser mana value", () => {
    // The chooser takes Craterhoof (8) whenever it's offered, so a search
    // that ignored "lesser" would find it.
    const { game, a } = setUp(["Colossal Dreadmaw"], [], ["Wastes", "Craterhoof Behemoth", "Grizzly Bears"]);
    lands(game, "Forest", 6);
    let offered: string[] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      offered = eligible.map((id) => game.state.objects[id].cardName);
      const hoof = eligible.find((id) => game.state.objects[id].cardName === "Craterhoof Behemoth");
      return [hoof ?? eligible[0]];
    };
    const vivien = spawn(game, "Vivien, Monsters' Advocate");
    game.dispatch({ type: "activate-ability", player: A, source: vivien, abilityIndex: 1 });
    game.advanceUntil(quiet);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Colossal Dreadmaw"), targets: [] });
    game.advanceUntil(quiet);
    expect(offered).toContain("Grizzly Bears");
    expect(offered).not.toContain("Craterhoof Behemoth");
    expect(named(game, "Grizzly Bears")).toHaveLength(1);
    expect(named(game, "Craterhoof Behemoth")).toHaveLength(0);
    expect(named(game, "Colossal Dreadmaw")).toHaveLength(1);
  });
});

describe("top-10000 batch 36b — Cathedral Acolyte", () => {
  const boltAt = (marked: boolean): string => {
    const { game } = setUp(["Lightning Bolt"]);
    spawn(game, "Cathedral Acolyte", B);
    const bears = spawn(game, "Grizzly Bears", B);
    if (marked) game.state.objects[bears].counters = { ...game.state.objects[bears].counters, shield: 1 };
    spawn(game, "Mountain");
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Lightning Bolt"), targets: [obj(bears)] });
    game.advanceUntil(quiet);
    return zoneOf(game, bears);
  };
  it("a creature with any counter has ward {1}; one without doesn't", () => {
    expect(boltAt(true)).toBe("battlefield");
    expect(boltAt(false)).toBe("graveyard");
  });

  it("its {T} targets only a creature that entered this turn", () => {
    const { game } = setUp();
    const old = spawn(game, "Grizzly Bears");
    const acolyte = spawn(game, "Cathedral Acolyte");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "precombat-main" && quiet(s));
    const fresh = spawn(game, "Hill Giant");
    const spec = registry.get("Cathedral Acolyte")!.activated[0].targets[0];
    expect(() =>
      game.dispatch({ type: "activate-ability", player: A, source: acolyte, abilityIndex: 0, targets: [obj(old)] }),
    ).toThrow();
    expect(spec).toBeDefined();
    game.dispatch({ type: "activate-ability", player: A, source: acolyte, abilityIndex: 0, targets: [obj(fresh)] });
    game.advanceUntil(quiet);
    expect(counters(game, fresh)).toBe(1);
  });
});

describe("top-10000 batch 36b — Hungry Lynx", () => {
  it("the opponent makes the deathtouch Rat; any Rat dying puts a counter on each Cat you control", () => {
    const { game } = setUp();
    const lynx = spawn(game, "Hungry Lynx");
    game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "cleanup");
    const [rat] = named(game, "Deathtouch Rat Token");
    expect(rat).toBeDefined();
    expect(game.state.objects[rat].controller).toBe(B);
    expect(game.characteristics(rat).keywords.has("deathtouch")).toBe(true);

    game.advanceUntil((s) => s.turn.number === 2 && s.turn.step === "precombat-main" && quiet(s));
    const theirCat = spawn(game, "Hungry Lynx", B);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(rat)]);
    game.advanceUntil(quiet);
    expect(counters(game, lynx)).toBe(1);
    // Both Lynxes trigger, each for its own controller's Cats.
    expect(counters(game, theirCat)).toBe(1);
  });
});

describe("top-10000 batch 36b — Court of Bounty", () => {
  it("puts a creature in only while you're the monarch; otherwise only a land", () => {
    const { game } = setUp(["Colossal Dreadmaw", "Forest"]);
    spawn(game, "Court of Bounty");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    // Not the monarch: the creature stays, the land goes in.
    expect(named(game, "Colossal Dreadmaw")).toHaveLength(0);
    expect(zoneOf(game, inHand(game, "Colossal Dreadmaw"))).toBe("hand");
    expect(game.handOf(A).some((id) => game.state.objects[id].cardName === "Forest")).toBe(false);

    game.debugApplyEffect(A, { kind: "become-monarch" }, []);
    game.advanceUntil((s) => s.turn.number === 5 && s.turn.step === "draw");
    expect(named(game, "Colossal Dreadmaw")).toHaveLength(1);
  });
});

describe("top-10000 batch 36b — Five Hundred Year Diary", () => {
  it("enters tapped and taps for {U} per Clue you control, itself included", () => {
    const { game } = setUp(["Five Hundred Year Diary"]);
    lands(game, "Island", 4);
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Five Hundred Year Diary"), targets: [] });
    game.advanceUntil(quiet);
    const [diary] = named(game, "Five Hundred Year Diary");
    expect(game.state.objects[diary].tapped).toBe(true);
    game.debugApplyEffect(A, { kind: "create-token", token: "Clue Token", count: 2 }, []);
    spawn(game, "Clue Token", B);
    game.state.objects[diary].tapped = false;
    game.dispatch({ type: "activate-ability", player: A, source: diary, abilityIndex: 0 });
    expect(game.state.players[A].manaPool.map((u) => u.type)).toEqual(["U", "U", "U"]);
  });
});

describe("top-10000 batch 36b — Sentinel's Eyes", () => {
  it("escapes from the graveyard onto a creature, exiling two other cards", () => {
    const { game } = setUp();
    const eyes = game.debugSpawn("Sentinel's Eyes", A, "graveyard");
    const others = [game.debugSpawn("Grizzly Bears", A, "graveyard"), game.debugSpawn("Hill Giant", A, "graveyard")];
    spawn(game, "Plains");
    const bears = spawn(game, "Grizzly Bears");
    expect(game.legalActions(A).some((o) => o.kind === "cast-spell" && o.card === eyes && o.via === "escape")).toBe(true);
    game.dispatch({ type: "cast-spell", player: A, card: eyes, targets: [obj(bears)], via: "escape", escapeExile: others });
    game.advanceUntil(quiet);
    expect(game.state.objects[eyes].attachedTo).toBe(bears);
    expect(game.characteristics(bears).power).toBe(3);
    expect(game.characteristics(bears).keywords.has("vigilance")).toBe(true);
    expect(others.map((id) => zoneOf(game, id))).toEqual(["exile", "exile"]);
  });
});

describe("top-10000 batch 36b — Price of Freedom", () => {
  it("the land's controller searches for the basic; you draw", () => {
    const { game } = setUp(["Price of Freedom"]);
    lands(game, "Mountain", 2);
    const target = spawn(game, "Forest", B);
    const basics = game.debugSpawn("Plains", B, "library");
    const handSize = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: inHand(game, "Price of Freedom"), targets: [obj(target)] });
    game.advanceUntil(quiet);
    expect(zoneOf(game, target)).toBe("graveyard");
    expect(zoneOf(game, basics)).toBe("battlefield");
    expect(game.state.objects[basics].controller).toBe(B);
    expect(game.state.objects[basics].tapped).toBe(true);
    expect(game.handOf(A).length).toBe(handSize);
  });
});

describe("top-10000 batch 36b — Forerunner of the Empire", () => {
  it("a Dinosaur entering under your control lets it deal 1 to each creature, if you choose", () => {
    const { game, a } = setUp();
    spawn(game, "Forerunner of the Empire");
    const elves = spawn(game, "Llanowar Elves", B);
    a.chooseModesFn = () => [];
    game.debugSpawn("Colossal Dreadmaw", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(zoneOf(game, elves)).toBe("battlefield");
    a.chooseModesFn = () => [0];
    const dino = game.debugSpawn("Colossal Dreadmaw", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    expect(zoneOf(game, elves)).toBe("graveyard");
    expect(game.state.objects[dino].damageMarked).toBe(1);
  });
});
