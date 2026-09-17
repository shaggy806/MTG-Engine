// Harvest a training set from self-play, for `fit-weights.mjs`.
//
//   npm run bot:harvest -w engine -- --games 2000 --out data/positions.ndjson
//   npm run bot:harvest -w engine -- --pairs --games 2000 --out data/pairs.ndjson
//
// Two modes, and the difference between them is the difference between
// correlation and causation:
//
// - **positions** (default) — every turn boundary of a game, labelled with
//   whether that seat went on to win. Cheap: ~20 labels per game. Teaches a
//   model to recognise a winning *position*, which is not the same as
//   recognising a good *move*, and the gap is where the evaluation goes wrong
//   (see `fit-weights.mjs`).
// - **`--pairs`** — stop at a decision point, take two of the concrete actions
//   available there, play both out, and label which won. The two continuations
//   descend from the same position, so every confound about how far along the
//   game is cancels in the difference. **A working prototype, not yet a usable
//   training set** — the labels come out overwhelmingly tied, and
//   `harvest-pairs-worker.mjs` documents why and what to try next.
//
// Flags: --games N, --out PATH (NDJSON, one line per game), --workers N,
// --timeout SECONDS (per game, default 300), --seed-offset N (so a second run
// produces held-out games rather than the same ones), --weights JSON (the
// policy that plays; defaults to the current `DEFAULT_WEIGHTS`), --opponent
// v1|self (default self; positions mode only), --max-turns N (turn boundaries
// visited per game, default 60), --horizon, --rollout, --bot-options (as
// `tune-bot.mjs`). Pairs mode also takes --pairs-per-game N (default 3),
// --playouts N per sibling (default 20) and --playout-turns N (default 0, play
// to the end; above zero truncates and scores the leaf with the evaluation).
//
// ## Why this exists
//
// The (1+1)-ES in `tune-bot.mjs` learns one accept/reject *bit* per match, and
// a match is 200 games. Thirty iterations is thirty bits with which to fit a
// two-dozen-dimensional weight vector, which is why hand-picked defaults were
// never convincingly beaten.
//
// The same games contain far more than that. Every position a game passes
// through is a labelled example the moment the game ends — this seat went on to
// win, or it didn't — so one 20-turn game yields ~20 of them instead of a
// fraction of a bit. A few thousand games is ~100k labelled positions, and a
// logistic regression over them (`fit-weights.mjs`) reads the weights straight
// off, as log-odds contributions to winning.
//
// The games are the only real cost, and they're games the ES would have played
// anyway. See `docs/plans/smarter-bots.md`, "Fitting the weights from
// self-play".

import os from "node:os";
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { createWriteStream, mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { DEFAULT_WEIGHTS } from "../dist/index.js";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};

const pairsMode = args.includes("--pairs");
const WORKER = fileURLToPath(
  new URL(pairsMode ? "./harvest-pairs-worker.mjs" : "./harvest-worker.mjs", import.meta.url),
);
const pairsPerGame = Number(flag("pairs-per-game", "3"));
const playoutsPerSide = Number(flag("playouts", "20"));
const playoutTurns = Number(flag("playout-turns", "0"));

const games = Math.ceil(Number(flag("games", "1000")) / 2) * 2;
const out = flag("out", "data/positions.ndjson");
const timeoutMs = Number(flag("timeout", "300")) * 1000;
const seedOffset = Number(flag("seed-offset", "0"));
const maxTurns = Number(flag("max-turns", "60"));
const horizon = flag("horizon", "turn");
const rollout = flag("rollout", undefined);
const botOptions = JSON.parse(flag("bot-options", "{}"));
const workers = Math.max(1, Math.min(Number(flag("workers", String(os.cpus().length - 2))), os.cpus().length));
const weights = { ...DEFAULT_WEIGHTS, ...JSON.parse(flag("weights", "{}")) };
for (const key of Object.keys(weights)) {
  if (!(key in DEFAULT_WEIGHTS)) throw new Error(`--weights: unknown weight "${key}"`);
}
// `v1` puts the heuristic bot in the other seat. Self-play keeps the
// distribution on-policy, which is what the fit wants; v1 games are a cheap way
// to widen it, since a bot that only ever meets itself never sees the positions
// a different policy walks into.
const opponentWeights = flag("opponent", "self") === "v1" ? null : weights;

mkdirSync(dirname(out), { recursive: true });
const sink = createWriteStream(out);

const startedAt = Date.now();
let done = 0;
let rows = 0;
let errors = 0;

await new Promise((resolve) => {
  let next = 0;

  const finish = (result) => {
    done += 1;
    if (result.error !== undefined) {
      errors += 1;
      console.error(`  ERROR seed ${result.seed}: ${result.error}`);
    } else {
      rows += pairsMode ? result.pairs.length : result.positions.length * 2;
      sink.write(`${JSON.stringify(result)}\n`);
    }
    if (done % 50 === 0 || done === games) {
      const secs = (Date.now() - startedAt) / 1000;
      console.log(
        `  ${done}/${games} games, ${rows} rows, ${errors} errors, ${secs.toFixed(0)}s (${(done / secs).toFixed(1)}/s)`,
      );
    }
    if (done === games) resolve();
  };

  const spawn = () => {
    const worker = new Worker(WORKER);
    let timer = null;
    let seed = null;

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
      worker.postMessage({
        seed,
        weights,
        opponentWeights,
        horizon,
        rollout,
        botOptions,
        // In positions mode this caps how many turn boundaries are sampled. In
        // pairs mode it caps which *decisions* the reservoir can see, and a
        // low cap would confine every sample to the opening — reservoir
        // sampling needs no cap to stay bounded, so it gets none.
        maxTurns: pairsMode ? Number.MAX_SAFE_INTEGER : maxTurns,
        pairsPerGame,
        playoutsPerSide,
        playoutTurns,
      });
    };

    worker.on("message", (result) => {
      clearTimeout(timer);
      finish(result);
      pump();
    });
    worker.on("error", (error) => {
      worker.removeAllListeners();
      clearTimeout(timer);
      finish({ seed, error: `worker crashed: ${error?.message ?? error}` });
      spawn();
    });
    pump();
  };

  console.log(
    `harvest ${pairsMode ? "pairs" : "positions"}: ${games} games, ` +
      `seeds ${seedOffset + 1}-${seedOffset + games}, ${workers} workers -> ${out}`,
  );
  for (let i = 0; i < Math.min(workers, games); i += 1) spawn();
});

sink.end();
console.log(`done: ${rows} rows from ${games - errors} games in ${((Date.now() - startedAt) / 1000).toFixed(0)}s`);
