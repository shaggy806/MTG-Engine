import { describe, expect, it, vi, afterEach } from "vitest";
import { createDefaultRegistry } from "engine";
import { evaluateDecklist, parseDecklistText } from "./import-deck.js";

describe("parseDecklistText", () => {
  it("parses plain 'N Card Name' lines", () => {
    const entries = parseDecklistText("1 Sol Ring\n1 Ureni of the Unwritten\n\n1 Forest");
    expect(entries).toEqual(
      expect.arrayContaining([
        { name: "Sol Ring", count: 1 },
        { name: "Ureni of the Unwritten", count: 1 },
        { name: "Forest", count: 1 },
      ]),
    );
  });

  it("strips a '(SET) collector-number' printing suffix, including foil/etched markers", () => {
    const entries = parseDecklistText(
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
    const entries = parseDecklistText("1 Marang River Regent / Coil and Catch (TDM) 378");
    expect(entries).toEqual([{ name: "Marang River Regent / Coil and Catch", count: 1 }]);
  });

  it("merges duplicate names and skips blank lines / comments / non-matching lines", () => {
    const entries = parseDecklistText(
      ["// a comment", "", "Commander", "1 Sol Ring", "1 Sol Ring"].join("\n"),
    );
    expect(entries).toEqual([{ name: "Sol Ring", count: 2 }]);
  });
});

describe("evaluateDecklist", () => {
  const registry = createDefaultRegistry();

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
  });

  it("reports found:false for a card Scryfall doesn't recognize either", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    const [result] = await evaluateDecklist([{ name: "Not A Real Card Name", count: 1 }], registry);

    expect(result.implemented).toBe(false);
    expect(result.found).toBe(false);
  });
});
