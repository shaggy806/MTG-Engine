// Random-vs-random games: both seats pick uniformly from legalActions().
// Doubles as an engine fuzzer — if legalActions ever offers something dispatch
// refuses, this crashes.
//
//   npm run play:random -w engine
//   npm run play:random -w engine -- --games 50
//   npm run play:random -w engine -- --log        # print the last game's log
//   npm run play:random -w engine -- --players 3  # or 4 — exercises multi-opponent combat
//   npm run play:random -w engine -- --seed 19    # replay exactly one seed
//   npm run play:random -w engine -- --timeout 60 # per-game limit, seconds (default 30)
//   npm run play:random -w engine -- --with "Card Name"  # in every seat's deck
//   npm run play:random -w engine -- --games 100 --coverage  # how much of the pool the decks reach
//
// Every seed deals each seat its own 100-card Commander deck from the whole
// pool (`fuzz-decks.mjs`), so a new card needs no edit here to be fuzzed.
//
// Each game runs in a worker thread with a wall-clock limit. A game that
// never finishes is killed and reported as a failure naming its seed, instead
// of stalling the whole run — a runaway loop inside one `tick()` never yields,
// so nothing short of terminating the thread can stop it. Any failure (a
// timeout, or a thrown error) makes the process exit non-zero.

import { Worker } from "node:worker_threads";

import { Game, RandomController, asPlayerId, createRng } from "../dist/index.js";
import { coverage, seatsFor, unknownCards } from "./fuzz-decks.mjs";
import { printLog, printSummary } from "./format.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const games = Number(flag("games", "10"));
const showLog = args.includes("--log");
const numPlayers = Number(flag("players", "2"));
// Long runs print nothing until the very end, so a game that never terminates
// looks identical to one that's merely slow. `--progress` announces each seed
// on stderr *before* playing it — the last line printed names the culprit.
const showProgress = args.includes("--progress");
const onlySeed = flag("seed", null);
const timeoutMs = Number(flag("timeout", "30")) * 1000;

const A = asPlayerId("alice");
const B = asPlayerId("bob");
const C = asPlayerId("carol");
const D = asPlayerId("dave");

const players = [A, B, C, D].slice(0, numPlayers);
// Each seed builds its own decks: a commander and 99 cards drawn from the
// whole pool (`fuzz-decks.mjs`). `--with "Card"` (repeatable) puts a card in
// every seat's deck — the way to fuzz a card you just authored.
const forced = args.flatMap((a, i) => (a === "--with" && args[i + 1] !== undefined ? [args[i + 1]] : []));
const unknown = unknownCards(forced);
if (unknown.length > 0) {
  console.error(`--with: not a deckable pool card: ${unknown.join(", ")}`);
  process.exit(1);
}
const seatsForSeed = (seed) => seatsFor(seed, players, { forced });

const results = [];
const failures = [];

const workerUrl = new URL("./random-game-worker.mjs", import.meta.url);
const spawn = () => new Worker(workerUrl);
let worker = spawn();

/** Play one seed in the worker, or kill it after `timeoutMs`. */
const play = (seed) =>
  new Promise((resolve) => {
    const timer = setTimeout(() => {
      worker.removeAllListeners("message");
      // Terminate and replace: the thread may be stuck mid-tick forever.
      void worker.terminate();
      worker = spawn();
      resolve({ seed, ok: false, timedOut: true, ms: timeoutMs });
    }, timeoutMs);
    worker.once("message", (result) => {
      clearTimeout(timer);
      resolve(result);
    });
    worker.postMessage({ seed, seats: seatsForSeed(seed) });
  });

const seedsToPlay =
  onlySeed !== null
    ? [Number(onlySeed)]
    : Array.from({ length: games }, (_, k) => k + 1);

// `--coverage`: play nothing; say how much of the pool these seeds' decks hold.
if (args.includes("--coverage")) {
  const { total, seen, missing } = coverage(seedsToPlay, players);
  console.log(`${seedsToPlay.length} seeds x ${players.length} seats: ${seen}/${total} deckable cards in at least one deck`);
  if (missing.length > 0) console.log(`missing: ${missing.join(", ")}`);
  process.exit(0);
}

for (const seed of seedsToPlay) {
  if (showProgress) process.stderr.write(`seed ${seed}/${games}… `);
  const result = await play(seed);
  if (result.ok) {
    if (showProgress) {
      process.stderr.write(`${result.turns} turns, ${result.events} events, ${result.ms}ms\n`);
    }
    results.push(result);
  } else if (result.timedOut) {
    const line = `FAILED seed ${seed}: TIMED OUT after ${timeoutMs / 1000}s (replay with --seed ${seed})`;
    process.stderr.write(`${showProgress ? "\n" : ""}${line}\n`);
    failures.push(line);
  } else {
    const line = `FAILED seed ${seed}: ${result.error}`;
    process.stderr.write(`${showProgress ? "\n" : ""}${line}\n`);
    failures.push(`FAILED seed ${seed} (replay with --seed ${seed})`);
  }
}
await worker.terminate();

// `--log` needs the Game object itself, which can't cross the worker boundary.
// Games are deterministic per seed, so replay the last successful one here.
let last = null;
if (showLog && results.length > 0) {
  const seed = results[results.length - 1].seed;
  const seats = seatsForSeed(seed);
  const rng = createRng(seed * 7919);
  const pick = () => rng.next();
  last = Game.create({
    seed,
    mulligans: true,
    controllers: Object.fromEntries(
      seats.map(({ player }) => [player, new RandomController(player, pick)]),
    ),
    decks: seats,
  });
  last.advance();
}

if (showLog && last !== null) {
  printLog(last);
  printSummary(last);
  console.log("");
}

console.log(`seed  winner  turns  events  reason`);
for (const r of results) {
  console.log(
    `${String(r.seed).padStart(4)}  ${String(r.winner).padEnd(6)}  ${String(
      r.turns,
    ).padStart(5)}  ${String(r.events).padStart(6)}  ${r.reason}`,
  );
}

const wins = (who) => results.filter((r) => r.winner === who).length;
console.log("");
const tally = players
  .map((player) => `${player} ${wins(player)}`)
  .concat(`draws ${wins("draw")}`)
  .join(", ");
console.log(`${results.length} games — ${tally}`);
console.log(
  `avg turns ${(results.reduce((s, r) => s + r.turns, 0) / Math.max(1, results.length)).toFixed(1)}`,
);
if (failures.length > 0) {
  console.log("");
  console.log(`${failures.length} FAILED:`);
  for (const f of failures) console.log(`  ${f}`);
  process.exitCode = 1;
}
