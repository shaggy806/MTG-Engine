#!/usr/bin/env node
// The card-triage records, read through one need vocabulary.
//
// Every unimplemented card a triage pass looked at has a record — `{ name,
// needs, why }` in a `blocked` list under `data/sweep-2/` or `data/sweep-3/`,
// and the top-500 commanders' in `src/cards/top-commanders-gaps.json`. The
// commanders' needs use that file's ~250 `features`; the sweep records were
// written batch by batch with keys of their own (`new:retrace` beside
// `keyword:retrace`). `data/needs-vocabulary.json` maps every one of those keys
// (`aliases`) onto a gaps-file feature or onto a narrower feature of its own
// (`features`, each filed under a gaps-file `family`), so that "what does
// building X unblock" is one question, and a feature added to the gaps file's
// `built` array marks every record that waits on it as worth rechecking.
//
// A record is triage, not a verdict: the engine moves on after it's written.
// A built need means "recheck this card", never "author it blind".
//
// Usage: node scripts/needs-vocabulary.mjs <command>
//   --check            raw keys the vocabulary doesn't know (a new record's
//                      needs must be canonical keys or aliased ones)
//   --rank [--top N]   needs by how many unimplemented cards wait on them
//                      (default 40), with how many each would fully unblock,
//                      and the families they roll up into
//   --stale            unimplemented cards with a need that has since been
//                      built: every need built ("recheck now") first, then
//                      the rest
//   --feature <key>    the unimplemented cards waiting on one need (a raw key,
//                      an alias or a family all work)
//
// The library half (`loadVocabulary`, `loadRecords`, `poolNames`) is what
// `card-brief.mjs` reads records through.

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ENGINE = path.join(here, "..");
const GAPS_PATH = path.join(ENGINE, "src/cards/top-commanders-gaps.json");
const VOCAB_PATH = path.join(ENGINE, "data/needs-vocabulary.json");
const SWEEP_DIRS = ["data/sweep-2", "data/sweep-3"];
const POOL_DIR = path.join(ENGINE, "src/cards/pool");

/** A card's front face: records name double-faced cards either way. */
export const frontName = (name) => name.split(" // ")[0].trim();

/**
 * The vocabulary: `features` (gaps-file features and this file's narrower
 * ones, each `{ family?, description?, example?, size? }`), `aliases`, and
 * `built`. `canonical(raw)` is the key a raw need means, or `undefined` for one
 * nobody has mapped (see `--check`).
 */
export function loadVocabulary() {
  const gaps = JSON.parse(readFileSync(GAPS_PATH, "utf8"));
  const vocab = JSON.parse(readFileSync(VOCAB_PATH, "utf8"));
  const features = new Map();
  for (const [key, f] of Object.entries(gaps.features)) features.set(key, { ...f, from: "gaps" });
  for (const [key, f] of Object.entries(vocab.features)) features.set(key, { ...f, from: "vocabulary" });
  const aliases = new Map(Object.entries(vocab.aliases));
  const built = new Set(gaps.built ?? []);
  const canonical = (raw) => {
    if (features.has(raw) || built.has(raw)) return raw;
    const alias = aliases.get(raw);
    if (alias !== undefined) return alias;
    return undefined;
  };
  /** The family a key rolls up into: its own `family`, or itself. */
  const familyOf = (key) => features.get(key)?.family ?? key;
  /** Built, either itself or (for a gaps-file feature) wholesale. */
  const isBuilt = (key) => built.has(key);
  /** Not a feature at all — `meta:unverified-in-mass-pass` and the like. */
  const isMeta = (key) => key.startsWith("meta:");
  const dates = builtDates(built);
  /** Built after `date` (a record's triage date): the record didn't know.
   * A record with no date counts as older than everything. */
  const builtSince = (key, date) => built.has(key) && (date === undefined || (dates.get(key) ?? "") > date);
  return { features, aliases, built, builtDates: dates, canonical, familyOf, isBuilt, builtSince, isMeta };
}

/**
 * When each `built` key landed: the date of the commit that first added it
 * to the gaps file (one `git log -p` over its history), or today for one not
 * committed yet. A key in the file's first version dates from then.
 */
function builtDates(built) {
  const dates = new Map();
  try {
    const out = execFileSync(
      "git",
      ["log", "-p", "--reverse", "-U0", "--format=DATE %cs", "--", "src/cards/top-commanders-gaps.json"],
      { cwd: ENGINE, encoding: "utf8", maxBuffer: 1 << 28 },
    );
    let date = "";
    for (const line of out.split("\n")) {
      if (line.startsWith("DATE ")) date = line.slice(5).trim();
      const m = /^\+\s*"([a-z]+:[a-z0-9-]+)",?\s*$/.exec(line.replace(/\r$/, ""));
      if (m !== null && built.has(m[1]) && !dates.has(m[1])) dates.set(m[1], date);
    }
  } catch {
    // No git: every built key reads as undated, so nothing looks stale.
  }
  const today = new Date().toISOString().slice(0, 10);
  for (const key of built) if (!dates.has(key)) dates.set(key, today);
  return dates;
}

