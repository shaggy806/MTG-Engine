#!/usr/bin/env node
// Scans a card cache produced by `top-commander-cards.mjs --cache-json ...`
// and flags cards that look mechanically risky for this engine — using a
// keyword-abilities/layout allowlist (built from what `cards/define.ts` and
// CLAUDE.md's "Not modeled" section actually support) plus a handful of
// oracle-text regexes for structural gaps that don't show up as a Scryfall
// keyword (multi-destination tutors, divided damage, phasing, etc).
//
// This is a heuristic screen, not a rules oracle: it flags candidates for a
// human to sanity-check before authoring, not a verdict. False positives
// (a flagged card that's actually fine) are expected and fine; the goal is
// to not silently miss a card that needs an engine feature that doesn't
// exist yet.
//
// Usage:
//   node scripts/flag-problematic-cards.mjs <cache.json> [--out path]

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Scryfall `keywords` tags this engine already has real support for (see
// cards/define.ts's Keyword union, cards/AUTHORING.md §5-6, and the
// implemented-mechanics list in CLAUDE.md). Anything else Scryfall tags a
// card with is a candidate the engine likely can't express yet.
const SUPPORTED_KEYWORDS = new Set(
  [
    "Flying", "Reach", "Haste", "Vigilance", "Defender", "First strike",
    "Double strike", "Trample", "Deathtouch", "Lifelink", "Menace",
    "Indestructible", "Hexproof", "Shroud", "Flash", "Daybound", "Nightbound",
    "Ward", "Flashback", "Kicker", "Cycling", "Scry", "Surveil",
    "Proliferate", "Storm", "Cascade", "Suspend", "Foretell", "Escape",
    "Disturb", "Adventure", "Transform", "Fight", "Equip", "Enchant",
    "Protection", "Exalted", "Landfall", "Ferocious", "Metalcraft",
    "Threshold", "Mill", "Prowess", "Treasure", "Food", "Clue", "Regenerate",
    // Ability words that are just flavor names for a trigger/static shape the
    // engine already has generic vocab for (a filtered enters-battlefield
    // trigger, an OR-of-two-players static condition, etc) — not a distinct
    // mechanic. Partner is an implemented Commander feature outright.
    "Partner", "Affinity", "Constellation",
  ].map((k) => k.toLowerCase()),
);

// Layouts this engine's alt-cast/multi-face machinery actually models
// (transform, MDFC, adventure, saga-as-normal-face). Everything else
// (split/aftermath, flip, leveler, class, case, meld, battle, ...) has no
// engine support at all.
const SUPPORTED_LAYOUTS = new Set(["normal", "saga", "modal_dfc", "transform", "adventure"]);

// [reason tag, regex, note] — oracle-text heuristics for gaps that don't
// surface as a Scryfall keyword. Matched against the combined oracle text of
// all faces.
const TEXT_HEURISTICS = [
  [
    "multi-destination-tutor",
    /search your library for [^.]*card[^.]*put (it|one) onto the battlefield[^.]*(put|then put)[^.]*(into your hand|hand)/is,
    "search that puts one card onto the battlefield AND another into hand (e.g. Cultivate) — engine tutors land in one destination",
  ],
  [
    "divided-damage",
    /divide(d|s)? .*damage.*among|damage divided as you choose/is,
    "variable-arity divided damage among any number of targets — engine's targeting is fixed-arity",
  ],
  [
    "phasing",
    /\bphas(e|es|ed|ing) (out|in)\b/i,
    "phasing (rule 702.26) is explicitly not modeled",
  ],
  [
    "dungeon-initiative",
    /venture into the dungeon|the ring tempts you|takes the initiative/i,
    "dungeons/Initiative/the Ring are explicitly not modeled",
  ],
  [
    "battle-type",
    /^Battle\b/i,
    "Battle cards are explicitly not modeled",
  ],
  [
    "background",
    /choose a background|^Background\b/i,
    "Backgrounds are explicitly not modeled",
  ],
  [
    "companion",
    /\bcompanion\b/i,
    "Companion is explicitly not modeled",
  ],
  [
    "banding",
    /\bbanding\b/i,
    "banding is explicitly not modeled",
  ],
  [
    "damage-redirect",
    /redirect(s|ed)? (that|the|any) damage|instead of dealing damage to (you|that player)/i,
    "damage redirection to a third object is explicitly not modeled",
  ],
  [
    "vehicle-crew",
    /\bcrew \d+\b/i,
    "Vehicles/crew have no engine support at all (grep found zero references)",
  ],
  [
    "snow-mana-cost",
    /\{S\}/,
    "{S} (snow mana symbol) in the cost — engine folds snow into generic mana, so it can't enforce 'must be paid with snow mana'",
  ],
  [
    "conditional-free-cast",
    /you may cast .*without paying (its|their) mana cost/i,
    "a conditional 'you may cast this without paying its mana cost' free-cast permission — not the same as the engine's one-shot cascade/suspend free-cast core",
  ],
  [
    "text-change-broad",
    /(all creature types|its name becomes|loses all abilities and.*text)/i,
    "text-change beyond a single creature-type word is explicitly not modeled",
  ],
  [
    "legend-rule-choice",
    /you choose which one (leaves|remains|stays)/i,
    "a player choice on which legendary permanent the legend rule keeps — engine deterministically keeps the oldest",
  ],
];

function combinedOracleText(card) {
  const parts = [card.oracle_text ?? ""];
  for (const face of card.card_faces ?? []) parts.push(face.oracle_text ?? "");
  return parts.join("\n");
}

function combinedTypeLine(card) {
  const parts = [card.type_line ?? ""];
  for (const face of card.card_faces ?? []) parts.push(face.type_line ?? "");
  return parts.join(" // ");
}

function flagCard(card) {
  const reasons = [];

  for (const kw of card.keywords ?? []) {
    if (!SUPPORTED_KEYWORDS.has(kw.toLowerCase())) {
      reasons.push(`keyword:${kw}`);
    }
  }

  if (!SUPPORTED_LAYOUTS.has(card.layout)) {
    reasons.push(`layout:${card.layout}`);
  }

  const text = combinedOracleText(card);
  const typeLine = combinedTypeLine(card);
  for (const [tag, regex, note] of TEXT_HEURISTICS) {
    if (regex.test(text) || regex.test(typeLine)) {
      reasons.push(`${tag}`);
    }
  }

  return reasons;
}

function main() {
  const args = process.argv.slice(2);
  const cachePath = args[0];
  if (!cachePath || cachePath.startsWith("--")) {
    console.error("Usage: node scripts/flag-problematic-cards.mjs <cache.json> [--out path]");
    process.exit(1);
  }
  let outPath = null;
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--out") outPath = args[++i];
  }

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  outPath ??= path.join(__dirname, "..", "src", "cards", "top-commander-cards-flagged.txt");

  const cards = JSON.parse(readFileSync(cachePath, "utf8"));

  const noteByTag = new Map(TEXT_HEURISTICS.map(([tag, , note]) => [tag, note]));

  const flagged = [];
  const reasonCounts = new Map();
  for (const card of cards) {
    if (card.implemented) continue; // already in the pool — moot
    const reasons = flagCard(card);
    if (reasons.length === 0) continue;
    flagged.push({ card, reasons });
    for (const r of reasons) {
      const tag = r.split(":")[0];
      reasonCounts.set(tag, (reasonCounts.get(tag) ?? 0) + 1);
    }
  }

  flagged.sort((a, b) => (a.card.edhrec_rank ?? 1e9) - (b.card.edhrec_rank ?? 1e9));

  const lines = [];
  lines.push(`Cards flagged as mechanically risky for this engine (${flagged.length}/${cards.length} scanned)`);
  lines.push("This is a heuristic screen, not a verdict — sanity-check before skipping a card.");
  lines.push("");
  lines.push("Reason-tag summary:");
  for (const [tag, count] of [...reasonCounts.entries()].sort((a, b) => b[1] - a[1])) {
    const note = noteByTag.get(tag);
    lines.push(`  ${String(count).padStart(4)}  ${tag}${note ? ` — ${note}` : ""}`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const { card, reasons } of flagged) {
    const rank = String(card.edhrec_rank ?? "?").padStart(5);
    lines.push(`${rank}  ${card.name}`);
    lines.push(`       ${combinedTypeLine(card)}`);
    lines.push(`       reasons: ${reasons.join(", ")}`);
    lines.push("");
  }

  writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
  console.error(`Flagged ${flagged.length}/${cards.length} not-yet-implemented cards.`);
  console.error(`Wrote ${outPath}`);
}

main();
