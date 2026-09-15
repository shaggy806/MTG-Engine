import { describe, expect, it } from "vitest";

import { validateCommanderDeck } from "../deck-validation.js";
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
});
