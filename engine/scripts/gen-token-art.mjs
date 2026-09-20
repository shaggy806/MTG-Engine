// Finds a real Scryfall printing for every token in `cards/tokens/`.
//
//   npm run token:art -w engine            # report what's missing and what fits
//   npm run token:art -w engine -- --write # patch the token files in place
//
// ## Why tokens need this when cards don't
//
// A card resolves its art by name. A token can't: ours are named for what the
// engine keys them by ("3/3 Beast Token"), and Scryfall names token printings
// after the creature alone ("Beast"), with dozens of unrelated printings under
// that one name. So `CardImage` skips the lookup for a token with no `art` and
// draws a text panel instead — which is why tokens render hit-or-miss, with
// exactly the ones that pin a printing showing a picture.
//
// ## How the link is made
//
// Scryfall puts a card's associated tokens in `all_parts`, which is the same
// data the website shows as "Tokens" on a card page. The engine already knows
// which card creates which token, from the `create-token` effects in the pool.
// Put together, that's a path from our token name to a real printing id:
//
//   "3/3 Beast Token"  ->  created by Beast Within, Garruk Wildspeaker, ...
//                      ->  their `all_parts` token entries
//                      ->  the one that is a 3/3 green Beast
//
// The last step matters: a card can make several different tokens, so the
// candidate is matched on power, toughness, colours and subtypes rather than
// trusted because it was the only thing listed. A token that matches more than
// one candidate, or none, is reported rather than guessed at.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { POOL_CARDS, TOKEN_CARDS } from "../dist/cards/generated.js";

const USER_AGENT = "MTG-Engine-CardAuthoring/1.0";
const here = dirname(fileURLToPath(import.meta.url));
const tokensDir = join(here, "..", "src", "cards", "tokens");
const write = process.argv.includes("--write");

/**
 * token name -> the file that defines it, read from the files themselves.
 *
 * Deriving it from the name looked obvious and is wrong: `phyrexian-wurm-
 * deathtouch.ts` defines "Phyrexian Wurm Token (Deathtouch)", so a slug of the
 * name points at a file that doesn't exist and the patch is skipped in
 * silence.
 */
const fileByTokenName = new Map();
for (const entry of readdirSync(tokensDir)) {
  if (!entry.endsWith(".ts")) continue;
  const src = readFileSync(join(tokensDir, entry), "utf8");
  const found = /\n\s*name:\s*"((?:[^"\\]|\\.)*)"/.exec(src);
  if (found !== null) fileByTokenName.set(found[1], entry);
}

/** Every `create-token` name reachable from an effect tree. */
function walkEffect(effect, onToken) {
  if (effect === null || effect === undefined || typeof effect !== "object") return;
  if (effect.kind === "create-token" && typeof effect.token === "string") onToken(effect.token);
  for (const key of ["effects", "modes"]) {
    if (Array.isArray(effect[key])) {
      for (const entry of effect[key]) walkEffect(entry?.effect ?? entry, onToken);
    }
  }
  for (const key of ["then", "else", "effect"]) walkEffect(effect[key], onToken);
}

/** token name -> the pool cards that create it. */
const creators = new Map();
for (const def of POOL_CARDS) {
  const add = (token) => {
    if (!creators.has(token)) creators.set(token, []);
    if (!creators.get(token).includes(def.name)) creators.get(token).push(def.name);
  };
  walkEffect(def.effect, add);
  for (const ability of def.activated ?? []) walkEffect(ability.effect, add);
  for (const ability of def.triggered ?? []) walkEffect(ability.effect, add);
  for (const chapter of def.chapters ?? []) walkEffect(chapter.effect, add);
  for (const mode of def.castModal?.modes ?? []) walkEffect(mode.effect, add);
  // A token can be created by an ability a static *grants* to something else
  // (Presence of Gond gives the enchanted creature a token-making tap
  // ability), which is invisible to a scan of the card's own abilities.
  for (const stat of def.static ?? []) {
    for (const ability of stat.grantsActivated ?? []) walkEffect(ability.effect, add);
    for (const ability of stat.grantsTriggered ?? []) walkEffect(ability.effect, add);
  }
  if (def.kicker?.effect) walkEffect(def.kicker.effect, add);
  if (def.overload?.effect) walkEffect(def.overload.effect, add);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function collection(identifiers) {
  const out = [];
  for (let i = 0; i < identifiers.length; i += 75) {
    const res = await fetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifiers: identifiers.slice(i, i + 75) }),
    });
    if (!res.ok) throw new Error(`Scryfall collection failed: ${res.status}`);
    const body = await res.json();
    out.push(...(body.data ?? []));
    await sleep(120);
  }
  return out;
}

const missing = TOKEN_CARDS.filter((t) => !t.art);
if (missing.length === 0) {
  console.log("every token already pins a printing");
  process.exit(0);
}

// One batch for every card that creates an art-less token.
const creatorNames = [
  ...new Set(missing.flatMap((t) => creators.get(t.name) ?? [])),
];
process.stderr.write(`looking up ${creatorNames.length} token-making cards\n`);
const cards = await collection(creatorNames.map((name) => ({ name })));
const cardByName = new Map(cards.map((c) => [c.name, c]));

