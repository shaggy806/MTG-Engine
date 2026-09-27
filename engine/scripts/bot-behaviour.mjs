// What a person watching the bots play would notice, counted.
//
//   npm run bot:behaviour -w engine                    # 24 four-player v2 games at the live 300 ms budget
//   npm run bot:behaviour -w engine -- --games 40 --players 2
//   npm run bot:behaviour -w engine -- --budget none --workers 18   # count budgets: exact, and faster
//   npm run bot:behaviour -w engine -- --bot v1
//   npm run bot:behaviour -w engine -- --budget none --weights '{"idlePower":0}'
//
// A win rate says whether a bot got stronger, needs hundreds of four-player
// games to say it (±4 points at 400), and can't say why. This counts the
// things that decide whether a bot looks like it knows what it's doing, from
// a few dozen self-play games:
//
// - **Wrong-side targets**: harm aimed at its own side, help at an opponent's,
//   judged by `target-polarity.ts` — and whether a right-side target was legal.
//   Found 22% for v1 and 11% for v2 before the aiming work
//   (`docs/plans/bot-effect-knowledge.md`).
// - **Idle turns**: its own last main phase passed with a sorcery-speed spell
//   still castable, and the cards it kept.
// - **Skipped land drops**.
// - **Time**, by kind of window — dead ones (nothing to do), mana-only ones,
//   real choices, decisions and combat — against the room's budget.
//
// Every seat is the same bot, dealt the precon seatings `bot-seating.mjs`
// deals. `--budget MS` is a wall-clock budget per decision (default 300, what
// live rooms use); timing under it depends on how busy the machine is, which
// is why this defaults to 8 workers rather than one per core. `--budget none`
// runs count budgets only, where the games replay exactly and any worker count
// gives the same numbers.
//
// `--weights JSON` merges overrides onto `DEFAULT_WEIGHTS`, as `bot:bench`'s
// does, so two vectors can be compared on the same seeds; with `--budget none`
// every difference between the two reports is the weights'.
//
// Flags: --games N, --players 2-4, --workers N, --budget MS|none, --bot v1|v2,
// --weights JSON, --first SEED, --timeout SECONDS (per game, default 900),
// --json PATH (every game's raw counts).

import { Worker } from "node:worker_threads";
import { writeFileSync } from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { DEFAULT_WEIGHTS } from "../dist/index.js";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};

const players = Math.min(4, Math.max(2, Number(flag("players", "4"))));
const games = Number(flag("games", "24"));
const bot = flag("bot", "v2");
const budgetFlag = flag("budget", "300");
const budget = budgetFlag === "none" ? null : Number(budgetFlag);
const defaultWorkers = budget === null ? os.cpus().length - 2 : 8;
const workers = Math.max(1, Math.min(Number(flag("workers", String(defaultWorkers))), games));
const first = Number(flag("first", "1"));
const timeoutMs = Number(flag("timeout", "900")) * 1000;
const jsonOut = flag("json", null);
const weightsFlag = flag("weights", null);
const weights = weightsFlag === null ? null : JSON.parse(weightsFlag);
for (const key of Object.keys(weights ?? {})) {
  if (!(key in DEFAULT_WEIGHTS)) throw new Error(`--weights: unknown weight "${key}"`);
}
if (weights !== null && bot === "v1") throw new Error("--weights: v1 has no weights");

const WORKER = fileURLToPath(new URL("./bot-behaviour-worker.mjs", import.meta.url));
const started = Date.now();
const results = [];
let next = first;
const last = first + games - 1;
let running = 0;

console.log(
  `bot:behaviour — ${games} ${players}-player games of ${bot}, budget ${budget === null ? "none (count only)" : `${budget} ms`}, ${workers} workers`,
);
if (weights !== null) console.log(`weights: ${weightsFlag}`);

function spawn() {
  const worker = new Worker(WORKER);
  let timer = null;
  let seed = null;
  running += 1;
  const feed = () => {
    if (next > last) {
      worker.terminate();
      running -= 1;
      if (running === 0) finish();
      return;
    }
    seed = next;
    next += 1;
    timer = setTimeout(() => {
      results.push({ seed, error: `timeout after ${timeoutMs / 1000}s` });
      process.stderr.write(`seed ${seed} timed out\n`);
      worker.terminate();
      running -= 1;
      if (next <= last) spawn();
      else if (running === 0) finish();
    }, timeoutMs);
    worker.postMessage({ seed, players, bot, budget, weights });
  };
  worker.on("message", (message) => {
    clearTimeout(timer);
    results.push(message);
    const elapsed = ((Date.now() - started) / 1000).toFixed(0);
    process.stderr.write(
      message.error
        ? `[${elapsed}s] ${results.length}/${games} seed ${message.seed} ERROR ${message.error.split("\n")[0]}\n`
        : `[${elapsed}s] ${results.length}/${games} seed ${message.seed}: ${message.turns} turns, ${(message.ms / 1000).toFixed(1)}s\n`,
    );
    feed();
  });
  worker.on("error", (error) => {
    clearTimeout(timer);
    results.push({ seed, error: String(error) });
    running -= 1;
    if (next <= last) spawn();
    else if (running === 0) finish();
  });
  feed();
}

