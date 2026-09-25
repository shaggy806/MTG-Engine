// Reads the checked-in Oracle snapshot (`engine/data/oracle/cards.jsonl`,
// built by `gen-oracle.mjs`): every Commander-legal card and every token, one
// line each, with rulings and the tokens it makes. Shared by `card:lookup`
// and `card:scaffold`, so neither needs the network.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const SNAPSHOT_PATH = path.join(here, "../data/oracle/cards.jsonl");

/** Fold a name for forgiving matches: case, accents, punctuation. */
const fold = (name) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

let cache = null;

/** Every entry, plus lookups by exact name, folded name and face name.
 * `null` when the snapshot hasn't been generated. */
export function loadSnapshot() {
  if (cache !== null) return cache;
  if (!existsSync(SNAPSHOT_PATH)) return null;
  const entries = readFileSync(SNAPSHOT_PATH, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  const exact = new Map();
  const folded = new Map();
  const add = (key, entry) => {
    // A card beats a token of the same name ("Treasure" the card, not the token).
    const prev = exact.get(key);
    if (prev === undefined || (prev.commander === "token" && entry.commander !== "token")) exact.set(key, entry);
    const f = fold(key);
    const prevF = folded.get(f);
    if (prevF === undefined || (prevF.commander === "token" && entry.commander !== "token")) folded.set(f, entry);
  };
  for (const entry of entries) {
    add(entry.name, entry);
    for (const face of entry.faces ?? []) add(face.name, entry);
  }
  cache = { entries, exact, folded };
  return cache;
}

/** The card a name means — exact, then any face, then ignoring case, accents
 * and punctuation. `undefined` when nothing matches. */
export function findCard(name) {
  const snap = loadSnapshot();
  if (snap === null) return undefined;
  return snap.exact.get(name) ?? snap.exact.get(name.split(" // ")[0]) ?? snap.folded.get(fold(name));
}

/** Up to `n` names containing every word of `name`, for a "did you mean". */
export function suggest(name, n = 5) {
  const snap = loadSnapshot();
  if (snap === null) return [];
  const words = fold(name).split(" ").filter(Boolean);
  return snap.entries
    .filter((e) => words.every((w) => fold(e.name).includes(w)))
    .slice(0, n)
    .map((e) => e.name);
}
