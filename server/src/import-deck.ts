/**
 * Decklist feasibility audit: parse a pasted plain-text decklist export
 * (Moxfield's own "Export" feature produces this — one line per card,
 * "N Card Name", optionally followed by a "(SET) collector-number" printing
 * suffix and a "*F*"/"*E*" foil/etched marker, e.g.
 * `1 Sol Ring (SLD) 2683 *F*`; the plain `1 Sol Ring` form without a
 * printing suffix is also accepted) and reports, per unique card, whether
 * the engine already has a matching `CardDefinition` by exact name. Cards it
 * doesn't have are annotated with their real mana cost / type line / Oracle
 * text (from Scryfall) so a human can review feasibility — this module
 * never invents a feasibility verdict beyond "is it already implemented,
 * yes or no".
 */

import { suggestReplacement, validateCommanderDeck } from "engine";
import type { CardDefinition, CardRegistry, DeckValidationResult } from "engine";

export interface DecklistEntry {
  readonly name: string;
  readonly count: number;
}

export interface ParsedDecklist {
  readonly entries: readonly DecklistEntry[];
  /** Card name(s) that appeared directly under an explicit "Commander"
   * section header (Moxfield's export format, among others, marks the
   * commander this way rather than leaving it to be guessed). Empty when
   * the pasted text has no such header — `formatCheck` falls back to its
   * own guess in that case. Still included among `entries` too, so the
   * commander gets an ordinary feasibility row like any other card. */
  readonly commanders: readonly string[];
}

const LINE_PATTERN = /^(\d+)\s+(.+)$/;
// Strips a trailing "(SET) collector-number [*F*|*E*|...]" printing suffix,
// if present, off the remainder of a decklist line. Collector numbers vary
// in shape ("160", "CMM-997", "105p") so it's matched as one non-whitespace
// token rather than digits-only.
const PRINTING_SUFFIX_PATTERN = /^(.*?)\s+\([A-Za-z0-9]{2,6}\)\s+\S+(?:\s+\*[A-Za-z]+\*)?$/;

function stripPrintingSuffix(rest: string): string {
  const match = PRINTING_SUFFIX_PATTERN.exec(rest);
  return match !== null ? match[1].trim() : rest;
}

/** Parses decklist lines, merging duplicate names (e.g. a commander also
 * listed among the support cards). Blank lines and `//` comments are
 * skipped; any other non-matching line is treated as a section header (some
 * export variants have one, e.g. "Commander"/"Companion"/"Deck") — silently
 * ignored except for "Commander" itself, whose cards are also collected
 * into `commanders`. A section ends at the next header line or a blank
 * line, whichever comes first. */
export function parseDecklistText(text: string): ParsedDecklist {
  const counts = new Map<string, number>();
  const commanders: string[] = [];
  let inCommanderSection = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "") {
      inCommanderSection = false;
      continue;
    }
    if (line.startsWith("//")) continue;
    const match = LINE_PATTERN.exec(line);
    if (match === null) {
      inCommanderSection = /^commanders?$/i.test(line);
      continue;
    }
    const name = stripPrintingSuffix(match[2].trim());
    counts.set(name, (counts.get(name) ?? 0) + Number(match[1]));
    if (inCommanderSection) commanders.push(name);
  }
  return {
    entries: [...counts.entries()].map(([name, count]) => ({ name, count })),
    commanders,
  };
}

export interface ScryfallCardSummary {
  readonly manaCost: string | null;
  readonly typeLine: string;
  readonly oracleText: string;
}

interface ScryfallCardPayload {
  readonly name?: string;
  readonly mana_cost?: string;
  readonly type_line?: string;
  readonly oracle_text?: string;
  readonly card_faces?: readonly {
    readonly name?: string;
    readonly mana_cost?: string;
    readonly type_line?: string;
    readonly oracle_text?: string;
  }[];
}

