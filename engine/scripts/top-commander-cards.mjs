#!/usr/bin/env node
// Fetches the top N most-popular-in-Commander cards from Scryfall (ranked by
// EDHREC rank via Scryfall's `order=edhrec` search sort) and cross-references
// them against the cards already authored in `cards/pool/`, so we can see at
// a glance which staples are missing from the engine's pool.
//
// Usage:
//   node scripts/top-commander-cards.mjs [--count 500] [--out path] [--include-basics]
//
// Output is a text file in the same [x]/[+]/[ ] style as `neededCards.txt`:
// one line per card, ranked by EDHREC popularity, marked [x] if a card of
// that name already exists under `cards/pool/`.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
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
  const opts = { count: 500, out: null, includeBasics: false, cacheJson: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--count") opts.count = Number(argv[++i]);
    else if (arg === "--out") opts.out = argv[++i];
    else if (arg === "--include-basics") opts.includeBasics = true;
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

function loadImplementedNames(poolDir) {
  const names = new Set();
  for (const file of readdirSync(poolDir)) {
    if (!file.endsWith(".ts")) continue;
    const text = readFileSync(path.join(poolDir, file), "utf8");
    // Top-level `name: "..."` (the card's own name) plus any `faces: [{ name: "..." }]`
    // entries, so both sides of an MDFC/transform card count as implemented.
    for (const match of text.matchAll(/\bname:\s*"([^"]+)"/g)) {
      names.add(match[1]);
    }
  }
  return names;
}

function formatLine(card, implemented) {
  const mark = implemented ? "[x]" : "[ ]";
  const mv = card.mana_cost && card.mana_cost.length > 0 ? card.mana_cost : `{${card.cmc ?? 0}}`;
  const type = card.type_line ?? "";
  return `${mark} ${String(card.edhrec_rank ?? "?").padStart(5)}  ${card.name.padEnd(40)} ${mv.padEnd(16)} ${type}`;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!Number.isFinite(opts.count) || opts.count <= 0) {
    console.error("--count must be a positive number");
    process.exit(1);
  }

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const poolDir = path.join(__dirname, "..", "src", "cards", "pool");
  const outPath = opts.out ?? path.join(__dirname, "..", "src", "cards", "top-commander-cards.txt");

  console.error(`Fetching top ${opts.count} Commander-popular cards from Scryfall...`);
  const cards = await fetchTopCommanderCards(opts.count, {
    includeBasics: opts.includeBasics,
    query: opts.query,
  });
  console.error(`Fetched ${cards.length} cards.`);

  const implementedNames = loadImplementedNames(poolDir);
  console.error(`Found ${implementedNames.size} implemented card names in cards/pool/.`);

  let implementedCount = 0;
  const lines = cards.map((card) => {
    const implemented = implementedNames.has(card.name);
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
      implemented: implementedNames.has(c.name),
    }));
    writeFileSync(opts.cacheJson, JSON.stringify(slim, null, 1), "utf8");
    console.error(`Wrote raw card cache to ${opts.cacheJson}`);
  }
}

main().catch((err) => {
  console.error(err.stack ?? String(err));
  process.exit(1);
});
