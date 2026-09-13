#!/usr/bin/env node
// Fetches a card's authoritative printed data from the Scryfall API, so a
// card gets authored from its real Oracle text/mana cost/type line instead
// of from memory. See AUTHORING.md §1 — run this before writing a new
// `cards/pool/*.ts` file, and again if a card's ruling behaviour is in
// doubt.
//
// Usage:
//   node scripts/scryfall-lookup.mjs "Card Name" ["Another Card" ...]
//   node scripts/scryfall-lookup.mjs --rulings "Card Name"
//   node scripts/scryfall-lookup.mjs --json "Card Name"   (raw Scryfall payload)

const USER_AGENT = "MTG-Engine-CardAuthoring/1.0";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Scryfall asks for at most ~10 req/sec; stay comfortably under that even
// though this script is normally called a name or two at a time.
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

async function fetchCardByName(name) {
  const res = await scryfallFetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`);
  if (res.status === 404) {
    const body = await res.json().catch(() => null);
    return { ok: false, error: body?.details ?? `not found: ${name}` };
  }
  if (!res.ok) {
    return { ok: false, error: `HTTP ${res.status} looking up "${name}"` };
  }
  return { ok: true, card: await res.json() };
}

async function fetchRulings(rulingsUri) {
  const res = await scryfallFetch(rulingsUri);
  if (!res.ok) return [];
  const body = await res.json();
  return body.data ?? [];
}

function printFace(face, indent = "") {
  const lines = [];
  if (face.mana_cost) lines.push(`${indent}Mana cost: ${face.mana_cost}`);
  lines.push(`${indent}Type line: ${face.type_line ?? ""}`);
  if (face.power !== undefined) lines.push(`${indent}P/T: ${face.power}/${face.toughness}`);
  if (face.loyalty !== undefined) lines.push(`${indent}Loyalty: ${face.loyalty}`);
  if (face.colors) lines.push(`${indent}Colors: ${face.colors.length > 0 ? face.colors.join("") : "colorless"}`);
  if (face.oracle_text) {
    lines.push(`${indent}Oracle text:`);
    for (const line of face.oracle_text.split("\n")) lines.push(`${indent}  ${line}`);
  }
  return lines;
}

function printCard(card, { rulings, json }) {
  if (json) {
    console.log(JSON.stringify(card, null, 2));
    return;
  }

  console.log(`=== ${card.name} ===`);
  console.log(`Set: ${card.set.toUpperCase()} #${card.collector_number}   Layout: ${card.layout}`);
  console.log(`Scryfall: ${card.scryfall_uri}`);
  console.log(`Color identity: ${card.color_identity.length > 0 ? card.color_identity.join("") : "colorless"}`);
  if (card.keywords?.length > 0) console.log(`Keywords: ${card.keywords.join(", ")}`);
  console.log("");

  if (card.card_faces && card.card_faces.length > 0) {
    for (const [i, face] of card.card_faces.entries()) {
      console.log(`-- Face ${i + 1}: ${face.name} --`);
      for (const line of printFace(face)) console.log(line);
      console.log("");
    }
  } else {
    for (const line of printFace(card)) console.log(line);
    console.log("");
  }

  if (card.all_parts && card.all_parts.length > 0) {
    console.log("Related parts (tokens/meld/combo pieces):");
    for (const part of card.all_parts) {
      console.log(`  - ${part.name} (${part.component})`);
    }
    console.log("");
  }

  if (rulings && card.rulings_uri) {
    console.log("(fetching rulings...)");
  }
}

async function printRulingsIfRequested(card, rulings) {
  if (!rulings || !card.rulings_uri) return;
  const entries = await fetchRulings(card.rulings_uri);
  if (entries.length === 0) {
    console.log("No rulings.");
    return;
  }
  console.log("Rulings:");
  for (const r of entries) {
    console.log(`  [${r.published_at}] ${r.comment}`);
  }
  console.log("");
}

async function main() {
  const args = process.argv.slice(2);
  const rulings = args.includes("--rulings");
  const json = args.includes("--json");
  const names = args.filter((a) => !a.startsWith("--"));

  if (names.length === 0) {
    console.error('Usage: node scripts/scryfall-lookup.mjs [--rulings] [--json] "Card Name" [...]');
    process.exitCode = 1;
    return;
  }

  let hadError = false;
  for (const name of names) {
    const result = await fetchCardByName(name);
    if (!result.ok) {
      console.error(`✗ ${name}: ${result.error}`);
      hadError = true;
      continue;
    }
    printCard(result.card, { rulings, json });
    if (!json) await printRulingsIfRequested(result.card, rulings);
  }
  if (hadError) process.exitCode = 1;
}

main();
