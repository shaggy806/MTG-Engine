/**
 * Card draw, drain, a conditional counter and tutors, each driven through a
 * real cast:
 *
 * - Inspiring Call: a card per creature you control with a +1/+1 counter, and
 *   exactly those creatures become indestructible.
 * - Exsanguinate: each opponent loses X; you gain what they lost in total,
 *   counting one driven below zero (the 2011-01-01 ruling), and X = 0 is no
 *   life gain at all.
 * - Pyroblast: either mode may target anything, but only a blue target is
 *   countered or destroyed.
 * - Diabolic Tutor: any card, not revealed.
 * - Fabricate: only an artifact, revealed.
 * - Green Sun's Zenith: a *green* creature with mana value X or less onto the
 *   battlefield, then the Zenith goes into its owner's library — unless it was
 *   countered, when it goes to the graveyard.
 */

import { describe, expect, it } from "vitest";

import { createDefaultRegistry } from "../cards.js";
import { ScriptedController } from "../controller.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import type { TargetRef } from "../target.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const registry = createDefaultRegistry();

const setUp = (aHand: readonly string[] = [], bHand: readonly string[] = [], threePlayers = false) => {
  const a = new ScriptedController(A);
  const b = new ScriptedController(B);
  const c = new ScriptedController(C);
  const filler = Array<string>(40).fill("Forest");
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    controllers: threePlayers ? { [A]: a, [B]: b, [C]: c } : { [A]: a, [B]: b },
    decks: [
      { player: A, cards: [...aHand, ...filler] },
      { player: B, cards: [...bHand, ...filler] },
      ...(threePlayers ? [{ player: C, cards: filler }] : []),
    ],
  });
  game.advanceUntil((s) => s.turn.number === 1 && s.turn.step === "precombat-main");
  return { game, a, b };
};

const quiet = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const lands = (game: Game, player: PlayerId, names: readonly string[]): void => {
  for (const name of names) game.debugSpawn(name, player, "battlefield");
};
const cardIn = (game: Game, zone: readonly ObjectId[], name: string): ObjectId => {
  const id = zone.find((each) => game.state.objects[each].cardName === name);
  if (id === undefined) throw new Error(`no ${name}`);
  return id;
};
const obj = (object: ObjectId): TargetRef => ({ kind: "object", object });
const zoneOf = (game: Game, id: ObjectId): string => game.state.objects[id].zone;
const plusOne = (game: Game, id: ObjectId): void =>
  game.debugApplyEffect(game.state.objects[id].controller, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 }, [
    obj(id),
  ]);

describe("Inspiring Call", () => {
  it("draws one per creature you control with a +1/+1 counter, and makes those indestructible", () => {
    const { game } = setUp(["Inspiring Call"]);
    lands(game, A, ["Forest", "Forest", "Forest"]);
    const one = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const two = game.debugSpawn("Llanowar Elves", A, "battlefield");
    const bare = game.debugSpawn("Grizzly Bears", A, "battlefield");
    const shrunk = game.debugSpawn("Craw Wurm", A, "battlefield");
    const theirs = game.debugSpawn("Grizzly Bears", B, "battlefield");
    plusOne(game, one);
    plusOne(game, two);
    plusOne(game, two); // two counters on one creature is still one card
    plusOne(game, theirs);
    game.debugApplyEffect(A, { kind: "add-counter", target: 0, counter: "-1/-1", amount: 1 }, [obj(shrunk)]);

    const before = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: cardIn(game, game.handOf(A), "Inspiring Call") });
    game.advanceUntil(quiet);

    expect(game.handOf(A).length).toBe(before - 1 + 2);
    const indestructible = (id: ObjectId): boolean => game.characteristics(id).keywords.has("indestructible");
    expect(indestructible(one)).toBe(true);
    expect(indestructible(two)).toBe(true);
    expect(indestructible(bare)).toBe(false);
    expect(indestructible(shrunk)).toBe(false);
    expect(indestructible(theirs)).toBe(false);

    // A counter arriving afterwards doesn't earn it (the 2017-11-17 ruling).
    plusOne(game, bare);
    expect(indestructible(bare)).toBe(false);
  });

  it("draws nothing when no creature of yours has a counter", () => {
    const { game } = setUp(["Inspiring Call"]);
    lands(game, A, ["Forest", "Forest", "Forest"]);
    game.debugSpawn("Grizzly Bears", A, "battlefield");
    plusOne(game, game.debugSpawn("Grizzly Bears", B, "battlefield"));
    const before = game.handOf(A).length;
    game.dispatch({ type: "cast-spell", player: A, card: cardIn(game, game.handOf(A), "Inspiring Call") });
    game.advanceUntil(quiet);
    expect(game.handOf(A).length).toBe(before - 1);
  });
});