const scryfallCache = new Map<string, ScryfallCardSummary | null>();

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Scryfall's own error on a violation reads "constrain API usage to less
// than 10 requests per second... FAILURE TO ACT WILL RESULT IN A NETWORK
// BLOCK" — 100ms (exactly 10/sec) turned out to trip that in practice, so
// every request is throttled to a real gap comfortably under the ceiling,
// tracked process-wide (not per-call) since concurrent imports share the
// same budget.
const MIN_INTERVAL_MS = 200;
let earliestNextRequestAt = 0;

async function throttle(): Promise<void> {
  const wait = earliestNextRequestAt - Date.now();
  if (wait > 0) await delay(wait);
  earliestNextRequestAt = Date.now() + MIN_INTERVAL_MS;
}

/** Scryfall's documented cap on identifiers per `/cards/collection` call. */
const COLLECTION_BATCH_SIZE = 75;

function summarize(data: ScryfallCardPayload): ScryfallCardSummary {
  const face = data.card_faces?.[0];
  return {
    manaCost: data.mana_cost ?? face?.mana_cost ?? null,
    typeLine: data.type_line ?? face?.type_line ?? "",
    oracleText:
      data.oracle_text ??
      (data.card_faces ?? [])
        .map((f) => f.oracle_text ?? "")
        .filter((t) => t !== "")
        .join("\n//\n"),
  };
}

function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

/** Every name a returned card should answer to: its own, its `"Front //
 * Back"` name rewritten in the single-slash form decklists often use, and
 * each individual face name — Scryfall doesn't echo which identifier
 * produced which card, so responses are matched back to requests by name. */
function responseKeys(data: ScryfallCardPayload): string[] {
  const keys: string[] = [];
  if (data.name !== undefined) {
    keys.push(nameKey(data.name), nameKey(data.name.replace(/\s*\/\/\s*/g, " / ")));
  }
  for (const face of data.card_faces ?? []) {
    if (face.name !== undefined) keys.push(nameKey(face.name));
  }
  return keys;
}

interface CollectionPayload {
  readonly data?: readonly ScryfallCardPayload[];
}

/** One `/cards/collection` request for up to `COLLECTION_BATCH_SIZE` names,
 * retried once if Scryfall asked us to back off (HTTP 429). Returns the
 * cards it found, indexed by every name they answer to; anything absent
 * simply wasn't found. A network error yields an empty map rather than
 * throwing, so one bad batch can't sink the rest of the import. */
async function fetchCollectionBatch(
  names: readonly string[],
): Promise<Map<string, ScryfallCardSummary>> {
  const found = new Map<string, ScryfallCardSummary>();
  const attempt = async (): Promise<number | null> => {
    await throttle();
    const res = await fetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "MTG-Engine-DeckImport/1.0",
      },
      body: JSON.stringify({ identifiers: names.map((name) => ({ name })) }),
    });
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after"));
      return Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 5000;
    }
    if (!res.ok) return null;
    const payload = (await res.json()) as CollectionPayload;
    for (const card of payload.data ?? []) {
      const summary = summarize(card);
      for (const key of responseKeys(card)) found.set(key, summary);
    }
    return null;
  };

  try {
    const retryAfterMs = await attempt();
    if (retryAfterMs !== null) {
      await delay(retryAfterMs);
      await attempt();
    }
  } catch {
    return found;
  }
  return found;
}

/** Splits `names` across as many `/cards/collection` requests as it takes,
 * calling `onBatch` with the running count of names covered after each. */
async function fetchCollection(
  names: readonly string[],
  onBatch?: (covered: number, lastName: string) => void,
): Promise<Map<string, ScryfallCardSummary>> {
  const found = new Map<string, ScryfallCardSummary>();
  for (let i = 0; i < names.length; i += COLLECTION_BATCH_SIZE) {
    const slice = names.slice(i, i + COLLECTION_BATCH_SIZE);
    const batch = await fetchCollectionBatch(slice);
    for (const [key, summary] of batch) found.set(key, summary);
    onBatch?.(i + slice.length, slice[slice.length - 1]);
  }
  return found;
}

/** A split/MDFC-style decklist name (`"Front / Back"` or `"Front/Back"`) may
 * not exact-match Scryfall's own `"Front // Back"` convention, so try that
 * form and then just the front face's name before giving up. */
