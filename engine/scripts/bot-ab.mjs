// The current engine's bot against the same bot at an older commit: one seat
// on the working build, the rest on the baseline, seeded and seated as
// `bot:bench` seats them (`bot-seating.mjs`), count budgets.
//
//   npm run bot:ab -w engine -- --base origin/main --bot v2 --games 400
//
// Flags: --base REF (default origin/main), --bot v1|v2 (default v2),
// --games N (default 400; rounded up to a multiple of --players),
// --players 2-4 (default 4), --workers N (default cores - 2),
// --timeout SECONDS per game (default 1500), --out FILE (an NDJSON of every
// game; rerun the same command to resume it).
//
// A game that errors or times out counts as an even share, like a draw, and
// is listed with its seed so it can be replayed (`npm run bot:replay`).

import { existsSync, readFileSync, appendFileSync, mkdirSync } from "node:fs";
import os from "node:os";
import { join, dirname } from "node:path";
import { Worker } from "node:worker_threads";

import { WORKER_LIMITS } from "./worker-limits.mjs";

import { ROOT, baselineDist, workingDist } from "./baseline-build.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const base = flag("base", "origin/main");
const bot = flag("bot", "v2");
const players = Math.min(4, Math.max(2, Number(flag("players", "4"))));
const games = Math.ceil(Number(flag("games", "400")) / players) * players;
const workers = Number(flag("workers", String(Math.max(1, os.cpus().length - 2))));
const timeoutMs = Number(flag("timeout", "1500")) * 1000;
const baseline = baselineDist(base);
const out = flag("out", join(ROOT, ".scratch", `ab-${bot}-${baseline.sha}-${players}p.ndjson`));
mkdirSync(dirname(out), { recursive: true });
const working = workingDist();

const done = new Set();
if (existsSync(out)) {
  for (const line of readFileSync(out, "utf8").split("\n")) if (line.trim()) done.add(JSON.parse(line).seed);
}
const queue = [];
for (let seed = 1; seed <= games; seed += 1) if (!done.has(seed)) queue.push(seed);
console.log(
  `bot:ab — ${bot}, working build vs ${base} (${baseline.sha}), ${players}p, ${games} games` +
    (done.size > 0 ? `, ${done.size} already in ${out}` : "") +
    `; ${workers} workers`,
);

const even = 1 / players;
function summary() {
  const rows = readFileSync(out, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const n = rows.length;
  const bad = rows.filter((r) => r.outcome !== "win" && r.outcome !== "loss" && r.outcome !== "draw");
  const share = rows.reduce((a, r) => a + (r.outcome === "win" ? 1 : r.outcome === "loss" ? 0 : even), 0);
  const p = share / n;
  const z = 1.96;
  const d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d;
  const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  console.log(
    `${bot} working vs ${baseline.sha}: ${(100 * p).toFixed(1)}% [${(100 * (c - h)).toFixed(1)}, ` +
      `${(100 * (c + h)).toFixed(1)}] over ${n} games (even ${(100 * even).toFixed(0)}%)`,
  );
  if (bad.length > 0) {
    console.log(`not finished (counted as even): ${bad.map((r) => `seed ${r.seed} ${r.outcome}${r.error ? `: ${r.error}` : ""}`).join("; ")}`);
  }
  console.log(`results: ${out}`);
}

let active = 0;
let finished = done.size;
const url = new URL("./bot-ab-worker.mjs", import.meta.url);
function next() {
  if (queue.length === 0) {
    if (active === 0) summary();
    return;
  }
  const seed = queue.shift();
  active += 1;
  const worker = new Worker(url, {
    workerData: { working: working.dist, baseline: baseline.dist, bot, players },
    resourceLimits: WORKER_LIMITS,
  });
  const record = (row) => {
    appendFileSync(out, JSON.stringify(row) + "\n");
    finished += 1;
    if (finished % 20 === 0) process.stderr.write(`  ${finished}/${games}\n`);
  };
  const timer = setTimeout(() => {
    record({ seed, outcome: "timeout" });
    void worker.terminate();
  }, timeoutMs);
  worker.once("message", (row) => {
    clearTimeout(timer);
    record(row);
    void worker.terminate();
  });
  worker.once("error", (error) => {
    clearTimeout(timer);
    record({ seed, outcome: "error", error: String(error?.message ?? error) });
  });
  worker.once("exit", () => {
    active -= 1;
    next();
  });
  worker.postMessage(seed);
}
for (let i = 0; i < workers; i += 1) next();
