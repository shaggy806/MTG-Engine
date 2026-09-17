// Bot benchmarking and weight tuning, parallelised across cores.
//
// The noise floor is the thing that bites: 30 games is +/-5 wins of pure
// variance, so a 16-14 result is indistinguishable from a coin flip. Resolving
// a 55% win rate from 50% needs several hundred games per configuration —
// hence the worker pool.
//
//   npm run bot:bench -w engine                    # v2 vs v1, default weights
//   npm run bot:bench -w engine -- --games 400
//   npm run bot:bench -w engine -- --players 4
//   npm run bot:tune  -w engine -- --games 200 --iterations 40
//
// Flags: --games N (rounded up to a multiple of --players, so every deck
// seating is played from every seat), --players 2-4, --horizon stack|turn,
// --rollout passive|combat|defensive (see `RolloutPolicy`; default: the bot's own),
// --bot-options JSON (any other `EvalBotOptions`, e.g. '{"rolloutDecisions":true}'),
// --workers N, --timeout SECONDS (per game, default 300), --json PATH,
// --weights JSON (overrides merged onto DEFAULT_WEIGHTS — the vector `bench`
// measures and `tune` starts from; e.g. --weights '{"handManaValue":0}' to
// ablate one term).
//
// `bench` measures one weight vector against the v1 `HeuristicBotController`.
// `tune` runs a (1+1) evolution strategy over the weight vector, playing each
// mutation against the incumbent (every other seat) and keeping it only when
// the whole confidence interval sits above an even share.
//
// "Even" is 1/players, not 50%: at a four-player table the candidate is one
// seat against three, and a bot exactly as strong as its opponents wins a
// quarter of the time. A draw counts as a 1/players share for the same reason.
//
// Games are played under live-room rules — see `tune-bot-worker.mjs`.
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
const players = Math.min(4, Math.max(2, Number(flag("players", "2"))));
const games = Math.ceil(Number(flag("games", "200")) / players) * players;
const horizon = flag("horizon", "turn");
const rollout = flag("rollout", undefined);
const botOptions = JSON.parse(flag("bot-options", "{}"));
const iterations = Number(flag("iterations", "30"));
const timeoutMs = Number(flag("timeout", "300")) * 1000;
const jsonOut = flag("json", null);
const workers = Math.max(1, Math.min(Number(flag("workers", String(os.cpus().length - 2))), os.cpus().length));
const even = 1 / players;
const baseWeights = { ...DEFAULT_WEIGHTS, ...JSON.parse(flag("weights", "{}")) };
for (const key of Object.keys(baseWeights)) {
  if (!(key in DEFAULT_WEIGHTS)) throw new Error(`--weights: unknown weight "${key}"`);
}

/**
 * Run `games` seeds across the worker pool and resolve the per-game results.
 * With `opponentWeights` the match is between two weight vectors; without,
 * it's against the v1 `HeuristicBotController`.
 *
 * A game that overruns `timeoutMs` has its worker killed and replaced, and is
 * recorded as an error: a runaway loop inside one engine tick never yields, so
 * nothing in the worker itself can stop it, and without this one stuck game
 * silently stalls the whole run.
 */
function runMatch(weights, seedOffset = 0, opponentWeights = null) {
  return new Promise((resolve) => {
    const results = [];
    let next = 0;

    const spawn = () => {
      const worker = new Worker(WORKER);
      let timer = null;
      let seed = null;

      const finish = (result) => {
        clearTimeout(timer);
        results.push(result);
        if (results.length === games) resolve(results);
      };

      const pump = () => {
        if (next >= games) {
          worker.terminate();
          return;
        }
        seed = seedOffset + next + 1;
        next += 1;
        timer = setTimeout(() => {
          worker.removeAllListeners();
          worker.terminate();
          finish({ seed, error: `timed out after ${timeoutMs / 1000}s` });
          spawn();
        }, timeoutMs);
        worker.postMessage({ seed, weights, opponentWeights, players, horizon, rollout, botOptions });
      };

      worker.on("message", (result) => {
        finish(result);
        pump();
      });
      worker.on("error", (error) => {
        worker.removeAllListeners();
        finish({ seed, error: `worker crashed: ${error?.message ?? error}` });
        spawn();
      });
      pump();
    };

    for (let i = 0; i < Math.min(workers, games); i += 1) spawn();
  });
}

/** Wilson score interval — unlike the Wald interval it stays honest near 0
 * and 1, and at four players the rates being compared sit near 0.25. */
function wilson(rate, n) {
  if (n === 0) return { low: 0, high: 0 };
  const z = 1.96;
  const denom = 1 + (z * z) / n;
  const centre = (rate + (z * z) / (2 * n)) / denom;
  const half = (z * Math.sqrt((rate * (1 - rate)) / n + (z * z) / (4 * n * n))) / denom;
  return { low: centre - half, high: centre + half };
}

function summarise(results) {
  const played = results.filter((r) => r.error === undefined);
  const wins = played.filter((r) => r.outcome === "win").length;
  const losses = played.filter((r) => r.outcome === "loss").length;
  const draws = played.filter((r) => r.outcome === "draw").length;
  const n = played.length;
  const rate = n > 0 ? (wins + draws * even) / n : 0;
  const { low, high } = wilson(rate, n);
  const errors = results.filter((r) => r.error !== undefined);
  return { wins, losses, draws, n, rate, low, high, errors };
}