// Every token id any of them lists, fetched once.
const tokenIds = new Set();
for (const card of cards) {
  for (const part of card.all_parts ?? []) {
    if (part.component === "token") tokenIds.add(part.id);
  }
}
process.stderr.write(`resolving ${tokenIds.size} associated token printings\n`);
const printings = await collection([...tokenIds].map((id) => ({ id })));
const printingById = new Map(printings.map((p) => [p.id, p]));

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const subtypesOf = (typeLine) => {
  const dash = typeLine.split(/—|--/)[1];
  return dash === undefined ? [] : dash.trim().split(/\s+/);
};

/**
 * Does this Scryfall printing actually depict our token?
 *
 * Returns `"exact"`, `"loose"` (everything agrees but the printing carries
 * fewer subtypes than we do), or `null`.
 *
 * The loose tier exists for a real and recurring case rather than as a
 * fudge: our definitions follow current Oracle text, while a token *printing*
 * is a physical card that may predate an erratum. Wurmcoil Engine now makes a
 * "Phyrexian Wurm", but the card in the box says "Wurm", and Scryfall is
 * describing the card in the box. P/T, colours and creature-ness must still
 * match exactly, and loose matches are reported separately so they can be
 * eyeballed rather than trusted silently.
 */
function matches(def, printing) {
  if (!sameSet([...def.colors], printing.colors ?? [])) return null;
  const isCreature = def.types.includes("creature");
  if (isCreature !== (printing.type_line ?? "").includes("Creature")) return null;
  if (isCreature) {
    if (String(def.power) !== printing.power) return null;
    if (String(def.toughness) !== printing.toughness) return null;
  }
  const theirs = subtypesOf(printing.type_line ?? "").map((s) => s.toLowerCase());
  const ours = [...def.subtypes].map((s) => s.toLowerCase());
  if (ours.length === 0) return theirs.length === 0 ? "exact" : null;
  if (sameSet(ours, theirs)) return "exact";
  return theirs.length > 0 && theirs.every((t) => ours.includes(t)) ? "loose" : null;
}

let resolved = 0;
const unresolved = [];
for (const def of missing) {
  const madeBy = creators.get(def.name) ?? [];
  /**
   * Four buckets, best first. Keywords **rank** rather than filter: a token's
   * printed abilities and ours can legitimately differ in both directions.
   * Wurmcoil Engine's two Wurms are identical but for deathtouch vs lifelink,
   * so keywords are the only thing that tells them apart — but Chandra,
   * Acolyte of Flame's Elemental is a vanilla 1/1 whose haste comes from the
   * spell, so demanding a keyword match would reject its only real printing.
   */
  const buckets = { exactKw: new Map(), exact: new Map(), looseKw: new Map(), loose: new Map() };
  const ourKeywords = [...(def.keywords ?? [])].map((k) => k.toLowerCase().replace(/-/g, " "));
  for (const cardName of madeBy) {
    for (const part of cardByName.get(cardName)?.all_parts ?? []) {
      if (part.component !== "token") continue;
      const printing = printingById.get(part.id);
      if (printing === undefined) continue;
      const tier = matches(def, printing);
      if (tier === null) continue;
      const kw = sameSet(ourKeywords, (printing.keywords ?? []).map((k) => k.toLowerCase()));
      buckets[tier === "exact" ? (kw ? "exactKw" : "exact") : kw ? "looseKw" : "loose"].set(
        printing.id,
        printing,
      );
    }
  }
  const picked =
    ["exactKw", "exact", "looseKw", "loose"].find((b) => buckets[b].size > 0) ?? null;
  const candidates = picked === null ? new Map() : buckets[picked];
  const tier =
    picked === "looseKw" || picked === "loose" ? "  [subtypes differ — check the art]" : "";
  if (candidates.size === 0) {
    unresolved.push({ def, why: madeBy.length === 0 ? "no pool card creates it" : "no printing matched" });
    continue;
  }
  const [id, printing] = [...candidates][0];
  console.log(
    `  ${def.name.padEnd(28)} -> ${printing.name} (${printing.set}) ${id}` +
      (candidates.size > 1 ? `  [${candidates.size} matched, took the first]` : "") + tier,
  );
  resolved += 1;
  if (!write) continue;

  // Insert `art` right after `name`, which is where every hand-authored token
  // puts it.
  const fileName = fileByTokenName.get(def.name);
  if (fileName === undefined) {
    unresolved.push({ def, why: "no file in cards/tokens/ defines this name" });
    continue;
  }
  const file = join(tokensDir, fileName);
  const src = readFileSync(file, "utf8");
  if (/^\s*art:/m.test(src)) continue;
  const patched = src.replace(
    /(\n(\s*)name:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'),)/,
    `$1\n$2art: "${id}",`,
  );
  if (patched === src) {
    unresolved.push({ def, why: "could not place `art` in the file" });
    continue;
  }
  writeFileSync(file, patched, "utf8");
}


console.log(
  `\n${resolved}/${missing.length} art-less tokens matched a printing` +
    (write ? " (files patched)" : " — rerun with --write to patch"),
);
for (const { def, why } of unresolved) console.log(`  UNRESOLVED  ${def.name}: ${why}`);
