/**
 * The oracle-tag index the card replacer matches on (see `engine`'s
 * `card-replacer.ts`), loaded once from the file `npm run gen:oracle-tags`
 * writes. Kept server-side: it's a few hundred kilobytes of data only the
 * decklist import needs, and the engine (which the client bundles) does no
 * I/O.
 */

import { readFileSync } from "node:fs";
import { createOracleTagIndex } from "engine";
import type { OracleTagIndex, OracleTagIndexData } from "engine";

const INDEX_FILE = new URL("../data/oracle-tags/index.json", import.meta.url);

let cached: OracleTagIndex | null | undefined;

/** The index, or `null` if the file is missing or unreadable — the replacer
 * then falls back to type, cost and body alone rather than failing an import. */
export function loadOracleTagIndex(): OracleTagIndex | null {
  if (cached !== undefined) return cached;
  try {
    const data = JSON.parse(readFileSync(INDEX_FILE, "utf8")) as OracleTagIndexData;
    cached = createOracleTagIndex(data);
  } catch (err) {
    console.warn(`oracle-tag index unavailable (${err instanceof Error ? err.message : String(err)}); card replacements will ignore tags`);
    cached = null;
  }
  return cached;
}
