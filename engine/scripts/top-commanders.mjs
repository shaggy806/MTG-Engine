#!/usr/bin/env node
// Fetches the most-played *commanders* and cross-references them against the
// cards already authored in `cards/pool/`.
//
//   node scripts/top-commanders.mjs [--count 500] [--out path]
//   node scripts/top-commanders.mjs --refresh          # re-mark in place
//
// **Not the same list as `top-commander-cards.txt`, and that is the point.**
// That file ranks cards by how often they are *played in* Commander decks,
// which is what Scryfall's `order=edhrec` sorts by. Ranking commanders that
// way is badly wrong: measured against EDHREC's real commander table, only 47
// of the 100 most-played commanders appear anywhere in the top 500
// commander-legal cards by card rank. Edgar Markov, The Ur-Dragon, Atraxa,
// Krenko and fifty others are missing outright, because a commander is played
// as a singleton in its own deck and almost nowhere else — so its *card* rank
// stays low however popular the deck is.
//
// The ranking here is `num_decks` from EDHREC: how many decks run that card
// **as their commander**.
//
// **Source, and the risk it carries.** json.edhrec.com is not a documented
// API, the same objection that kept the card replacer off Scryfall Tagger's
// GraphQL. It is used here anyway for one reason: nothing else publishes
// commander-specific deck counts, and this script produces a *checked-in*
// file. If the endpoint changes, the list it already wrote keeps working and
// only `--refresh`-from-network stops — a build-time dependency, never a
// runtime one. `/pages/commanders.json` answers 403; the per-colour-identity
// pages (32 of them, 100 commanders each) do not, and together they cover far
// more than the top 500. Card names, costs and type lines still come from
// Scryfall, which stays the authority on what a card actually is.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const USER_AGENT = "MTG-Engine-CardAuthoring/1.0";
const DEFAULT_OUT = fileURLToPath(new URL("../src/cards/top-commanders.txt", import.meta.url));

/** Every colour identity EDHREC files commanders under. Taken from the
 * `related_info` block any one of these pages returns, so it stays in step
 * with however EDHREC groups them. */
const IDENTITIES = [
  "mono-white", "mono-blue", "mono-black", "mono-red", "mono-green", "colorless",
  "azorius", "dimir", "rakdos", "gruul", "selesnya", "orzhov", "izzet", "golgari",
  "boros", "simic", "esper", "grixis", "jund", "naya", "bant", "abzan", "jeskai",
  "sultai", "mardu", "temur", "yore-tiller", "glint-eye", "dune-brood",
  "ink-treader", "witch-maw", "five-color",
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** EDHREC is one site serving a static JSON blob per page and is not an API
 * anyone promised us — one request a second, sequentially, is the polite
 * reading of that. The whole run is ~32 requests. */
const EDHREC_INTERVAL_MS = 1000;
/** Scryfall asks for ~10 req/sec; this only sends a handful of batches. */
const SCRYFALL_INTERVAL_MS = 150;

async function getJson(url, { attempts = 3 } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (res.ok) return res.json();
    // 429/5xx are worth another go; a 403/404 is an answer, not a hiccup.
    if (res.status !== 429 && res.status < 500) {
      throw new Error(`${url} -> ${res.status} ${res.statusText}`);
    }
    if (attempt === attempts) throw new Error(`${url} -> ${res.status} after ${attempts} tries`);
    await delay(attempt * 1500);
  }
  throw new Error("unreachable");
}

/** The commanders EDHREC lists for one colour identity, with the deck count
 * that is the whole reason for this script. */
async function fetchIdentity(identity) {
  const page = await getJson(`https://json.edhrec.com/pages/commanders/${identity}.json`);
  const lists = page?.container?.json_dict?.cardlists ?? [];
  const out = [];
  for (const list of lists) {
    for (const card of list.cardviews ?? []) {
      if (typeof card?.name !== "string") continue;
      const decks = Number(card.num_decks ?? 0);
      if (!Number.isFinite(decks) || decks <= 0) continue;
      out.push({ name: card.name, decks, identity });
    }
  }
  return out;
}

/** Scryfall's record for each name, for the cost and type line the list
 * prints — and as the check that a name EDHREC gave us is a real card. */
async function fetchScryfall(names) {
  const byName = new Map();
  for (let i = 0; i < names.length; i += 75) {
    const batch = names.slice(i, i + 75);
    const res = await fetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifiers: batch.map((name) => ({ name })) }),
    });
    if (!res.ok) throw new Error(`Scryfall collection -> ${res.status}`);
    const body = await res.json();
    for (const card of body.data ?? []) {
      // Indexed under its own name and, for a multi-face card, the
      // single-slash spelling a decklist and EDHREC both use.
      byName.set(card.name, card);
      if (card.name.includes(" // ")) byName.set(card.name.replace(" // ", " // "), card);
      for (const face of card.card_faces ?? []) byName.set(face.name, card);
    }
    process.stderr.write(`  scryfall ${Math.min(i + 75, names.length)}/${names.length}\r`);
    await delay(SCRYFALL_INTERVAL_MS);
  }
  process.stderr.write("\n");
  return byName;
}

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
    for (const face of def.faces ?? []) names.add(face);
  }
  return names;
}

const nameOfLine = (line) => line.slice(4).replace(/^\s*[\d,]+\s+/, "").split(/\s{2,}/)[0]?.trim();

/** Re-mark an existing file against the pool as it stands, touching no
 * network — what you want after authoring, so the ranking snapshot (and its
 * correspondence with the backlog doc) stays put. */
