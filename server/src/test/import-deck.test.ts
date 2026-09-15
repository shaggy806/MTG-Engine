import { describe, expect, it, vi, afterEach } from "vitest";
import { createDefaultRegistry } from "engine";
import { evaluateDecklist, formatCheck, parseDecklistText } from "../import-deck.js";

const registry = createDefaultRegistry();

describe("parseDecklistText", () => {
  it("parses plain 'N Card Name' lines", () => {
    const { entries } = parseDecklistText("1 Sol Ring\n1 Ureni of the Unwritten\n\n1 Forest");
    expect(entries).toEqual(
      expect.arrayContaining([
        { name: "Sol Ring", count: 1 },
        { name: "Ureni of the Unwritten", count: 1 },
        { name: "Forest", count: 1 },
      ]),
    );
  });

  it("strips a '(SET) collector-number' printing suffix, including foil/etched markers", () => {
    const { entries } = parseDecklistText(
      [
        "1 Ureni of the Unwritten (TDC) 9 *F*",
        "5 Forest (STX) 374",
        "1 Frontier Bivouac (PLST) CMM-997",
        "1 Dracogenesis (PTDM) 105p",
        "1 Miirym, Sentinel Wyrm (CLB) 542 *E*",
      ].join("\n"),
    );
    expect(entries).toEqual(
      expect.arrayContaining([
        { name: "Ureni of the Unwritten", count: 1 },
        { name: "Forest", count: 5 },
        { name: "Frontier Bivouac", count: 1 },
        { name: "Dracogenesis", count: 1 },
        { name: "Miirym, Sentinel Wyrm", count: 1 },
      ]),
    );
  });

  it("keeps a split-card name with its printing suffix stripped", () => {
    const { entries } = parseDecklistText("1 Marang River Regent / Coil and Catch (TDM) 378");
    expect(entries).toEqual([{ name: "Marang River Regent / Coil and Catch", count: 1 }]);
  });

  it("merges duplicate names and skips blank lines / comments / non-matching lines", () => {
    const { entries, commanders } = parseDecklistText(
      ["// a comment", "", "1 Sol Ring", "1 Sol Ring"].join("\n"),
    );
    expect(entries).toEqual([{ name: "Sol Ring", count: 2 }]);
    expect(commanders).toEqual([]);
  });

  it("collects cards under an explicit Commander section header", () => {
    const text = [
      "Commander",
      "1 Atraxa, Praetors' Voice",
      "",
      "Deck",
      "1 Sol Ring",
      "1 Lightning Bolt",
    ].join("\n");
    const { entries, commanders } = parseDecklistText(text);
    expect(commanders).toEqual(["Atraxa, Praetors' Voice"]);
    // Still an ordinary row among the rest, not excluded from feasibility.
    expect(entries).toEqual(
      expect.arrayContaining([{ name: "Atraxa, Praetors' Voice", count: 1 }]),
    );
  });

  it("supports two commanders (Partner) under one Commander section", () => {
    const text = ["Commander", "1 Alice", "1 Bob", "", "Deck", "1 Sol Ring"].join("\n");
    expect(parseDecklistText(text).commanders).toEqual(["Alice", "Bob"]);
  });

  it("a blank line ends the Commander section even without a following header", () => {
    const text = ["Commander", "1 Alice", "", "1 Bob"].join("\n");
    expect(parseDecklistText(text).commanders).toEqual(["Alice"]);
  });
});

