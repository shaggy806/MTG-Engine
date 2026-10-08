// How strong each starter deck is when identical bots play it: every seat the
// same bot, four distinct decks a game drawn from all of `SAMPLE_DECKS`, and
// each deck's win rate and average finish. What decides which decks join
// `BENCH_DECKS` (`sample-decks.ts`'s `bench`) — a deck that loses every game
// measures nothing about a bot — and, beside a v1 run, which decks the search
// helps or struggles with.
//
//   npm run build -w engine
//   node engine/scripts/deck-winrates.mjs --rounds 30 [--bot v2|v1] [--players 4]
//     [--workers N] [--timeout SECONDS] [--out FILE]
//
// Tables: each round deals every deck once into tables of `players` (a seeded
// shuffle, so `rounds` rounds give every deck about the same number of
// tables), and each table is played `players` times with the decks rotated a
// seat, so seat order and play/draw cancel within it. Resumable: rows already
// in --out are skipped, and the summary is printed from the file.

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import os from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// `--pool upgraded`: the precons against their upgrades (`deck-pool.mjs`).
// Set before the pool module loads, and inherited by the workers.
const poolArg = process.argv.indexOf("--pool");
if (poolArg >= 0) process.env.DECK_POOL = process.argv[poolArg + 1];
const { SAMPLE_DECKS } = await import("../dist/index.js");
const { DECK_POOL } = await import("./deck-pool.mjs");
import { runPool } from "./worker-pool.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const bot = flag("bot", "v2");
const players = Math.min(4, Math.max(2, Number(flag("players", "4"))));
const rounds = Number(flag("rounds", "30"));
const workers = Number(flag("workers", String(Math.max(1, os.cpus().length - 4))));
const timeoutMs = Number(flag("timeout", "900")) * 1000;
const out = flag("out", join(ROOT, ".scratch", `deck-winrates-${bot}-${players}p${process.env.DECK_POOL ? `-${process.env.DECK_POOL}` : ""}.ndjson`));
mkdirSync(dirname(out), { recursive: true });

// Deterministic tables.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = rng(0xdec5 + players);
const n = DECK_POOL.length;
const stream = [];
for (let r = 0; r < rounds; r += 1) {
  const order = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  stream.push(...order);
}
const tables = [];
for (let i = 0; i + players <= stream.length; i += players) {
  const table = stream.slice(i, i + players);
  // A deck twice at one table (a round boundary): swap in the next distinct one.
  for (let a = 0; a < table.length; a += 1) {
    if (table.indexOf(table[a]) !== a) {
      const k = stream.findIndex((d, idx) => idx >= i + players && !table.includes(d));
      if (k >= 0) [table[a], stream[k]] = [stream[k], table[a]];
    }
  }
  tables.push(table);
}
const jobs = [];
tables.forEach((table, t) => {
  for (let rot = 0; rot < players; rot += 1) {
    jobs.push({ seed: t * players + rot + 1, decks: table.map((_, i) => table[(i + rot) % players]) });
  }
});

const done = new Set();
if (existsSync(out)) {
  for (const line of readFileSync(out, "utf8").split("\n")) if (line.trim()) done.add(JSON.parse(line).seed);
}
const queue = jobs.filter((j) => !done.has(j.seed));
console.log(
  `deck win rates — ${bot} in every seat, ${players}p, ${n} decks, ${jobs.length} games` +
    (done.size > 0 ? ` (${done.size} already in ${out})` : "") +
    `; ${workers} workers`,
);

function wilson(k, total) {
  if (total === 0) return [0, 0];
  const p = k / total;
  const z = 1.96;
  const d = 1 + (z * z) / total;
  const c = (p + (z * z) / (2 * total)) / d;
  const h = (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) / d;
  return [c - h, c + h];
}

function summary() {
  const rows = readFileSync(out, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const stats = new Map(DECK_POOL.map((d) => [d.name, { games: 0, wins: 0, finish: 0, finished: 0, winTurns: 0 }]));
  let unfinished = 0;
  for (const r of rows) {
    if (r.error || r.outcome === "timeout" || r.winner === undefined) unfinished += 1;
    if (!r.decks) continue;
    for (const d of r.decks) {
      const s = stats.get(d);
      if (!s) continue;
      s.games += 1;
      if (r.winner === d) {
        s.wins += 1;
        s.winTurns += r.turns;
      }
      // Finish: 1 for the winner, then up from the last knocked out; a game
      // with no winner (a draw, a timeout) counts nobody's finish.
      if (r.winner) {
        const place = r.winner === d ? 1 : r.decks.length - r.eliminated.indexOf(d);
        s.finish += place;
        s.finished += 1;
      }
    }
  }
  const even = 1 / players;
  const list = [...stats].map(([name, s]) => ({ name, ...s, rate: s.games ? s.wins / s.games : 0 }));
  list.sort((a, b) => b.rate - a.rate);
  console.log(`\n${"deck".padEnd(22)} games  wins   win%   95% CI         avg finish  win turn   (even ${(100 * even).toFixed(0)}%)`);
  for (const d of list) {
    const [lo, hi] = wilson(d.wins, d.games);
    const bench = SAMPLE_DECKS.find((x) => x.name === d.name)?.bench ? "*" : " ";
    console.log(
      `${bench}${d.name.padEnd(21)} ${String(d.games).padStart(5)} ${String(d.wins).padStart(5)}  ${(100 * d.rate).toFixed(1).padStart(5)}%  [${(100 * lo).toFixed(0).padStart(2)}, ${(100 * hi).toFixed(0).padStart(2)}]` +
        `       ${d.finished ? (d.finish / d.finished).toFixed(2) : " -  "}      ${d.wins ? (d.winTurns / d.wins).toFixed(0) : "-"}`,
    );
  }
  const turns = rows.filter((r) => r.turns).map((r) => r.turns);
  console.log(
    `\n${rows.length} games, ${unfinished} without a winner (draw, timeout or error); ` +
      `median length ${turns.sort((a, b) => a - b)[Math.floor(turns.length / 2)] ?? "-"} turns. * = bench deck.`,
  );
  console.log(`results: ${out}`);
}

let finished = done.size;
const record = (row) => {
  appendFileSync(out, JSON.stringify(row) + "\n");
  finished += 1;
  if (finished % 20 === 0) process.stderr.write(`  ${finished}/${jobs.length}\n`);
};
if (queue.length === 0) summary();
else
  runPool({
    url: new URL("./deck-winrates-worker.mjs", import.meta.url),
    workerData: { bot },
    jobs: queue,
    workers,
    timeoutMs,
    onMessage: (row) => record(row),
    onLost: (job, reason) =>
      record({ seed: job.seed, decks: job.decks.map((i) => DECK_POOL[i].name), outcome: reason === "timeout" ? "timeout" : "error", error: reason }),
    onDone: () => summary(),
  });
