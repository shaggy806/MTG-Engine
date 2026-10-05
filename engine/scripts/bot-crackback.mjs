// How often a bot that attacks dies to the crackback — the opponents' turns
// between its swing and its next untap — when the table wasn't showing lethal.
//
//   npm run bot:crackback -w engine                       # 200 four-player v2 self-play games
//   npm run bot:crackback -w engine -- --games 400 --players 2
//   npm run bot:crackback -w engine -- --weights '{"crackbackGrowth":0}' --out .scratch/crackback-growth0-4p.ndjson
//   npm run bot:crackback -w engine -- --report .scratch/crackback-v2-4p.ndjson   # report a finished run
//
// Every seat is v2 (`EvalBotController`, count budgets, so a seed replays
// exactly), dealt the precon seatings `bot-seating.mjs` deals. Each attack
// declaration with something able to attack is logged with:
//
// - **What it sent**: everything able to attack ("full"), some ("partial") or
//   nothing.
// - **What the table showed**, read by `combat-math.ts`'s blocking arithmetic
//   three ways — the next opponent alone, every opponent all-in, and the
//   bot's own check (the rest at `crackbackParanoia`, `crackbackMargin` held
//   back, `crackbackGrowth` left out so readings compare across vectors) —
//   on three boards: holding everything back, the declaration (what it kept
//   home, before combat), and the **handoff**, the board the opponents
//   actually got once its turn ended (blockers dead, players it killed gone).
// - **Whether it died before its next turn**, and how: combat damage from
//   creatures on the board at the swing, from ones that arrived after it,
//   noncombat damage and drain; haste (a creature that hit it the turn it
//   arrived), native or granted; and the haste enablers its opponents
//   showed at the swing (Swiftfoot Boots, Anger in a graveyard, …).
//
// First run, 2026-10-05 (198 games): 2.7% of full swings that showed no
// lethal all-in died anyway — 0.4% at 31+ life, 26% at 10 or less — mostly to
// creatures already on the board hitting harder than shown; haste decided 10
// of 70. It's what `EvalWeights.crackbackGrowth` came from.
//
// Flags: --games N (default 200), --players 2-4 (4), --workers N (cores - 2),
// --first SEED (1), --weights JSON (merged onto DEFAULT_WEIGHTS, every seat),
// --timeout SECONDS per game (900), --out FILE (resumable NDJSON, default
// .scratch/crackback-v2-<players>p.ndjson), --report FILE (report only).

import { Worker } from "node:worker_threads";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import os from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { WORKER_LIMITS } from "./worker-limits.mjs";
import { DEFAULT_WEIGHTS } from "../dist/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};

const reportOnly = flag("report", null);
const players = Math.min(4, Math.max(2, Number(flag("players", "4"))));
const games = Number(flag("games", "200"));
const first = Number(flag("first", "1"));
const workers = Math.max(1, Math.min(Number(flag("workers", String(Math.max(1, os.cpus().length - 2)))), games));
const timeoutMs = Number(flag("timeout", "900")) * 1000;
const weightsFlag = flag("weights", null);
const weights = weightsFlag === null ? null : JSON.parse(weightsFlag);
for (const key of Object.keys(weights ?? {})) {
  if (!(key in DEFAULT_WEIGHTS)) throw new Error(`--weights: unknown weight "${key}"`);
}
const out = reportOnly ?? flag("out", join(ROOT, ".scratch", `crackback-v2-${players}p.ndjson`));

const readRows = (file) =>
  existsSync(file)
    ? readFileSync(file, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line))
    : [];

if (reportOnly !== null) {
  report(readRows(reportOnly));
} else {
  run();
}

