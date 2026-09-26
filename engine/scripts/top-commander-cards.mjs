#!/usr/bin/env node
// Fetches the top N most-popular-in-Commander cards from Scryfall (ranked by
// EDHREC rank via Scryfall's `order=edhrec` search sort) and cross-references
// them against the cards already authored in `cards/pool/`, so we can see at
// a glance which staples are missing from the engine's pool.
//
// Usage:
//   node scripts/top-commander-cards.mjs [--count 500] [--out path] [--include-basics]
//   node scripts/top-commander-cards.mjs --refresh          # re-mark in place
//
// Output is a text file in the same [x]/[+]/[ ] style as `neededCards.txt`:
// one line per card, ranked by EDHREC popularity, marked [x] if a card of
// that name already exists under `cards/pool/`.
//
// `--refresh` touches no network: it rewrites only the [x]/[ ] marks of the
// existing file against the pool as it stands now, leaving the EDHREC ranking
// snapshot — and so its correspondence with `neededCards-features.md` —
// exactly as fetched. That is what you want after authoring cards; re-fetch
// only when the ranking itself should move.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const USER_AGENT = "MTG-Engine-CardAuthoring/1.0";
const SCRYFALL_PAGE_SIZE = 175;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Scryfall asks for at most ~10 req/sec; this script pages through search
// results so stay comfortably under that.
const MIN_INTERVAL_MS = 150;
let earliestNextRequestAt = 0;

async function throttle() {
  const wait = earliestNextRequestAt - Date.now();
  if (wait > 0) await delay(wait);
  earliestNextRequestAt = Date.now() + MIN_INTERVAL_MS;
}

async function scryfallFetch(url) {
  await throttle();
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after"));
    await delay(Number.isFinite(retryAfter) ? retryAfter * 1000 : 2000);
    return scryfallFetch(url);
  }
  return res;
}

function parseArgs(argv) {
  const opts = { count: 500, out: null, includeBasics: false, cacheJson: null, refresh: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--count") opts.count = Number(argv[++i]);
    else if (arg === "--out") opts.out = argv[++i];
    else if (arg === "--include-basics") opts.includeBasics = true;
    else if (arg === "--refresh") opts.refresh = true;
    else if (arg === "--query") opts.query = argv[++i];
    else if (arg === "--cache-json") opts.cacheJson = argv[++i];
  }
  return opts;
}

async function fetchTopCommanderCards(count, { includeBasics = false, query } = {}) {
  const clauses = ["legal:commander", "game:paper", "-is:funny"];
  if (!includeBasics) clauses.push("-t:basic");
  const q = query ?? clauses.join(" ");
  const cards = [];
  let url =
    `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}` +
    `&order=edhrec&dir=asc&unique=cards`;

  while (url && cards.length < count) {
    const res = await scryfallFetch(url);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(`Scryfall search failed (${res.status}): ${body?.details ?? res.statusText}`);
    }
    const body = await res.json();
    for (const card of body.data ?? []) {
      cards.push(card);
      if (cards.length >= count) break;
    }
    url = body.has_more ? body.next_page : null;
  }
  return cards;
}

/**
 * Every card name the pool implements, read from the **built** definitions
 * rather than by regexing the source.
 *
 * Regexing `name: "…"` out of each file used to miss every card built by a
 * `helpers.ts` constructor — `shockLand("Blood Crypt", …)` is a whole file
 * with no `name:` key in it — so ten already-implemented lands were reported
 * unauthored. `POOL_CARDS` has no such blind spot; the cost is that
 * `engine/dist` has to be built first, which the npm script takes care of.
 */
async function loadImplementedNames() {
  const dist = fileURLToPath(new URL("../dist/cards/generated.js", import.meta.url));
  let mod;
  try {
    mod = await import(pathToFileURL(dist).href);
  } catch {
    console.error(`Could not load ${dist} — run \`npm run build -w engine\` first.`);
    process.exit(1);
  }
  const names = new Set();
  for (const def of mod.POOL_CARDS) {
    names.add(def.name);
    // A multi-face card is listed under either face's name, so both count.
    for (const face of def.faces ?? []) names.add(face);
  }
  return names;
}

/** Whether a listed card is implemented: by its name, or — for a double-faced
 * card, which Scryfall lists as "Front // Back" and the pool as its faces —
 * by its front face's. */
function isImplemented(implementedNames, name) {
  return implementedNames.has(name) || implementedNames.has(name.split(" // ")[0]);
}

