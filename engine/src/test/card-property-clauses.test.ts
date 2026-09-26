/**
 * `CardFilter` clauses about a card's own properties (`filter.ts`): base
 * power and toughness, having a mana ability, having any ability at all, `{X}`
 * in the mana cost, the coloured mana symbols in it, how many card types it
 * has, a name different from each of a group, and being of the creature type
 * chosen for the permanent asking.
 *
 * The commanders that use them have their own files — Duskana (base P/T),
 * Raggadragga (mana abilities), Morophon (the chosen type).
 */

import { describe, expect, it } from "vitest";

import { isManaAbility, isManaAbilityByRule } from "../abilities.js";
import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import type { EffectSpec } from "../effects.js";
import { matchesFilter } from "../filter.js";
import type { CardFilter } from "../filter.js";
import { Game } from "../game.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");

/** Elvish Spirit Guide's shape — a mana ability that works from the hand —
 * which the pool doesn't have. */
const HAND_MANA = "Test Hand Mana Creature";
/** A static scoped by base P/T, which the layer fold can't answer. */
const BASE_LORD = "Test Base Two Lord";
/** A static scoped by "no abilities", which the layer fold can't answer. */
const VANILLA_LORD = "Test Vanilla Lord";
/** "Creatures you control have flying." */
const FLYING_ANTHEM = "Test Flying Anthem";
/** "Creatures you control with flying have '{T}: Add {G}.'" — a mana ability
 * granted by keyword, which depends on whatever grants the keyword. */
const FLIER_MANA = "Test Flier Mana";
/** "Creatures you control with a mana ability have '{T}: Add {C}.'" — a grant
 * whose scope asks the very question it answers. */
const MANA_ECHO = "Test Mana Echo";

const tapForMana = (mana: "G" | "C") => ({
  cost: { mana: null, tap: true },
  targets: [],
  effect: { kind: "add-mana", mana, amount: 1 },
  resolve: null,
  text: `{T}: Add {${mana}}.`,
}) as const;

