#!/usr/bin/env node
// What the card-definition vocabulary can say, and which cards say it —
// generated from the pool, so it can't go out of date.
//
// Two sources, joined on the term:
//
//   - **Usage**: every registered card and token definition (from `dist/`),
//     walked for its discriminators and fields. An object with a `kind` is
//     the term `kind=<value>` (an effect, a target spec, a condition, an
//     amount …); one with an `on` is `on=<value>` (a trigger); every field an
//     object carries is `<owner>.<field>`, where the owner is that `kind=`/
//     `on=` term or, for an object without one, where it sits (`static[]`,
//     `activated[].cost`); and an enum-like string value adds
//     `<owner>.<field>=<value>` (`on=step-begins.step=begin-combat`). Each
//     term keeps how many cards use it and the three smallest that do.
//   - **Declarations**: the engine sources that define the vocabulary
//     (`effects.ts`, `abilities.ts`, `target.ts`, `cards/define.ts`,
//     `replacements.ts`, `filter.ts`, `mana.ts`), read for every
//     `kind: "…"`/`on: "…"` union member and every `readonly field?:`, with
//     the doc comment above it — and `cards/AUTHORING.md`'s lines.
//
// So "is there vocabulary for X?" is one search: what's declared, what's used
// (and by which small card to copy), and what the guide says. A declared kind
// no card uses yet is listed too (`--unused`) — built, but easy to miss.
//
// Usage: node scripts/card-vocab.mjs <term> [<term> …]   search (all terms must match)
//          --examples N   example cards per usage term (default 3)
//          --unused       declared kinds and triggers no card uses
//          --list [prefix] every usage term, by cards using it

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ENGINE = path.join(here, "..");
const SOURCES = [
  "src/effects.ts",
  "src/abilities.ts",
  "src/target.ts",
  "src/cards/define.ts",
  "src/replacements.ts",
  "src/filter.ts",
  "src/mana.ts",
];
const GUIDE = "src/cards/AUTHORING.md";

// ------------------------------------------------------------------ usage

const ENUMISH = /^[a-z][a-z0-9-]{0,40}$/;
const SKIP_FIELDS = new Set(["text", "name", "prompt", "art", "flavor", "token", "tokenName", "chosen"]);

async function loadDefinitions() {
  const defs = [];
  for (const dir of ["pool", "tokens"]) {
    const abs = path.join(ENGINE, "dist/cards", dir);
    if (!existsSync(abs)) continue;
    const files = readdirSync(abs).filter((f) => f.endsWith(".js"));
    const mods = await Promise.all(files.map((f) => import(pathToFileURL(path.join(abs, f)).href)));
    mods.forEach((m, i) => {
      if (m.default && typeof m.default.name === "string") {
        defs.push({ def: m.default, file: `src/cards/${dir}/${files[i].replace(/\.js$/, ".ts")}` });
      }
    });
  }
  return defs;
}

function usageIndex(defs, perTerm) {
  const terms = new Map(); // term -> { cards: Set, examples: [{size, name, file}] }
  for (const { def, file } of defs) {
    const size = JSON.stringify(def).length;
    const seen = new Set();
    const note = (term) => {
      if (seen.has(term)) return;
      seen.add(term);
      let t = terms.get(term);
      if (t === undefined) terms.set(term, (t = { count: 0, examples: [] }));
      t.count += 1;
      t.examples.push({ size, name: def.name, file });
      if (t.examples.length > perTerm * 4) {
        t.examples.sort((a, b) => a.size - b.size);
        t.examples.length = perTerm;
      }
    };
    const walk = (node, place) => {
      if (Array.isArray(node)) {
        for (const item of node) walk(item, `${place}[]`);
        return;
      }
      if (node === null || typeof node !== "object") return;
      let owner = place;
      if (typeof node.kind === "string") owner = `kind=${node.kind}`;
      else if (typeof node.on === "string") owner = `on=${node.on}`;
      if (owner !== place) note(owner);
      for (const [field, value] of Object.entries(node)) {
        if (value === undefined || value === null) continue;
        if (field === "kind" && owner.startsWith("kind=")) continue;
        if (field === "on" && owner.startsWith("on=")) continue;
        note(`${owner}.${field}`);
        if (typeof value === "string" && ENUMISH.test(value) && !SKIP_FIELDS.has(field)) {
          note(`${owner}.${field}=${value}`);
        }
        if (typeof value === "object") walk(value, owner === place ? `${place}.${field}` : field);
      }
    };
    walk(def, "card");
  }
  for (const t of terms.values()) {
    t.examples.sort((a, b) => a.size - b.size);
    t.examples.length = Math.min(t.examples.length, perTerm);
  }
  return terms;
}

// ------------------------------------------------------------------ declarations

/** The doc comment ending just above line `i` (blank lines and a `| {`
 * between are allowed), first two sentences. */