describe("Exsanguinate", () => {
  const cast = (game: Game, x: number): void => {
    lands(game, A, Array<string>(2 + x).fill("Swamp"));
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: cardIn(game, game.handOf(A), "Exsanguinate"),
      xValue: x,
    });
    game.advanceUntil(quiet);
  };

  it("drains each opponent for X", () => {
    const { game } = setUp(["Exsanguinate"]);
    cast(game, 3);
    expect(game.state.players[B].life).toBe(17);
    expect(game.state.players[A].life).toBe(23);
  });

  it("gains the total lost across opponents, one driven below zero included", () => {
    const { game } = setUp(["Exsanguinate"], [], true);
    game.state.players[B].life = 3;
    game.state.players[C].life = 10;
    cast(game, 4);
    expect(game.state.players[B].life).toBe(-1);
    expect(game.state.players[C].life).toBe(6);
    expect(game.state.players[A].life).toBe(28);
    expect(game.state.players[B].hasLost).toBe(true);
  });

  it("X = 0 changes no life and triggers nothing that watches for life gain", () => {
    const { game } = setUp(["Exsanguinate"]);
    const pridemate = game.debugSpawn("Ajani's Pridemate", A, "battlefield");
    cast(game, 0);
    expect(game.state.players[A].life).toBe(20);
    expect(game.state.players[B].life).toBe(20);
    expect(game.state.objects[pridemate].counters["+1/+1"] ?? 0).toBe(0);
  });

  it("with X > 0 the gain is a real life gain", () => {
    const { game } = setUp(["Exsanguinate"]);
    const pridemate = game.debugSpawn("Ajani's Pridemate", A, "battlefield");
    cast(game, 2);
    expect(game.state.objects[pridemate].counters["+1/+1"]).toBe(1);
  });
});

describe("Pyroblast", () => {
  /** Bob's legal targets for one mode of the Pyroblast in his hand. */
  const bobModeOptions = (game: Game, card: ObjectId, mode: number): readonly TargetRef[] => {
    const offer = game.legalActions(B).find((o) => o.kind === "cast-spell" && o.card === card);
    if (offer?.kind !== "cast-spell" || offer.castModal === undefined) throw new Error("no modal offer");
    return offer.castModal.modes[mode].targetOptions[0];
  };
  /** Alice casts `name`; Bob answers with Pyroblast's counter mode aimed at it. */
  const respond = (name: string, land: string) => {
    const { game } = setUp([name], ["Pyroblast"]);
    lands(game, A, [land, land]);
    lands(game, B, ["Mountain"]);
    const spell = cardIn(game, game.handOf(A), name);
    game.dispatch({ type: "cast-spell", player: A, card: spell });
    game.dispatch({ type: "pass-priority", player: A });
    const pyro = cardIn(game, game.handOf(B), "Pyroblast");
    // Any spell is a legal target, blue or not (the 2016-06-08 ruling).
    expect(bobModeOptions(game, pyro, 0)).toContainEqual(obj(spell));
    game.dispatch({ type: "cast-spell", player: B, card: pyro, modes: [0], targets: [obj(spell)] });
    game.advanceUntil(quiet);
    return { game, spell, pyro };
  };

  it("counters a blue spell", () => {
    const { game, spell, pyro } = respond("Baithook Angler", "Island");
    expect(zoneOf(game, spell)).toBe("graveyard");
    expect(game.events.some((e) => e.type === "spell-countered" && e.object === spell)).toBe(true);
    expect(zoneOf(game, pyro)).toBe("graveyard");
  });

  it("leaves a spell that isn't blue alone", () => {
    const { game, spell, pyro } = respond("Grizzly Bears", "Forest");
    expect(zoneOf(game, spell)).toBe("battlefield");
    expect(zoneOf(game, pyro)).toBe("graveyard");
  });

  it("destroys a blue permanent, and can target one that isn't but leaves it be", () => {
    const { game } = setUp(["Pyroblast", "Pyroblast"]);
    lands(game, A, ["Mountain", "Mountain"]);
    const angler = game.debugSpawn("Baithook Angler", B, "battlefield");
    const bears = game.debugSpawn("Grizzly Bears", B, "battlefield");
    const forest = game.debugSpawn("Forest", B, "battlefield");
    const [first, second] = game.handOf(A).filter((id) => game.state.objects[id].cardName === "Pyroblast");

    const offer = game.legalActions(A).find((o) => o.kind === "cast-spell" && o.card === first);
    const options = offer?.kind === "cast-spell" ? (offer.castModal?.modes[1].targetOptions[0] ?? []) : [];
    expect(options).toContainEqual(obj(angler));
    expect(options).toContainEqual(obj(bears));
    expect(options).toContainEqual(obj(forest));
    // The counter mode has nothing to aim at with an empty stack.
    expect(offer?.kind === "cast-spell" ? offer.castModal?.modes[0].targetOptions[0] : null).toEqual([]);

    game.dispatch({ type: "cast-spell", player: A, card: first, modes: [1], targets: [obj(bears)] });
    game.advanceUntil(quiet);
    expect(zoneOf(game, bears)).toBe("battlefield");

    game.dispatch({ type: "cast-spell", player: A, card: second, modes: [1], targets: [obj(angler)] });
    game.advanceUntil(quiet);
    expect(zoneOf(game, angler)).toBe("graveyard");
  });
});