function scryfallNameVariants(name: string): string[] {
  const variants = [name];
  const splitMatch = /^(.+?)\s*\/\s*(.+)$/.exec(name);
  if (splitMatch !== null) {
    variants.push(`${splitMatch[1]} // ${splitMatch[2]}`, splitMatch[1]);
  }
  return variants;
}

/** Reports how many of the requested names have been resolved so far —
 * batch-granular, since that's the unit of work now. */
export type LookupProgress = (done: number, lastName: string | null) => void;

/**
 * Looks up many cards' authoritative printed data in as few requests as
 * possible: `/cards/collection` takes 75 names at a time, so a 100-card
 * decklist costs two round-trips instead of a hundred throttled ones.
 * Returns a map keyed by the *requested* name (a miss maps to `null`).
 *
 * Results are cached for the life of the process — names repeat within a
 * deck and across separate import requests — including misses, so an
 * unknown name isn't re-queried every time it comes up. Names that miss
 * under their printed form are retried once per alternate spelling (see
 * `scryfallNameVariants`), one extra batched round per variant.
 */
export async function lookupScryfallMany(
  names: readonly string[],
  onProgress?: LookupProgress,
): Promise<Map<string, ScryfallCardSummary | null>> {
  const out = new Map<string, ScryfallCardSummary | null>();
  const pending: string[] = [];
  for (const name of names) {
    if (out.has(name)) continue;
    const cached = scryfallCache.get(name);
    out.set(name, cached ?? null);
    if (cached === undefined) pending.push(name);
  }

  // Names already in the cache resolved for free, so they count as done
  // from the outset — otherwise a partly-cached list never reaches 100%.
  const cachedCount = out.size - pending.length;

  let unresolved = pending;
  for (let round = 0; unresolved.length > 0; round += 1) {
    // Which spelling to try this round for each name still unaccounted for;
    // a name whose variants are exhausted drops out of the next round.
    const queries = new Map<string, string>();
    for (const name of unresolved) {
      const variant = scryfallNameVariants(name)[round];
      if (variant !== undefined) queries.set(variant, name);
    }
    if (queries.size === 0) break;

    // Progress counts a name once, as its first attempt lands; the variant
    // rounds that follow only ever cover a handful of leftovers, so they
    // report nothing rather than counting the same name twice.
    const found = await fetchCollection(
      [...queries.keys()],
      round === 0 ? (covered, lastName) => onProgress?.(cachedCount + covered, lastName) : undefined,
    );
    const missed: string[] = [];
    for (const [query, name] of queries) {
      const summary = found.get(nameKey(query));
      if (summary !== undefined) out.set(name, summary);
      else missed.push(name);
    }
    unresolved = missed;
  }

  for (const name of pending) scryfallCache.set(name, out.get(name) ?? null);
  return out;
}

/** Single-name convenience wrapper over `lookupScryfallMany`. */
export async function lookupScryfall(name: string): Promise<ScryfallCardSummary | null> {
  return (await lookupScryfallMany([name])).get(name) ?? null;
}

function localTypeLine(def: CardDefinition): string {
  const front = [...def.supertypes, ...def.types].join(" ");
  return def.subtypes.length > 0 ? `${front} — ${def.subtypes.join(" ")}` : front;
}

export interface CardReportEntry extends DecklistEntry {
  /** Already has a matching `CardDefinition` in the engine's registry. */
  readonly implemented: boolean;
  /** Whether any characteristics data (local or Scryfall) was found to show. */
  readonly found: boolean;
  readonly manaCost: string | null;
  readonly typeLine: string;
  readonly oracleText: string;
  /** An already-implemented card the client's deck builder can substitute
   * in for this one — `null` when `implemented` (nothing to replace) or
   * when nothing in the pool shares even this card's primary type (see
   * `engine`'s `suggestReplacement`). Only ever computed from Scryfall's
   * *type line and mana cost*, not its rules text — a similarity pick, not
   * a claim that the two cards play the same. */
  readonly suggestedReplacement: string | null;
}

/** Called as the audit advances, so a caller streaming it to a client can
 * show real progress. Granularity follows the work: cards the engine already
 * implements resolve locally and are counted in one go, and the rest are
 * counted a Scryfall batch (up to `COLLECTION_BATCH_SIZE` names) at a time. */
