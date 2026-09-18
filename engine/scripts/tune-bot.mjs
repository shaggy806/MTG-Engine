// Bot benchmarking and weight tuning, parallelised across cores.
//
// The noise floor is the thing that bites: 30 games is +/-5 wins of pure
// variance, so a 16-14 result is indistinguishable from a coin flip. Resolving
// a 55% win rate from 50% needs several hundred games per configuration —
// hence the worker pool.
//
//   npm run bot:bench -w engine                    # v2 vs v1, four players
//   npm run bot:bench -w engine -- --games 400
//   npm run bot:bench -w engine -- --players 2     # cheaper, but not the format
//   npm run bot:bench -w engine -- --opponent gauntlet    # one match per member
//   npm run bot:tune  -w engine -- --games 200 --iterations 40
//
// Flags: --games N (rounded up to a multiple of --players, so every deck
// seating is played from every seat), --players 2-4, --horizon stack|turn,
// --rollout passive|combat|defensive (see `RolloutPolicy`; default: the bot's own),
// --bot-options JSON (any other `EvalBotOptions`, e.g. '{"rolloutDecisions":true}'),
// --workers N, --timeout SECONDS (per game, default 300), --json PATH,
// --weights JSON (overrides merged onto DEFAULT_WEIGHTS — the vector `bench`
// measures and `tune` starts from; e.g. --weights '{"handManaValue":0}' to
// ablate one term), --opponent v1|<champion id>|gauntlet|mixed (bench only),
// --gauntlet-games N (0 turns the tune's gauntlet veto off), --mixed/--no-mixed
// (tune only; mixed tables default on above two players).
//
// `bench` measures one weight vector against a chosen opponent — by default the
// v1 `HeuristicBotController`.
//
// `tune` runs a (1+1) evolution strategy over the weight vector: each mutation
// plays the incumbent and is kept only when the whole confidence interval sits
// above an even share *and* it doesn't regress against any gauntlet member.
// Head-to-head is the primary signal; the gauntlet is a veto — see
// `engine/src/bot/champions/` for what's in it and why it can't just be v1.
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

import { CHAMPIONS, DEFAULT_WEIGHTS, championById } from "../dist/index.js";

const WORKER = fileURLToPath(new URL("./tune-bot-worker.mjs", import.meta.url));

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const mode = args[0] === "tune" ? "tune" : "bench";
// **Four by default, because Commander is a four-player game.** Two-player
// benches are cheaper and were the default for most of this project's life,
// which quietly biased every result toward a format nobody plays: `ramp`
// measured 78.8% at two players and exactly average at four, and v3's whole
// architecture rework came out neutral at two and was never checked at four
// until late. Pass `--players 2` deliberately when a cheap signal is wanted.
const players = Math.min(4, Math.max(2, Number(flag("players", "4"))));
const games = Math.ceil(Number(flag("games", "200")) / players) * players;
const horizon = flag("horizon", "turn");
const rollout = flag("rollout", undefined);
const botOptions = JSON.parse(flag("bot-options", "{}"));
const iterations = Number(flag("iterations", "30"));
const timeoutMs = Number(flag("timeout", "300")) * 1000;
const jsonOut = flag("json", null);
const workers = Math.max(1, Math.min(Number(flag("workers", String(os.cpus().length - 2))), os.cpus().length));
const even = 1 / players;
const opponentArg = flag("opponent", "v1");
// Which searching bot the *candidate* is. `v2` is the per-window search that
// live rooms play; `v3` is the turn planner (`docs/plans/bot-v3-search.md`).
const bot = flag("bot", "v2");
const gauntletGames = Math.ceil(Number(flag("gauntlet-games", String(games))) / players) * players;
// A mixed table is only a thing above two players — with one opponent seat
// there's nothing to mix.
const mixed = players > 2 && !args.includes("--no-mixed");
const baseWeights = { ...DEFAULT_WEIGHTS, ...JSON.parse(flag("weights", "{}")) };
for (const key of Object.keys(baseWeights)) {
  if (!(key in DEFAULT_WEIGHTS)) throw new Error(`--weights: unknown weight "${key}"`);
}

/** The v1 `HeuristicBotController`, as an opponent spec. `weights: null` is
 * what the worker reads as "not an `EvalBotController`". */
const V1 = { id: "v1", weights: null };
const asOpponent = (champion) => ({ id: champion.id, weights: champion.weights });

/** Every frozen opponent a candidate is measured against, v1 included. */
const GAUNTLET = [V1, ...CHAMPIONS.map(asOpponent)];

