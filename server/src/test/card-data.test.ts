import { afterEach, describe, expect, it, vi } from "vitest";
import { createDefaultRegistry } from "engine";
import { createCardData, loadCardData } from "../card-data.js";
import { evaluateDecklist } from "../import-deck.js";

const registry = createDefaultRegistry();

// Made-up names, so no real card's arrival in the pool (or in the process
// cache another test filled) can change what these see.
const data = createCardData([
  {
    name: "Local Only Golem",
    commander: "legal",
    mana_cost: "{4}",
    type_line: "Artifact Creature — Golem",
    power: "4",
    toughness: "4",
    keywords: ["Trample"],
    color_identity: [],
  },
  {
    name: "Lefty Spell // Righty Spell",
    commander: "legal",
    mana_cost: "{1}{R} // {1}{U}",
    type_line: "Instant // Instant",
    color_identity: ["R", "U"],
    faces: [
      { name: "Lefty Spell", mana_cost: "{1}{R}", type_line: "Instant" },
      { name: "Righty Spell", mana_cost: "{1}{U}", type_line: "Instant" },
    ],
  },
  { name: "Golem Token", commander: "token", type_line: "Token Artifact Creature — Golem" },
]);

describe("createCardData", () => {
  it("answers to a card's name, its single-slash form and each face, in any case", () => {
    expect(data("Local Only Golem")?.power).toBe("4");
    expect(data("local only golem")?.keywords).toEqual(["Trample"]);
    for (const name of ["Lefty Spell // Righty Spell", "Lefty Spell / Righty Spell", "Righty Spell"]) {
      expect(data(name)?.colorIdentity).toEqual(["R", "U"]);
    }
    expect(data("Nobody Knows Me")).toBeUndefined();
    // A token is no card a decklist names.
    expect(data("Golem Token")).toBeUndefined();
  });
});

describe("the engine's Oracle snapshot", () => {
  it("loads, and knows real cards the engine doesn't have", () => {
    const real = loadCardData();
    expect(real).not.toBeNull();
    // Rule zero keeps the pool to cards the engine runs exactly, so a card
    // in it can still be one of these; what matters is the file has them.
    expect(real!("Tooth and Nail")?.typeLine).toBe("Sorcery");
    expect(real!("Fire // Ice")?.manaCost).toBe("{1}{R} // {1}{U}");
    expect(real!("Ice")).toBeDefined();
  });
});

describe("evaluateDecklist with local card data", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads a card it has from the local data, asking Scryfall only about the rest", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: { body?: string }) => {
      const { identifiers } = JSON.parse(init?.body ?? "{}") as { identifiers: { name: string }[] };
      const data = identifiers
        .filter((id) => id.name === "Printed Last Week")
        .map(() => ({ name: "Printed Last Week", type_line: "Artifact", mana_cost: "{2}" }));
      return { ok: true, status: 200, json: async () => ({ data }) };
    });
    vi.stubGlobal("fetch", fetchMock);

    const results = await evaluateDecklist(
      [
        { name: "Local Only Golem", count: 1 },
        { name: "Righty Spell", count: 1 },
        { name: "Printed Last Week", count: 1 },
      ],
      registry,
      undefined,
      { cardData: data },
    );

    expect(results.map((r) => r.found)).toEqual([true, true, true]);
    expect(results[0].typeLine).toBe("Artifact Creature — Golem");
    expect(results[0].suggestedReplacement).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body)).toEqual({
      identifiers: [{ name: "Printed Last Week" }],
    });
  });

  it("makes no request at all when the local data has every card", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const progress: number[] = [];
    await evaluateDecklist([{ name: "Local Only Golem", count: 1 }], registry, (p) => progress.push(p.done), {
      cardData: data,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(progress.at(-1)).toBe(1);
  });
});
