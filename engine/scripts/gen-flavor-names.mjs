// Regenerates `src/cards/flavor-names.ts` — the alternate names cards are
// printed under (Scryfall's `flavor_name`: Final Fantasy's "Princess Sarah"
// for Azusa, Lost but Seeking, Universes Within and Secret Lair crossovers),
// each mapped to the name the card has in the pool.
//
//   npm run gen:flavor-names -w engine
//
// The output is checked in, so nothing needs the network at runtime. Rerun it
// when a set with flavor names comes out.
//
// Two consumers: the **decklist importer** (`server/src/import-deck.ts`)
// reads a pasted "1 Princess Sarah" as Azusa, and **card search** (the
// library and the deck builder) finds Azusa by "Princess Sarah".
//
// Scryfall's `has:flavorname` search lists every printing with one — a few
// pages, not a bulk download. A flavor name on a face (a Secret Lair
// reversible card, Edgar's "Dracula the Voyager") counts too. Each maps to the
// card's name as the pool registers it, read through its Oracle id in the
// offline snapshot (`data/oracle/cards.jsonl`): a split card's full
// "A // B", any other multi-face card's front face. Only Commander-legal (or
// banned) cards: the snapshot holds no others.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "../src/cards/flavor-names.ts");
const HEADERS = { "User-Agent": "MTG-Engine-CardAuthoring/1.0", Accept: "application/json" };

/** Oracle id → the name the pool gives the card. */
const poolNameById = new Map();
/** Every card and face name, lowercased: a flavor name that is also a real
 * card's name means that card, never the one it's printed on. */
const realNames = new Set();
for (const line of readFileSync(join(here, "../data/oracle/cards.jsonl"), "utf8").split("\n")) {
  if (line.trim() === "") continue;
  const card = JSON.parse(line);
  if (card.commander === "token") continue;
  const name = card.layout === "split" ? card.name : card.name.split(" // ")[0];
  poolNameById.set(card.oracle_id, name);
  for (const n of [card.name, ...card.name.split(" // ")]) realNames.add(n.toLowerCase());
}

const printings = [];
let url = "https://api.scryfall.com/cards/search?q=has%3Aflavorname&unique=prints";
while (url !== null) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const page = await res.json();
  printings.push(...page.data);
  url = page.has_more ? page.next_page : null;
  await new Promise((r) => setTimeout(r, 120));
}

const aliases = new Map();
let skipped = 0;
for (const card of printings) {
  const oracleId = card.oracle_id ?? card.card_faces?.[0]?.oracle_id;
  const poolName = poolNameById.get(oracleId);
  const flavorNames = [card.flavor_name, ...(card.card_faces ?? []).map((f) => f.flavor_name)].filter(
    (n) => typeof n === "string" && n !== "",
  );
  if (poolName === undefined) {
    skipped += flavorNames.length;
    continue;
  }
  for (const flavor of flavorNames) {
    // The card's own name is no alias (a reversible card's other face).
    if (flavor === poolName || realNames.has(flavor.toLowerCase())) continue;
    const seen = aliases.get(flavor);
    if (seen !== undefined && seen !== poolName) {
      throw new Error(`"${flavor}" names both ${seen} and ${poolName}`);
    }
    aliases.set(flavor, poolName);
  }
}

const sorted = [...aliases].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
const body = sorted.map(([flavor, name]) => `  ${JSON.stringify(flavor)}: ${JSON.stringify(name)},`).join("\n");

writeFileSync(
  out,
  `/**
 * The alternate names cards are printed under (Scryfall's \`flavor_name\` —
 * Final Fantasy's "Princess Sarah" for Azusa, Lost but Seeking), each mapped
 * to the card's name in the pool. **Generated** — run
 * \`npm run gen:flavor-names -w engine\`; do not edit by hand.
 *
 * A flavor name is printed in place of the card's name and nothing else
 * changes: it's the same card (rule 201.2, the Oracle name is the card's
 * name). So a decklist or a search that uses one means the card.
 */

export const FLAVOR_NAMES: Readonly<Record<string, string>> = {
${body}
};

const BY_LOWER = new Map(Object.entries(FLAVOR_NAMES).map(([flavor, name]) => [flavor.toLowerCase(), name]));

/** The pool name a flavor name stands for, ignoring case, or \`null\` when
 * \`name\` isn't one. */
export const nameForFlavorName = (name: string): string | null =>
  BY_LOWER.get(name.trim().toLowerCase()) ?? null;

let byCard: Map<string, string[]> | null = null;

/** Every flavor name \`cardName\` (its pool name) is printed under. */
export const flavorNamesOf = (cardName: string): readonly string[] => {
  if (byCard === null) {
    byCard = new Map();
    for (const [flavor, name] of Object.entries(FLAVOR_NAMES)) {
      const list = byCard.get(name);
      if (list === undefined) byCard.set(name, [flavor]);
      else list.push(flavor);
    }
  }
  return byCard.get(cardName) ?? [];
};
`,
  "utf8",
);

console.log(
  `wrote ${out}: ${aliases.size} flavor names from ${printings.length} printings` +
    (skipped > 0 ? `, ${skipped} on cards outside the Commander snapshot` : ""),
);