describe("Diabolic Tutor", () => {
  it("puts any card into your hand, without revealing it", () => {
    const { game, a } = setUp(["Diabolic Tutor"]);
    lands(game, A, ["Swamp", "Swamp", "Swamp", "Swamp"]);
    const wurm = game.debugSpawn("Craw Wurm", A, "library");
    const ring = game.debugSpawn("Sol Ring", A, "library");
    let offered: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      offered = eligible;
      return [wurm];
    };
    game.dispatch({ type: "cast-spell", player: A, card: cardIn(game, game.handOf(A), "Diabolic Tutor") });
    game.advanceUntil(quiet);

    expect(offered).toContain(wurm);
    expect(offered).toContain(ring);
    expect(zoneOf(game, wurm)).toBe("hand");
    expect(zoneOf(game, ring)).toBe("library");
    expect(game.events.some((e) => e.type === "cards-revealed")).toBe(false);
  });
});

describe("Fabricate", () => {
  it("finds only an artifact card, and reveals it", () => {
    const { game, a } = setUp(["Fabricate"]);
    lands(game, A, ["Island", "Island", "Island"]);
    const wurm = game.debugSpawn("Craw Wurm", A, "library");
    const ring = game.debugSpawn("Sol Ring", A, "library");
    const stone = game.debugSpawn("Mind Stone", A, "library");
    let offered: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      offered = eligible;
      return [stone];
    };
    game.dispatch({ type: "cast-spell", player: A, card: cardIn(game, game.handOf(A), "Fabricate") });
    game.advanceUntil(quiet);

    expect([...offered].sort()).toEqual([ring, stone].sort());
    expect(offered).not.toContain(wurm);
    expect(zoneOf(game, stone)).toBe("hand");
    expect(
      game.events.some((e) => e.type === "cards-revealed" && e.objects.includes(stone)),
    ).toBe(true);
  });
});

describe("Green Sun's Zenith", () => {
  const library = (game: Game) => ({
    bears: game.debugSpawn("Grizzly Bears", A, "library"), // green, MV 2
    elves: game.debugSpawn("Llanowar Elves", A, "library"), // green, MV 1
    wurm: game.debugSpawn("Craw Wurm", A, "library"), // green, MV 6
    angler: game.debugSpawn("Baithook Angler", A, "library"), // blue, MV 2
    ring: game.debugSpawn("Sol Ring", A, "library"), // not a creature
  });

  it("puts a green creature card with mana value X or less onto the battlefield, then shuffles itself away", () => {
    const { game, a } = setUp(["Green Sun's Zenith"]);
    lands(game, A, ["Forest", "Forest", "Forest"]);
    const cards = library(game);
    let offered: readonly ObjectId[] = [];
    a.chooseFromZoneFn = (_view, eligible) => {
      offered = eligible;
      return [cards.bears];
    };
    const zenith = cardIn(game, game.handOf(A), "Green Sun's Zenith");
    game.dispatch({ type: "cast-spell", player: A, card: zenith, xValue: 2 });
    game.advanceUntil(quiet);

    expect([...offered].sort()).toEqual([cards.bears, cards.elves].sort());
    expect(zoneOf(game, cards.bears)).toBe("battlefield");
    expect(zoneOf(game, cards.wurm)).toBe("library");
    expect(zoneOf(game, zenith)).toBe("library");
    expect(game.graveyardOf(A)).not.toContain(zenith);
  });

  it("with X = 0 there's nothing to find here, and it still goes back into the library", () => {
    const { game, a } = setUp(["Green Sun's Zenith"]);
    lands(game, A, ["Forest"]);
    library(game);
    let offered: readonly ObjectId[] | null = null;
    a.chooseFromZoneFn = (_view, eligible) => {
      offered = eligible;
      return [];
    };
    const zenith = cardIn(game, game.handOf(A), "Green Sun's Zenith");
    game.dispatch({ type: "cast-spell", player: A, card: zenith, xValue: 0 });
    game.advanceUntil(quiet);
    expect(offered ?? []).toEqual([]);
    expect(zoneOf(game, zenith)).toBe("library");
  });

  it("goes to the graveyard when countered, and searches nothing", () => {
    const { game, a } = setUp(["Green Sun's Zenith"], ["Counterspell"]);
    lands(game, A, ["Forest", "Forest", "Forest"]);
    lands(game, B, ["Island", "Island"]);
    const cards = library(game);
    let searched = false;
    a.chooseFromZoneFn = () => {
      searched = true;
      return [cards.bears];
    };
    const zenith = cardIn(game, game.handOf(A), "Green Sun's Zenith");
    game.dispatch({ type: "cast-spell", player: A, card: zenith, xValue: 2 });
    game.dispatch({ type: "pass-priority", player: A });
    game.dispatch({
      type: "cast-spell",
      player: B,
      card: cardIn(game, game.handOf(B), "Counterspell"),
      targets: [obj(zenith)],
    });
    game.advanceUntil(quiet);
    expect(zoneOf(game, zenith)).toBe("graveyard");
    expect(searched).toBe(false);
    expect(zoneOf(game, cards.bears)).toBe("library");
  });
});