function docAbove(lines, i) {
  let j = i - 1;
  while (j >= 0 && /^\s*(\|\s*\{|\{)?\s*$/.test(lines[j])) j--;
  if (j < 0 || !/\*\/\s*$/.test(lines[j])) return "";
  const end = j;
  while (j >= 0 && !/\/\*\*/.test(lines[j])) j--;
  if (j < 0 || end - j > 80) return "";
  const text = lines
    .slice(j, end + 1)
    .map((l) => l.replace(/^\s*\/?\*+\/?\s?/, "").replace(/\*\/\s*$/, ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  // A sentence ends at a stop followed by a capital or a quote — not at the
  // stop inside "rule 702.43a".
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z"`'(*])/);
  return sentences.slice(0, 2).join(" ").trim();
}

function declarations() {
  const out = [];
  for (const rel of SOURCES) {
    const abs = path.join(ENGINE, rel);
    if (!existsSync(abs)) continue;
    const lines = readFileSync(abs, "utf8").split("\n");
    lines.forEach((line, i) => {
      let m = /^\s*readonly (kind|on): "([a-z0-9-]+)";/.exec(line);
      if (m) {
        // A union member's doc sits above its `readonly kind`, or above the `| {`.
        out.push({ term: `${m[1]}=${m[2]}`, file: rel, line: i + 1, doc: docAbove(lines, i) });
        return;
      }
      m = /^\s*readonly ([a-zA-Z][a-zA-Z0-9]*)\??:/.exec(line);
      if (m) out.push({ term: `.${m[1]}`, file: rel, line: i + 1, doc: docAbove(lines, i) });
    });
  }
  return out;
}

// ------------------------------------------------------------------ CLI

const clip = (s, n) => (s.length > n ? `${s.slice(0, n)}…` : s);

async function main() {
  const args = process.argv.slice(2);
  const opt = (name, fallback) => {
    const i = args.indexOf(name);
    return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
  };
  const perTerm = Number(opt("--examples", 3));
  if (!existsSync(path.join(ENGINE, "dist/cards/pool"))) {
    console.error("No dist/ build: run npm run build -w engine first.");
    process.exit(1);
  }
  const usage = usageIndex(await loadDefinitions(), perTerm);
  const decls = declarations();

  if (args.includes("--unused")) {
    const unused = decls.filter((d) => /^(kind|on)=/.test(d.term) && !usage.has(d.term));
    const seen = new Set();
    console.log("Declared, but no card uses it yet:");
    for (const d of unused) {
      if (seen.has(d.term)) continue;
      seen.add(d.term);
      console.log(`  ${d.term.padEnd(42)} ${d.file}:${d.line}  ${clip(d.doc, 110)}`);
    }
    console.log(`${seen.size} term(s).`);
    return;
  }

  if (args.includes("--list")) {
    const prefix = opt("--list", "");
    const rows = [...usage].filter(([t]) => prefix === "" || prefix.startsWith("--") || t.startsWith(prefix));
    for (const [t, u] of rows.sort((a, b) => b[1].count - a[1].count)) console.log(`${String(u.count).padStart(5)}  ${t}`);
    return;
  }

  const optionValues = new Set([opt("--examples", null)].filter(Boolean));
  const words = args.filter((a) => !a.startsWith("--") && !optionValues.has(a)).map((w) => w.toLowerCase());
  if (words.length === 0) {
    console.error("Usage: node scripts/card-vocab.mjs <term> [<term> …] | --unused | --list [prefix]");
    process.exit(1);
  }
  const matches = (s) => words.every((w) => s.toLowerCase().includes(w));
  // A field name matches "sacrifice" when it's spelled sacrificeCount: match
  // case-insensitively on the term, and on the term with dashes removed.
  const termMatches = (t) => matches(t) || matches(t.replace(/-/g, ""));

  const used = [...usage].filter(([t]) => termMatches(t)).sort((a, b) => b[1].count - a[1].count);
  console.log(`Used by cards (${used.length} term${used.length === 1 ? "" : "s"}):`);
  for (const [t, u] of used.slice(0, 40)) {
    console.log(`  ${String(u.count).padStart(5)}  ${t}`);
    console.log(`         e.g. ${u.examples.map((e) => `${e.name} (${e.file})`).join("; ")}`);
  }
  if (used.length > 40) console.log(`  … ${used.length - 40} more (narrow the search)`);

  const declared = decls.filter((d) => termMatches(d.term) || matches(d.doc));
  console.log(`\nDeclared in the engine (${declared.length}):`);
  for (const d of declared.slice(0, 40)) {
    const n = usage.get(d.term)?.count;
    const tag = /^(kind|on)=/.test(d.term) ? (n ? ` [${n} cards]` : " [no card uses it yet]") : "";
    console.log(`  ${d.term}${tag}  ${d.file}:${d.line}`);
    if (d.doc) console.log(`      ${clip(d.doc, 220)}`);
  }
  if (declared.length > 40) console.log(`  … ${declared.length - 40} more`);

  const guide = readFileSync(path.join(ENGINE, GUIDE), "utf8").split("\n");
  const hits = guide.map((l, i) => ({ l, i })).filter(({ l }) => matches(l));
  console.log(`\nIn ${GUIDE} (${hits.length} line${hits.length === 1 ? "" : "s"}):`);
  for (const { l, i } of hits.slice(0, 15)) console.log(`  ${GUIDE}:${i + 1}  ${clip(l.trim(), 200)}`);
  if (hits.length > 15) console.log(`  … ${hits.length - 15} more`);
}

await main();
