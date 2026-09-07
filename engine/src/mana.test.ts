import { describe, expect, it } from "vitest";

import { manaValue, parseManaCost } from "./mana.js";

describe("parseManaCost", () => {
  it("parses generic and colored symbols", () => {
    const cost = parseManaCost("{2}{G}{G}");
    expect(cost.generic).toBe(2);
    expect(cost.colored.G).toBe(2);
    expect(cost.colored.R).toBe(0);
  });

  it("sums repeated generic symbols", () => {
    expect(parseManaCost("{1}{1}{R}").generic).toBe(2);
  });

  it("treats null / empty as {0}", () => {
    expect(parseManaCost(null)).toEqual({
      generic: 0,
      colored: { W: 0, U: 0, B: 0, R: 0, G: 0 },
      colorless: 0,
      x: 0,
      hybrid: [],
    });
    expect(manaValue(parseManaCost(""))).toBe(0);
  });

  it("parses {C} as a colorless pip, counted in mana value", () => {
    const cost = parseManaCost("{4}{C}{C}");
    expect(cost.colorless).toBe(2);
    expect(cost.generic).toBe(4);
    expect(manaValue(cost)).toBe(6);
  });

  it("parses {X} into its own count and as mana value 0", () => {
    const cost = parseManaCost("{X}{R}");
    expect(cost.x).toBe(1);
    expect(cost.colored.R).toBe(1);
    expect(manaValue(cost)).toBe(1);
  });

  it("rejects unsupported symbols", () => {
    expect(() => parseManaCost("{Q}")).toThrow(/unsupported/);
    expect(() => parseManaCost("{W/Q}")).toThrow(/unsupported/);
  });

  it("manaValue counts every pip", () => {
    expect(manaValue(parseManaCost("{3}{W}{U}"))).toBe(5);
    expect(manaValue(parseManaCost("{R}"))).toBe(1);
  });

  it("parses hybrid, twobrid, and Phyrexian pips", () => {
    const hybrid = parseManaCost("{W/U}");
    expect(hybrid.hybrid).toEqual([
      [
        { kind: "color", color: "W" },
        { kind: "color", color: "U" },
      ],
    ]);

    const twobrid = parseManaCost("{2/R}{2/R}{2/R}");
    expect(twobrid.hybrid).toHaveLength(3);
    expect(twobrid.hybrid[0]).toEqual([
      { kind: "generic", amount: 2 },
      { kind: "color", color: "R" },
    ]);

    const phyrexian = parseManaCost("{R/P}");
    expect(phyrexian.hybrid[0]).toEqual([
      { kind: "color", color: "R" },
      { kind: "phyrexian" },
    ]);
  });

  it("mana value of a hybrid pip is its greatest half (rule 202.3f)", () => {
    expect(manaValue(parseManaCost("{W/U}"))).toBe(1);
    expect(manaValue(parseManaCost("{2/W}{2/W}{2/W}"))).toBe(6);
    expect(manaValue(parseManaCost("{R/P}"))).toBe(1);
    expect(manaValue(parseManaCost("{2}{G/W}{G/W}"))).toBe(4);
  });

  it("parses {S} (snow) as a generic pip", () => {
    expect(parseManaCost("{S}{S}{1}").generic).toBe(3);
  });
});
