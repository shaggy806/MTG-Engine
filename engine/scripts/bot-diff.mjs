// Where the current bot decides differently from the same bot at an older
// commit: every seat plays on the working build, and at each of its decisions
// the baseline's bot is asked the same question on the same board. Every
// disagreement is logged in words, then grouped. A bench says whether a
// change won; this says what it changed — read the groups, and check the odd
// ones by hand.
//
//   npm run bot:diff -w engine -- --base origin/main --bot v2 --games 6
//
// Flags: --base REF (default origin/main), --bot v1|v2 (default v2),
// --games N (default 6 for v2, 40 for v1), --first SEED (default 1),
// --players 2-4 (default 4), --parallel N (default 6 — each game holds two
// card pools and two searching bots; more at once has run out of memory),
// --out FILE (NDJSON of every disagreement).

import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Worker } from "node:worker_threads";

import { ROOT, baselineDist, workingDist } from "./baseline-build.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const base = flag("base", "origin/main");
const bot = flag("bot", "v2");
const games = Number(flag("games", bot === "v1" ? "40" : "6"));
const first = Number(flag("first", "1"));
const players = Math.min(4, Math.max(2, Number(flag("players", "4"))));
const parallel = Number(flag("parallel", "6"));
const baseline = baselineDist(base);
const out = flag("out", join(ROOT, ".scratch", `diff-${bot}-${baseline.sha}.ndjson`));
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, "");
const working = workingDist();
console.log(`bot:diff — ${bot}, working build vs ${base} (${baseline.sha}), ${players}p, seeds ${first}-${first + games - 1}`);

const queue = Array.from({ length: games }, (_, i) => first + i);
let active = 0;
let decisions = 0;
const url = new URL("./bot-diff-worker.mjs", import.meta.url);

function report() {
  const rows = readFileSync(out, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const errors = rows.filter((r) => r.error !== undefined);
  const diffs = rows.filter((r) => r.error === undefined);
  console.log(`\n${diffs.length} disagreements in ${decisions} decisions over ${games} games${errors.length > 0 ? `, ${errors.length} games errored` : ""}`);
  const groups = new Map();
  for (const r of diffs) {
    const key = `${r.kind}${r.source ? ` · ${r.source}` : ""} | new: ${r.new.split(" → ")[0]} | old: ${r.old.split(" → ")[0]}`;
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  for (const [key, n] of [...groups].sort((a, b) => b[1] - a[1]).slice(0, 40)) console.log(`${String(n).padStart(4)}  ${key}`);
  for (const e of errors) console.log(`seed ${e.seed} errored: ${e.error}`);
  console.log(`every disagreement, with its turn and targets: ${out}`);
}

function next() {
  if (queue.length === 0) {
    if (active === 0) report();
    return;
  }
  const seed = queue.shift();
  active += 1;
  const worker = new Worker(url, { workerData: { working: working.dist, baseline: baseline.dist, bot, players, seed } });
  worker.on("message", (m) => {
    if (m.type === "diff") appendFileSync(out, JSON.stringify(m.row) + "\n");
    else if (m.type === "done") {
      decisions += m.decisions;
      process.stderr.write(`  seed ${seed}: ${m.diffs} of ${m.decisions} decisions differ, game ended turn ${m.turn}\n`);
    } else if (m.type === "error") appendFileSync(out, JSON.stringify({ seed, error: m.error }) + "\n");
  });
  worker.once("error", (error) => appendFileSync(out, JSON.stringify({ seed, error: String(error?.message ?? error) }) + "\n"));
  worker.once("exit", () => {
    active -= 1;
    next();
  });
}
for (let i = 0; i < parallel; i += 1) next();