/** When each sweep file was first committed, as `YYYY-MM-DD` — a record's
 * triage date. Files git doesn't know are left out. */
function firstCommitDates() {
  const dates = new Map();
  try {
    const out = execFileSync("git", ["log", "--format=@%cs", "--name-only", "--", ...SWEEP_DIRS], {
      cwd: ENGINE,
      encoding: "utf8",
      maxBuffer: 1 << 26,
    });
    let date = "";
    for (const line of out.split("\n")) {
      if (line.startsWith("@")) date = line.slice(1).trim();
      else if (line.trim() !== "") dates.set(path.basename(line.trim()), date); // oldest wins: log is newest first
    }
  } catch {
    // No git (a tarball): records just carry no date.
  }
  return dates;
}

/**
 * Every triage record: `{ name, needs: string[], why, batch, file, date? }`.
 * A record whose `needs` is a single string (a few old ones) is read as one
 * key. Commanders come from the gaps file, batch `"top-500 commanders"`.
 */
export function loadRecords() {
  const dates = firstCommitDates();
  const records = [];
  const walk = (node, batch, file) => {
    if (Array.isArray(node)) {
      for (const item of node) walk(item, batch, file);
      return;
    }
    if (node === null || typeof node !== "object") return;
    if (typeof node.name === "string" && node.needs !== undefined) {
      const needs = typeof node.needs === "string" ? [node.needs] : [...node.needs];
      records.push({ name: node.name, needs, why: node.why ?? "", batch, file, date: dates.get(path.basename(file)) });
    }
    for (const value of Object.values(node)) if (typeof value === "object") walk(value, batch, file);
  };
  for (const dir of SWEEP_DIRS) {
    const abs = path.join(ENGINE, dir);
    for (const name of readdirSync(abs).filter((n) => n.endsWith(".json")).sort()) {
      const data = JSON.parse(readFileSync(path.join(abs, name), "utf8"));
      walk(data, data.batch ?? name.replace(/\.json$/, ""), `${dir}/${name}`);
    }
  }
  const gaps = JSON.parse(readFileSync(GAPS_PATH, "utf8"));
  for (const c of gaps.commanders ?? []) {
    records.push({
      name: c.name,
      needs: [...(c.needs ?? [])],
      why: c.why ?? "",
      batch: "top-500 commanders",
      file: "src/cards/top-commanders-gaps.json",
      date: gaps.generated,
    });
  }
  return records;
}

/** Card names in the pool, front faces, read from the sources (no build
 * needed): the first `name:` of each file's `defineCard`, and every face's. */
export function poolNames() {
  const names = new Map();
  for (const file of readdirSync(POOL_DIR).filter((n) => n.endsWith(".ts"))) {
    const src = readFileSync(path.join(POOL_DIR, file), "utf8");
    for (const m of src.matchAll(/^\s*name:\s*"((?:[^"\\]|\\.)*)"/gm)) {
      const name = JSON.parse(`"${m[1]}"`);
      if (!names.has(name)) names.set(name, `src/cards/pool/${file}`);
    }
  }
  return names;
}

// ------------------------------------------------------------------ CLI

function openNeeds(record, vocab) {
  return record.needs
    .map((raw) => vocab.canonical(raw) ?? raw)
    .filter((key) => !vocab.isMeta(key) && !vocab.isBuilt(key));
}

