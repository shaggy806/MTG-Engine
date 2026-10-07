/**
 * The printed characteristics of every Commander-legal (or banned) card, for
 * the decklist import to read a card the engine doesn't implement from
 * instead of asking Scryfall. The source is the engine's checked-in Oracle
 * snapshot, `engine/data/oracle/cards.jsonl` (`npm run gen:oracle -w engine`,
 * from Scryfall's bulk data) — the same file card authoring reads — loaded
 * once, the first time an import needs it.
 */

import { readFileSync } from "node:fs";
import type { Color } from "engine";
import type { LocalCardData, ScryfallCardSummary } from "./import-deck.js";

const ORACLE_FILE = new URL("../../engine/data/oracle/cards.jsonl", import.meta.url);

/** The fields of one snapshot line the import reads. */
export interface OracleLine {
  readonly name: string;
  /** "legal", "banned", or "token" for a token's line. */
  readonly commander?: string;
  readonly mana_cost?: string;
  readonly type_line?: string;
  readonly power?: string;
  readonly toughness?: string;
  readonly keywords?: readonly string[];
  readonly color_identity?: readonly string[];
  readonly faces?: readonly {
    readonly name: string;
    readonly mana_cost?: string;
    readonly type_line?: string;
    readonly power?: string;
    readonly toughness?: string;
  }[];
}

/**
 * The snapshot's cards as a lookup, under every name a decklist might use
 * for one: its own, its `"Front // Back"` name in the single-slash form, and
 * each face's name — the same names a Scryfall answer is matched back by
 * (`responseKeys` in import-deck.ts). A card's own name wins over another
 * card's face of the same name. Case-insensitive. Each card is reduced the
 * way `summarize` reduces a Scryfall answer, so it reads the same from
 * either source.
 */
export function createCardData(lines: readonly OracleLine[]): LocalCardData {
  const byKey = new Map<string, ScryfallCardSummary>();
  const faces: [string, ScryfallCardSummary][] = [];
  for (const card of lines) {
    if (card.commander === "token") continue;
    const face = card.faces?.[0];
    const summary: ScryfallCardSummary = {
      manaCost: card.mana_cost ?? face?.mana_cost ?? null,
      typeLine: card.type_line ?? face?.type_line ?? "",
      power: card.power ?? face?.power ?? null,
      toughness: card.toughness ?? face?.toughness ?? null,
      keywords: card.keywords ?? [],
      colorIdentity: (card.color_identity ?? []).filter((c): c is Color => ["W", "U", "B", "R", "G"].includes(c)),
    };
    byKey.set(key(card.name), summary);
    if (card.name.includes(" // ")) byKey.set(key(card.name.replace(/\s*\/\/\s*/g, " / ")), summary);
    for (const f of card.faces ?? []) faces.push([key(f.name), summary]);
  }
  for (const [faceKey, summary] of faces) if (!byKey.has(faceKey)) byKey.set(faceKey, summary);
  return (name) => byKey.get(key(name));
}

const key = (name: string): string => name.trim().toLowerCase();

let cached: LocalCardData | null | undefined;

/** The snapshot as a lookup, or `null` if it's missing or unreadable — the
 * import then asks Scryfall about every card the engine lacks. */
export function loadCardData(): LocalCardData | null {
  if (cached !== undefined) return cached;
  try {
    const lines = readFileSync(ORACLE_FILE, "utf8")
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => JSON.parse(line) as OracleLine);
    cached = createCardData(lines);
  } catch (err) {
    console.warn(`Oracle snapshot unavailable (${err instanceof Error ? err.message : String(err)}); imports will ask Scryfall for every unimplemented card`);
    cached = null;
  }
  return cached;
}
