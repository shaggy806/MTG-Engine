import { describe, expect, it } from "vitest";
import { parseTypeLine, suggestReplacement } from "../card-replacer.js";
import { createDefaultRegistry } from "../cards.js";
import { manaValue, parseManaCost } from "../mana.js";

const registry = createDefaultRegistry();

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

describe("suggestReplacement", () => {
  it("returns an implemented, same-type card for a green bear-shaped creature", () => {
    const name = suggestReplacement({ manaCost: "{1}{G}", typeLine: "Creature — Bear" });
    expect(name).not.toBeNull();
    const def = registry.get(name!);
    expect(def.types).toContain("creature");
    expect(def.colors).toContain("G");
  });

  it("never suggests a creature for a noncreature instant", () => {
    const name = suggestReplacement({ manaCost: "{1}{U}", typeLine: "Instant" });
    expect(name).not.toBeNull();
    const def = registry.get(name!);
    expect(def.types).toEqual(["instant"]);
  });

  it("prefers a closer mana value over an exact type match further away", () => {
    // Grizzly Bears-shaped creature at a specific, uncommon mana value (5) --
    // the result should be a creature reasonably close to that cost, not an
    // arbitrary one.
    const name = suggestReplacement({ manaCost: "{3}{G}{G}", typeLine: "Creature — Beast" });
    const def = registry.get(name!);
    expect(def.types).toContain("creature");
    expect(Math.abs(manaValue(parseManaCost(def.manaCost)) - 5)).toBeLessThanOrEqual(2);
  });

  it("returns null for a type line with no recognizable card type", () => {
    expect(suggestReplacement({ manaCost: null, typeLine: "Hero" })).toBeNull();
  });

  it("returns null when nothing in the pool shares the target's type at all", () => {
    // Battle is a real CardType but this pool (per AUTHORING/ROADMAP) has no
    // implemented Battle cards -- confirms the hard type filter actually
    // excludes rather than falling back to "closest anything".
    const name = suggestReplacement({ manaCost: "{3}{R}", typeLine: "Battle — Siege" });
    expect(name).toBeNull();
  });

  it("is deterministic across repeated calls", () => {
    const target = { manaCost: "{2}{W}", typeLine: "Creature — Human Soldier" };
    const first = suggestReplacement(target);
    const second = suggestReplacement(target);
    expect(first).toBe(second);
  });
});