export type EvaluateProgress = (progress: {
  readonly done: number;
  readonly total: number;
  /** The last card accounted for, or `null` when nothing specific. */
  readonly name: string | null;
}) => void;

/** Cross-references each decklist entry against the engine's card registry
 * by exact name. Implemented cards are reported straight from their local
 * `CardDefinition` (no network call needed); everything else is looked up on
 * Scryfall — in batches, so a 100-card list costs two round-trips rather
 * than a hundred throttled ones — so its real characteristics can be
 * reviewed, and matched against the pool for a stand-in the deck builder's
 * import flow can use. */
export async function evaluateDecklist(
  entries: readonly DecklistEntry[],
  registry: CardRegistry,
  onProgress?: EvaluateProgress,
): Promise<CardReportEntry[]> {
  const total = entries.length;
  const unimplemented = entries.filter((e) => !registry.has(e.name));
  // Everything the registry already has is free; report it before the
  // network work starts so the bar reflects what's actually left to do.
  const localCount = total - unimplemented.length;
  if (localCount > 0) onProgress?.({ done: localCount, total, name: null });

  const scryfallByName = await lookupScryfallMany(
    unimplemented.map((e) => e.name),
    (done, lastName) => onProgress?.({ done: localCount + done, total, name: lastName }),
  );
  // Nothing above fires when every name came from the process cache, and the
  // variant rounds deliberately don't report, so close the bar out here.
  onProgress?.({ done: total, total, name: null });

  return entries.map((entry): CardReportEntry => {
    if (registry.has(entry.name)) {
      const def = registry.get(entry.name);
      return {
        ...entry,
        implemented: true,
        found: true,
        manaCost: def.manaCost,
        typeLine: localTypeLine(def),
        oracleText: def.text,
        suggestedReplacement: null,
      };
    }
    const scryfall = scryfallByName.get(entry.name) ?? null;
    return {
      ...entry,
      implemented: false,
      found: scryfall !== null,
      manaCost: scryfall?.manaCost ?? null,
      typeLine: scryfall?.typeLine ?? "",
      oracleText: scryfall?.oracleText ?? "",
      suggestedReplacement:
        scryfall !== null
          ? suggestReplacement({ manaCost: scryfall.manaCost, typeLine: scryfall.typeLine })
          : null,
    };
  });
}

/**
 * A best-effort Commander-format check over the *implemented* cards in a
 * pasted list (ROADMAP Phase 9). Prefers `explicitCommanders` (from
 * `parseDecklistText`'s "Commander" section, when the pasted text had one);
 * otherwise falls back to guessing the first implemented legendary
 * creature/planeswalker in the list. Everything else is the 99. Only
 * surfaces singleton / colour-identity / size violations — feasibility (is
 * each card implemented) is the `cards` report's job. An explicit commander
 * that isn't implemented is still reported *as* the commander (accurately
 * showing "not implemented" among the violations, and a colourless identity)
 * rather than silently falling through to the guess — the deck builder's
 * import flow is what actually repairs this, by substituting `cards[]`'s
 * `suggestedReplacement` for it.
 */
export function formatCheck(
  entries: readonly DecklistEntry[],
  registry: CardRegistry,
  explicitCommanders: readonly string[] = [],
): DeckValidationResult & { readonly commander: string | null } {
  const flat: string[] = [];
  for (const e of entries) {
    for (let i = 0; i < e.count; i += 1) flat.push(e.name);
  }
  const commander =
    explicitCommanders[0] ??
    flat.find((n) => {
      if (!registry.has(n)) return false;
      const def = registry.get(n);
      return (
        def.supertypes.includes("legendary") &&
        (def.types.includes("creature") || def.types.includes("planeswalker"))
      );
    }) ??
    null;

  const rest = commander === null ? flat : flat.filter((n, i) => !(n === commander && i === flat.indexOf(commander)));
  const result = validateCommanderDeck(
    { commanders: commander ? [commander] : [], cards: rest, size: 100 },
    registry,
  );
  return { ...result, commander };
}
