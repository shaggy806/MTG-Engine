#!/usr/bin/env node
// Cross-checks every card under cards/pool/ against its real Scryfall data:
// mana cost, colors, supertypes/types/subtypes, power/toughness, loyalty.
// Behaviour (abilities/effects) isn't checked here — only the objectively
// comparable printed characteristics. Tokens (cards/tokens/) are skipped:
// their names aren't unique/canonical on Scryfall.
//
// Usage: node scripts/verify-cards.mjs [--json out.json] [--limit N] [--start N]

import { readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { writeFileSync } from "node:fs";

const POOL_DIR = fileURLToPath(new URL("../dist/cards/pool/", import.meta.url));
const USER_AGENT = "MTG-Engine-CardVerification/1.0";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const jsonOut = flag("json", null);
const limit = Number(flag("limit", Infinity));
const start = Number(flag("start", 0));

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const MIN_INTERVAL_MS = 400;
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 5;
let earliestNextRequestAt = 0;
async function throttle() {
  const wait = earliestNextRequestAt - Date.now();
  if (wait > 0) await delay(wait);
  earliestNextRequestAt = Date.now() + MIN_INTERVAL_MS;
}

/** One HTTP attempt with a hard timeout — a stalled connection aborts rather
 * than hanging the whole run forever. Returns `{ res } | { error }`. */
async function attemptFetch(url, init) {
  await throttle();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...init?.headers },
      signal: controller.signal,
    });
    return { res };
  } catch (error) {
    return { error };
  } finally {
    clearTimeout(timer);
  }
}

/** Bounded retries — a 429, a timeout, or a network error all get up to
 * `MAX_RETRIES` more tries with backoff, then give up (never loops forever). */
async function scryfallFetch(url, init) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const outcome = await attemptFetch(url, init);
    if (outcome.error !== undefined) {
      if (attempt === MAX_RETRIES) return { ok: false, status: "network-error", detail: String(outcome.error) };
      await delay(1000 * (attempt + 1));
      continue;
    }
    const res = outcome.res;
    // 429 (rate limited) and 5xx (Scryfall/Cloudflare transient trouble —
    // observed in practice after a day of heavy lookups) are both worth
    // retrying; a real 404 ("no such card") is not.
    if (res.status === 429 || res.status >= 500) {
      if (attempt === MAX_RETRIES) return { ok: false, status: res.status };
      const retryAfter = Number(res.headers.get("retry-after"));
      const backoff = Number.isFinite(retryAfter) ? Math.min(retryAfter * 1000, 10_000) : 1500 * (attempt + 1);
      await delay(backoff);
      continue;
    }
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, status: res.status, body: await res.json() };
  }
  return { ok: false, status: "unreachable" };
}