/** The card name on one line of an existing list file — see `formatLine`. */
function nameOfLine(line) {
  // The name is `padEnd(40)` from column 11; a longer name overflows the field
  // and is then separated from the mana cost by the single literal space.
  const rest = line.slice(11);
  if (rest.length <= 40 || rest[40] === " ") return rest.slice(0, 40).trim();
  return rest.split(/\s{2,}| (?=\{)/)[0].trim();
}

/**
 * `--refresh`: rewrite only the marks of an existing list, leaving its ranking
 * snapshot byte-for-byte alone.
 */
async function refresh(outPath) {
  const implementedNames = await loadImplementedNames();
  const lines = readFileSync(outPath, "utf8").split("\n");
  let implemented = 0;
  let total = 0;
  const marked = lines.map((line) => {
    if (!/^\[.\] /.test(line)) return line;
    total += 1;
    const has = isImplemented(implementedNames, nameOfLine(line));
    if (has) implemented += 1;
    return `${has ? "[x]" : "[ ]"}${line.slice(3)}`;
  });
  // The file's own summary line has to move with the marks.
  const summary = marked.findIndex((l) => / already implemented \/ /.test(l));
  if (summary >= 0) {
    marked[summary] =
      `${implemented} already implemented / ${total - implemented} missing ` +
      `(marks refreshed ${new Date().toISOString().slice(0, 10)})`;
  }
  writeFileSync(outPath, marked.join("\n"), "utf8");
  console.error(`Refreshed ${outPath}: ${implemented}/${total} implemented.`);
}

function formatLine(card, implemented) {
  const mark = implemented ? "[x]" : "[ ]";
  const mv = card.mana_cost && card.mana_cost.length > 0 ? card.mana_cost : `{${card.cmc ?? 0}}`;
  const type = card.type_line ?? "";
  return `${mark} ${String(card.edhrec_rank ?? "?").padStart(5)}  ${card.name.padEnd(40)} ${mv.padEnd(16)} ${type}`;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.refresh && (!Number.isFinite(opts.count) || opts.count <= 0)) {
    console.error("--count must be a positive number");
    process.exit(1);
  }

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const outPath = opts.out ?? path.join(__dirname, "..", "src", "cards", "top-commander-cards.txt");

  if (opts.refresh) {
    await refresh(outPath);
    return;
  }

  console.error(`Fetching top ${opts.count} Commander-popular cards from Scryfall...`);
  const cards = await fetchTopCommanderCards(opts.count, {
    includeBasics: opts.includeBasics,
    query: opts.query,
  });
  console.error(`Fetched ${cards.length} cards.`);

  const implementedNames = await loadImplementedNames();
  console.error(`Found ${implementedNames.size} implemented card names in cards/pool/.`);

  let implementedCount = 0;
  const lines = cards.map((card) => {
    const implemented = isImplemented(implementedNames, card.name);
    if (implemented) implementedCount++;
    return formatLine(card, implemented);
  });

  const header = [
    `Top ${cards.length} Commander cards by EDHREC popularity (fetched ${new Date().toISOString().slice(0, 10)})`,
    `${implementedCount} already implemented / ${cards.length - implementedCount} missing`,
    `Legend: [x] name already exists in cards/pool/   [ ] not yet authored`,
    "",
  ];

  writeFileSync(outPath, [...header, ...lines].join("\n") + "\n", "utf8");
  console.error(`Wrote ${outPath}`);
  console.error(`${implementedCount}/${cards.length} already implemented.`);

  if (opts.cacheJson) {
    const slim = cards.map((c) => ({
      name: c.name,
      edhrec_rank: c.edhrec_rank ?? null,
      mana_cost: c.mana_cost ?? null,
      cmc: c.cmc ?? null,
      type_line: c.type_line ?? null,
      oracle_text: c.oracle_text ?? null,
      keywords: c.keywords ?? [],
      layout: c.layout,
      color_identity: c.color_identity ?? [],
      card_faces: c.card_faces?.map((f) => ({
        name: f.name,
        type_line: f.type_line,
        oracle_text: f.oracle_text,
      })),
      implemented: isImplemented(implementedNames, c.name),
    }));
    writeFileSync(opts.cacheJson, JSON.stringify(slim, null, 1), "utf8");
    console.error(`Wrote raw card cache to ${opts.cacheJson}`);
  }
}

main().catch((err) => {
  console.error(err.stack ?? String(err));
  process.exit(1);
});
