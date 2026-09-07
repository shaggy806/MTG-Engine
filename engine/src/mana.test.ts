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
    expect(() => parseManaCost("{G/U}")).toThrow(/unsupported/);
    expect(() => parseManaCost("{W/P}")).toThrow();
  });

  it("manaValue counts every pip", () => {
    expect(manaValue(parseManaCost("{3}{W}{U}"))).toBe(5);
    expect(manaValue(parseManaCost("{R}"))).toBe(1);
  });
});
