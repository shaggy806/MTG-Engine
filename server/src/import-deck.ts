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

import type { CardDefinition, CardRegistry } from "engine";
import { validateCommanderDeck } from "./deck-validation.js";
import type { DeckValidationResult } from "./deck-validation.js";

export interface DecklistEntry {
  readonly name: string;
  readonly count: number;
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
 * listed among the support cards). Blank lines, `//` comments, and any
 * non-matching line (a section header some export variants include) are
 * silently skipped rather than treated as errors. */
export function parseDecklistText(text: string): DecklistEntry[] {
  const counts = new Map<string, number>();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("//")) continue;
    const match = LINE_PATTERN.exec(line);
    if (match === null) continue;
    const name = stripPrintingSuffix(match[2].trim());
    counts.set(name, (counts.get(name) ?? 0) + Number(match[1]));
  }
  return [...counts.entries()].map(([name, count]) => ({ name, count }));
}

export interface ScryfallCardSummary {
  readonly manaCost: string | null;
  readonly typeLine: string;
  readonly oracleText: string;
}

interface ScryfallCardPayload {
  readonly mana_cost?: string;
  readonly type_line?: string;
  readonly oracle_text?: string;
  readonly card_faces?: readonly {
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
// BLOCK" — 100ms (exactly 10/sec) turned out to trip that in practice for a
// long decklist, so every request is throttled to a real gap comfortably
// under the ceiling, tracked process-wide (not per-call) since a decklist
// runs many lookups back to back.
const MIN_INTERVAL_MS = 200;
let earliestNextRequestAt = 0;

async function throttle(): Promise<void> {
  const wait = earliestNextRequestAt - Date.now();
  if (wait > 0) await delay(wait);
  earliestNextRequestAt = Date.now() + MIN_INTERVAL_MS;
}

interface ScryfallLookupResult {
  readonly summary: ScryfallCardSummary | null;
  /** Set when Scryfall itself asked us to back off (HTTP 429) rather than a
   * plain "no such card" (404) — worth one retry after waiting it out. */
  readonly retryAfterMs: number | null;
}

async function fetchScryfallByExactName(name: string): Promise<ScryfallLookupResult> {
  await throttle();
  const res = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`, {
    headers: { "User-Agent": "MTG-Engine-DeckImport/1.0" },
  });
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after"));
    return { summary: null, retryAfterMs: Number.isFinite(retryAfter) ? retryAfter * 1000 : 5000 };
  }
  if (!res.ok) return { summary: null, retryAfterMs: null };
  const data = (await res.json()) as ScryfallCardPayload;
  const face = data.card_faces?.[0];
  return {
    retryAfterMs: null,
    summary: {
      manaCost: data.mana_cost ?? face?.mana_cost ?? null,
      typeLine: data.type_line ?? face?.type_line ?? "",
      oracleText:
        data.oracle_text ??
        (data.card_faces ?? [])
          .map((f) => f.oracle_text ?? "")
          .filter((t) => t !== "")
          .join("\n//\n"),
    },
  };
}

/** Looks up one name, retrying once if Scryfall asked us to back off. */
async function fetchScryfallWithRetry(name: string): Promise<ScryfallCardSummary | null> {
  const first = await fetchScryfallByExactName(name);
  if (first.summary !== null || first.retryAfterMs === null) return first.summary;
  await delay(first.retryAfterMs);
  return (await fetchScryfallByExactName(name)).summary;
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

/** Looks up one card's authoritative printed data by name. Cached for the
 * life of the process (names repeat within a deck, and across separate
 * import requests). A miss (not found under any name variant, or a network
 * error) is cached as `null` rather than retried every time the same
 * unknown name comes up. */
export async function lookupScryfall(name: string): Promise<ScryfallCardSummary | null> {
  const cached = scryfallCache.get(name);
  if (cached !== undefined) return cached;

  let summary: ScryfallCardSummary | null = null;
  try {
    for (const variant of scryfallNameVariants(name)) {
      summary = await fetchScryfallWithRetry(variant);
      if (summary !== null) break;
    }
  } catch {
    summary = null;
  }

  scryfallCache.set(name, summary);
  return summary;
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
}

/** Cross-references each decklist entry against the engine's card registry
 * by exact name. Implemented cards are reported straight from their local
 * `CardDefinition` (no network call needed); everything else is looked up on
 * Scryfall so its real characteristics can be reviewed. */
export async function evaluateDecklist(
  entries: readonly DecklistEntry[],
  registry: CardRegistry,
): Promise<CardReportEntry[]> {
  const results: CardReportEntry[] = [];
  for (const entry of entries) {
    if (registry.has(entry.name)) {
      const def = registry.get(entry.name);
      results.push({
        ...entry,
        implemented: true,
        found: true,
        manaCost: def.manaCost,
        typeLine: localTypeLine(def),
        oracleText: def.text,
      });
      continue;
    }
    const scryfall = await lookupScryfall(entry.name);
    results.push({
      ...entry,
      implemented: false,
      found: scryfall !== null,
      manaCost: scryfall?.manaCost ?? null,
      typeLine: scryfall?.typeLine ?? "",
      oracleText: scryfall?.oracleText ?? "",
    });
  }
  return results;
}

/**
 * A best-effort Commander-format check over the *implemented* cards in a
 * pasted list (ROADMAP Phase 9). The commander is guessed as the first
 * legendary creature/planeswalker in the list; everything else is the 99. It
 * only surfaces singleton / colour-identity / size violations — feasibility
 * (is each card implemented) is the `cards` report's job.
 */
export function formatCheck(
  entries: readonly DecklistEntry[],
  registry: CardRegistry,
): DeckValidationResult & { readonly commander: string | null } {
  const flat: string[] = [];
  for (const e of entries) {
    for (let i = 0; i < e.count; i += 1) flat.push(e.name);
  }
  const commander =
    flat.find((n) => {
      if (!registry.has(n)) return false;
      const def = registry.get(n);
      return (
        def.supertypes.includes("legendary") &&
        (def.types.includes("creature") || def.types.includes("planeswalker"))
      );
    }) ?? null;

  const rest = commander === null ? flat : flat.filter((n, i) => !(n === commander && i === flat.indexOf(commander)));
  const result = validateCommanderDeck(
    { commanders: commander ? [commander] : [], cards: rest, size: 100 },
    registry,
  );
  return { ...result, commander };
}
