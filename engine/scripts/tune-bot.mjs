// Bot benchmarking and weight tuning, parallelised across cores.
//
// A single bot-vs-bot game is 0.1-0.6s, and the noise floor is the thing that
// bites: 30 games is +/-5 wins of pure variance, so a 16-14 result is
// indistinguishable from a coin flip. Resolving a 55% win rate from 50% needs
// several hundred games per configuration — hence the worker pool.
//
//   npm run bot:bench -w engine                    # v2 vs v1, default weights
//   npm run bot:bench -w engine -- --games 400
//   npm run bot:bench -w engine -- --players 4
//   npm run bot:tune  -w engine -- --games 200 --iterations 40
//
// `bench` measures one weight vector against the v1 `HeuristicBotController`.
// `tune` runs a (1+1) evolution strategy over the weight vector, keeping a
// mutation only when it beats the incumbent by more than the noise floor.
//
// See `docs/plans/smarter-bots.md`.

import os from "node:os";
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";

import { DEFAULT_WEIGHTS } from "../dist/index.js";

const WORKER = fileURLToPath(new URL("./tune-bot-worker.mjs", import.meta.url));

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const mode = args[0] === "tune" ? "tune" : "bench";
const games = Number(flag("games", "200"));
const players = Number(flag("players", "2"));
const horizon = flag("horizon", "turn");
const iterations = Number(flag("iterations", "30"));
const jsonOut = flag("json", null);
const workers = Math.max(1, Math.min(Number(flag("workers", String(os.cpus().length - 2))), os.cpus().length));

/** Run `games` seeds of candidate-vs-v1 across the pool; resolve a tally. */
function runMatch(weights, seedOffset = 0) {
  return new Promise((resolve, reject) => {
    const tally = { wins: 0, losses: 0, draws: 0, errors: 0 };
    let next = 0;
    let live = 0;
    let failed = false;

    const pump = (worker) => {
      if (next >= games) {
        worker.terminate();
        live -= 1;
        if (live === 0 && !failed) resolve(tally);
        return;
      }
      worker.postMessage({ seed: seedOffset + next + 1, weights, players, horizon });
      next += 1;
    };

    for (let i = 0; i < Math.min(workers, games); i += 1) {
      const worker = new Worker(WORKER);
      live += 1;
      worker.on("message", (result) => {
        if (result.error !== undefined) tally.errors += 1;
        else if (result.outcome === "win") tally.wins += 1;
        else if (result.outcome === "loss") tally.losses += 1;
        else tally.draws += 1;
        pump(worker);
      });
      worker.on("error", (error) => {
        failed = true;
        reject(error);
      });
      pump(worker);
    }
  });
}

/** Wald interval on the decisive games — what stops a run being read as
 * signal when it's noise. */
function summarise(tally) {
  const decisive = tally.wins + tally.losses;
  const rate = decisive > 0 ? tally.wins / decisive : 0;
  const halfWidth = decisive > 0 ? 1.96 * Math.sqrt((rate * (1 - rate)) / decisive) : 0;
  return { ...tally, rate, halfWidth, decisive };
}

const fmt = (s) =>
  `${s.wins}W-${s.losses}L-${s.draws}D  ${(s.rate * 100).toFixed(1)}% +/-${(s.halfWidth * 100).toFixed(1)}%` +
  (s.errors > 0 ? `  errors=${s.errors}` : "");

const WEIGHT_KEYS = Object.keys(DEFAULT_WEIGHTS);

/** Log-normal-ish jitter on a random subset — keeps every weight positive and
 * scales the step to the weight's own magnitude. */
function mutate(weights, rng, strength = 0.35) {
  const next = { ...weights };
  const touched = 1 + Math.floor(rng() * 3);
  for (let i = 0; i < touched; i += 1) {
    const key = WEIGHT_KEYS[Math.floor(rng() * WEIGHT_KEYS.length)];
    next[key] = Math.max(0.01, weights[key] * Math.exp((rng() * 2 - 1) * strength));
  }
  return next;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const startedAt = Date.now();
console.log(
  `${mode}: ${games} games/config, ${players} players, horizon=${horizon}, ${workers} workers`,
);

if (mode === "bench") {
  const summary = summarise(await runMatch(DEFAULT_WEIGHTS));
  console.log(`v2 vs v1: ${fmt(summary)}   (${((Date.now() - startedAt) / 1000).toFixed(1)}s)`);
  if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ weights: DEFAULT_WEIGHTS, summary }, null, 2));
} else {
  const rng = mulberry32(0xc0ffee);
  let incumbent = { ...DEFAULT_WEIGHTS };
  let best = summarise(await runMatch(incumbent));
  console.log(`baseline: ${fmt(best)}`);
  const history = [{ iteration: 0, weights: incumbent, summary: best }];

  for (let i = 1; i <= iterations; i += 1) {
    const candidate = mutate(incumbent, rng);
    // A fresh seed block each iteration, so a winner can't be one that merely
    // memorised a lucky set of shuffles.
    const summary = summarise(await runMatch(candidate, i * games));
    // Only accept a candidate that clears the incumbent's own error bar.
    const accepted = summary.rate - summary.halfWidth > best.rate;
    if (accepted) {
      incumbent = candidate;
      best = summary;
    }
    console.log(`  ${String(i).padStart(3)}: ${fmt(summary)} ${accepted ? "ACCEPT" : "reject"}`);
    history.push({ iteration: i, weights: candidate, summary, accepted });
    if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ best: { weights: incumbent, summary: best }, history }, null, 2));
  }

  console.log(`\nbest: ${fmt(best)}`);
  console.log(JSON.stringify(incumbent, null, 2));
}
