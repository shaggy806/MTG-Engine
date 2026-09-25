#!/usr/bin/env node
// Builds the checked-in Oracle snapshot, `engine/data/oracle/cards.jsonl`:
// every Commander-legal (or banned) card and every token Scryfall knows, one
// JSON object per line, sorted by name, with the card's rulings and the tokens
// it makes folded into its own line. Everything card authoring reads from
// Scryfall — cost, types, stats, Oracle text, rulings, token details, a
// printing to pin art to — is in it, so authoring works without the network
// (cloud sessions can't reach Scryfall) and a card is one `grep` away.
//
// The source is Scryfall's bulk data (https://scryfall.com/docs/api/bulk-data):
// the "Oracle Cards" and "Rulings" files, downloaded whole into the
// git-ignored `engine/.cache/scryfall/` and reused while Scryfall's copy is
// unchanged. The only per-card requests are for the token printings cards
// name in `all_parts`, which the Oracle file doesn't index by printing — a
// few dozen batched `/cards/collection` calls.
//
// Usage: npm run gen:oracle -w engine [-- --refresh]   (--refresh re-downloads)

import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createGunzip } from "node:zlib";

const here = path.dirname(fileURLToPath(import.meta.url));
const cacheDir = path.join(here, "../.cache/scryfall");
const outDir = path.join(here, "../data/oracle");
const HEADERS = { "User-Agent": "MTG-Engine-OracleSnapshot/1.0", Accept: "application/json" };
const refresh = process.argv.includes("--refresh");

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function download(type) {
  const index = await (await fetch("https://api.scryfall.com/bulk-data", { headers: HEADERS })).json();
  const entry = index.data.find((b) => b.type === type);
  if (!entry) throw new Error(`no bulk file of type ${type}`);
  const file = path.join(cacheDir, `${type}.jsonl.gz`);
  const stamp = path.join(cacheDir, `${type}.updated_at`);
  if (!refresh && existsSync(file) && existsSync(stamp) && readFileSync(stamp, "utf8") === entry.updated_at) {
    console.error(`${type}: cached (${entry.updated_at})`);
    return { file, updatedAt: entry.updated_at };
  }
  console.error(`${type}: downloading ${(entry.compressed_size / 1e6).toFixed(1)} MB…`);
  const res = await fetch(entry.jsonl_download_uri, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${type}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  writeFileSync(stamp, entry.updated_at);
  return { file, updatedAt: entry.updated_at };
}

async function* jsonLines(file) {
  const lines = createInterface({ input: createReadStream(file).pipe(createGunzip()), crlfDelay: Infinity });
  for await (const line of lines) {
    const trimmed = line.trim().replace(/,$/, "");
    if (trimmed.startsWith("{")) yield JSON.parse(trimmed);
  }
}

/** The printed characteristics of one face (or a single-faced card). */
const faceOf = (f) => ({
  name: f.name,
  mana_cost: f.mana_cost || undefined,
  type_line: f.type_line,
  oracle_text: f.oracle_text || undefined,
  colors: f.colors,
  color_indicator: f.color_indicator,
  power: f.power,
  toughness: f.toughness,
  loyalty: f.loyalty,
  defense: f.defense,
});

mkdirSync(cacheDir, { recursive: true });
mkdirSync(outDir, { recursive: true });
const oracle = await download("oracle_cards");
const rulingsFile = await download("rulings");

const rulings = new Map();
for await (const r of jsonLines(rulingsFile.file)) {
  if (!rulings.has(r.oracle_id)) rulings.set(r.oracle_id, []);
  rulings.get(r.oracle_id).push({ date: r.published_at, source: r.source, text: r.comment });
}

const cards = [];
const tokenIds = new Set();
for await (const c of jsonLines(oracle.file)) {
  const isToken = c.layout === "token" || c.layout === "double_faced_token";
  const legality = c.legalities?.commander;
  if (!isToken && legality !== "legal" && legality !== "banned") continue;
  const parts = (c.all_parts ?? []).filter((p) => p.component === "token" && p.id !== c.id);
  for (const p of parts) tokenIds.add(p.id);
  const multi = c.card_faces !== undefined && c.oracle_text === undefined;
  cards.push({
    name: c.name,
    oracle_id: c.oracle_id,
    printing: c.id,
    set: c.set,
    collector_number: c.collector_number,
    layout: c.layout,
    commander: isToken ? "token" : legality,
    cmc: c.cmc,
    color_identity: c.color_identity,
    colors: c.colors,
    keywords: c.keywords?.length ? c.keywords : undefined,
    edhrec_rank: c.edhrec_rank,
    ...(multi ? { mana_cost: c.mana_cost || undefined, type_line: c.type_line } : faceOf(c)),
    faces: multi ? c.card_faces.map(faceOf) : undefined,
    token_ids: parts.length ? parts.map((p) => p.id) : undefined,
    rulings: rulings.get(c.oracle_id),
  });
}

// Resolve the token printings `all_parts` names, 75 identifiers a request.
const tokens = new Map();
const ids = [...tokenIds];
console.error(`resolving ${ids.length} token printings in ${Math.ceil(ids.length / 75)} requests…`);
for (let i = 0; i < ids.length; i += 75) {
  const body = JSON.stringify({ identifiers: ids.slice(i, i + 75).map((id) => ({ id })) });
  let res;
  for (;;) {
    res = await fetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/json" },
      body,
    });
    if (res.status !== 429) break;
    await delay(2000);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} resolving tokens`);
  for (const t of (await res.json()).data ?? []) {
    const multi = t.card_faces !== undefined && t.oracle_text === undefined;
    tokens.set(t.id, {
      printing: t.id,
      oracle_id: t.oracle_id,
      set: t.set,
      ...(multi ? { name: t.name, type_line: t.type_line, faces: t.card_faces.map(faceOf) } : faceOf(t)),
    });
  }
  await delay(120);
}
for (const card of cards) {
  if (card.token_ids === undefined) continue;
  card.tokens = card.token_ids.map((id) => tokens.get(id)).filter(Boolean);
  delete card.token_ids;
}

cards.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
const drop = (o) => JSON.stringify(o, (_k, v) => (v === undefined ? undefined : v));
writeFileSync(path.join(outDir, "cards.jsonl"), cards.map(drop).join("\n") + "\n");
writeFileSync(
  path.join(outDir, "meta.json"),
  JSON.stringify(
    {
      oracle_cards: oracle.updatedAt,
      rulings: rulingsFile.updatedAt,
      cards: cards.filter((c) => c.commander !== "token").length,
      tokens: cards.filter((c) => c.commander === "token").length,
    },
    null,
    2,
  ) + "\n",
);
console.error(`wrote ${cards.length} entries to data/oracle/cards.jsonl`);
