/**
 * Changeling (rule 702.73a) — "this object is every creature type", a
 * characteristic-defining ability that works in every zone (rule 604.3) —
 * and its land counterpart, "every land type". Both are one marker in a
 * subtype list (`subtypes.ts`), which every subtype question asks about
 * through `hasSubtype`: filters, lords, amass, Path of Ancestry, a snapshot
 * of a permanent that has left.
 *
 * Morophon, the Boundless is the pool's changeling; the rest of Morophon is
 * `cmdr-morophon-the-boundless.test.ts`.
 */

import { describe, expect, it } from "vitest";

import { defineCard } from "../cards/define.js";
import { createDefaultRegistry } from "../cards/registry.js";
import { computeCharacteristics, effectiveSubtypes } from "../characteristics.js";
import { landTypesControlledBy } from "../combat/eligibility.js";
import type { EffectSpec } from "../effects.js";
import { matchesFilter } from "../filter.js";
import type { CardFilter } from "../filter.js";
import { Game } from "../game.js";
import { manaOriginMatches } from "../mana.js";
import { asPlayerId } from "../primitives.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import { EVERY_CREATURE_TYPE, EVERY_LAND_TYPE, hasSubtype, withoutTypeMarkers } from "../subtypes.js";

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const MOROPHON = "Morophon, the Boundless";

/** A creature card with no creature type at all, which shares none with
 * anything — the pool has none. */
const TYPELESS = "Test Typeless Creature";
/** A plain changeling creature, for the side of Path of Ancestry where the
 * spell is the changeling. */
const CHANGELING = "Test Changeling Scout";
/** Changeling on a noncreature, which can't have creature types (rule
 * 205.3d). */
const CHANGELING_RELIC = "Test Changeling Relic";

const registry = createDefaultRegistry()
  .register(
    defineCard({
      name: TYPELESS,
      manaCost: "{1}",
      types: ["creature"],
      power: 1,
      toughness: 1,
    }),
  )
  .register(
    defineCard({
      name: CHANGELING,
      manaCost: "{G}",
      colors: ["G"],
      types: ["creature"],
      subtypes: ["Shapeshifter"],
      power: 1,
      toughness: 1,
      keywords: ["changeling"],
      text: "Changeling (This card is every creature type.)",
    }),
  )
  .register(
    defineCard({
      name: CHANGELING_RELIC,
      manaCost: "{1}",
      types: ["artifact"],
      keywords: ["changeling"],
      text: "Changeling (This card is every creature type.)",
    }),
  );

const pad = (cards: readonly string[]): string[] => [
  ...cards,
  ...Array<string>(Math.max(0, 40 - cards.length)).fill("Forest"),
];

function makeGame(opts: { aCards?: readonly string[]; commander?: string } = {}): Game {
  const game = Game.create({
    seed: 1,
    shuffle: false,
    registry,
    startingPlayer: A,
    rules: { skipFirstDraw: false, maxLandsPerTurn: 99, maxHandSize: 99 },
    decks: [
      {
        player: A,
        cards: pad(opts.aCards ?? []),
        ...(opts.commander !== undefined ? { commander: opts.commander } : {}),
      },
      { player: B, cards: pad([]) },
    ],
  });
  game.advanceUntil((s) => s.turn.step === "precombat-main" && s.priority.holder === A);
  return game;
}

const spawn = (game: Game, name: string, player: PlayerId = A): ObjectId =>
  game.debugSpawn(name, player, "battlefield", { summoningSick: false });
const matches = (game: Game, id: ObjectId, filter: CardFilter, you: PlayerId = A): boolean =>
  matchesFilter(game.state, registry, id, filter, { you });
const subtypesOf = (game: Game, id: ObjectId): readonly string[] =>
  effectiveSubtypes(game.state, registry, game.state.objects[id]);
const settled = (s: GameState): boolean =>
  s.zones.shared.stack.length === 0 && s.awaiting === null && s.pendingTriggers.length === 0;
const on = (game: Game, id: ObjectId, effect: EffectSpec): void =>
  game.debugApplyEffect(A, effect, [{ kind: "object", object: id }]);

