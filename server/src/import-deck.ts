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
 *
 * The printing suffix is kept rather than discarded: an implemented card
 * that named one is resolved to that printing's Scryfall card id, so an
 * imported deck arrives wearing the art it was exported with (see
 * `SavedDeck.printings` and `DeckList.printings`).
 */

import { assignReplacements, colorIdentityOf, validateCommanderDeck } from "engine";
import type {
  CardDefinition,
  CardRegistry,
  Color,
  DeckValidationResult,
  OracleTagIndex,
  ReplacementConfidence,
} from "engine";

/** The `(SET) collector-number` suffix a decklist line can carry, naming one
 * specific printing of a card. */
export interface PrintingRef {
  readonly set: string;
  readonly collectorNumber: string;
}

export interface DecklistEntry {
  readonly name: string;
  readonly count: number;
  /** The printing the pasted line named, when it named one. Resolved to a
   * Scryfall card id by {@link evaluateDecklist} so an imported deck keeps
   * the art it was exported with. */
  readonly printing?: PrintingRef;
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
// Splits a trailing "(SET) collector-number [*F*|*E*|...]" printing suffix,
// if present, off the remainder of a decklist line. Collector numbers vary
// in shape ("160", "CMM-997", "105p") so it's matched as one non-whitespace
// token rather than digits-only.
const PRINTING_SUFFIX_PATTERN = /^(.*?)\s+\(([A-Za-z0-9]{2,6})\)\s+(\S+)(?:\s+\*[A-Za-z]+\*)?$/;

function splitPrintingSuffix(rest: string): { name: string; printing?: PrintingRef } {
  const match = PRINTING_SUFFIX_PATTERN.exec(rest);
  if (match === null) return { name: rest };
  return {
    name: match[1].trim(),
    printing: { set: match[2].toLowerCase(), collectorNumber: match[3] },
  };
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
  // One printing per name — the first line that names one wins, since a deck
  // brings a single art per card (see `SavedDeck.printings`).
  const printings = new Map<string, PrintingRef>();
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
    const { name, printing } = splitPrintingSuffix(match[2].trim());
    counts.set(name, (counts.get(name) ?? 0) + Number(match[1]));
    if (printing !== undefined && !printings.has(name)) printings.set(name, printing);
    if (inCommanderSection) commanders.push(name);
  }
  return {
    entries: [...counts.entries()].map(([name, count]) => ({
      name,
      count,
      ...(printings.has(name) ? { printing: printings.get(name)! } : {}),
    })),
    commanders,
  };
}

export interface ScryfallCardSummary {
  readonly manaCost: string | null;
  readonly typeLine: string;
  readonly oracleText: string;
  /** Front face's, for a creature; what the replacer compares bodies on. */
  readonly power: string | null;
  readonly toughness: string | null;
  readonly keywords: readonly string[];
  /** Rule 903.4, as Scryfall computes it — how an *unimplemented* commander
   * still tells the replacer which colours its deck may use. */
  readonly colorIdentity: readonly Color[];
}

interface ScryfallCardPayload {
  readonly id?: string;
  readonly set?: string;
  readonly collector_number?: string;
  readonly name?: string;
  readonly mana_cost?: string;
  readonly type_line?: string;
  readonly oracle_text?: string;
  readonly power?: string;
  readonly toughness?: string;
  readonly keywords?: readonly string[];
  readonly color_identity?: readonly string[];
  readonly card_faces?: readonly {
    readonly name?: string;
    readonly mana_cost?: string;
    readonly type_line?: string;
    readonly oracle_text?: string;
    readonly power?: string;
    readonly toughness?: string;
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
    power: data.power ?? face?.power ?? null,
    toughness: data.toughness ?? face?.toughness ?? null,
    keywords: data.keywords ?? [],
    colorIdentity: (data.color_identity ?? []).filter((c): c is Color =>
      ["W", "U", "B", "R", "G"].includes(c),
    ),
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

/** A `/cards/collection` identifier — either form Scryfall accepts. */
type Identifier = { name: string } | { set: string; collector_number: string };

/** One `/cards/collection` POST for up to `COLLECTION_BATCH_SIZE`
 * identifiers, retried once if Scryfall asked us to back off (HTTP 429).
 * Returns the raw cards it found — Scryfall doesn't echo which identifier
 * produced which card, so matching them back is the caller's job. A network
 * error yields nothing rather than throwing, so one bad batch can't sink the
 * rest of the import. */
async function postCollection(
  identifiers: readonly Identifier[],
): Promise<readonly ScryfallCardPayload[]> {
  let cards: readonly ScryfallCardPayload[] = [];
  const attempt = async (): Promise<number | null> => {
    await throttle();
    const res = await fetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "MTG-Engine-DeckImport/1.0",
      },
      body: JSON.stringify({ identifiers }),
    });
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after"));
      return Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 5000;
    }
    if (!res.ok) return null;
    const payload = (await res.json()) as CollectionPayload;
    cards = payload.data ?? [];
    return null;
  };

  try {
    const retryAfterMs = await attempt();
    if (retryAfterMs !== null) {
      await delay(retryAfterMs);
      await attempt();
    }
  } catch {
    return cards;
  }
  return cards;
}