function main() {
  const args = process.argv.slice(2);
  const opt = (name, fallback) => {
    const i = args.indexOf(name);
    return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
  };
  const vocab = loadVocabulary();
  const records = loadRecords();
  const pool = poolNames();
  const waiting = records.filter((r) => !pool.has(frontName(r.name)));

  if (args.includes("--check")) {
    const unknown = new Map();
    let strings = 0;
    for (const r of records) for (const raw of r.needs) {
      if (vocab.canonical(raw) === undefined) unknown.set(raw, [...(unknown.get(raw) ?? []), `${r.name} (${r.file})`]);
    }
    for (const r of loadRecordsRawStrings()) strings += r;
    if (unknown.size === 0) console.log(`Every need key is in the vocabulary (${records.length} records).`);
    for (const [raw, where] of unknown) console.log(`${raw}\t${where.slice(0, 3).join("; ")}`);
    if (strings > 0) console.log(`${strings} record(s) give needs as a string, not a list.`);
    process.exitCode = unknown.size === 0 ? 0 : 1;
    return;
  }

  if (args.includes("--feature")) {
    const asked = opt("--feature", "");
    const key = vocab.canonical(asked) ?? asked;
    const hits = waiting.filter((r) =>
      r.needs.some((raw) => {
        const k = vocab.canonical(raw) ?? raw;
        return k === key || vocab.familyOf(k) === key;
      }),
    );
    const f = vocab.features.get(key);
    console.log(`${key}${vocab.isBuilt(key) ? " (built)" : ""}${f?.family ? ` — family ${f.family}` : ""}`);
    if (f?.description) console.log(`  ${f.description}`);
    const seen = new Set();
    for (const r of hits) {
      if (seen.has(r.name)) continue;
      seen.add(r.name);
      const others = openNeeds(r, vocab).filter((k) => k !== key && vocab.familyOf(k) !== key);
      console.log(`- ${r.name} [${r.batch}]${others.length ? `  also: ${others.join(", ")}` : "  (only this)"}`);
    }
    console.log(`${seen.size} card(s).`);
    return;
  }

  if (args.includes("--stale")) {
    const byCard = new Map();
    for (const r of waiting) {
      const keys = r.needs.map((raw) => vocab.canonical(raw) ?? raw).filter((k) => !vocab.isMeta(k));
      const built = keys.filter((k) => vocab.builtSince(k, r.date));
      if (built.length === 0) continue;
      const open = keys.filter((k) => !vocab.isBuilt(k));
      const prev = byCard.get(r.name);
      // A card's newest record wins: it was triaged against a later engine.
      if (prev === undefined || (r.date ?? "") > (prev.date ?? "")) byCard.set(r.name, { ...r, built, open });
    }
    const all = [...byCard.values()].sort((a, b) => a.open.length - b.open.length || a.name.localeCompare(b.name));
    const ready = all.filter((r) => r.open.length === 0);
    console.log(`Every need built since triage — recheck these (${ready.length}):`);
    const when = (k) => `${k} (${vocab.builtDates.get(k)})`;
    for (const r of ready) console.log(`- ${r.name} [${r.batch}${r.date ? `, ${r.date}` : ""}] built: ${r.built.map(when).join(", ")}`);
    console.log(`\nSome needs built (${all.length - ready.length}):`);
    for (const r of all.filter((x) => x.open.length > 0)) {
      console.log(`- ${r.name} [${r.batch}] built: ${r.built.join(", ")}; still: ${r.open.join(", ")}`);
    }
    return;
  }

  // --rank (the default)
  const top = Number(opt("--top", 40));
  const cardsByNeed = new Map();
  const onlyNeed = new Map();
  const latest = new Map();
  for (const r of waiting) {
    const prev = latest.get(r.name);
    if (prev === undefined || (r.date ?? "") > (prev.date ?? "")) latest.set(r.name, r);
  }
  for (const r of latest.values()) {
    const open = [...new Set(openNeeds(r, vocab))];
    for (const k of open) cardsByNeed.set(k, (cardsByNeed.get(k) ?? 0) + 1);
    if (open.length === 1) onlyNeed.set(open[0], (onlyNeed.get(open[0]) ?? 0) + 1);
  }
  const families = new Map();
  for (const [k, n] of cardsByNeed) families.set(vocab.familyOf(k), (families.get(vocab.familyOf(k)) ?? 0) + n);
  console.log(`${latest.size} unimplemented cards with a record; needs by cards waiting (fully unblocks):`);
  for (const [k, n] of [...cardsByNeed].sort((a, b) => b[1] - a[1]).slice(0, top)) {
    const fam = vocab.familyOf(k);
    console.log(`${String(n).padStart(4)} (${String(onlyNeed.get(k) ?? 0).padStart(3)})  ${k}${fam !== k ? `  ← ${fam}` : ""}`);
  }
  console.log(`\nFamilies (needs rolled up):`);
  for (const [k, n] of [...families].sort((a, b) => b[1] - a[1]).slice(0, Math.min(top, 25))) {
    console.log(`${String(n).padStart(4)}  ${k}`);
  }
}

/** How many records give `needs` as a bare string — for `--check`. */
function loadRecordsRawStrings() {
  const counts = [];
  for (const dir of SWEEP_DIRS) {
    const abs = path.join(ENGINE, dir);
    for (const name of readdirSync(abs).filter((n) => n.endsWith(".json"))) {
      const text = readFileSync(path.join(abs, name), "utf8");
      counts.push((text.match(/"needs":\s*"/g) ?? []).length);
    }
  }
  return counts;
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) main();