/**
 * Run `count` seeds across the worker pool and resolve the per-game results.
 * `opponents` fills every seat the candidate isn't in, round-robin — one spec
 * for a straight match, several for a mixed table.
 *
 * A game that overruns `timeoutMs` has its worker killed and replaced, and is
 * recorded as an error: a runaway loop inside one engine tick never yields, so
 * nothing in the worker itself can stop it, and without this one stuck game
 * silently stalls the whole run.
 */
function runMatch(weights, opponents, seedOffset = 0, count = games) {
  return new Promise((resolve) => {
    if (count === 0) {
      resolve([]);
      return;
    }
    const results = [];
    let next = 0;

    const spawn = () => {
      const worker = new Worker(WORKER);
      let timer = null;
      let seed = null;

      const finish = (result) => {
        clearTimeout(timer);
        results.push(result);
        if (results.length === count) resolve(results);
      };

      const pump = () => {
        if (next >= count) {
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
        worker.postMessage({ seed, weights, opponents, players, horizon, rollout, botOptions, bot });
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

    for (let i = 0; i < Math.min(workers, count); i += 1) spawn();
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
  // Only interesting on a mixed table, where which opponents sat down varies
  // block to block.
  const byTable = new Map();
  for (const r of played) {
    const key = [...(r.opponents ?? [])].sort().join("+");
    const d = byTable.get(key) ?? { wins: 0, n: 0 };
    d.n += 1;
    if (r.outcome === "win") d.wins += 1;
    byTable.set(key, d);
  }
  if (byTable.size > 1) {
    console.log("  table:");
    for (const [key, d] of [...byTable].sort()) {
      console.log(`    ${key.padEnd(28)} ${String(d.wins).padStart(4)}/${String(d.n).padEnd(4)} ${pct(d.wins / d.n)}`);
    }
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

/** Weights whose magnitude is below this are "off": a multiplicative step
 * can't move them meaningfully, so a mutation switches them on at a random
 * small value of either sign instead — and a weight that shrinks under it
 * switches off. Without this a term that starts at zero could never be tried. */
const OFF_BELOW = 0.02;

/**
 * Log-normal jitter on a random subset: the step scales with the weight's own
 * magnitude, and multiplying by a positive factor preserves its sign.
 *
 * Sign matters now that weights can be *fitted* rather than hand-picked
 * (`fit-weights.mjs`). The hand-written vectors are all positive by
 * convention — costs are subtracted rather than carrying a negative weight —
 * but a regression is free to report that a feature genuinely predicts losing,
 * and a mutation must not quietly flip that back.
 */
function mutate(weights, rng, strength = 0.35) {
  const next = { ...weights };
  const touched = 1 + Math.floor(rng() * 3);
  for (let i = 0; i < touched; i += 1) {
    const key = WEIGHT_KEYS[Math.floor(rng() * WEIGHT_KEYS.length)];
    if (Math.abs(weights[key]) < OFF_BELOW) {
      // Switching a dormant term back on: try both directions, since a zero
      // carries no sign to preserve.
      next[key] = (0.1 + rng() * 0.9) * (rng() < 0.5 ? -1 : 1);
      continue;
    }
    const stepped = weights[key] * Math.exp((rng() * 2 - 1) * strength);
    next[key] = Math.abs(stepped) < OFF_BELOW ? 0 : stepped;
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

/**
 * Play `weights` against every gauntlet member in turn, one straight match
 * each, and return `{id: summary}`. Seeds are offset per member so no two
 * members are measured on the same shuffles within a round.
 */
async function runGauntlet(weights, seedOffset, count) {
  const profile = {};
  for (const [i, member] of GAUNTLET.entries()) {
    profile[member.id] = summarise(await runMatch(weights, [member], seedOffset + i * count, count));
  }
  return profile;
}

/**
 * The veto. A candidate that beats the incumbent head to head is still rejected
 * if it has clearly got *worse* against anyone in the pool — "clearly" meaning
 * its whole interval sits below what the incumbent scored against that member,
 * so ordinary sampling noise can't trip it. Without this the search is free to
 * trade general strength for whatever beats the one opponent it's scored on.
 */
function regressions(candidateProfile, incumbentProfile) {
  return GAUNTLET.map((m) => m.id).filter(
    (id) => incumbentProfile[id] !== undefined && candidateProfile[id].high < incumbentProfile[id].rate,
  );
}

const profileLine = (profile) =>
  GAUNTLET.map((m) => `${m.id} ${pct(profile[m.id].rate)}`).join("  ");

const startedAt = Date.now();
const elapsed = () => `${((Date.now() - startedAt) / 1000).toFixed(1)}s`;
console.log(
  `${mode}: ${games} games/config, ${players} players, bot=${bot}, horizon=${horizon}, rollout=${rollout ?? "default"}, options=${JSON.stringify(botOptions)}, ${workers} workers`,
);

if (mode === "bench") {
  if (overridden) console.log(`weights: ${flag("weights", "{}")}`);

  if (opponentArg === "gauntlet") {
    const profile = await runGauntlet(baseWeights, 0, games);
    for (const member of GAUNTLET) {
      console.log(`vs ${member.id.padEnd(22)} ${fmt(profile[member.id])}   (${elapsed()})`);
    }
    if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ weights: baseWeights, players, profile }, null, 2));
  } else {
    // `mixed` seats one of each gauntlet member; anything else is a straight
    // match against that one opponent.
    const opponents =
      opponentArg === "mixed" ? GAUNTLET : [opponentArg === "v1" ? V1 : asOpponent(championById(opponentArg))];
    const results = await runMatch(baseWeights, opponents);
    const summary = summarise(results);
    console.log(`v2 vs ${opponents.map((o) => o.id).join("+")}: ${fmt(summary)}   (${elapsed()})`);
    report(results);
    if (jsonOut) {
      writeFileSync(jsonOut, JSON.stringify({ weights: baseWeights, players, summary, results }, null, 2));
    }
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
  //
  // Above two players the other seats are a *mix* — incumbent, v1, a hand-set
  // style — rather than three copies of the incumbent, which is both closer to
  // a real pod and one fewer policy for the candidate to learn to farm. The
  // incumbent still takes the first seat, so it's the opponent that's always
  // present.
  // Exactly one spec per opponent seat. Handing the worker a longer list would
  // rotate the incumbent out of some blocks entirely, and the incumbent being
  // at every table is what makes this the primary signal.
  const opponentsFor = (weights) => {
    const incumbentSpec = { id: "incumbent", weights };
    return mixed ? [incumbentSpec, ...GAUNTLET].slice(0, players - 1) : [incumbentSpec];
  };

  // The gauntlet profile the veto compares against. Measured once here, and
  // thereafter inherited from whichever candidate was accepted — that
  // candidate's own numbers are already in hand, so an acceptance costs one
  // gauntlet sweep rather than two.
  let profile = gauntletGames > 0 ? await runGauntlet(incumbent, 0, gauntletGames) : {};
  if (gauntletGames > 0) console.log(`incumbent gauntlet: ${profileLine(profile)}   (${elapsed()})`);

  const history = [{ iteration: 0, weights: incumbent, profile }];
  // Seeds every match ever played in this run draws from, bumped as it goes, so
  // no two matches share shuffles and no winner is one that merely memorised a
  // lucky set of them.
  let seedCursor = GAUNTLET.length * gauntletGames;

  for (let i = 1; i <= iterations; i += 1) {
    const candidate = mutate(incumbent, rng);
    const summary = summarise(await runMatch(candidate, opponentsFor(incumbent), seedCursor));
    seedCursor += games;
    // Beat the incumbent first: the whole interval above an even share, so the
    // candidate has to be better rather than merely luckier.
    const beatsIncumbent = summary.low > even;

    let candidateProfile = null;
    let regressed = [];
    if (beatsIncumbent && gauntletGames > 0) {
      candidateProfile = await runGauntlet(candidate, seedCursor, gauntletGames);
      seedCursor += GAUNTLET.length * gauntletGames;
      regressed = regressions(candidateProfile, profile);
    }
    const accepted = beatsIncumbent && regressed.length === 0;
    if (accepted) {
      incumbent = candidate;
      if (candidateProfile !== null) profile = candidateProfile;
    }

    const verdict = accepted ? "ACCEPT" : regressed.length > 0 ? `VETO (${regressed.join(", ")})` : "reject";
    console.log(`  ${String(i).padStart(3)}: vs incumbent ${fmt(summary)} ${verdict}   (${elapsed()})`);
    if (candidateProfile !== null) console.log(`       gauntlet: ${profileLine(candidateProfile)}`);
    for (const e of summary.errors) console.log(`       ERROR seed ${e.seed}: ${e.error}`);
    history.push({ iteration: i, weights: candidate, summary, profile: candidateProfile, regressed, accepted });
    if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ best: incumbent, players, profile, history }, null, 2));
  }

  console.log(`\nfinal vs v1: ${fmt(summarise(await runMatch(incumbent, [V1], seedCursor)))}`);
  console.log(JSON.stringify(incumbent, null, 2));
}