let finished = false;
function finish() {
  if (finished) return;
  finished = true;
  if (jsonOut !== null) writeFileSync(jsonOut, JSON.stringify(results, null, 1));
  report();
}

const pct = (part, whole) => (whole === 0 ? "—" : `${((100 * part) / whole).toFixed(1)}%`);
const top = (counts, n) =>
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);

function report() {
  const ok = results.filter((r) => !r.error);
  const failed = results.filter((r) => r.error);
  const sum = {
    windows: {},
    ms: {},
    maxMs: {},
    overBudget: {},
    simulations: {},
    idleCards: {},
    wrongCards: {},
    ownTurns: 0,
    idleTurns: 0,
    landSkips: 0,
    targeted: 0,
    wrongSide: 0,
    avoidable: 0,
  };
  const add = (into, from) => {
    for (const [k, v] of Object.entries(from)) into[k] = (into[k] ?? 0) + v;
  };
  for (const r of ok) {
    const s = r.stats;
    for (const key of ["windows", "ms", "overBudget", "simulations", "idleCards", "wrongCards"]) add(sum[key], s[key]);
    for (const [k, v] of Object.entries(s.maxMs)) sum.maxMs[k] = Math.max(sum.maxMs[k] ?? 0, v);
    for (const key of ["ownTurns", "idleTurns", "landSkips", "targeted", "wrongSide", "avoidable"]) sum[key] += s[key];
  }
  const turns = ok.reduce((a, r) => a + r.turns, 0);
  const gameMs = ok.reduce((a, r) => a + r.ms, 0);
  const totalMs = Object.values(sum.ms).reduce((a, b) => a + b, 0);

  console.log(
    `\n${ok.length} games (${failed.length} failed), mean ${(turns / Math.max(1, ok.length)).toFixed(1)} turns, ${(gameMs / Math.max(1, ok.length) / 1000).toFixed(1)}s a game, ${((Date.now() - started) / 1000).toFixed(0)}s in all`,
  );
  for (const r of failed) console.log(`  failed: seed ${r.seed}: ${String(r.error).split("\n")[0]}`);

  console.log("\ntime, by kind of window:");
  const labels = {
    dead: "nothing to do",
    manaOnly: "mana only",
    real: "a real choice",
    decision: "a decision",
    combat: "attack/block",
  };
  for (const kind of ["dead", "manaOnly", "real", "decision", "combat"]) {
    const n = sum.windows[kind] ?? 0;
    const ms = sum.ms[kind] ?? 0;
    console.log(
      `  ${labels[kind].padEnd(14)} ${String(n).padStart(7)} windows  ${(ms / Math.max(1, n)).toFixed(1).padStart(6)} ms mean  ${(sum.maxMs[kind] ?? 0).toFixed(0).padStart(5)} ms max  ${pct(ms, totalMs).padStart(6)} of the time${
        budget === null ? "" : `  ${pct(sum.overBudget[kind] ?? 0, n).padStart(6)} over budget`
      }`,
    );
  }
  if (Object.keys(sum.simulations).length > 0) {
    const order = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"];
    console.log(
      `  simulations per real choice: ${order.filter((k) => sum.simulations[k]).map((k) => `${k}:${sum.simulations[k]}`).join("  ")}`,
    );
  }

  console.log(
    `\ntargets: ${sum.targeted} aimed where the side matters, ${sum.wrongSide} (${pct(sum.wrongSide, sum.targeted)}) at the wrong side, ${sum.avoidable} of those with a right-side target legal`,
  );
  for (const [key, n] of top(sum.wrongCards, 12)) console.log(`  ${String(n).padStart(4)}x ${key}`);

  console.log(
    `\nown turns: ${sum.ownTurns}; ended with a sorcery-speed spell castable and unplayed: ${sum.idleTurns} (${pct(sum.idleTurns, sum.ownTurns)}); land drops skipped: ${sum.landSkips}`,
  );
  const idle = top(sum.idleCards, 12);
  if (idle.length > 0) console.log(`  most often kept: ${idle.map(([name, n]) => `${name} ${n}`).join(", ")}`);
}

for (let i = 0; i < workers; i += 1) spawn();
