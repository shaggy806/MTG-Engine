import { describe, expect, it } from "vitest";
import {
  createOracleTagIndex,
  parseTypeLine,
  suggestReplacements,
} from "../card-replacer.js";
import type { ReplacementTarget } from "../card-replacer.js";
import { colorIdentityOf, withinIdentity } from "../identity.js";
import { createDefaultRegistry } from "../cards.js";
import { manaValue, parseManaCost } from "../mana.js";

const registry = createDefaultRegistry();

/** The single best stand-in's name, or `null` when nothing fits. */
const bestReplacement = (target: ReplacementTarget): string | null =>
  suggestReplacements(target, { limit: 1 })[0]?.name ?? null;

describe("parseTypeLine", () => {
  it("splits supertype + type + subtypes", () => {
    expect(parseTypeLine("Legendary Creature — Elf Warrior")).toEqual({
      supertypes: ["legendary"],
      types: ["creature"],
      subtypes: ["Elf", "Warrior"],
    });
  });

  it("handles a card with two types and no subtypes", () => {
    expect(parseTypeLine("Artifact Creature — Construct")).toEqual({
      supertypes: [],
      types: ["artifact", "creature"],
      subtypes: ["Construct"],
    });
  });

  it("handles a single type with no dash at all", () => {
    expect(parseTypeLine("Instant")).toEqual({ supertypes: [], types: ["instant"], subtypes: [] });
  });

  it("handles a basic land", () => {
    expect(parseTypeLine("Basic Land — Forest")).toEqual({
      supertypes: ["basic"],
      types: ["land"],
      subtypes: ["Forest"],
    });
  });
});

describe("suggestReplacements — the best match", () => {
  it("returns an implemented, same-type card for a green bear-shaped creature", () => {
    const name = bestReplacement({ manaCost: "{1}{G}", typeLine: "Creature — Bear" });
    expect(name).not.toBeNull();
    const def = registry.get(name!);
    expect(def.types).toContain("creature");
    expect(def.colors).toContain("G");
  });

  it("never suggests a creature for a noncreature instant", () => {
    const name = bestReplacement({ manaCost: "{1}{U}", typeLine: "Instant" });
    expect(name).not.toBeNull();
    const def = registry.get(name!);
    expect(def.types).toEqual(["instant"]);
  });

  it("prefers a closer mana value over an exact type match further away", () => {
    // Grizzly Bears-shaped creature at a specific, uncommon mana value (5) --
    // the result should be a creature reasonably close to that cost, not an
    // arbitrary one.
    const name = bestReplacement({ manaCost: "{3}{G}{G}", typeLine: "Creature — Beast" });
    const def = registry.get(name!);
    expect(def.types).toContain("creature");
    expect(Math.abs(manaValue(parseManaCost(def.manaCost)) - 5)).toBeLessThanOrEqual(2);
  });

  it("returns null for a type line with no recognizable card type", () => {
    expect(bestReplacement({ manaCost: null, typeLine: "Hero" })).toBeNull();
  });

  it("returns null when nothing in the pool shares the target's type at all", () => {
    // Battle is a real CardType but this pool (per AUTHORING/ROADMAP) has no
    // implemented Battle cards -- confirms the hard type filter actually
    // excludes rather than falling back to "closest anything".
    const name = bestReplacement({ manaCost: "{3}{R}", typeLine: "Battle — Siege" });
    expect(name).toBeNull();
  });

  it("is deterministic across repeated calls", () => {
    const target = { manaCost: "{2}{W}", typeLine: "Creature — Human Soldier" };
    const first = bestReplacement(target);
    const second = bestReplacement(target);
    expect(first).toBe(second);
  });
});

