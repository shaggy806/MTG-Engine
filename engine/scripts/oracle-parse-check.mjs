#!/usr/bin/env node
// Measures the Oracle parser (`oracle-parse.mjs`) against ground truth: every
// hand-authored card in the pool. For each pool card it parses the card's
// Oracle text from the snapshot, and wherever the parser claims an ability is
// complete it compares that ability with the authored one — cost, trigger,
// targets, restrictions and effect. A disagreement is a parser bug (or, now
// and then, an authoring choice worth a look); the report lists them.
//
// Usage: npm run card:parse-check -w engine [-- --all]   (--all lists every mismatch)

import { pathToFileURL } from "node:url";

import { parseFace } from "./oracle-parse.mjs";
import { findCard } from "./oracle-snapshot.mjs";

const showAll = process.argv.includes("--all");

/** Comparable form: no text, no resolve hatch, no undefined keys, and a
 * token name wildcarded (the parser can only guess which token file). */
function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v === null || typeof v !== "object") return v;
  // Equivalent spellings of one thing, all written one way:
  // a permanent target filtered to a single type is that type's literal.
  if (v.kind === "permanent" && (v.whose === undefined || v.whose === "any") && v.filter !== undefined) {
    const keys = Object.keys(v.filter);
    if (keys.length === 1 && keys[0] === "type" && ["creature", "artifact", "enchantment", "land", "permanent"].includes(v.filter.type)) {
      return v.filter.type;
    }
  }
  const out = {};
  for (const [k, val] of Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) {
    if (val === undefined || k === "text" || k === "resolve" || k.startsWith("__")) continue;
    if (k === "token" && v.kind === "create-token") continue;
    if (k === "prompt" && v.kind === "may") continue;
    // `who: "you"` is the default for life, draws and the like.
    if (k === "who" && val === "you" && ["gain-life", "lose-life", "draw"].includes(v.kind)) continue;
    // A `{0}` mana cost is no mana cost (Equip {0}).
    if (k === "mana" && (val === "{0}" || val === null)) continue;
    // "Sacrifice a creature" either way.
    if (k === "sacrifice" && val === "creature-you-control") {
      out[k] = { filter: { type: "creature" } };
      continue;
    }
    out[k] = canon(val);
  }
  return out;
}
/** A trigger written two equivalent ways: `who: "you"` plus a
 * `controlledBy: "you"` filter is `who: "you-control"`. */
function canonTrigger(t) {
  if (t === null || typeof t !== "object" || t.on === undefined) return t;
  // A spell never triggers its own battlefield ability as it's cast (checked:
  // casting Gev, a Lizard, doesn't fire his "whenever you cast a Lizard
  // spell"), so a cast trigger's `otherOnly` changes nothing.
  if (t.on === "cast-spell" && t.otherOnly === true) {
    const { otherOnly: _o, ...rest } = t;
    t = rest;
  }
  if ((t.who !== "you" && t.who !== "any") || t.filter?.controlledBy !== "you") return t;
  const { controlledBy: _drop, ...filter } = t.filter;
  return { ...t, who: "you-control", filter };
}
const same = (a, b) => JSON.stringify(canon(canonTrigger(a))) === JSON.stringify(canon(canonTrigger(b)));

/** "Add {B} or {R}" parsed as one ability with a choice, authored
 * (equivalently) as one ability per colour. */
function manaSplit(parsed, authored) {
  return (
    parsed?.kind === "add-mana" && typeof parsed.mana === "object" && authored?.kind === "add-mana" &&
    typeof authored.mana === "string" && parsed.mana.oneOf?.includes(authored.mana) === true
  );
}
const tidy = (s) =>
  s
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/[^a-z0-9{}+/-]+/g, " ")
    .trim();

/**
 * Every ability the parser claims complete, compared with the authored one.
 * `poolCards` is the pool's definitions (`POOL_CARDS`); `tokenNames` any token
 * name, since which token file a "create" means is wildcarded.
 */