async function fetchCardByName(name) {
  return scryfallFetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`);
}

/** Scryfall's batch endpoint — up to 75 identifiers per POST, one request
 * instead of one-per-card. https://scryfall.com/docs/api/cards/collection.
 * `name` identifiers do an exact match — a name that's only one face of a
 * DFC/split/adventure card (our registry key) legitimately won't resolve
 * here and comes back in `not_found` for the caller to fuzzy-fallback on. */
const COLLECTION_BATCH_SIZE = 75;
async function fetchCollection(names) {
  const outcome = await scryfallFetch("https://api.scryfall.com/cards/collection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifiers: names.map((name) => ({ name })) }),
  });
  if (!outcome.ok) return { found: new Map(), missing: names, error: outcome.status };
  const found = new Map();
  for (const card of outcome.body.data) {
    found.set(card.name.toLowerCase(), card);
    for (const face of card.card_faces ?? []) found.set(face.name.toLowerCase(), card);
  }
  // Anything Scryfall couldn't exact-match, plus anything we asked for that
  // didn't come back under its own name (a DFC face is a real risk here).
  const missing = names.filter((n) => !found.has(n.toLowerCase()));
  return { found, missing };
}

const KNOWN_SUPERTYPES = new Set(["Legendary", "Basic", "Snow", "World", "Ongoing"]);
const KNOWN_TYPES = new Set([
  "Creature", "Land", "Artifact", "Enchantment", "Instant", "Sorcery", "Planeswalker", "Battle",
  "Tribal", "Kindred", "Dungeon", "Plane", "Phenomenon", "Scheme", "Vanguard", "Conspiracy",
]);
function parseTypeLine(typeLine) {
  const [frontPart, subPart] = typeLine.split(/\s+—\s+/);
  const words = frontPart.trim().split(/\s+/);
  const supertypes = words.filter((w) => KNOWN_SUPERTYPES.has(w)).map((w) => w.toLowerCase());
  const types = words.filter((w) => KNOWN_TYPES.has(w)).map((w) => w.toLowerCase());
  const subtypes = subPart ? subPart.trim().split(/\s+/) : [];
  return { supertypes, types, subtypes };
}

function sameSet(a, b) {
  const as = new Set(a ?? []);
  const bs = new Set(b ?? []);
  if (as.size !== bs.size) return false;
  for (const x of as) if (!bs.has(x)) return false;
  return true;
}

/** Every name a face/card could legitimately be looked up under — its real
 * name and its Universes Beyond `flavor_name` (Azusa, Lost but Seeking /
 * "Princess Sarah" — our registry uses whichever name is actually printed
 * on the card, which for a crossover card is the flavor name). */
function namesOf(faceOrCard) {
  return [faceOrCard.name, faceOrCard.flavor_name].filter((n) => n !== undefined);
}

/** Pick the Scryfall face (or the top-level card) whose name matches `name`. */
function faceFor(card, name) {
  const lower = name.toLowerCase();
  if (card.card_faces && card.card_faces.length > 0) {
    const face = card.card_faces.find((f) => namesOf(f).some((n) => n.toLowerCase() === lower));
    if (face !== undefined) return face;
  }
  return card;
}

/** True only if `card` (or one of its faces) is actually named `name`. The
 * batch collection endpoint's "name" identifier is an exact match, so it
 * can't misfire — but the fuzzy fallback (`?fuzzy=`, used only for a name
 * the batch endpoint couldn't exact-match) is lenient enough to return a
 * completely unrelated real card for a homebrew name that merely contains a
 * real card's words (e.g. "Rendwin, Warden of the Grove" fuzzy-matched the
 * real, unrelated "Warden of the Grove"). Without this check that reads as
 * a false "mismatch" instead of the true "not on Scryfall at all". */
function actuallyNamed(card, name) {
  const lower = name.toLowerCase();
  if (namesOf(card).some((n) => n.toLowerCase() === lower)) return true;
  return (card.card_faces ?? []).some((f) => namesOf(f).some((n) => n.toLowerCase() === lower));
}

function numOrNull(s) {
  if (s === undefined || s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function compare(def, card) {
  const face = faceFor(card, def.name);
  const issues = [];

  const theirCost = face.mana_cost ?? "";
  const ourCost = def.manaCost ?? "";
  if (theirCost.trim() !== ourCost.trim()) {
    issues.push(`manaCost: ours="${ourCost}" scryfall="${theirCost}"`);
  }

  const theirColors = face.colors ?? card.colors ?? [];
  // A colourless permanent's own `colors` is legitimately absent on a face
  // that inherits colour from the front (rare) — only flag a real mismatch.
  if (!sameSet(def.colors ?? [], theirColors)) {
    issues.push(`colors: ours=[${(def.colors ?? []).join(",")}] scryfall=[${theirColors.join(",")}]`);
  }

  if (face.type_line) {
    const parsed = parseTypeLine(face.type_line);
    if (!sameSet(def.supertypes ?? [], parsed.supertypes)) {
      issues.push(`supertypes: ours=[${(def.supertypes ?? []).join(",")}] scryfall=[${parsed.supertypes.join(",")}]`);
    }
    if (!sameSet(def.types ?? [], parsed.types)) {
      issues.push(`types: ours=[${(def.types ?? []).join(",")}] scryfall=[${parsed.types.join(",")}]`);
    }
    if (!sameSet(def.subtypes ?? [], parsed.subtypes)) {
      issues.push(`subtypes: ours=[${(def.subtypes ?? []).join(",")}] scryfall=[${parsed.subtypes.join(",")}]`);
    }
  }

  const theirPower = numOrNull(face.power);
  const theirToughness = numOrNull(face.toughness);
  if (theirPower !== null && def.power !== undefined && def.power !== theirPower) {
    issues.push(`power: ours=${def.power} scryfall=${face.power}`);
  }
  if (theirToughness !== null && def.toughness !== undefined && def.toughness !== theirToughness) {
    issues.push(`toughness: ours=${def.toughness} scryfall=${face.toughness}`);
  }
  const theirLoyalty = numOrNull(face.loyalty);
  if (theirLoyalty !== null && def.loyalty !== undefined && def.loyalty !== theirLoyalty) {
    issues.push(`loyalty: ours=${def.loyalty} scryfall=${face.loyalty}`);
  }

  return issues;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const files = readdirSync(POOL_DIR)
    .filter((f) => f.endsWith(".js"))
    .sort()
    .slice(start, Number.isFinite(limit) ? start + limit : undefined);

  const entries = [];
  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(POOL_DIR, file)).href);
    const def = mod.default;
    if (def === undefined || def.name === undefined) continue;
    entries.push({ file, def });
  }

  // Pass 1: the batch collection endpoint, ceil(N/75) requests total.
  const byName = new Map();
  const batches = chunk(entries.map((e) => e.def.name), COLLECTION_BATCH_SIZE);
  console.log(`resolving ${entries.length} cards in ${batches.length} batch request(s)...`);
  for (const batch of batches) {
    const { found, missing, error } = await fetchCollection(batch);
    for (const [name, card] of found) byName.set(name, card);
    if (error !== undefined) console.log(`  batch request failed (status=${error}) — falling back per-name for it`);
    for (const name of missing) byName.set(name.toLowerCase(), "fallback-needed");
  }

  // Pass 2: fuzzy fallback, one request each — only for names the batch
  // endpoint's exact-match couldn't resolve (typically one face of a
  // DFC/split/adventure card, since our registry key is just that face).
  const needFallback = entries.filter((e) => byName.get(e.def.name.toLowerCase()) === "fallback-needed");
  if (needFallback.length > 0) {
    console.log(`fuzzy-resolving ${needFallback.length} name(s) the batch endpoint couldn't exact-match...`);
  }
  for (const { def } of needFallback) {
    const outcome = await fetchCardByName(def.name);
    const resolved = outcome.ok && actuallyNamed(outcome.body, def.name) ? outcome.body : undefined;
    byName.set(def.name.toLowerCase(), resolved ?? { __error: outcome.ok ? "fuzzy-mismatch" : outcome.status });
  }

  const results = [];
  let checked = 0;
  let mismatched = 0;
  let notFound = 0;

  for (const { file, def } of entries) {
    const card = byName.get(def.name.toLowerCase());
    if (card === undefined || card === "fallback-needed" || card?.__error !== undefined) {
      notFound += 1;
      const httpStatus = card?.__error;
      results.push({ name: def.name, file, status: "not-found", httpStatus });
      console.log(`? NOT FOUND: ${def.name} (${file})${httpStatus !== undefined ? ` [status=${httpStatus}]` : ""}`);
      continue;
    }
    checked += 1;
    const issues = compare(def, card);
    if (issues.length > 0) {
      mismatched += 1;
      results.push({ name: def.name, file, status: "mismatch", issues });
      console.log(`✗ ${def.name} (${file})`);
      for (const issue of issues) console.log(`    ${issue}`);
    } else {
      results.push({ name: def.name, file, status: "ok" });
    }
  }

  console.log(
    `\n${checked} checked, ${mismatched} mismatched, ${notFound} not found on Scryfall (out of ${entries.length} cards)`,
  );

  if (jsonOut !== null) {
    writeFileSync(jsonOut, JSON.stringify(results, null, 2), "utf8");
    console.log(`wrote ${jsonOut}`);
  }
}

main();