describe("hasSubtype — asking a subtype list", () => {
  it("reads a plain list as written", () => {
    expect(hasSubtype(["Elf", "Druid"], "Elf")).toBe(true);
    expect(hasSubtype(["Elf", "Druid"], "Goblin")).toBe(false);
  });

  it("reads the creature marker as every creature type, and nothing else", () => {
    const list = ["Shapeshifter", EVERY_CREATURE_TYPE];
    for (const type of ["Goblin", "Time Lord", "C'tan", "Army", "Shapeshifter"]) {
      expect(hasSubtype(list, type)).toBe(true);
    }
    for (const other of ["Forest", "Equipment", "Aura", "Urza's"]) {
      expect(hasSubtype(list, other)).toBe(false);
    }
  });

  it("reads the land marker as every land type, and nothing else", () => {
    const list = [EVERY_LAND_TYPE];
    for (const type of ["Forest", "Island", "Urza's", "Gate", "Power-Plant", "Desert"]) {
      expect(hasSubtype(list, type)).toBe(true);
    }
    expect(hasSubtype(list, "Goblin")).toBe(false);
    expect(hasSubtype(list, "Equipment")).toBe(false);
  });

  it("asked for a marker, answers 'any type of that kind'", () => {
    expect(hasSubtype(["Goblin"], EVERY_CREATURE_TYPE)).toBe(true);
    expect(hasSubtype(["Equipment"], EVERY_CREATURE_TYPE)).toBe(false);
    expect(hasSubtype([], EVERY_CREATURE_TYPE)).toBe(false);
    expect(hasSubtype([EVERY_CREATURE_TYPE], EVERY_CREATURE_TYPE)).toBe(true);
    expect(hasSubtype(["Plains"], EVERY_LAND_TYPE)).toBe(true);
    expect(hasSubtype(["Goblin"], EVERY_LAND_TYPE)).toBe(false);
  });

  it("strips the markers for a type line", () => {
    expect(withoutTypeMarkers(["Shapeshifter", EVERY_CREATURE_TYPE])).toEqual(["Shapeshifter"]);
    const plain = ["Elf"];
    expect(withoutTypeMarkers(plain)).toBe(plain);
  });

  it("makes mana from a changeling mana from each creature type", () => {
    const origin = { types: ["creature"] as const, subtypes: ["Shapeshifter", EVERY_CREATURE_TYPE], supertypes: [] };
    expect(manaOriginMatches(origin, { subtype: "Elf" })).toBe(true);
    expect(manaOriginMatches(origin, { type: "creature", subtype: "Treasure" })).toBe(false);
  });
});

