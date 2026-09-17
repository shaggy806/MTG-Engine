// Builds server/data/oracle-tags/index.json: for every Commander-legal card,
// which of the allowlisted Scryfall Tagger oracle tags it carries. The card
// replacer (engine/src/card-replacer.ts) compares cards on these to suggest a
// stand-in that fills the same role.
//
//   npm run gen:oracle-tags -w server
//
// Uses only Scryfall's public API: one `oracletag:<slug> legal:commander`
// search per allowlisted tag, paged. Scryfall's API does not expose a card's
// own tags; searching by tag does. A few minutes at the API's requested pace.
//
// Slugs are checked against Scryfall's public tag list first, because search
// answers an unknown tag exactly like one no card carries ("no cards found"),
// and some tags visible on Tagger aren't searchable at all.

import { readFileSync, writeFileSync } from "node:fs";

const DATA = new URL("../data/oracle-tags/", import.meta.url);
const UA = "MTG-Engine/1.0 (card replacer oracle-tag index; tobyens.com)";
const HEADERS = { "User-Agent": UA, Accept: "application/json" };
const PACE_MS = 120; // Scryfall asks for no more than ~10 requests a second
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const progress = (m) => process.stderr.write(`${m}\n`);

async function get(url) {
  for (let attempt = 0; ; attempt += 1) {
    await sleep(PACE_MS);
    const res = await fetch(url, { headers: HEADERS });
    if (res.status === 429 && attempt < 5) {
      progress(`  429 — backing off`);
      await sleep(2000 * (attempt + 1));
      continue;
    }
    return res;
  }
}

const allowlist = readFileSync(new URL("allowlist.txt", DATA), "utf8")
  .split(/\r?\n/)
  .map((line) => line.replace(/#.*/, "").trim())
  .filter(Boolean);
const duplicates = allowlist.filter((slug, i) => allowlist.indexOf(slug) !== i);
if (duplicates.length > 0) throw new Error(`allowlist repeats: ${duplicates.join(", ")}`);

progress(`checking ${allowlist.length} tags against scryfall.com/docs/tagger-tags`);
const catalogHtml = await (await get("https://scryfall.com/docs/tagger-tags")).text();
const searchable = new Set(
  [...catalogHtml.matchAll(/href="\/search\?q=oracletag%3A([^"&]+)"/g)].map((m) => decodeURIComponent(m[1])),
);
if (searchable.size < 1000) throw new Error(`tag list looks wrong (${searchable.size} tags) — has the page changed?`);
const unknown = allowlist.filter((slug) => !searchable.has(slug));
if (unknown.length > 0) throw new Error(`not searchable oracle tags: ${unknown.join(", ")}`);

const legal = await (await get("https://api.scryfall.com/cards/search?q=legal%3Acommander")).json();
const legalCardCount = legal.total_cards;
progress(`${legalCardCount} Commander-legal cards`);

/** card name (front face, as decklists write it) -> tag indices */
const cards = new Map();
let requests = 0;
for (const [index, slug] of allowlist.entries()) {
  let url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(`oracletag:${slug} legal:commander`)}&order=name`;
  let count = 0;
  while (url) {
    const res = await get(url);
    requests += 1;
    const body = await res.json();
    if (body.object === "error") {
      if (body.code === "not_found") break; // a real tag no legal card carries
      throw new Error(`${slug}: ${body.details}`);
    }
    for (const card of body.data) {
      const name = card.name.split(" // ")[0];
      const tags = cards.get(name) ?? [];
      if (!tags.includes(index)) tags.push(index);
      cards.set(name, tags);
      count += 1;
    }
    url = body.has_more ? body.next_page : null;
  }
  progress(`[${index + 1}/${allowlist.length}] ${slug}: ${count}`);
}

const sorted = Object.fromEntries([...cards].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
writeFileSync(
  new URL("index.json", DATA),
  JSON.stringify({
    source: "Scryfall Tagger oracle tags, via api.scryfall.com search",
    generatedAt: new Date().toISOString().slice(0, 10),
    legalCardCount,
    tags: allowlist,
    cards: sorted,
  }) + "\n",
);
progress(`DONE: ${cards.size} cards tagged, ${requests} requests`);