describe("suggestReplacements — for a particular deck", () => {
  // A hand-built index in the generator's shape: a handful of real cards and
  // the tags they really carry, plus enough stand-ins for all the other
  // removal in Magic that "removal" is as common as it really is and "edict"
  // as rare — similarity weighs rare tags more, so the proportions matter.
  const TAGS = ["removal", "removal-creature", "edict", "sweeper", "card-advantage", "tutor-land-basic"];
  const tag = (...names: string[]) => names.map((n) => TAGS.indexOf(n));
  const otherRemoval = Object.fromEntries(
    Array.from({ length: 5000 }, (_, i) => [`Other removal ${i}`, tag("removal", "removal-creature")]),
  );
  const index = createOracleTagIndex({
    legalCardCount: 30000,
    tags: TAGS,
    cards: {
      ...otherRemoval,
      "Soul Shatter": tag("removal", "removal-creature", "edict"),
      "Diabolic Edict": tag("removal", "removal-creature", "edict"),
      "Doom Blade": tag("removal", "removal-creature"),
      "Murder": tag("removal", "removal-creature"),
      "Infernal Grasp": tag("removal", "removal-creature"),
      "Night's Whisper": tag("card-advantage"),
      "Sign in Blood": tag("card-advantage"),
      "Myriad Landscape": tag("tutor-land-basic"),
      "Evolving Wilds": tag("tutor-land-basic"),
      "Terramorphic Expanse": tag("tutor-land-basic"),
    },
  });
  const soulShatter = { name: "Soul Shatter", manaCost: "{2}{B}", typeLine: "Instant" };

  it("keeps every suggestion inside the deck's colour identity", () => {
    const identity = new Set(["W"] as const);
    const suggestions = suggestReplacements(
      { manaCost: "{1}{B}", typeLine: "Instant" },
      { identity, limit: 10 },
    );
    expect(suggestions.length).toBeGreaterThan(0);
    for (const s of suggestions) {
      expect(withinIdentity(colorIdentityOf(registry.get(s.name)), identity)).toBe(true);
    }
  });

  it("never suggests a card the deck already has", () => {
    const first = suggestReplacements(soulShatter, { tags: index })[0].name;
    const next = suggestReplacements(soulShatter, { tags: index, exclude: [first] });
    expect(next.map((s) => s.name)).not.toContain(first);
  });

  it("only offers a card that can be a commander for the commander slot", () => {
    const suggestions = suggestReplacements(
      { manaCost: "{3}{B}{R}", typeLine: "Legendary Creature — Demon", power: "5", toughness: "5" },
      { forCommander: true, limit: 10 },
    );
    expect(suggestions.length).toBeGreaterThan(0);
    for (const s of suggestions) {
      const def = registry.get(s.name);
      expect(def.supertypes).toContain("legendary");
    }
  });

  it("prefers the card that does the same job, and says what they share", () => {
    const [best] = suggestReplacements(soulShatter, { tags: index, identity: ["B"] });
    // Among black instants at a similar cost, the edict is the one that
    // removes a creature the way Soul Shatter does.
    expect(best.name).toBe("Diabolic Edict");
    expect(best.sharedTags[0]).toBe("edict");
    expect(best.confidence).toBe("high");
  });

  it("matches a land on what it fetches", () => {
    const [best] = suggestReplacements(
      { name: "Myriad Landscape", manaCost: null, typeLine: "Land" },
      { tags: index },
    );
    expect(["Evolving Wilds", "Terramorphic Expanse"]).toContain(best.name);
    expect(best.sharedTags).toEqual(["tutor-land-basic"]);
  });

  it("is low confidence when there are no tags to go on", () => {
    const suggestions = suggestReplacements(soulShatter, { identity: ["B"] });
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every((s) => s.confidence === "low" && s.sharedTags.length === 0)).toBe(true);
  });

  it("doesn't cross a card type unless the tags say the job is the same", () => {
    // A tagless black sorcery never gets a creature.
    for (const s of suggestReplacements(
      { manaCost: "{2}{B}", typeLine: "Sorcery" },
      { identity: ["B"], limit: 10 },
    )) {
      expect(registry.get(s.name).types).not.toContain("creature");
    }
  });
});