describe("changeling — every creature type (rule 702.73a)", () => {
  it("makes Morophon every creature type, while its type line still reads Shapeshifter", () => {
    const game = makeGame();
    const morophon = spawn(game, MOROPHON);
    expect(subtypesOf(game, morophon)).toEqual(["Shapeshifter", EVERY_CREATURE_TYPE]);
    expect(matches(game, morophon, { subtype: "Goblin" })).toBe(true);
    expect(matches(game, morophon, { subtypes: ["Elf", "Wizard"] })).toBe(true);
    expect(matches(game, morophon, { type: "creature", subtype: "Time Lord" })).toBe(true);
    // A creature type, and nothing else: not a land type, not an Equipment.
    expect(matches(game, morophon, { subtype: "Forest" })).toBe(false);
    expect(matches(game, morophon, { subtype: "Equipment" })).toBe(false);
    // "Non-Zombie" leaves it out — it's a Zombie too.
    expect(matches(game, morophon, { notSubtypes: ["Zombie"] })).toBe(false);

    const seen = game.viewFor(A).objects[morophon]!;
    expect(seen.subtypes).toEqual(["Shapeshifter"]);
    expect(seen.keywords).toContain("changeling");
  });

  it("works in every zone — a changeling card in a library, hand or graveyard (rule 604.3)", () => {
    const game = makeGame();
    for (const zone of ["library", "hand", "graveyard", "exile"] as const) {
      const card = game.debugSpawn(MOROPHON, A, zone);
      expect(game.state.objects[card].zone).toBe(zone);
      expect(matches(game, card, { type: "creature", subtype: "Sliver" })).toBe(true);
      expect(computeCharacteristics(game.state, registry, card).subtypes).toContain(EVERY_CREATURE_TYPE);
    }
  });

  it("is reached by a lord of any creature type (layer 4 comes before layer 7)", () => {
    const game = makeGame();
    const morophon = spawn(game, MOROPHON);
    expect(game.characteristics(morophon).power).toBe(6);
    spawn(game, "Goblin Chieftain");
    expect(game.characteristics(morophon).power).toBe(7);
    expect(game.characteristics(morophon).toughness).toBe(7);
    expect(game.characteristics(morophon).keywords.has("haste")).toBe(true);
    // An opponent's lord reaches only its own controller's creatures.
    const other = makeGame();
    const theirs = spawn(other, MOROPHON, B);
    spawn(other, "Goblin Chieftain", A);
    expect(other.characteristics(theirs).power).toBe(6);
  });

  it("stays every creature type after losing its abilities — changeling applied first", () => {
    const game = makeGame();
    const morophon = spawn(game, MOROPHON);
    on(game, morophon, {
      kind: "animate",
      target: 0,
      power: 6,
      toughness: 6,
      addTypes: [],
      addSubtypes: [],
      loseAbilities: true,
      duration: "end-of-turn",
    });
    expect(game.characteristics(morophon).keywords.has("changeling")).toBe(false);
    expect(matches(game, morophon, { subtype: "Goblin" })).toBe(true);
  });

  it("is just a Frog once Turn to Frog makes it one — a later type change wins", () => {
    const game = makeGame();
    const morophon = spawn(game, MOROPHON);
    on(game, morophon, registry.get("Turn to Frog").effect!);
    expect(subtypesOf(game, morophon)).toEqual(["Frog"]);
    expect(matches(game, morophon, { subtype: "Goblin" })).toBe(false);
    expect(matches(game, morophon, { subtype: "Frog" })).toBe(true);
  });

  it("is copied with the rest of the card — a token copy is every creature type", () => {
    const game = makeGame();
    const morophon = spawn(game, MOROPHON);
    const before = new Set(game.battlefield);
    on(game, morophon, { kind: "create-token-copy", of: 0, count: 1, notLegendary: true });
    const copy = game.battlefield.find((id) => !before.has(id))!;
    expect(game.state.objects[copy].isToken).toBe(true);
    expect(matches(game, copy, { subtype: "Goblin" })).toBe(true);
  });

  it("gives no creature types to a noncreature (rule 205.3d)", () => {
    const game = makeGame();
    const relic = spawn(game, CHANGELING_RELIC);
    expect(subtypesOf(game, relic)).toEqual([]);
    expect(matches(game, relic, { subtype: "Goblin" })).toBe(false);
  });

  it("is read as it last existed once it has left — still every creature type", () => {
    const game = makeGame();
    const morophon = spawn(game, MOROPHON);
    game.debugApplyEffect(A, { kind: "destroy", target: 0 }, [{ kind: "object", object: morophon }]);
    expect(game.state.objects[morophon].zone).toBe("graveyard");
    expect(game.state.objects[morophon].lastKnown?.subtypes).toContain(EVERY_CREATURE_TYPE);
    expect(
      matchesFilter(game.state, registry, morophon, { subtype: "Goblin" }, { you: A, lastKnown: true }),
    ).toBe(true);
  });

  it("is a Dog spell and a Cat spell to Rin and Seri — both triggers", () => {
    const game = makeGame({ aCards: [MOROPHON] });
    spawn(game, "Rin and Seri, Inseparable");
    for (let i = 0; i < 7; i += 1) spawn(game, "Forest");
    const card = game.handOf(A).find((id) => game.state.objects[id].cardName === MOROPHON)!;
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    game.advanceUntil((s) => s.awaiting !== null || settled(s));
    if (game.state.awaiting?.kind === "choose-creature-type") {
      game.dispatch({ type: "choose-creature-type", player: A, creatureType: "Elf" });
      game.advanceUntil((s) => s.awaiting !== null || settled(s));
    }
    const tokens = game.battlefield.map((id) => game.state.objects[id].cardName);
    expect(tokens).toContain("1/1 Green Cat Token");
    expect(tokens).toContain("1/1 White Dog Token");
    // And a Dog and a Cat to "the number of Dogs you control".
    const morophon = game.battlefield.find((id) => game.state.objects[id].cardName === MOROPHON)!;
    expect(matches(game, morophon, { subtype: "Dog", controlledBy: "you" })).toBe(true);
    expect(matches(game, morophon, { subtype: "Cat", controlledBy: "you" })).toBe(true);
  });

  it("is an Army creature — amass grows it instead of making a token (rule 701.47a)", () => {
    const game = makeGame();
    const morophon = spawn(game, MOROPHON);
    const before = game.battlefield.length;
    game.debugApplyEffect(A, { kind: "amass", amount: 2, creatureType: "Zombie" });
    expect(game.battlefield.length).toBe(before);
    expect(game.state.objects[morophon].counters["+1/+1"]).toBe(2);
    // An opponent's changeling isn't an Army *you* control.
    const other = makeGame();
    spawn(other, MOROPHON, B);
    const count = other.battlefield.length;
    other.debugApplyEffect(A, { kind: "amass", amount: 1, creatureType: "Zombie" });
    expect(other.battlefield.length).toBe(count + 1);
  });

  it("gives a text change no creature-type word to replace that the card doesn't print (rule 612)", () => {
    // Artificial Evolution rewrites words printed on the card. Being every
    // creature type puts none of them there, so on Morophon — which prints
    // only "Shapeshifter" — there's nothing on its menu to replace.
    const game = makeGame();
    const morophon = spawn(game, MOROPHON);
    on(game, morophon, { kind: "change-text", target: 0 });
    expect(game.state.awaiting).toBeNull();
    // The same effect on a Goblin does offer "Goblin".
    const chieftain = spawn(game, "Goblin Chieftain");
    on(game, chieftain, { kind: "change-text", target: 0 });
    const awaiting = game.state.awaiting;
    expect(awaiting?.kind).toBe("choose-text");
    if (awaiting?.kind === "choose-text") expect(awaiting.fromOptions).toEqual(["Goblin"]);
  });
});

