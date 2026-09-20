// Regenerates `src/cards/edhrec-rank.ts` — how popular each pool card is in
// Commander, as EDHREC's rank (1 = most played).
//
//   npm run gen:edhrec-rank -w engine
//
// The output is checked in, so nothing needs the network at runtime. Rerun it
// when the pool grows, or occasionally to refresh the ranking itself.
//
// Two consumers, which is why it's a table rather than a field on each card:
//
//  - The **card library** sorts by it, so the gallery opens on the cards people
//    actually play instead of alphabetically on whatever starts with "A".
//  - The **authoring backlog** is ordered by it. `top-commander-cards.txt` is a
//    frozen snapshot of the same data; this table is the live version, and the
//    two should agree where they overlap.
//
// Scryfall returns `edhrec_rank` on every card, so this costs one batched
// request per 75 names rather than a scrape. A card with no rank (never played
// in Commander, or too new to have one) is simply left out of the table —
// absent means "unranked", and consumers sort those last.

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { POOL_CARDS } from "../dist/cards/generated.js";
import { isDeckableCard } from "../dist/cards/classify.js";

const USER_AGENT = "MTG-Engine-CardAuthoring/1.0";
const COLLECTION_BATCH_SIZE = 75;
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "src", "cards", "edhrec-rank.ts");

/** Front faces of real cards only: a token has no EDHREC rank, and a DFC is
 * ranked under the name a decklist uses. */
const names = [
  ...new Set(POOL_CARDS.filter(isDeckableCard).map((def) => def.name)),
].sort((a, b) => a.localeCompare(b));

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const ranks = new Map();
let missing = 0;
const batches = chunk(names, COLLECTION_BATCH_SIZE);

for (const [i, batch] of batches.entries()) {
  const res = await fetch("https://api.scryfall.com/cards/collection", {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ identifiers: batch.map((name) => ({ name })) }),
  });
  if (!res.ok) {
    console.error(`Scryfall collection request failed: ${res.status}`);
    process.exit(1);
  }
  const body = await res.json();
  for (const card of body.data ?? []) {
    // Responses carry no echo of which identifier produced which card, so
    // they're matched back by name — the same approach `import-deck.ts` uses.
    // A card's own name, and for a DFC the front-face name a decklist writes.
    const rank = card.edhrec_rank;
    if (typeof rank !== "number") continue;
    ranks.set(card.name, rank);
    const front = card.card_faces?.[0]?.name;
    if (front !== undefined && !ranks.has(front)) ranks.set(front, rank);
    if (card.name.includes(" // ")) {
      const single = card.name.split(" // ")[0];
      if (!ranks.has(single)) ranks.set(single, rank);
    }
  }
  missing += (body.not_found ?? []).length;
  process.stderr.write(`  batch ${i + 1}/${batches.length}, ${ranks.size} ranked\n`);
  // Scryfall asks for 50-100ms between requests.
  await new Promise((resolve) => setTimeout(resolve, 120));
}

const ranked = names.filter((name) => ranks.has(name));
const body = ranked
  .map((name) => `  ${JSON.stringify(name)}: ${ranks.get(name)},`)
  .join("\n");

writeFileSync(
  out,
  `/**
 * How popular each pool card is in Commander, as an EDHREC rank (1 = most
 * played). **Generated** — run \`npm run gen:edhrec-rank -w engine\`; do not
 * edit by hand.
 *
 * A card missing from this table is unranked rather than unpopular: EDHREC has
 * no entry for it, which is normal for a very new card and universal for
 * tokens. {@link edhrecRankOf} reports those as \`null\` and every consumer
 * sorts them last.
 */

export const EDHREC_RANK: Readonly<Record<string, number>> = {
${body}
};

/** This card's Commander popularity, or \`null\` when EDHREC doesn't rank it. */
export const edhrecRankOf = (cardName: string): number | null =>
  EDHREC_RANK[cardName] ?? null;
`,
  "utf8",
);

console.log(
  `wrote ${out}: ${ranked.length} of ${names.length} pool cards ranked` +
    (missing > 0 ? `, ${missing} not found on Scryfall` : ""),
);