/** Splits `names` across as many `/cards/collection` requests as it takes,
 * calling `onBatch` with the running count of names covered after each.
 * Results are indexed by every name the returned card answers to. */
async function fetchCollection(
  names: readonly string[],
  onBatch?: (covered: number, lastName: string) => void,
): Promise<Map<string, ScryfallCardSummary>> {
  const found = new Map<string, ScryfallCardSummary>();
  for (let i = 0; i < names.length; i += COLLECTION_BATCH_SIZE) {
    const slice = names.slice(i, i + COLLECTION_BATCH_SIZE);
    for (const card of await postCollection(slice.map((name) => ({ name })))) {
      const summary = summarize(card);
      for (const key of responseKeys(card)) found.set(key, summary);
    }
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

/** `(SET) number` → the Scryfall card id, or `null` for a pair that doesn't
 * resolve. Cached for the life of the process, misses included. */
const printingCache = new Map<string, string | null>();

const printingKey = (p: PrintingRef): string =>
  `${p.set.toLowerCase()}/${p.collectorNumber.toLowerCase()}`;

/**
 * Turns each entry's `(SET) collector-number` suffix into the Scryfall card
 * id of that exact printing, so an imported deck keeps the art it was
 * exported with (`SavedDeck.printings`).
 *
 * Batched through the same `/cards/collection` endpoint as the name lookups
 * — a hundred-card export with printing suffixes costs two extra round-trips,
 * not a hundred. Scryfall doesn't say which identifier produced which card,
 * so results are matched back by `set`/`collector_number`, which is exact
 * (unlike the name matching `fetchCollection` has to do).
 *
 * A returned card whose name doesn't match the entry's is discarded: a
 * decklist with a stale or mistyped collector number would otherwise pin a
 * completely different card's art onto this one.
 */
export async function lookupPrintingIds(
  entries: readonly DecklistEntry[],
  onProgress?: (covered: number, lastName: string | null) => void,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const pending: DecklistEntry[] = [];
  for (const entry of entries) {
    if (entry.printing === undefined) continue;
    const cached = printingCache.get(printingKey(entry.printing));
    if (cached === undefined) pending.push(entry);
    else if (cached !== null) out.set(entry.name, cached);
  }

  for (let i = 0; i < pending.length; i += COLLECTION_BATCH_SIZE) {
    const slice = pending.slice(i, i + COLLECTION_BATCH_SIZE);
    const byPrinting = new Map<string, ScryfallCardPayload>();
    for (const card of await postCollection(
      slice.map((e) => ({ set: e.printing!.set, collector_number: e.printing!.collectorNumber })),
    )) {
      if (card.set !== undefined && card.collector_number !== undefined) {
        byPrinting.set(printingKey({ set: card.set, collectorNumber: card.collector_number }), card);
      }
    }
    for (const entry of slice) {
      const key = printingKey(entry.printing!);
      const card = byPrinting.get(key);
      const matches = card !== undefined && responseKeys(card).includes(nameKey(entry.name));
      const id = matches && card.id !== undefined ? card.id : null;
      printingCache.set(key, id);
      if (id !== null) out.set(entry.name, id);
    }
    onProgress?.(i + slice.length, slice[slice.length - 1].name);
  }
  return out;
}

function localTypeLine(def: CardDefinition): string {
  const front = [...def.supertypes, ...def.types].join(" ");
  return def.subtypes.length > 0 ? `${front} — ${def.subtypes.join(" ")}` : front;
}

/** One suggested stand-in for an unimplemented card — see `engine`'s
 * `suggestReplacements`. */
export interface ReplacementOption {
  readonly name: string;
  /** How well it covers what the original does, judged on shared oracle tags
   * (`"low"` when the original has none to go on). */
  readonly confidence: ReplacementConfidence;
  /** Oracle tags both cards carry, most telling first. */
  readonly sharedTags: readonly string[];
}

export interface CardReportEntry extends DecklistEntry {
  /** Already has a matching `CardDefinition` in the engine's registry. */
  readonly implemented: boolean;
  /** Whether any characteristics data (local or Scryfall) was found to show. */
  readonly found: boolean;
  readonly manaCost: string | null;
  readonly typeLine: string;
  readonly oracleText: string;
  /** The stand-in the import uses for this card: `replacements[0]`, or
   * `null` when `implemented` (nothing to replace) or nothing is a sensible
   * match. */
  readonly suggestedReplacement: string | null;
  /** Up to three stand-ins, best first, for the deck builder to offer as
   * alternatives. Chosen for *this* deck: inside its commander's colour
   * identity, never a card the list already has, and never another card's
   * first choice — so taking every first choice can't break singleton. */
  readonly replacements: readonly ReplacementOption[];
  /** The Scryfall card id of the printing this decklist line named, when it
   * named one that resolves. Only ever filled for an `implemented` card — an
   * unimplemented one is either dropped or stood in for by a *different*
   * card, and neither keeps this one's art. `null` for a plain `1 Sol Ring`
   * line, or a printing Scryfall doesn't have. */
  readonly printingId: string | null;
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
export interface EvaluateOptions {
  /** The pasted list's "Commander" section, if it had one — otherwise the
   * commander is guessed the same way `formatCheck` does. */
  readonly commanders?: readonly string[];
  /** Oracle tags for matching stand-ins on role (`loadOracleTagIndex`).
   * Without them, stand-ins are matched on type, cost and body only. */
  readonly tags?: OracleTagIndex | null;
}

export async function evaluateDecklist(
  entries: readonly DecklistEntry[],
  registry: CardRegistry,
  onProgress?: EvaluateProgress,
  options: EvaluateOptions = {},
): Promise<CardReportEntry[]> {
  const total = entries.length;
  const unimplemented = entries.filter((e) => !registry.has(e.name));
  // Implemented cards resolve from the local registry — except the ones
  // naming a specific printing, which cost a lookup of their own. Counting
  // those with the network work rather than with the free ones is what keeps
  // the bar honest; every entry is still counted exactly once.
  const printed = entries.filter((e) => registry.has(e.name) && e.printing !== undefined);
  const free = entries.length - unimplemented.length - printed.length;
  if (free > 0) onProgress?.({ done: free, total, name: null });

  const printingIds = await lookupPrintingIds(printed, (covered, lastName) =>
    onProgress?.({ done: free + covered, total, name: lastName }),
  );
  const beforeNames = free + printed.length;

  const scryfallByName = await lookupScryfallMany(
    unimplemented.map((e) => e.name),
    (done, lastName) => onProgress?.({ done: beforeNames + done, total, name: lastName }),
  );
  // Nothing above fires when every name came from the process cache, and the
  // variant rounds deliberately don't report, so close the bar out here.
  onProgress?.({ done: total, total, name: null });

  const replacements = chooseReplacements(entries, registry, scryfallByName, options);

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
        replacements: [],
        printingId: printingIds.get(entry.name) ?? null,
      };
    }
    const scryfall = scryfallByName.get(entry.name) ?? null;
    const options = replacements.get(entry.name) ?? [];
    return {
      ...entry,
      implemented: false,
      found: scryfall !== null,
      manaCost: scryfall?.manaCost ?? null,
      typeLine: scryfall?.typeLine ?? "",
      oracleText: scryfall?.oracleText ?? "",
      suggestedReplacement: options[0]?.name ?? null,
      replacements: options,
      printingId: null,
    };
  });
}