function run() {
  mkdirSync(dirname(out), { recursive: true });
  const previous = readRows(out);
  for (const row of previous) {
    if (JSON.stringify(row.weights ?? null) !== JSON.stringify(weights)) {
      throw new Error(`${out} holds games played with other weights (${JSON.stringify(row.weights)}); pass another --out`);
    }
  }
  const done = new Set(previous.map((row) => row.seed));
  const queue = [];
  for (let seed = first; seed < first + games; seed += 1) if (!done.has(seed)) queue.push(seed);
  console.log(
    `bot:crackback — ${games} ${players}-player v2 self-play games, ${workers} workers${
      weights === null ? "" : `, weights ${weightsFlag}`
    }; ${done.size} already in ${out}`,
  );
  const started = Date.now();
  const total = queue.length;
  let finished = 0;
  let running = 0;
  if (total === 0) {
    report(readRows(out));
    return;
  }
  const record = (row) => {
    appendFileSync(out, `${JSON.stringify(row)}\n`);
    finished += 1;
    const elapsed = ((Date.now() - started) / 1000).toFixed(0);
    process.stderr.write(
      `[${elapsed}s] ${finished}/${total} seed ${row.seed}: ${row.error ? `ERROR ${row.error.split("\n")[0]}` : `${row.turns} turns`}\n`,
    );
  };
  const spawn = () => {
    if (queue.length === 0) return;
    const worker = new Worker(new URL("./bot-crackback-worker.mjs", import.meta.url), { resourceLimits: WORKER_LIMITS });
    running += 1;
    let timer = null;
    let seed = null;
    const stop = () => {
      worker.terminate();
      running -= 1;
      if (queue.length > 0) spawn();
      else if (running === 0) report(readRows(out));
    };
    const feed = () => {
      if (queue.length === 0) {
        worker.terminate();
        running -= 1;
        if (running === 0) report(readRows(out));
        return;
      }
      seed = queue.shift();
      timer = setTimeout(() => {
        record({ seed, weights, error: `timeout after ${timeoutMs / 1000}s` });
        stop();
      }, timeoutMs);
      worker.postMessage({ seed, players, weights });
    };
    worker.on("message", (row) => {
      clearTimeout(timer);
      record(row);
      feed();
    });
    worker.on("error", (error) => {
      clearTimeout(timer);
      record({ seed, weights, error: String(error) });
      stop();
    });
    feed();
  };
  for (let i = 0; i < Math.min(workers, total); i += 1) spawn();
}