const registry = createDefaultRegistry()
  .register(
    defineCard({
      name: HAND_MANA,
      manaCost: "{3}{G}",
      colors: ["G"],
      types: ["creature"],
      subtypes: ["Elf", "Spirit"],
      power: 2,
      toughness: 2,
      text: "Exile this card from your hand: Add {G}.",
      activated: [
        {
          zone: "hand",
          cost: { mana: null, tap: false },
          targets: [],
          effect: { kind: "add-mana", mana: "G", amount: 1 },
          resolve: null,
          text: "Exile this card from your hand: Add {G}.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: BASE_LORD,
      manaCost: "{0}",
      types: ["enchantment"],
      text: "Creatures with base power 2 get +1/+1.",
      static: [
        {
          affects: { scope: "filter", filter: { type: "creature", basePower: { op: "eq", n: 2 } } },
          grantPt: [1, 1],
          text: "Creatures with base power 2 get +1/+1.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: VANILLA_LORD,
      manaCost: "{0}",
      types: ["enchantment"],
      text: "Creatures with no abilities get +1/+1.",
      static: [
        {
          affects: { scope: "filter", filter: { type: "creature", hasAbilities: false } },
          grantPt: [1, 1],
          text: "Creatures with no abilities get +1/+1.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: FLYING_ANTHEM,
      manaCost: "{0}",
      types: ["enchantment"],
      text: "Creatures you control have flying.",
      static: [
        {
          affects: { scope: "creatures-you-control" },
          grantKeywords: ["flying"],
          text: "Creatures you control have flying.",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: FLIER_MANA,
      manaCost: "{0}",
      types: ["enchantment"],
      text: "Creatures you control with flying have \"{T}: Add {G}.\"",
      static: [
        {
          affects: { scope: "creatures-you-control", withKeyword: "flying" },
          grantsActivated: [tapForMana("G")],
          text: "Creatures you control with flying have \"{T}: Add {G}.\"",
        },
      ],
    }),
  )
  .register(
    defineCard({
      name: MANA_ECHO,
      manaCost: "{0}",
      types: ["enchantment"],
      text: "Creatures you control with a mana ability have \"{T}: Add {C}.\"",
      static: [
        {
          affects: {
            scope: "filter",
            filter: { type: "creature", controlledBy: "you", hasManaAbility: true },
          },
          grantsActivated: [tapForMana("C")],
          text: "Creatures you control with a mana ability have \"{T}: Add {C}.\"",
        },
      ],
    }),
  );

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array<string>(Math.max(0, 40 - cards.length)).fill("Forest"),
];

function makeGame(aCards: readonly string[] = []): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      { player: A, cards: pad(aCards) },
      { player: B, cards: pad([]) },
    ],
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

const spawn = (game: Game, name: string, player: PlayerId = A, zone: "battlefield" | "hand" | "library" | "graveyard" = "battlefield"): ObjectId =>
  game.debugSpawn(name, player, zone, { summoningSick: false });
const matches = (game: Game, id: ObjectId, filter: CardFilter, you: PlayerId = A): boolean =>
  matchesFilter(game.state, registry, id, filter, { you });
const lastKnown = (game: Game, id: ObjectId, filter: CardFilter): boolean =>
  matchesFilter(game.state, registry, id, filter, { you: A, lastKnown: true });
const on = (game: Game, id: ObjectId, effect: EffectSpec): void =>
  game.debugApplyEffect(A, effect, [{ kind: "object", object: id }]);
const destroy = (game: Game, id: ObjectId): void => on(game, id, { kind: "destroy", target: 0 });
const settled = (s: GameState): boolean => s.zones.shared.stack.length === 0 && s.awaiting === null;

const TWO_TWO: CardFilter = { basePower: { op: "eq", n: 2 }, baseToughness: { op: "eq", n: 2 } };

describe("basePower / baseToughness — base P/T (rule 613.4b)", () => {
  it("is the printed P/T for a plain creature", () => {
    const game = makeGame();
    expect(matches(game, spawn(game, "Grizzly Bears"), TWO_TWO)).toBe(true);
    expect(matches(game, spawn(game, "Llanowar Elves"), TWO_TWO)).toBe(false);
  });

  it("isn't changed by counters or a pump", () => {
    const game = makeGame();
    const bears = spawn(game, "Grizzly Bears");
    on(game, bears, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 });
    expect(game.characteristics(bears).power).toBe(3);
    expect(matches(game, bears, TWO_TWO)).toBe(true);
    expect(matches(game, bears, { power: { op: "eq", n: 2 } })).toBe(false);
    const elves = spawn(game, "Llanowar Elves");
    on(game, elves, { kind: "modify-pt", target: 0, power: 1, toughness: 1, duration: "end-of-turn" });
    expect(game.characteristics(elves).power).toBe(2);
    expect(matches(game, elves, TWO_TWO)).toBe(false);
  });

  it("is what an effect that sets P/T made it — Kudo's 2/2s, a 'becomes a 2/2'", () => {
    const game = makeGame();
    const wurm = spawn(game, "Wurmcoil Engine", B);
    expect(matches(game, wurm, TWO_TWO)).toBe(false);
    spawn(game, "Kudo, King Among Bears");
    expect(matches(game, wurm, TWO_TWO)).toBe(true);
    const elves = spawn(game, "Llanowar Elves");
    on(game, elves, {
      kind: "animate",
      target: 0,
      power: 2,
      toughness: 2,
      addTypes: [],
      addSubtypes: [],
      duration: "end-of-turn",
    });
    expect(matches(game, elves, TWO_TWO)).toBe(true);
  });

  it("is what a characteristic-defining ability counts to — Tarmogoyf", () => {
    const game = makeGame();
    const goyf = spawn(game, "Tarmogoyf");
    spawn(game, "Lightning Bolt", B, "graveyard");
    spawn(game, "Forest", B, "graveyard");
    // An instant and a land: 2/3, counted in layer 7a — so that's its base.
    expect(game.characteristics(goyf).power).toBe(2);
    expect(matches(game, goyf, { basePower: { op: "eq", n: 2 }, baseToughness: { op: "eq", n: 3 } })).toBe(true);
    on(game, goyf, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 2 });
    expect(matches(game, goyf, { basePower: { op: "eq", n: 2 } })).toBe(true);
  });

  it("is kept for a creature that has left, as it last existed", () => {
    const game = makeGame();
    const bears = spawn(game, "Grizzly Bears");
    on(game, bears, { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 });
    destroy(game, bears);
    expect(game.state.objects[bears].zone).toBe("graveyard");
    expect(lastKnown(game, bears, TWO_TWO)).toBe(true);
    expect(lastKnown(game, bears, { power: { op: "eq", n: 3 } })).toBe(true);
  });

  it("fails closed as a static's scope, which the layer fold can't answer", () => {
    const game = makeGame();
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, BASE_LORD);
    expect(game.characteristics(bears).power).toBe(2);
  });
});

describe("hasManaAbility — a mana ability (rule 605.1)", () => {
  it("counts a printed activated mana ability, and nothing else", () => {
    const game = makeGame();
    expect(matches(game, spawn(game, "Llanowar Elves"), { hasManaAbility: true })).toBe(true);
    expect(matches(game, spawn(game, "Birds of Paradise"), { hasManaAbility: true })).toBe(true);
    expect(matches(game, spawn(game, "Grizzly Bears"), { hasManaAbility: false })).toBe(true);
    // A card in hand has its abilities too.
    expect(matches(game, spawn(game, "Llanowar Elves", A, "hand"), { hasManaAbility: true })).toBe(true);
  });

  it("counts a triggered mana ability (rule 605.1b), not a trigger that adds mana on the stack", () => {
    const game = makeGame();
    expect(matches(game, spawn(game, "Crypt Ghast"), { hasManaAbility: true })).toBe(true);
    // "When this creature enters, add {R}{G}" isn't a mana ability.
    expect(matches(game, spawn(game, "Burning-Tree Emissary"), { hasManaAbility: true })).toBe(false);
  });

  it("counts a mana ability granted by a static — Cryptolith Rite — for the creatures it reaches", () => {
    const game = makeGame();
    const bears = spawn(game, "Grizzly Bears");
    const theirs = spawn(game, "Grizzly Bears", B);
    spawn(game, "Cryptolith Rite");
    expect(matches(game, bears, { hasManaAbility: true })).toBe(true);
    expect(matches(game, theirs, { hasManaAbility: true })).toBe(false);
  });

  it("is gone with the rest of its abilities", () => {
    const game = makeGame();
    const elves = spawn(game, "Llanowar Elves");
    on(game, elves, registry.get("Turn to Frog").effect!);
    expect(matches(game, elves, { hasManaAbility: true })).toBe(false);
  });

  it("counts one that works from another zone — rule 605.1a doesn't care where", () => {
    const def = registry.get(HAND_MANA);
    expect(isManaAbility(def.activated[0]!)).toBe(false);
    expect(isManaAbilityByRule(def.activated[0]!)).toBe(true);
    const game = makeGame();
    expect(matches(game, spawn(game, HAND_MANA), { hasManaAbility: true })).toBe(true);
  });

  it("is kept for a creature that has left", () => {
    const game = makeGame();
    const elves = spawn(game, "Llanowar Elves");
    destroy(game, elves);
    expect(lastKnown(game, elves, { hasManaAbility: true })).toBe(true);
  });

  it("sees a mana ability granted by keyword, the keyword granted too (rule 613.8a)", () => {
    // A static scoped by "with a mana ability" (Raggadragga's +2/+2) waits
    // for the keywords the fold grants, so the grant that turns on flying
    // from another static reaches the Bears in time.
    const game = makeGame();
    spawn(game, "Raggadragga, Goreguts Boss");
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, FLIER_MANA);
    expect(game.characteristics(bears).power).toBe(2);
    spawn(game, FLYING_ANTHEM);
    expect(matches(game, bears, { hasManaAbility: true })).toBe(true);
    expect(game.characteristics(bears).power).toBe(4);
  });

  it("answers a grant scoped by the same question without looping", () => {
    // "Creatures with a mana ability have one": asking whether the Bears
    // have one asks whether the grant reaches them, which asks again. The
    // inner question answers with what's printed — they have none — and the
    // Elves, which do, get the grant as well.
    const game = makeGame();
    spawn(game, MANA_ECHO);
    const bears = spawn(game, "Grizzly Bears");
    const elves = spawn(game, "Llanowar Elves");
    expect(matches(game, bears, { hasManaAbility: true })).toBe(false);
    expect(matches(game, elves, { hasManaAbility: true })).toBe(true);
  });
});

describe("hasAbilities — any ability at all (rule 113)", () => {
  it("is false only for a card with no ability — a vanilla creature", () => {
    const game = makeGame();
    expect(matches(game, spawn(game, "Grizzly Bears"), { hasAbilities: false })).toBe(true);
    expect(matches(game, spawn(game, "Llanowar Elves"), { hasAbilities: true })).toBe(true);
    // A basic land's mana ability, an instant's instructions, an Aura's
    // enchant ability.
    expect(matches(game, spawn(game, "Forest"), { hasAbilities: true })).toBe(true);
    expect(matches(game, spawn(game, "Lightning Bolt", A, "hand"), { hasAbilities: true })).toBe(true);
    expect(matches(game, spawn(game, "Pacifism", A, "hand"), { hasAbilities: true })).toBe(true);
  });

  it("counts what's granted — a keyword, an activated ability — but not a bonus", () => {
    const game = makeGame();
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Glorious Anthem");
    expect(game.characteristics(bears).power).toBe(3);
    expect(matches(game, bears, { hasAbilities: false })).toBe(true);
    on(game, bears, { kind: "grant-keyword", target: 0, keyword: "flying", duration: "end-of-turn" });
    expect(matches(game, bears, { hasAbilities: true })).toBe(true);

    const other = makeGame();
    const plain = spawn(other, "Grizzly Bears");
    spawn(other, "Cryptolith Rite");
    expect(matches(other, plain, { hasAbilities: true })).toBe(true);
  });

  it("is false once a creature loses its abilities", () => {
    const game = makeGame();
    const elves = spawn(game, "Llanowar Elves");
    on(game, elves, registry.get("Turn to Frog").effect!);
    expect(matches(game, elves, { hasAbilities: false })).toBe(true);
  });

  it("counts escape a static gives a card in a graveyard — Underworld Breach", () => {
    const game = makeGame();
    const bears = spawn(game, "Grizzly Bears", A, "graveyard");
    expect(matches(game, bears, { hasAbilities: false })).toBe(true);
    spawn(game, "Underworld Breach");
    expect(matches(game, bears, { hasAbilities: true })).toBe(true);
  });

  it("reads a spell on the stack", () => {
    const game = makeGame(["Grizzly Bears"]);
    spawn(game, "Forest");
    spawn(game, "Forest");
    const card = game.handOf(A).find((id) => game.state.objects[id].cardName === "Grizzly Bears")!;
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    expect(game.state.objects[card].zone).toBe("stack");
    expect(matches(game, card, { type: "creature", hasAbilities: false })).toBe(true);
    game.advanceUntil(settled);
  });

  it("counts split second a static gives a spell — Shadow the Hedgehog's", () => {
    const game = makeGame(["Grizzly Bears"]);
    spawn(game, "Shadow the Hedgehog");
    // Mind Stone pays the {1}: mana from an artifact, so the Bears have
    // split second on the stack.
    spawn(game, "Mind Stone");
    spawn(game, "Forest");
    const card = game.handOf(A).find((id) => game.state.objects[id].cardName === "Grizzly Bears")!;
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    expect(game.state.objects[card].zone).toBe("stack");
    expect(matches(game, card, { hasAbilities: true })).toBe(true);
    game.advanceUntil(settled);
  });

  it("counts the haste a suspended creature gains", () => {
    const game = makeGame();
    const bears = spawn(game, "Grizzly Bears");
    game.state.objects[bears].hastyUntilItLeaves = true;
    expect(matches(game, bears, { hasAbilities: true })).toBe(true);
  });

  it("is kept for a creature that has left", () => {
    const game = makeGame();
    const bears = spawn(game, "Grizzly Bears");
    destroy(game, bears);
    expect(lastKnown(game, bears, { hasAbilities: false })).toBe(true);
  });

  it("fails closed as a static's scope, which the layer fold can't answer", () => {
    const game = makeGame();
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, VANILLA_LORD);
    expect(game.characteristics(bears).power).toBe(2);
  });
});

describe("xInManaCost / coloredManaSymbols — reading the mana cost", () => {
  const card = (game: Game, name: string): ObjectId => spawn(game, name, A, "hand");
  const symbols = (game: Game, id: ObjectId, n: number): boolean =>
    matches(game, id, { coloredManaSymbols: { op: "eq", n } });

  it("finds {X} in a mana cost", () => {
    const game = makeGame();
    expect(matches(game, card(game, "Blaze"), { xInManaCost: true })).toBe(true);
    expect(matches(game, card(game, "Lightning Bolt"), { xInManaCost: true })).toBe(false);
    expect(matches(game, card(game, "Lightning Bolt"), { xInManaCost: false })).toBe(true);
  });

  it("still finds {X} on a spell cast with X chosen", () => {
    const game = makeGame(["Blaze"]);
    for (let i = 0; i < 4; i += 1) spawn(game, "Mountain");
    const blaze = game.handOf(A).find((id) => game.state.objects[id].cardName === "Blaze")!;
    game.dispatch({
      type: "cast-spell",
      player: A,
      card: blaze,
      xValue: 3,
      targets: [{ kind: "player", player: B }],
    });
    expect(game.state.objects[blaze].zone).toBe("stack");
    expect(matches(game, blaze, { xInManaCost: true })).toBe(true);
    game.advanceUntil(settled);
  });

  it("counts coloured symbols — a hybrid or Phyrexian symbol once, {C} and generic not at all", () => {
    const game = makeGame();
    expect(symbols(game, card(game, "Lightning Bolt"), 1)).toBe(true);
    expect(symbols(game, card(game, "Blaze"), 1)).toBe(true);
    expect(symbols(game, card(game, "Grizzly Bears"), 1)).toBe(true);
    expect(symbols(game, card(game, "Boros Guildmage"), 2)).toBe(true);
    expect(symbols(game, card(game, "Dismember"), 2)).toBe(true);
    expect(symbols(game, card(game, "Spectral Procession"), 3)).toBe(true);
    expect(symbols(game, card(game, "Spatial Contortion"), 0)).toBe(true);
    expect(symbols(game, card(game, "Wastes"), 0)).toBe(true);
    // Omnath, Locus of All's "three or more".
    const threePlus: CardFilter = { coloredManaSymbols: { op: "gte", n: 3 } };
    expect(matches(game, card(game, "Spectral Procession"), threePlus)).toBe(true);
    expect(matches(game, card(game, "Boros Guildmage"), threePlus)).toBe(false);
  });

  it("reads the face that's up — a transformed back face has no mana cost (rule 712.8e)", () => {
    const game = makeGame();
    const keeper = spawn(game, "Bloodline Keeper");
    expect(symbols(game, keeper, 2)).toBe(true);
    on(game, keeper, { kind: "transform", target: 0 });
    expect(game.state.objects[keeper].face).toBe(1);
    expect(symbols(game, keeper, 0)).toBe(true);
    // Its mana value is still the front face's.
    expect(matches(game, keeper, { manaValue: { op: "eq", n: 4 } })).toBe(true);
  });
});

describe("cardTypeCount — how many card types", () => {
  it("counts current types", () => {
    const game = makeGame();
    const twoPlus: CardFilter = { cardTypeCount: { op: "gte", n: 2 } };
    expect(matches(game, spawn(game, "Grizzly Bears"), twoPlus)).toBe(false);
    expect(matches(game, spawn(game, "Solemn Simulacrum"), twoPlus)).toBe(true);
    expect(matches(game, spawn(game, "Dryad Arbor"), twoPlus)).toBe(true);
    const wastes = spawn(game, "Wastes");
    expect(matches(game, wastes, twoPlus)).toBe(false);
    on(game, wastes, {
      kind: "animate",
      target: 0,
      power: 2,
      toughness: 2,
      addTypes: ["creature"],
      addSubtypes: [],
      duration: "end-of-turn",
    });
    expect(matches(game, wastes, twoPlus)).toBe(true);
  });
});

describe("nameDiffersFromEach — a different name than each … (rule 201.2c)", () => {
  const AURA: CardFilter = {
    subtype: "Aura",
    nameDiffersFromEach: { subtype: "Aura", controlledBy: "you" },
  };

  it("rejects a card sharing its name with one of yours, and nothing else", () => {
    const game = makeGame();
    const pacifism = spawn(game, "Pacifism", A, "library");
    const flight = spawn(game, "Arcane Flight", A, "library");
    // Nothing to differ from: every Aura qualifies.
    expect(matches(game, pacifism, AURA)).toBe(true);
    game.debugSpawn("Pacifism", A, "battlefield");
    expect(matches(game, pacifism, AURA)).toBe(false);
    expect(matches(game, flight, AURA)).toBe(true);
  });

  it("looks only at the permanents the inner filter finds — not an opponent's", () => {
    const game = makeGame();
    const pacifism = spawn(game, "Pacifism", A, "library");
    game.debugSpawn("Pacifism", B, "battlefield");
    expect(matches(game, pacifism, AURA)).toBe(true);
  });
});

describe("ofChosenType — of the creature type chosen for the permanent asking", () => {
  it("matches the chosen type — a changeling always — and nothing without a choice", () => {
    const game = makeGame();
    const cavern = spawn(game, "Cavern of Souls");
    const elves = spawn(game, "Llanowar Elves");
    const bears = spawn(game, "Grizzly Bears");
    const morophon = spawn(game, "Morophon, the Boundless");
    const asking = (id: ObjectId, source?: ObjectId): boolean =>
      matchesFilter(game.state, registry, id, { ofChosenType: true }, {
        you: A,
        ...(source !== undefined ? { source } : {}),
      });
    // Nothing chosen yet (debugSpawn doesn't ask), and no source at all.
    expect(asking(elves, cavern)).toBe(false);
    expect(asking(elves)).toBe(false);
    game.state.objects[cavern].chosenCreatureType = "Elf";
    expect(asking(elves, cavern)).toBe(true);
    expect(asking(bears, cavern)).toBe(false);
    expect(asking(morophon, cavern)).toBe(true);
  });
});
