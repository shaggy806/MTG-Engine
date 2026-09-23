import { describe, expect, it } from "vitest";

import { canPairCommanders, commandersOf, validateCommanderDeck } from "../deck-validation.js";
import { createDefaultRegistry } from "../cards.js";

const reg = createDefaultRegistry();

describe("validateCommanderDeck", () => {
  // Atraxa's identity is WUBG, so the filler basics have to be in it too.
  const basics = (n: number): string[] => Array<string>(n).fill("Forest");

  it("passes a within-identity singleton 100", () => {
    const r = validateCommanderDeck(
      {
        commanders: ["Atraxa, Praetors' Voice"], // WUBG
        cards: ["Counterspell", "White Knight", "Doom Blade", ...basics(96)],
        size: 100,
      },
      reg,
    );
    expect(r.legal).toBe(true);
    expect(r.identity).toBe("WUBG");
  });

  it("flags a colour-identity violation", () => {
    const r = validateCommanderDeck(
      {
        commanders: ["Atraxa, Praetors' Voice"], // WUBG — no red
        cards: ["Lightning Bolt", ...basics(98)],
        size: 100,
      },
      reg,
    );
    expect(r.legal).toBe(false);
    expect(r.violations.some((v) => v.includes("Lightning Bolt") && v.includes("colour identity"))).toBe(true);
  });

  it("flags a non-singleton non-basic and a wrong size", () => {
    const r = validateCommanderDeck(
      {
        commanders: ["Atraxa, Praetors' Voice"],
        cards: ["Llanowar Elves", "Llanowar Elves", ...basics(10)],
        size: 100,
      },
      reg,
    );
    expect(r.violations.some((v) => v.includes('2× "Llanowar Elves"'))).toBe(true);
    expect(r.violations.some((v) => v.includes("13 cards, the format wants 100"))).toBe(true);
  });

  it("basics may repeat", () => {
    const r = validateCommanderDeck(
      { commanders: ["Atraxa, Praetors' Voice"], cards: basics(99), size: 100 },
      reg,
    );
    expect(r.violations.some((v) => v.includes("singleton"))).toBe(false);
  });

  it("rejects a non-legendary-creature commander", () => {
    const r = validateCommanderDeck(
      { commanders: ["Lightning Bolt"], cards: basics(99), size: 100 },
      reg,
    );
    expect(r.violations.some((v) => v.includes("can't be a commander"))).toBe(true);
  });

  // A token and a back face are both fully-registered definitions, so without
  // an explicit check they pass singleton/identity/size like any other name.
  it("rejects a token in the 99", () => {
    const r = validateCommanderDeck(
      {
        commanders: ["Atraxa, Praetors' Voice"],
        cards: ["Treasure Token", ...basics(98)],
        size: 100,
      },
      reg,
    );
    expect(r.violations.some((v) => v.includes("Treasure Token") && v.includes("token"))).toBe(
      true,
    );
  });

  it("rejects a card's back face in the 99", () => {
    const r = validateCommanderDeck(
      {
        commanders: ["Atraxa, Praetors' Voice"],
        // The night side of Harvesttide Infiltrator, which is what a decklist
        // would actually name.
        cards: ["Harvesttide Assailant", ...basics(98)],
        size: 100,
      },
      reg,
    );
    expect(
      r.violations.some(
        (v) => v.includes("Harvesttide Assailant") && v.includes("Harvesttide Infiltrator"),
      ),
    ).toBe(true);
  });
});

describe("two commanders (Partner, rule 702.124c)", () => {
  // Thrasios is GU and Tana RG, so Forests fit both.
  const deckOf = (commanders: readonly string[]) =>
    validateCommanderDeck({ commanders, cards: Array<string>(98).fill("Forest"), size: 100 }, reg);

  it("pairs two commanders that both have Partner", () => {
    expect(deckOf(["Thrasios, Triton Hero", "Tana, the Bloodsower"]).violations).toEqual([]);
    expect(canPairCommanders(reg, "Thrasios, Triton Hero", "Tana, the Bloodsower")).toBe(true);
  });

  // It used to be enough for either one to have it, which made Thrasios the
  // partner of any legend at all.
  it("won't pair a Partner commander with one that lacks it", () => {
    const r = deckOf(["Thrasios, Triton Hero", "Atraxa, Praetors' Voice"]);
    expect(r.legal).toBe(false);
    expect(r.violations).toContain(
      `"Thrasios, Triton Hero" and "Atraxa, Praetors' Voice" can't be paired: both commanders need Partner`,
    );
    expect(canPairCommanders(reg, "Atraxa, Praetors' Voice", "Thrasios, Triton Hero")).toBe(false);
  });

  it("doesn't guess whether an unimplemented commander has Partner", () => {
    const r = deckOf(["Thrasios, Triton Hero", "Some Made Up Partner"]);
    expect(r.violations).toEqual([`commander "Some Made Up Partner" is not implemented`]);
  });
});

describe("commandersOf", () => {
  it("reads `commanders` first, then the single `commander`, then nothing", () => {
    expect(commandersOf({ commanders: ["A", "B"], commander: "C" })).toEqual(["A", "B"]);
    expect(commandersOf({ commander: "C" })).toEqual(["C"]);
    expect(commandersOf({})).toEqual([]);
    // An empty list is a deck with no commander, not a missing field.
    expect(commandersOf({ commanders: [], commander: "C" })).toEqual([]);
  });
});