export function checkPool(poolCards, tokenName = "Treasure Token") {
  const tokenFor = () => tokenName;
  const stats = { cards: 0, abilities: 0, claimed: 0, agreed: 0, keywordCards: 0, keywordAgreed: 0 };
  const mismatches = [];

  for (const def of poolCards) {
    const entry = findCard(def.name);
    if (entry === undefined) continue;
    const face = (entry.faces ?? [entry]).find((f) => f.name === def.name);
    if (face === undefined) continue;
    stats.cards += 1;
    const parsed = parseFace(face, { tokenFor });

    stats.keywordCards += 1;
    if ([...parsed.keywords].sort().join() === [...def.keywords].filter((k) => k !== "unblockable").sort().join()) {
      stats.keywordAgreed += 1;
    }

    for (const kind of ["activated", "triggered"]) {
      const authored = def[kind];
      // Each authored ability pairs with one parsed ability at most: "enters or
      // attacks" is two abilities with the same text.
      const used = new Set();
      for (const p of parsed[kind]) {
        stats.abilities += 1;
        if (p.effect === null || p.__todo !== undefined) continue;
        stats.claimed += 1;
        // The authored ability this one is: the same printed text and the same
        // trigger event, else the one at the same position.
        const index = parsed[kind].indexOf(p);
        const match =
          authored.find(
            (a) => !used.has(a) && tidy(a.text) === tidy(p.text) && (kind === "activated" || a.trigger?.on === p.trigger?.on),
          ) ??
          authored.find((a) => !used.has(a) && tidy(a.text) === tidy(p.text)) ??
          authored[index];
        if (match !== undefined) used.add(match);
        if (match === undefined) {
          mismatches.push({ card: def.name, kind, text: p.text, why: "no authored ability to compare" });
          continue;
        }
        if (match.resolve !== null) {
          stats.claimed -= 1;
          continue;
        }
        const fields = kind === "activated"
          ? ["cost", "targets", "effect", "sorcerySpeed", "oncePerTurn", "loyaltyCost", "zone", "otherOnly", "condition"]
          : ["trigger", "targets", "effect", "oncePerTurn"];
        let differ = fields.filter((f) => !same(p[f] ?? null, match[f] ?? null) && !(f === "sorcerySpeed" && !p[f] && !match[f]));
        if (differ.length === 1 && differ[0] === "effect" && manaSplit(p.effect, match.effect)) differ = [];
        if (differ.length === 0) stats.agreed += 1;
        else mismatches.push({ card: def.name, kind, text: p.text, differ, parsed: canon(p), authored: canon(match) });
      }
    }
  }

  return { stats, mismatches };
}

const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { POOL_CARDS } = await import("../dist/cards/generated.js");
  const { stats, mismatches } = checkPool(POOL_CARDS);
  const pct = (a, b) => `${a}/${b} (${b ? ((100 * a) / b).toFixed(1) : 0}%)`;
  console.log(`${stats.cards} pool cards with a snapshot entry`);
  console.log(`keywords agree on ${pct(stats.keywordAgreed, stats.keywordCards)} of cards`);
  console.log(`abilities found: ${stats.abilities}; parser claims ${stats.claimed} complete; ${pct(stats.agreed, stats.claimed)} agree with the authored ability`);
  console.log(`\n${mismatches.length} disagreement(s)${showAll ? "" : " — the first 30 (--all for every one)"}:`);
  for (const m of showAll ? mismatches : mismatches.slice(0, 30)) {
    console.log(`\n• ${m.card} — ${m.kind}: ${m.text}`);
    if (m.why) console.log(`    ${m.why}`);
    else {
      for (const f of m.differ) {
        console.log(`    ${f}: parsed   ${JSON.stringify(m.parsed[f] ?? null)}`);
        console.log(`    ${" ".repeat(f.length)}  authored ${JSON.stringify(m.authored[f] ?? null)}`);
      }
    }
  }

}