import { describe, expect, it } from "vitest";
import { createDefaultRegistry } from "engine";

import { validateCommanderDeck } from "./deck-validation.js";
import { formatCheck, parseDecklistText } from "./import-deck.js";

const reg = createDefaultRegistry();

describe("validateCommanderDeck", () => {
  const basics = (n: number): string[] => Array<string>(n).fill("Mountain");

  it("passes a within-identity singleton 100", () => {
    const r = validateCommanderDeck(
      {
        commanders: ["Ashmark, Mardu Vanguard"], // WBR
        cards: ["Lightning Bolt", "White Knight", "Doom Blade", ...basics(96)],
        size: 100,
      },
      reg,
    );
    expect(r.legal).toBe(true);
    expect(r.identity).toBe("WBR");
  });

  it("flags a colour-identity violation", () => {
    const r = validateCommanderDeck(
      {
        commanders: ["Ashmark, Mardu Vanguard"], // WBR — no green
        cards: ["Llanowar Elves", ...basics(98)],
        size: 100,
      },
      reg,
    );
    expect(r.legal).toBe(false);
    expect(r.violations.some((v) => v.includes("Llanowar Elves") && v.includes("colour identity"))).toBe(true);
  });

  it("flags a non-singleton non-basic and a wrong size", () => {
    const r = validateCommanderDeck(
      {
        commanders: ["Ashmark, Mardu Vanguard"],
        cards: ["Lightning Bolt", "Lightning Bolt", ...basics(10)],
        size: 100,
      },
      reg,
    );
    expect(r.violations.some((v) => v.includes('2× "Lightning Bolt"'))).toBe(true);
    expect(r.violations.some((v) => v.includes("13 cards, the format wants 100"))).toBe(true);
  });

  it("basics may repeat", () => {
    const r = validateCommanderDeck(
      { commanders: ["Ashmark, Mardu Vanguard"], cards: basics(99), size: 100 },
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
});

describe("formatCheck (over a pasted list's implemented cards)", () => {
  it("guesses the commander and reports identity + violations", () => {
    const text = [
      "1 Ashmark, Mardu Vanguard",
      "3 Lightning Bolt",
      "1 Llanowar Elves",
      "10 Mountain",
    ].join("\n");
    const r = formatCheck(parseDecklistText(text), reg);
    expect(r.commander).toBe("Ashmark, Mardu Vanguard");
    expect(r.identity).toBe("WBR");
    expect(r.violations.some((v) => v.includes('3× "Lightning Bolt"'))).toBe(true);
    expect(r.violations.some((v) => v.includes("Llanowar Elves"))).toBe(true);
  });
});
