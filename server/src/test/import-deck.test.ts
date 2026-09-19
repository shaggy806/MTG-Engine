import { describe, expect, it, vi, afterEach } from "vitest";
import { colorIdentityOf, createDefaultRegistry, withinIdentity } from "engine";
import { evaluateDecklist, formatCheck, parseDecklistText } from "../import-deck.js";

const registry = createDefaultRegistry();

describe("parseDecklistText", () => {
  // Moxfield's real export has no "Commander" header — it puts the commander
  // last, alone, after a blank line. Before this was recognised the commander
  // was left to be guessed, and the guess (first legendary in the list) picks
  // whichever legend sits earliest in the 99.
  const list = (...lines: string[]): string => lines.join("\n");

  it("reads Moxfield's trailing commander line", () => {
    const { commanders, commanderSource } = parseDecklistText(
      list("1 Sol Ring (LTC) 284", "1 Grizzly Bears", "1 Forest", "", "1 Azusa, Lost but Seeking (CHK) 225"),
    );
    expect(commanders).toEqual(["Azusa, Lost but Seeking"]);
    expect(commanderSource).toBe("trailing");
  });

  it("reads a trailing partner pair", () => {
    const { commanders, commanderSource } = parseDecklistText(
      list("1 Sol Ring", "1 Forest", "", "1 Bruse Tarl, Boorish Herder", "1 Kydele, Chosen of Kruphix"),
    );
    expect(commanders).toHaveLength(2);
    expect(commanderSource).toBe("trailing");
  });

  it("still prefers an explicit Commander header over the trailing block", () => {
    const { commanders, commanderSource } = parseDecklistText(
      list("Commander", "1 Azusa, Lost but Seeking", "", "1 Sol Ring", "", "1 Forest"),
    );
    expect(commanders).toEqual(["Azusa, Lost but Seeking"]);
    expect(commanderSource).toBe("section");
  });

  it("does not mistake a long trailing block for a command zone", () => {
    // A list that simply ends with a group of cards is not naming a commander,
    // and a lands block at the end is the commonest shape there is.
    const { commanders, commanderSource } = parseDecklistText(
      list("1 Sol Ring", "", "1 Forest", "1 Island", "1 Plains"),
    );
    expect(commanders).toEqual([]);
    expect(commanderSource).toBeNull();
  });

  it("does not mistake a trailing multiple for a commander", () => {
    const { commanders, commanderSource } = parseDecklistText(list("1 Sol Ring", "", "30 Forest"));
    expect(commanders).toEqual([]);
    expect(commanderSource).toBeNull();
  });

  it("leaves a single-block list to the guess", () => {
    const { commanders, commanderSource } = parseDecklistText(list("1 Sol Ring", "1 Forest"));
    expect(commanders).toEqual([]);
    expect(commanderSource).toBeNull();
  });

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

  it("splits a '(SET) collector-number' printing suffix off, including foil/etched markers", () => {
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
        { name: "Ureni of the Unwritten", count: 1, printing: { set: "tdc", collectorNumber: "9" } },
        { name: "Forest", count: 5, printing: { set: "stx", collectorNumber: "374" } },
        {
          name: "Frontier Bivouac",
          count: 1,
          printing: { set: "plst", collectorNumber: "CMM-997" },
        },
        { name: "Dracogenesis", count: 1, printing: { set: "ptdm", collectorNumber: "105p" } },
        {
          name: "Miirym, Sentinel Wyrm",
          count: 1,
          printing: { set: "clb", collectorNumber: "542" },
        },
      ]),
    );
  });

  it("leaves a line with no printing suffix carrying no printing at all", () => {
    expect(parseDecklistText("1 Sol Ring").entries).toEqual([{ name: "Sol Ring", count: 1 }]);
  });

  it("takes the first printing named for a card that appears more than once", () => {
    const { entries } = parseDecklistText("1 Sol Ring (SLD) 2683\n1 Sol Ring (C21) 263");
    expect(entries).toEqual([
      { name: "Sol Ring", count: 2, printing: { set: "sld", collectorNumber: "2683" } },
    ]);
  });

  it("keeps a split-card name with its printing suffix split off", () => {
    const { entries } = parseDecklistText("1 Marang River Regent / Coil and Catch (TDM) 378");
    expect(entries).toEqual([
      {
        name: "Marang River Regent / Coil and Catch",
        count: 1,
        printing: { set: "tdm", collectorNumber: "378" },
      },
    ]);
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

/** Stands in for Scryfall's `POST /cards/collection`: answers with whichever
 * of `cards` the batch actually asked for, the way the real endpoint does
 * (found cards in `data`, everything else simply absent). Both identifier
 * shapes are honoured — by name, and by `set`/`collector_number` for a card
 * whose stub carries them. */
function stubCollection(cards: Record<string, Record<string, unknown>>) {
  const bySetNumber = new Map<string, Record<string, unknown>>();
  for (const card of Object.values(cards)) {
    if (typeof card.set === "string" && typeof card.collector_number === "string") {
      bySetNumber.set(`${card.set}/${card.collector_number}`, card);
    }
  }
  const fetchMock = vi.fn(async (_url: string, init?: { body?: string }) => {
    const { identifiers } = JSON.parse(init?.body ?? "{}") as {
      identifiers?: ({ name: string } | { set: string; collector_number: string })[];
    };
    const data = (identifiers ?? [])
      .map((id) =>
        "name" in id ? cards[id.name] : bySetNumber.get(`${id.set}/${id.collector_number}`),
      )
      .filter((c): c is Record<string, unknown> => c !== undefined);
    return { ok: true, status: 200, json: async () => ({ data }) };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("evaluateDecklist", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("chooses stand-ins for this deck: its identity, no repeats, a commander for the commander", async () => {
    // Names no other test looks up — the Scryfall cache is process-wide.
    stubCollection({
      "Trostani Discordant": {
        name: "Trostani Discordant",
        mana_cost: "{3}{G}{W}",
        type_line: "Legendary Creature — Dryad",
        power: "1",
        toughness: "4",
        color_identity: ["G", "W"],
      },
      "Tireless Tracker": {
        name: "Tireless Tracker",
        mana_cost: "{2}{G}",
        type_line: "Creature — Human Scout",
        power: "3",
        toughness: "2",
        color_identity: ["G"],
      },
      "Wood Elves": {
        name: "Wood Elves",
        mana_cost: "{2}{G}",
        type_line: "Creature — Elf Scout",
        power: "1",
        toughness: "1",
        color_identity: ["G"],
      },
    });

    const cards = await evaluateDecklist(
      [
        { name: "Trostani Discordant", count: 1 },
        { name: "Llanowar Elves", count: 1 },
        { name: "Tireless Tracker", count: 1 },
        { name: "Wood Elves", count: 1 },
      ],
      registry,
      undefined,
      { commanders: ["Trostani Discordant"] },
    );
    const byName = new Map(cards.map((c) => [c.name, c]));

    // The commander is unimplemented, so its identity comes from Scryfall.
    const identity = new Set(["G", "W"] as const);
    for (const c of cards) {
      for (const option of c.replacements) {
        expect(withinIdentity(colorIdentityOf(registry.get(option.name)), identity)).toBe(true);
        expect(option.name).not.toBe("Llanowar Elves");
      }
    }
    const commanderPick = registry.get(byName.get("Trostani Discordant")!.suggestedReplacement!);
    expect(commanderPick.supertypes).toContain("legendary");

    // Two same-shaped cards never get the same first choice.
    const firsts = cards.map((c) => c.suggestedReplacement).filter((n) => n !== null);
    expect(new Set(firsts).size).toBe(firsts.length);
    expect(byName.get("Tireless Tracker")!.replacements.length).toBeGreaterThan(0);
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
    // A deliberately fictional name. The Scryfall response is stubbed, so the
    // name only has to be one the registry lacks — and naming a *real* card
    // here is a time bomb: this test used to say "Fellwar Stone" and broke the
    // day it was authored. The pool is real-cards-only, so a made-up name can
    // never become implemented.
    const MISSING = "Nonexistent Mana Rock";
    stubCollection({
      [MISSING]: {
        name: MISSING,
        mana_cost: "{2}",
        type_line: "Artifact",
        oracle_text: "{T}: Add one mana of any color that a land you control could produce.",
      },
    });

    const [result] = await evaluateDecklist([{ name: MISSING, count: 1 }], registry);

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

  it("looks every unimplemented card up in one batched request, not one each", async () => {
    const names = ["Batched One", "Batched Two", "Batched Three"];
    const fetchMock = stubCollection(
      Object.fromEntries(names.map((n) => [n, { name: n, type_line: "Artifact" }])),
    );

    const results = await evaluateDecklist(
      // The implemented card must not contribute an identifier.
      [...names, "Lightning Bolt"].map((name) => ({ name, count: 1 })),
      registry,
    );

    expect(results.map((r) => r.found)).toEqual([true, true, true, true]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, { body: string }];
    expect(url).toBe("https://api.scryfall.com/cards/collection");
    expect(JSON.parse(init.body)).toEqual({ identifiers: names.map((name) => ({ name })) });
  });

  it("splits a list longer than Scryfall's 75-identifier cap across requests", async () => {
    const names = Array.from({ length: 80 }, (_, i) => `Bulk Filler ${i}`);
    const fetchMock = stubCollection(
      Object.fromEntries(names.map((n) => [n, { name: n, type_line: "Artifact" }])),
    );

    await evaluateDecklist(names.map((name) => ({ name, count: 1 })), registry);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const sizes = fetchMock.mock.calls.map(
      (c) => (JSON.parse((c[1] as { body: string }).body) as { identifiers: unknown[] }).identifiers.length,
    );
    expect(sizes).toEqual([75, 5]);
  });

  it("reports progress: local cards first, then each lookup batch", async () => {
    const names = Array.from({ length: 80 }, (_, i) => `Progress Filler ${i}`);
    stubCollection(Object.fromEntries(names.map((n) => [n, { name: n, type_line: "Artifact" }])));
    const seen: { done: number; total: number; name: string | null }[] = [];

    await evaluateDecklist(
      ["Lightning Bolt", ...names].map((name) => ({ name, count: 1 })),
      registry,
      (p) => seen.push(p),
    );

    expect(seen).toEqual([
      { done: 1, total: 81, name: null },
      { done: 76, total: 81, name: "Progress Filler 74" },
      { done: 81, total: 81, name: "Progress Filler 79" },
      { done: 81, total: 81, name: null },
    ]);
  });

  it("still reaches 100% when every name is already cached", async () => {
    stubCollection({ "Twice Imported": { name: "Twice Imported", type_line: "Artifact" } });
    const entries = [{ name: "Twice Imported", count: 1 }];
    await evaluateDecklist(entries, registry);

    const seen: { done: number; total: number; name: string | null }[] = [];
    await evaluateDecklist(entries, registry, (p) => seen.push(p));

    expect(seen[seen.length - 1]).toEqual({ done: 1, total: 1, name: null });
  });

  it("retries a split-card name in Scryfall's '//' spelling, in a second batch", async () => {
    // Only the "//" spelling resolves, so round 0 must miss and round 1
    // must re-ask for the same card under its alternate name.
    const fetchMock = stubCollection({
      "Split Alpha // Split Beta": {
        name: "Split Alpha // Split Beta",
        type_line: "Instant // Instant",
        card_faces: [
          { name: "Split Alpha", oracle_text: "Alpha text" },
          { name: "Split Beta", oracle_text: "Beta text" },
        ],
      },
    });

    const [result] = await evaluateDecklist(
      [{ name: "Split Alpha / Split Beta", count: 1 }],
      registry,
    );

    expect(result.found).toBe(true);
    expect(result.oracleText).toBe("Alpha text\n//\nBeta text");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse((fetchMock.mock.calls[1][1] as { body: string }).body)).toEqual({
      identifiers: [{ name: "Split Alpha // Split Beta" }],
    });
  });

  it("caches a resolved name so a second import doesn't re-request it", async () => {
    const fetchMock = stubCollection({
      "Cached Rock": { name: "Cached Rock", type_line: "Artifact" },
    });
    const entries = [{ name: "Cached Rock", count: 1 }];

    await evaluateDecklist(entries, registry);
    await evaluateDecklist(entries, registry);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports found:false for a card Scryfall doesn't recognize either", async () => {
    stubCollection({});

    const [result] = await evaluateDecklist([{ name: "Not A Real Card Name", count: 1 }], registry);

    expect(result.implemented).toBe(false);
    expect(result.found).toBe(false);
    expect(result.suggestedReplacement).toBeNull();
  });

  it("resolves an implemented card's printing suffix to that printing's card id", async () => {
    const fetchMock = stubCollection({
      "Sol Ring": { id: "aaaa1111-0000-0000-0000-000000000001", name: "Sol Ring", set: "p01", collector_number: "11" },
    });

    const [result] = await evaluateDecklist(
      [{ name: "Sol Ring", count: 1, printing: { set: "p01", collectorNumber: "11" } }],
      registry,
    );

    expect(result.implemented).toBe(true);
    expect(result.printingId).toBe("aaaa1111-0000-0000-0000-000000000001");
    // One batch, by set/number — not a name lookup, and not one call per card.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body)).toEqual({
      identifiers: [{ set: "p01", collector_number: "11" }],
    });
  });

  it("leaves printingId null for a line with no printing suffix, and makes no call for it", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const [result] = await evaluateDecklist([{ name: "Lightning Bolt", count: 1 }], registry);

    expect(result.printingId).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  // A stale or mistyped collector number resolves to some *other* card, and
  // pinning its art onto this one would be worse than no printing at all.
  it("discards a printing whose card isn't the one the line named", async () => {
    stubCollection({
      "Some Other Card": {
        id: "aaaa1111-0000-0000-0000-000000000002",
        name: "Some Other Card",
        set: "p02",
        collector_number: "22",
      },
    });

    const [result] = await evaluateDecklist(
      [{ name: "Sol Ring", count: 1, printing: { set: "p02", collectorNumber: "22" } }],
      registry,
    );

    expect(result.printingId).toBeNull();
  });

  it("doesn't resolve a printing for an unimplemented card", async () => {
    // A name no earlier test has looked up — `lookupScryfallMany`'s cache is
    // process-wide, so a repeat would make no call at all and prove nothing.
    // It also has to stay unimplemented: this test once used Thought Vessel,
    // which silently broke when that card joined the pool.
    const name = "Sunbird's Invocation";
    expect(registry.has(name), `${name} is implemented now — pick another card`).toBe(false);
    const fetchMock = stubCollection({
      [name]: {
        id: "aaaa1111-0000-0000-0000-000000000003",
        name,
        mana_cost: "{5}{R}",
        type_line: "Enchantment",
        oracle_text: "",
        set: "m19",
        collector_number: "165",
      },
    });

    const [result] = await evaluateDecklist(
      [{ name, count: 1, printing: { set: "m19", collectorNumber: "165" } }],
      registry,
    );

    // It's about to be swapped for a different card, whose art this printing
    // says nothing about — so only the name lookup happens.
    expect(result.implemented).toBe(false);
    expect(result.printingId).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body)).toEqual({
      identifiers: [{ name }],
    });
  });

  it("counts every entry exactly once across both lookup passes", async () => {
    stubCollection({
      "Arcane Signet": { id: "aaaa1111-0000-0000-0000-000000000004", name: "Arcane Signet", set: "p04", collector_number: "44" },
      "Chromatic Orrery": {
        name: "Chromatic Orrery",
        mana_cost: "{7}",
        type_line: "Legendary Artifact",
        oracle_text: "",
      },
    });

    const seen: { done: number; total: number }[] = [];
    await evaluateDecklist(
      [
        { name: "Lightning Bolt", count: 1 }, // free — local registry
        { name: "Arcane Signet", count: 1, printing: { set: "p04", collectorNumber: "44" } },
        { name: "Chromatic Orrery", count: 1 }, // unimplemented — name lookup
      ],
      registry,
      ({ done, total }) => seen.push({ done, total }),
    );

    expect(seen.every((p) => p.total === 3 && p.done <= 3)).toBe(true);
    expect(seen.map((p) => p.done)).toEqual([1, 2, 3, 3]);
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
