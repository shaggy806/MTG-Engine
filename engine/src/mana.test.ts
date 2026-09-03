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
    });
    expect(manaValue(parseManaCost(""))).toBe(0);
  });

  it("rejects unsupported symbols", () => {
    expect(() => parseManaCost("{X}{R}")).toThrow(/unsupported/);
    expect(() => parseManaCost("{G/U}")).toThrow();
  });

  it("manaValue counts every pip", () => {
    expect(manaValue(parseManaCost("{3}{W}{U}"))).toBe(5);
    expect(manaValue(parseManaCost("{R}"))).toBe(1);
  });
});
