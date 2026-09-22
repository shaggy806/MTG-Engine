#!/usr/bin/env node
// Ranks the engine features that stand between the pool and the top-500
// commanders, from `src/cards/top-commanders-gaps.json` (the per-commander
// triage, normalized onto one feature vocabulary — see
// neededCards-features.md, "The commander gap").
//
// Commanders already implemented (marked [x] in top-commanders.txt — run
// `npm run cmdrs:mark` first) and features listed in the JSON's `built`
// array are left out, so the numbers move as work lands. No network.
//
// Usage: node scripts/commander-gaps.mjs [--top 40] [--order 30] [--ui]
//   --top N    features by how many commanders need them (default 40)
//   --order N  greedy build order: the feature that fully unblocks the most
//              commanders per unit of effort next, engine-only unless --ui
//              (default 30)

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const gapsPath = path.join(here, "../src/cards/top-commanders-gaps.json");
const listPath = path.join(here, "../src/cards/top-commanders.txt");

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? Number(args[i + 1]) : fallback;
};
const TOP = opt("--top", 40);
const ORDER = opt("--order", 30);
const WITH_UI = args.includes("--ui");
const EFFORT = { small: 1, medium: 3, large: 10 };

const data = JSON.parse(readFileSync(gapsPath, "utf8"));
const built = new Set(data.built ?? []);
const implemented = new Set(
  readFileSync(listPath, "utf8")
    .split("\n")
    .filter((l) => l.startsWith("[x]"))
    .map((l) => l.replace(/^\[x\]\s+\d+\s+/, "").split(/\s{2,}/)[0]),
);

const open = data.commanders
  .filter((c) => !implemented.has(c.name))
  .map((c) => ({ ...c, needs: c.needs.filter((k) => !built.has(k)) }));

const need = new Map();
const sole = new Map();
for (const c of open) {
  for (const k of c.needs) need.set(k, (need.get(k) ?? 0) + 1);
  if (c.needs.length === 1) sole.set(c.needs[0], (sole.get(c.needs[0]) ?? 0) + 1);
}

const ready = open.filter((c) => c.needs.length === 0);
console.log(`${open.length} top-500 commanders not yet implemented; ${ready.length} need no engine work:`);
console.log(`  ${ready.map((c) => `${c.rank} ${c.name}`).join(" · ")}\n`);

const byCount = new Map();
for (const c of open) byCount.set(c.needs.length, (byCount.get(c.needs.length) ?? 0) + 1);
console.log(
  "Features still needed per commander: " +
    [...byCount.entries()].sort((a, b) => a[0] - b[0]).map(([n, k]) => `${n}→${k}`).join("  ") +
    "\n",
);

const f = (k) => data.features[k] ?? { size: "medium", ui: false, description: "" };
console.log(`Top ${TOP} features by commanders that need them (sole = the only thing blocking one):`);
for (const [k, n] of [...need.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP)) {
  console.log(
    `${String(n).padStart(3)}  sole ${String(sole.get(k) ?? 0).padStart(2)}  ${f(k).size.padEnd(6)} ${f(k).ui ? "UI" : "  "}  ${k}`,
  );
}

const remaining = open.filter((c) => c.needs.length > 0);
const have = new Set();
console.log(`\nGreedy build order (${WITH_UI ? "all features" : "engine-only"}): feature, newly unblocked, running total`);
let total = 0;
for (let step = 0; step < ORDER; step += 1) {
  let best = null;
  for (const k of need.keys()) {
    if (have.has(k) || (!WITH_UI && f(k).ui)) continue;
    const gain = remaining.filter(
      (c) => c.needs.includes(k) && c.needs.every((n) => n === k || have.has(n)),
    ).length;
    if (gain === 0) continue;
    const score = gain / (EFFORT[f(k).size] ?? 3);
    if (best === null || score > best.score) best = { k, gain, score };
  }
  if (best === null) break;
  have.add(best.k);
  total += best.gain;
  console.log(`  ${best.k.padEnd(52)} +${String(best.gain).padStart(2)}  ${total}`);
}