function report(rows) {
  const ok = rows.filter((row) => !row.error);
  const failed = rows.filter((row) => row.error);
  const recs = ok.flatMap((g) => g.records.filter((r) => !r.unresolved).map((r) => ({ ...r, seed: g.seed, seats: g.seats })));
  const kind = (r) => (r.sent === 0 ? "none" : r.sent >= r.eligible ? "full" : "partial");
  const wilson = (k, n) => {
    const z = 1.96;
    const p = k / n;
    const d = 1 + (z * z) / n;
    const c = (p + (z * z) / (2 * n)) / d;
    const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
    return `[${(100 * Math.max(0, c - h)).toFixed(1)}–${(100 * Math.min(1, c + h)).toFixed(1)}]`;
  };
  const line = (label, list) => {
    const died = list.filter((r) => r.died).length;
    const rate = list.length === 0 ? "     —" : `${((100 * died) / list.length).toFixed(1)}%`.padStart(6);
    console.log(
      `  ${label.padEnd(52)} ${String(list.length).padStart(5)} swings ${String(died).padStart(4)} died ${rate} ${list.length === 0 ? "" : wilson(died, list.length)}`,
    );
  };
  const tally = (list, key) => {
    const counts = {};
    for (const r of list) {
      const k = key(r);
      counts[k] = (counts[k] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ${n}`)
      .join(", ");
  };
  const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? "—";

  console.log(
    `\n${ok.length} games (${failed.length} failed), ${recs.length} attack decisions with something able to attack`,
  );
  for (const row of failed) console.log(`  failed: seed ${row.seed}: ${String(row.error).split("\n")[0]}`);
  if (recs.length === 0) return;

  console.log("\ndied before its next turn, by what it sent and whether every opponent all-in was lethal through what it kept home:");
  for (const k of ["full", "partial", "none"]) {
    const of = recs.filter((r) => kind(r) === k);
    line(`${k}, not showing lethal`, of.filter((r) => !r.swinging.lethalAll));
    line(`${k}, showing lethal`, of.filter((r) => r.swinging.lethalAll));
  }
  const safe = recs.filter((r) => kind(r) === "full" && !r.swinging.lethalAll);
  line("full, kept nothing home that could block", safe.filter((r) => r.home === 0 && r.couldBlock > 0));
  line("full, passing the bot's own check", recs.filter((r) => kind(r) === "full" && !r.swinging.lethalBot));

  console.log("\nfull swings not showing lethal, by life:");
  for (const [lo, hi] of [[1, 10], [11, 20], [21, 30], [31, Infinity]]) {
    line(`life ${lo}${hi === Infinity ? "+" : `–${hi}`}`, safe.filter((r) => r.swinging.life >= lo && r.swinging.life <= hi));
  }
  console.log("by the bot's own projected crackback, as a share of its life:");
  for (const [lo, hi] of [[0, 0.25], [0.25, 0.5], [0.5, 0.75], [0.75, Infinity]]) {
    line(
      `${lo * 100}${hi === Infinity ? "%+" : `–${hi * 100}%`}`,
      safe.filter((r) => r.swinging.botThrough / r.swinging.life >= lo && r.swinging.botThrough / r.swinging.life < hi),
    );
  }
  console.log("by players alive:");
  for (const alive of [2, 3, 4].filter((n) => n <= Math.max(...recs.map((r) => r.swinging.alive)))) {
    line(`${alive} alive`, safe.filter((r) => r.swinging.alive === alive));
  }

  // Full swings into a board showing lethal: a race because holding back was
  // lost too, or a swing the board it handed over says was safe after all
  // (it killed a player, or the blockers that would have hit it died).
  const into = recs.filter((r) => kind(r) === "full" && r.swinging.lethalAll);
  if (into.length > 0) {
    console.log("\nfull swings into a board showing lethal:");
    const raced = into.filter((r) => r.holdingBack.lethalBot);
    const rest = into.filter((r) => !r.holdingBack.lethalBot);
    line("dead anyway by its own check: a race", raced);
    line("holding back safe; handoff board safe by its check", rest.filter((r) => r.handoff && !r.handoff.lethalBot));
    line("holding back safe; handoff board lethal by its check", rest.filter((r) => r.handoff?.lethalBot));
    line("holding back safe; died before handing over", rest.filter((r) => r.handoff === null));
  }

  const deaths = safe.filter((r) => r.died);
  if (deaths.length === 0) return;
  console.log(`\nthe ${deaths.length} deaths after a full swing not showing lethal:`);
  console.log(`  life at the swing ${median(deaths.map((r) => r.swinging.life))}, projected all-in ${median(deaths.map((r) => r.swinging.allThrough))}, actually lost ${median(deaths.map((r) => r.died.lifeLost))} (medians)`);
  const why = (r) => {
    const d = r.died;
    if (d.onTurnOf === r.seat) return "on its own turn";
    if (d.onBoard >= r.swinging.life && d.onBoard > r.swinging.allThrough) return "creatures on the board hit harder than shown";
    if (d.onBoard + d.arrived >= r.swinging.life && d.arrived > 0) return "creatures that arrived after the swing";
    if (d.noncombat > 0 || d.lifeLost > d.onBoard + d.arrived) return "noncombat damage or drain";
    return "other";
  };
  console.log(`  what the projection missed: ${tally(deaths, why)}`);
  console.log(
    `  died on the turn of the opponent: ${tally(deaths, (r) => {
      const n = (r.seats.indexOf(r.died.onTurnOf) - r.seats.indexOf(r.seat) + r.seats.length) % r.seats.length;
      return n === 0 ? "its own" : ["", "next", "second", "third"][n];
    })}`,
  );
  console.log(`  opponents who damaged it: ${tally(deaths, (r) => r.died.opponents)}`);
  const hasty = (r) => r.died.hastyNative + r.died.hastyGranted;
  console.log(
    `  haste: hasty attackers hit it in ${deaths.filter((r) => hasty(r) > 0).length}, decided it in ${
      deaths.filter((r) => hasty(r) > 0 && r.died.lifeLost - hasty(r) < r.swinging.life).length
    } (damage native ${deaths.reduce((s, r) => s + r.died.hastyNative, 0)}, granted ${deaths.reduce((s, r) => s + r.died.hastyGranted, 0)})`,
  );
  line("haste enabler showing at the swing", safe.filter((r) => r.hasteEnablers.length > 0));
  line("no haste enabler showing", safe.filter((r) => r.hasteEnablers.length === 0));
}