async function refresh(out) {
  const implemented = await loadImplementedNames();
  const lines = readFileSync(out, "utf8").split("\n");
  let marked = 0;
  const next = lines.map((line) => {
    if (!/^\[[ x]\] /.test(line)) return line;
    const name = nameOfLine(line);
    const has = implemented.has(name) || implemented.has(name?.split(" // ")[0] ?? "");
    if (has) marked += 1;
    return `[${has ? "x" : " "}]${line.slice(3)}`;
  });
  const total = lines.filter((l) => /^\[[ x]\] /.test(l)).length;
  // The summary line too, as `top-commander-cards.mjs --refresh` does —
  // otherwise it keeps the count from the day the ranking was fetched.
  const summary = next.findIndex((l) => / already implemented \/ /.test(l));
  if (summary >= 0) next[summary] = `${marked} already implemented / ${total - marked} missing`;
  writeFileSync(out, next.join("\n"));
  console.error(`Re-marked ${out}: ${marked}/${total} implemented.`);
}

function parseArgs(argv) {
  const opts = { count: 500, out: DEFAULT_OUT, refresh: false, cacheJson: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--count") opts.count = Number(argv[++i]);
    else if (arg === "--out") opts.out = argv[++i];
    else if (arg === "--refresh") opts.refresh = true;
    else if (arg === "--cache-json") opts.cacheJson = argv[++i];
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.refresh) return refresh(opts.out);
  if (!Number.isFinite(opts.count) || opts.count <= 0) {
    console.error("--count must be a positive number");
    process.exit(1);
  }

  const all = new Map();
  for (const identity of IDENTITIES) {
    const rows = await fetchIdentity(identity);
    for (const row of rows) {
      // A partner can be listed under more than one identity; the larger
      // count is the one that answers "how often is this someone's commander".
      const seen = all.get(row.name);
      if (seen === undefined || row.decks > seen.decks) all.set(row.name, row);
    }
    process.stderr.write(`  ${identity}: ${rows.length} (${all.size} total)\n`);
    await delay(EDHREC_INTERVAL_MS);
  }

  // EDHREC files a **partner pair** under one joined name ("Kraum, Ludevic's
  // Opus // Tymna the Weaver"), spelled exactly like a double-faced card. The
  // two cases have to be told apart before ranking, and only Scryfall can do
  // it: a DFC resolves as one card, a pair resolves as nothing. A pair isn't
  // a card anyone can author, so its decks are credited to each half — which
  // is what "how many decks run this as their commander" means for a partner.
  const joined = [...all.keys()].filter((name) => name.includes(" // "));
  if (joined.length > 0) {
    process.stderr.write(`resolving ${joined.length} joined name(s)\n`);
    const known = await fetchScryfall(joined);
    for (const name of joined) {
      if (known.has(name)) continue; // a real double-faced card — leave it
      const entry = all.get(name);
      all.delete(name);
      for (const half of name.split(" // ").map((s) => s.trim())) {
        const seen = all.get(half);
        if (seen === undefined) all.set(half, { ...entry, name: half });
        else seen.decks += entry.decks;
      }
    }
  }

  const ranked = [...all.values()].sort(
    (a, b) => b.decks - a.decks || a.name.localeCompare(b.name),
  );
  const top = ranked.slice(0, opts.count);
  console.error(`${all.size} commanders collected; taking the top ${top.length}.`);

  const scryfall = await fetchScryfall(top.map((c) => c.name));
  const implemented = await loadImplementedNames();

  const missingFromScryfall = [];
  let have = 0;
  const lines = top.map((entry, i) => {
    const card = scryfall.get(entry.name) ?? scryfall.get(entry.name.split(" // ")[0]);
    if (card === undefined) missingFromScryfall.push(entry.name);
    const has =
      implemented.has(entry.name) || implemented.has(entry.name.split(" // ")[0]);
    if (has) have += 1;
    const cost = card?.mana_cost ?? card?.card_faces?.[0]?.mana_cost ?? "";
    const type = card?.type_line ?? "";
    return (
      `[${has ? "x" : " "}] ${String(i + 1).padStart(4)}  ` +
      `${entry.name.padEnd(44)} ${String(entry.decks).padStart(7)} decks  ` +
      `${cost.padEnd(16)} ${type}`
    );
  });

  const header = [
    `Top ${top.length} Commander *commanders* by EDHREC deck count (fetched ${new Date()
      .toISOString()
      .slice(0, 10)})`,
    `${have} already implemented / ${top.length - have} missing`,
    "Ranked by how many decks run the card AS THEIR COMMANDER (EDHREC num_decks) —",
    "not by how often it is played across Commander decks, which is what",
    "top-commander-cards.txt ranks and which badly misorders commanders.",
    "Legend: [x] name already exists in cards/pool/   [ ] not yet authored",
    "",
  ].join("\n");

  writeFileSync(opts.out, `${header}${lines.join("\n")}\n`);
  if (opts.cacheJson !== null) {
    writeFileSync(
      opts.cacheJson,
      JSON.stringify(top.map((e) => ({ ...e, scryfall: scryfall.get(e.name) ?? null }))),
    );
  }
  console.error(`Wrote ${opts.out}`);
  console.error(`${have}/${top.length} already implemented.`);
  if (missingFromScryfall.length > 0) {
    console.error(
      `${missingFromScryfall.length} name(s) Scryfall didn't match: ${missingFromScryfall
        .slice(0, 8)
        .join(", ")}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