describe("Path of Ancestry — sharing a creature type with a changeling", () => {
  /** Put Path of Ancestry onto A's battlefield untapped: the only mana. */
  const withPath = (game: Game): void => {
    const path = spawn(game, "Path of Ancestry");
    game.state.objects[path].tapped = false;
  };
  const castFromHand = (game: Game, name: string): void => {
    const card = game.debugSpawn(name, A, "hand");
    game.dispatch({ type: "cast-spell", player: A, card, targets: [] });
    game.advanceUntil((s) => s.awaiting !== null || settled(s));
  };

  it("a changeling commander shares a type with any creature spell that has one", () => {
    const game = makeGame({ commander: MOROPHON });
    withPath(game);
    castFromHand(game, "Llanowar Elves");
    expect(game.state.awaiting?.kind).toBe("scry");
  });

  it("…but not with a creature spell that has no creature type", () => {
    const game = makeGame({ commander: MOROPHON });
    withPath(game);
    castFromHand(game, TYPELESS);
    expect(game.state.awaiting).toBeNull();
  });

  it("a changeling spell shares a type with any commander that has one", () => {
    const game = makeGame({ commander: "Anafenza, the Foremost" });
    withPath(game);
    castFromHand(game, CHANGELING);
    expect(game.state.awaiting?.kind).toBe("scry");
  });
});

describe("every land type", () => {
  it("is every land type to a filter and to landwalk, and no creature type", () => {
    const game = makeGame();
    const wastes = spawn(game, "Wastes", B);
    expect(matches(game, wastes, { subtype: "Forest" })).toBe(false);
    game.debugApplyEffect(B, {
      kind: "add-types",
      target: 0,
      addSubtypes: [EVERY_LAND_TYPE],
      duration: "permanent",
    }, [{ kind: "object", object: wastes }]);
    for (const type of ["Forest", "Island", "Urza's", "Gate", "Desert"]) {
      expect(matches(game, wastes, { type: "land", subtype: type })).toBe(true);
    }
    expect(matches(game, wastes, { subtypes: ["Swamp", "Mountain"] })).toBe(true);
    expect(matches(game, wastes, { subtype: "Goblin" })).toBe(false);
    // Every landwalk works against the player who controls it (rule 702.14c).
    expect([...landTypesControlledBy(game.state, registry, B)].sort()).toEqual(
      ["Desert", "Forest", "Island", "Mountain", "Plains", "Swamp"],
    );
    expect(game.viewFor(A).objects[wastes]!.subtypes).toEqual([]);
  });

  it("the creature marker works as an added type too — a lord reaches it", () => {
    const game = makeGame();
    const bears = spawn(game, "Grizzly Bears");
    spawn(game, "Goblin Chieftain");
    expect(game.characteristics(bears).power).toBe(2);
    on(game, bears, { kind: "add-types", target: 0, addSubtypes: [EVERY_CREATURE_TYPE], duration: "permanent" });
    expect(game.characteristics(bears).power).toBe(3);
    expect(game.viewFor(A).objects[bears]!.subtypes).toEqual(["Bear"]);
  });
});