describe("evaluateDecklist", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports an implemented card straight from the local registry, no network call", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const [result] = await evaluateDecklist([{ name: "Lightning Bolt", count: 1 }], registry);

    expect(result.implemented).toBe(true);
    expect(result.found).toBe(true);
    expect(result.manaCost).toBe("{R}");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("looks up an unimplemented card on Scryfall and reports it as not implemented", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          mana_cost: "{2}",
          type_line: "Artifact",
          oracle_text: "{T}: Add one mana of any color that a land you control could produce.",
        }),
      }),
    );

    const [result] = await evaluateDecklist([{ name: "Fellwar Stone", count: 1 }], registry);

    expect(result.implemented).toBe(false);
    expect(result.found).toBe(true);
    expect(result.manaCost).toBe("{2}");
    expect(result.oracleText).toBe(
      "{T}: Add one mana of any color that a land you control could produce.",
    );
    // An artifact that taps for mana -- some already-implemented mana rock
    // is a plausible enough stand-in.
    expect(result.suggestedReplacement).not.toBeNull();
    expect(registry.has(result.suggestedReplacement!)).toBe(true);
  });

  it("suggestedReplacement is null for an implemented card (nothing to replace)", async () => {
    const [result] = await evaluateDecklist([{ name: "Lightning Bolt", count: 1 }], registry);
    expect(result.suggestedReplacement).toBeNull();
  });

  it("reports progress after each entry, counting up to the total", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const seen: { done: number; total: number; name: string; implemented: boolean }[] = [];

    await evaluateDecklist(
      [
        { name: "Lightning Bolt", count: 1 },
        { name: "Not A Real Card Name", count: 1 },
      ],
      registry,
      (p) => seen.push(p),
    );

    expect(seen).toEqual([
      { done: 1, total: 2, name: "Lightning Bolt", implemented: true },
      { done: 2, total: 2, name: "Not A Real Card Name", implemented: false },
    ]);
  });

  it("reports found:false for a card Scryfall doesn't recognize either", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    const [result] = await evaluateDecklist([{ name: "Not A Real Card Name", count: 1 }], registry);

    expect(result.implemented).toBe(false);
    expect(result.found).toBe(false);
    expect(result.suggestedReplacement).toBeNull();
  });
});

describe("formatCheck (over a pasted list's implemented cards)", () => {
  it("guesses the commander and reports identity + violations", () => {
    const text = [
      "1 Atraxa, Praetors' Voice",
      "3 Lightning Bolt",
      "1 Raging Goblin",
      "10 Forest",
    ].join("\n");
    const { entries, commanders } = parseDecklistText(text);
    const r = formatCheck(entries, registry, commanders);
    expect(r.commander).toBe("Atraxa, Praetors' Voice");
    expect(r.identity).toBe("WUBG");
    expect(r.violations.some((v) => v.includes('3× "Lightning Bolt"'))).toBe(true);
    expect(r.violations.some((v) => v.includes("Raging Goblin"))).toBe(true);
  });

  it("prefers an explicit Commander section over the first-legendary guess", () => {
    // Atraxa would otherwise be guessed first -- an explicit section names
    // Ureni instead, and formatCheck should honour it.
    const text = [
      "Commander",
      "1 Ureni of the Unwritten",
      "",
      "Deck",
      "1 Atraxa, Praetors' Voice",
      "1 Forest",
    ].join("\n");
    const { entries, commanders } = parseDecklistText(text);
    const r = formatCheck(entries, registry, commanders);
    expect(r.commander).toBe("Ureni of the Unwritten");
  });

  it("falls back to guessing when the pasted list has no Commander section", () => {
    const { entries, commanders } = parseDecklistText(
      ["1 Atraxa, Praetors' Voice", "1 Forest"].join("\n"),
    );
    expect(commanders).toEqual([]);
    const r = formatCheck(entries, registry, commanders);
    expect(r.commander).toBe("Atraxa, Praetors' Voice");
  });

  it("reports an unimplemented explicit commander honestly rather than silently falling back", () => {
    const text = ["Commander", "1 Some Made Up Legend", "", "Deck", "1 Forest"].join("\n");
    const { entries, commanders } = parseDecklistText(text);
    const r = formatCheck(entries, registry, commanders);
    expect(r.commander).toBe("Some Made Up Legend");
    expect(r.legal).toBe(false);
    expect(r.violations.some((v) => v.includes("not implemented"))).toBe(true);
  });
});