/** The pasted list's commanders: its "Commander" section when it had one,
 * otherwise the first implemented legendary creature or planeswalker. */
function commandersOf(
  entries: readonly DecklistEntry[],
  registry: CardRegistry,
  explicit: readonly string[],
): readonly string[] {
  if (explicit.length > 0) return explicit;
  const guess = entries.find((e) => {
    if (!registry.has(e.name)) return false;
    const def = registry.get(e.name);
    return (
      def.supertypes.includes("legendary") &&
      (def.types.includes("creature") || def.types.includes("planeswalker"))
    );
  });
  return guess === undefined ? [] : [guess.name];
}

/**
 * Stand-ins for every unimplemented card, chosen for this deck. The commander
 * goes first (its colour identity is what everything else must fit), then the
 * rest in list order, each card's first choice joining the deck's contents so
 * the next card can't be given it too.
 */
function chooseReplacements(
  entries: readonly DecklistEntry[],
  registry: CardRegistry,
  scryfallByName: ReadonlyMap<string, ScryfallCardSummary | null>,
  options: EvaluateOptions,
): Map<string, readonly ReplacementOption[]> {
  const commanders = commandersOf(entries, registry, options.commanders ?? []);
  // The deck's identity, when every commander's is known — otherwise no
  // colour filter, rather than a wrong one.
  let identity: Set<Color> | null = commanders.length > 0 ? new Set() : null;
  for (const name of commanders) {
    const colors = registry.has(name)
      ? [...colorIdentityOf(registry.get(name))]
      : scryfallByName.get(name)?.colorIdentity;
    if (colors === undefined || identity === null) {
      identity = null;
      continue;
    }
    for (const c of colors) identity.add(c);
  }

  const inDeck = new Set(entries.filter((e) => registry.has(e.name)).map((e) => e.name));
  const isCommander = new Set(commanders);
  const order = [...entries].sort(
    (a, b) => Number(isCommander.has(b.name)) - Number(isCommander.has(a.name)),
  );

  // Commanders and everything else are assigned separately, because a
  // commander's candidates are restricted to cards that can legally be one and
  // the two pools barely overlap. Within each group the choice is joint.
  const out = new Map<string, readonly ReplacementOption[]>();
  const seen = new Set<string>();
  const pending: { entry: (typeof order)[number]; commander: boolean }[] = [];
  for (const entry of order) {
    if (registry.has(entry.name) || seen.has(entry.name)) continue;
    // A name can be *present* in the map with a null value — Scryfall was
    // asked and didn't recognise it — so presence is not enough.
    if ((scryfallByName.get(entry.name) ?? null) === null) continue;
    seen.add(entry.name);
    pending.push({ entry, commander: isCommander.has(entry.name) });
  }

  for (const commander of [true, false]) {
    const group = pending.filter((x) => x.commander === commander);
    if (group.length === 0) continue;
    const targets = group.map(({ entry }) => {
      const scryfall = scryfallByName.get(entry.name) as NonNullable<
        ReturnType<typeof scryfallByName.get>
      >;
      return {
        name: entry.name,
        manaCost: scryfall.manaCost,
        typeLine: scryfall.typeLine,
        power: scryfall.power,
        toughness: scryfall.toughness,
        keywords: scryfall.keywords,
      };
    });

    // **Assigned jointly, not one at a time.** Singleton means a stand-in can
    // only be used once, so the choices compete — and taking them in decklist
    // order hands a contested card to whichever line happened to come first.
    // `assignReplacements` maximises the total instead, which gives a shared
    // stand-in to the card whose alternatives are worst rather than to the one
    // that merely scores highest. See its doc comment for the worked example.
    const assigned = assignReplacements(targets, {
      ...(identity !== null ? { identity } : {}),
      exclude: inDeck,
      forCommander: commander,
      ...(options.tags ? { tags: options.tags } : {}),
    });

    for (const [i, a] of assigned.entries()) {
      // `choice` leads, because it is what the import takes; the rest follow as
      // the alternatives the deck builder offers. The chosen one is not always
      // the highest-scoring, which is the whole point, so it has to be moved to
      // the front rather than assumed to be there.
      const ranked = [
        ...(a.choice ? [a.choice] : []),
        ...a.options.filter((s) => s.name !== a.choice?.name),
      ];
      out.set(
        group[i].entry.name,
        ranked.map(({ name, confidence, sharedTags }) => ({ name, confidence, sharedTags })),
      );
      if (a.choice !== null) inDeck.add(a.choice.name);
    }
  }
  return out;
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