const pct = (x) => `${(x * 100).toFixed(1)}%`;
const fmt = (s) =>
  `${s.wins}W-${s.losses}L-${s.draws}D  ${pct(s.rate)} [${pct(s.low)}, ${pct(s.high)}] vs even ${pct(even)}` +
  (s.errors.length > 0 ? `  errors=${s.errors.length}` : "");

function report(results) {
  const played = results.filter((r) => r.error === undefined);
  const byDeck = new Map();
  for (const r of played) {
    const d = byDeck.get(r.candidateDeck) ?? { wins: 0, n: 0 };
    d.n += 1;
    if (r.outcome === "win") d.wins += 1;
    byDeck.set(r.candidateDeck, d);
  }
  console.log("  candidate's deck:");
  for (const [name, d] of [...byDeck].sort()) {
    console.log(`    ${name.padEnd(28)} ${String(d.wins).padStart(4)}/${String(d.n).padEnd(4)} ${pct(d.wins / d.n)}`);
  }
  if (played.length > 0) {
    const mean = (f) => played.reduce((sum, r) => sum + f(r), 0) / played.length;
    const worst = played.reduce((a, r) => (r.maxDecisionMs > a.maxDecisionMs ? r : a));
    const decisions = played.reduce((sum, r) => sum + r.decisions, 0);
    const decisionMs = played.reduce((sum, r) => sum + r.decisionMs, 0);
    console.log(
      `  turns ${mean((r) => r.turns).toFixed(1)} avg, game ${(mean((r) => r.ms) / 1000).toFixed(1)}s avg, ` +
        `decision ${(decisionMs / Math.max(1, decisions)).toFixed(2)}ms avg / ${worst.maxDecisionMs.toFixed(0)}ms worst (seed ${worst.seed})`,
    );
  }
  for (const e of summarise(results).errors) console.log(`  ERROR seed ${e.seed}: ${e.error}`);
}

const WEIGHT_KEYS = Object.keys(DEFAULT_WEIGHTS);
const overridden = JSON.stringify(baseWeights) !== JSON.stringify(DEFAULT_WEIGHTS);

/** Weights below this are "off": a multiplicative step can't move them
 * meaningfully, so a mutation switches them on at a random small value
 * instead — and a weight that shrinks under it switches off. Without this a
 * term that starts at zero could never be tried. */
const OFF_BELOW = 0.02;

/** Log-normal jitter on a random subset — keeps every weight non-negative and
 * scales the step to the weight's own magnitude. */
function mutate(weights, rng, strength = 0.35) {
  const next = { ...weights };
  const touched = 1 + Math.floor(rng() * 3);
  for (let i = 0; i < touched; i += 1) {
    const key = WEIGHT_KEYS[Math.floor(rng() * WEIGHT_KEYS.length)];
    if (weights[key] < OFF_BELOW) {
      next[key] = 0.1 + rng() * 0.9;
      continue;
    }
    const stepped = weights[key] * Math.exp((rng() * 2 - 1) * strength);
    next[key] = stepped < OFF_BELOW ? 0 : stepped;
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
const elapsed = () => `${((Date.now() - startedAt) / 1000).toFixed(1)}s`;
console.log(
  `${mode}: ${games} games/config, ${players} players, horizon=${horizon}, rollout=${rollout ?? "default"}, options=${JSON.stringify(botOptions)}, ${workers} workers`,
);

if (mode === "bench") {
  if (overridden) console.log(`weights: ${flag("weights", "{}")}`);
  const results = await runMatch(baseWeights);
  const summary = summarise(results);
  console.log(`v2 vs v1: ${fmt(summary)}   (${elapsed()})`);
  report(results);
  if (jsonOut) {
    writeFileSync(jsonOut, JSON.stringify({ weights: baseWeights, players, summary, results }, null, 2));
  }
} else {
  const rng = mulberry32(0xc0ffee);
  let incumbent = { ...baseWeights };

  // The candidate plays the *incumbent* directly, not a third party. Scoring
  // both against v1 and comparing the two numbers is far less sensitive: each
  // estimate carries its own sampling error, so at 200 games a candidate would
  // have to clear roughly 62% against v1 to look better than a 55% incumbent,
  // and in practice nothing ever does — an earlier revision of this script
  // rejected all 14 mutations it tried for exactly that reason. Head-to-head
  // asks the question once instead of twice.
  console.log(`incumbent vs v1, for reference: ${fmt(summarise(await runMatch(incumbent)))}`);
  const history = [{ iteration: 0, weights: incumbent }];

  for (let i = 1; i <= iterations; i += 1) {
    const candidate = mutate(incumbent, rng);
    // A fresh seed block each iteration, so a winner can't be one that merely
    // memorised a lucky set of shuffles.
    const summary = summarise(await runMatch(candidate, i * games, incumbent));
    // Accept only when the whole interval sits above an even share: the
    // candidate has to be better than the incumbent, not merely luckier.
    const accepted = summary.low > even;
    if (accepted) incumbent = candidate;
    console.log(
      `  ${String(i).padStart(3)}: vs incumbent ${fmt(summary)} ${accepted ? "ACCEPT" : "reject"}   (${elapsed()})`,
    );
    for (const e of summary.errors) console.log(`       ERROR seed ${e.seed}: ${e.error}`);
    history.push({ iteration: i, weights: candidate, summary, accepted });
    if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ best: incumbent, players, history }, null, 2));
  }

  console.log(`\nfinal vs v1: ${fmt(summarise(await runMatch(incumbent)))}`);
  console.log(JSON.stringify(incumbent, null, 2));
}
