import { describe, expect, it } from "vitest";
import type { Color } from "engine";
import { botNameFits, botNameFor } from "../bot-names.js";

const colors = (s: string) => new Set(s.split("") as Color[]);

describe("botNameFor", () => {
  it("picks a character of the deck's own colours", () => {
    expect(["Jace", "Urza", "Tamiyo", "Talrand"]).toContain(botNameFor(colors("U")));
    expect(["Vraska", "Jarad", "Meren"]).toContain(botNameFor(colors("BG")));
    expect(["Karn", "Ugin", "Kozilek", "Emrakul"]).toContain(botNameFor(new Set()));
  });

  it("passes over a name another seat already uses", () => {
    expect(botNameFor(colors("BG"), new Set(["Vraska", "Jarad"]))).toBe("Meren");
  });

  it("falls back to the closest match once every exact one is taken", () => {
    const name = botNameFor(colors("BG"), new Set(["Vraska", "Jarad", "Meren"]));
    // Jund, Sultai and Abzan each share both colours with a third extra (2/3),
    // ahead of a mono-colour character's 1/2.
    expect(["Korvold", "Prossh", "Kresh", "Sidisi", "Tasigur", "Muldrotha", "Anafenza", "Karador", "Ghave"]).toContain(name);
  });

  it("botNameFits accepts only a best match", () => {
    expect(botNameFits("Vraska", colors("BG"))).toBe(true);
    expect(botNameFits("Liliana", colors("BG"))).toBe(false);
  });
});
