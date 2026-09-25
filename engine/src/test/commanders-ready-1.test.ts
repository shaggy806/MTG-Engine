/**
 * Commanders the engine could already run, authored in one pass (2026-09-24):
 * the first group — Toph through Terra. One `describe` per card, pinning the
 * part of it that composes several features or leans on a recent one.
 */

import { describe, expect, it } from "vitest";

import { effectiveSubtypes, effectiveTypes } from "../characteristics.js";
import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const registry = createDefaultRegistry();

const setUp = (aDeck: readonly string[] = [], bDeck: readonly string[] = []) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aDeck, ...Array<string>(40).fill("Island")] },
      { player: B, cards: [...bDeck, ...Array<string>(40).fill("Island")] },
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 &&
  s.awaiting === null &&
  s.pendingTriggers.length === 0 &&
  s.priority.holder !== null;
const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const lands = (game: Game, name: string, n: number, player: PlayerId = A): void => {
  for (let i = 0; i < n; i += 1) spawn(game, name, player);
};
const named = (game: Game, name: string, player?: PlayerId): ObjectId[] =>
  game.state.zones.shared.battlefield.filter(
    (id) =>
      game.state.objects[id].cardName === name && (player === undefined || game.state.objects[id].controller === player),
  );
const inHand = (game: Game, player: PlayerId, name: string): ObjectId => {
  const id = game.handOf(player).find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name} in hand`);
  return id;
};
const obj = (id: ObjectId): TargetRef => ({ kind: "object", object: id });
const activate = (game: Game, source: ObjectId, abilityIndex: number, targets: (TargetRef | null)[] = [], extra = {}) => {
  game.dispatch({ type: "activate-ability", player: A, source, abilityIndex, targets, ...extra });
  game.advanceUntil(quiet);
};
const cast = (game: Game, card: ObjectId, targets: (TargetRef | null)[] = [], extra = {}) => {
  game.dispatch({ type: "cast-spell", player: A, card, targets, ...extra });
  game.advanceUntil(quiet);
};
const toStep = (game: Game, step: GameState["turn"]["step"]) =>
  game.advanceUntil((s) => s.turn.step === step && quiet(s));
const life = (game: Game, p: PlayerId) => game.state.players[p].life;
const types = (game: Game, id: ObjectId) => effectiveTypes(game.state, registry, game.state.objects[id]);

describe("Toph, the First Metalbender", () => {
  it("makes nontoken artifacts lands, and earthbends 2 at the end step", () => {
    const { game } = setUp();
    spawn(game, "Toph, the First Metalbender");
    const rock = spawn(game, "Sol Ring");
    expect(types(game, rock)).toEqual(expect.arrayContaining(["artifact", "land"]));
    game.advanceUntil((s) => s.turn.number === 2);
    const creatures = game.state.zones.shared.battlefield.filter(
      (id) => types(game, id).includes("land") && types(game, id).includes("creature"),
    );
    expect(creatures).toHaveLength(1);
    expect(game.state.objects[creatures[0]].counters["+1/+1"]).toBe(2);
  });
});

describe("Kefka, Court Mage // Kefka, Ruler of Ruin", () => {
  it("each player discards on entering; you draw one per card type discarded", () => {
    const { game } = setUp(["Darksteel Myr"], ["Lightning Bolt"]);
    const hand = game.handOf(A).length;
    game.debugSpawn("Kefka, Court Mage", A, "battlefield", { announceEntry: true });
    game.advanceUntil(quiet);
    // Alice discards the Myr (artifact, creature), Bob the Bolt (instant).
    expect(game.handOf(A).length).toBe(hand - 1 + 3);
  });

  it("{8}: each opponent sacrifices a permanent, and Kefka transforms; the back draws on life loss", () => {
    const { game } = setUp();
    const kefka = spawn(game, "Kefka, Court Mage");
    lands(game, "Island", 8);
    const bear = spawn(game, "Grizzly Bears", B);
    activate(game, kefka, 0);
    expect(game.state.objects[bear].zone).toBe("graveyard");
    expect(game.state.objects[kefka].face).toBe(1);
    const hand = game.handOf(A).length;
    game.debugApplyEffect(A, { kind: "lose-life", amount: 3, who: "each-opponent" }, [], { source: kefka });
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(hand + 3);
  });
});

describe("Sam, Loyal Attendant", () => {
  it("makes a Food each combat, and Foods' abilities cost {1} less", () => {
    const { game } = setUp();
    spawn(game, "Sam, Loyal Attendant");
    toStep(game, "begin-combat");
    const [food] = named(game, "Food Token");
    expect(food).toBeDefined();
    spawn(game, "Island");
    game.state.players[A].life = 10;
    activate(game, food, 0);
    expect(life(game, A)).toBe(13);
  });
});

describe("Esika, God of the Tree // The Prismatic Bridge", () => {
  it("gives other legendary creatures vigilance and a mana ability", () => {
    const { game } = setUp();
    spawn(game, "Esika, God of the Tree");
    const legend = spawn(game, "Thrasios, Triton Hero");
    const bear = spawn(game, "Grizzly Bears");
    expect(game.characteristics(legend).keywords).toContain("vigilance");
    expect(game.characteristics(bear).keywords).not.toContain("vigilance");
    const offers = game
      .legalActions(A)
      .filter((o) => o.kind === "activate-ability" && o.source === legend && o.manaAbility === true);
    expect(offers.length).toBeGreaterThan(0);
  });

  it("the Bridge puts the first creature or planeswalker from the top onto the battlefield", () => {
    const { game } = setUp();
    const bridge = spawn(game, "Esika, God of the Tree");
    game.state.objects[bridge].face = 1;
    for (const name of ["Grizzly Bears", "Lightning Bolt", "Island"]) game.debugSpawn(name, A, "library");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "draw");
    expect(named(game, "Grizzly Bears", A)).toHaveLength(1);
  });
});

describe("Ygra, Eater of All", () => {
  it("other creatures are Food artifacts; a Food dying grows Ygra", () => {
    const { game } = setUp();
    const ygra = spawn(game, "Ygra, Eater of All");
    const bear = spawn(game, "Grizzly Bears", B);
    expect(types(game, bear)).toEqual(expect.arrayContaining(["creature", "artifact"]));
    expect(effectiveSubtypes(game.state, registry, game.state.objects[bear])).toContain("Food");
    expect(types(game, ygra)).not.toContain("artifact");
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [obj(bear)], { source: ygra });
    game.advanceUntil(quiet);
    expect(game.state.objects[ygra].counters["+1/+1"]).toBe(2);
  });
});

describe("Kuja, Genome Sorcerer // Trance Kuja, Fate Defied", () => {
  it("makes a tapped Wizard each end step, and transforms at four Wizards", () => {
    const { game } = setUp();
    const kuja = spawn(game, "Kuja, Genome Sorcerer");
    game.advanceUntil((s) => s.turn.number === 2);
    const [wizard] = named(game, "Wizard Token (Kuja)");
    expect(game.state.objects[wizard].tapped).toBe(true);
    expect(game.state.objects[kuja].face ?? 0).toBe(0);
    spawn(game, "Wizard Token (Kuja)");
    spawn(game, "Wizard Token (Kuja)");
    game.advanceUntil((s) => s.turn.number === 3 && s.turn.step === "end" && quiet(s));
    expect(game.state.objects[kuja].face).toBe(1);
  });

  it("the Wizard pings on a noncreature spell, doubled once Kuja has transformed", () => {
    const { game } = setUp(["Lightning Bolt", "Lightning Bolt"]);
    spawn(game, "Wizard Token (Kuja)");
    lands(game, "Mountain", 2);
    cast(game, inHand(game, A, "Lightning Bolt"), [{ kind: "player", player: B }]);
    expect(life(game, B)).toBe(20 - 3 - 1);
    const kuja = spawn(game, "Kuja, Genome Sorcerer");
    game.debugApplyEffect(A, { kind: "transform", target: "source" }, [], { source: kuja });
    game.advanceUntil(quiet);
    cast(game, inHand(game, A, "Lightning Bolt"), [{ kind: "player", player: B }]);
    expect(life(game, B)).toBe(16 - 3 - 2);
  });
});

describe("Tom Bombadil", () => {
  it("has hexproof and indestructible with four lore counters among your Sagas", () => {
    const { game } = setUp();
    const tom = spawn(game, "Tom Bombadil");
    const saga = spawn(game, "History of Benalia");
    game.state.objects[saga].counters.lore = 3;
    expect(game.characteristics(tom).keywords).not.toContain("indestructible");
    game.state.objects[saga].counters.lore = 4;
    expect(game.characteristics(tom).keywords).toContain("hexproof");
    expect(game.characteristics(tom).keywords).toContain("indestructible");
  });
});

describe("Malcolm, Keen-Eyed Navigator", () => {
  it("a Treasure for each opponent a Pirate damaged", () => {
    const { game } = setUp();
    const malcolm = spawn(game, "Malcolm, Keen-Eyed Navigator");
    game.debugApplyEffect(A, { kind: "damage", amount: 1, who: "each-opponent" }, [], { source: malcolm });
    game.advanceUntil(quiet);
    expect(named(game, "Treasure Token", A)).toHaveLength(1);
  });
});

describe("Terra, Herald of Hope", () => {
  it("mills two and gains flying as combat begins", () => {
    const { game } = setUp();
    const terra = spawn(game, "Terra, Herald of Hope");
    toStep(game, "begin-combat");
    expect(game.state.zones.perPlayer[A].graveyard).toHaveLength(2);
    expect(game.characteristics(terra).keywords).toContain("flying");
  });

  it("pays {2} on combat damage to return a small creature card tapped", () => {
    const { game, a } = setUp();
    const terra = spawn(game, "Terra, Herald of Hope");
    lands(game, "Plains", 2);
    const bears = game.debugSpawn("Grizzly Bears", A, "graveyard");
    a.chooseModesFn = () => [0];
    a.declareAttackersFn = () => [{ attacker: terra, defender: B }];
    toStep(game, "postcombat-main");
    expect(game.state.objects[bears].zone).toBe("battlefield");
    expect(game.state.objects[bears].tapped).toBe(true);
  });
});
