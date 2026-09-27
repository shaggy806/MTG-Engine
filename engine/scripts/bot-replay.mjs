// Play one bench seed with the current bots and watch it: every slow
// decision and every activation, with its step and the stack, and each turn's
// time and life totals. With --snapshot-at, save the game at the start of that
// turn; with --from, start from a saved snapshot instead of from turn 1 — the
// way to study a slow or odd turn without replaying forty others each time
// (seed 50: `docs/plans/bot-effect-knowledge.md`, "After the plan").
//
//   npm run bot:replay -w engine -- --seed 50 --snapshot-at 40
//   npm run bot:replay -w engine -- --from .scratch/replays/seed-50-t40.json --until 41
//
// Flags: --seed N, --players 2-4 (default 4), --bot v1|v2 (default v2, on
// every seat, count budgets), --snapshot-at TURN (saves to
// .scratch/replays/seed-N-tTURN.json and plays on), --from FILE, --until TURN
// (stop once this turn begins), --slow MS (log decisions slower than this,
// default 2000), --quiet-before TURN (log only from this turn on).
//
// Turn numbers count every player's turns: at four players turn 37 is the
// first player's tenth.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";

import {
  COMMANDER_RULES,
  EvalBotController,
  Game,
  HeuristicBotController,
  createDefaultRegistry,
  describeMove,
} from "../dist/index.js";
import { ROOT } from "./baseline-build.mjs";
import { tableFor } from "./bot-seating.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const seed = Number(flag("seed", "1"));
const players = Math.min(4, Math.max(2, Number(flag("players", "4"))));
const bot = flag("bot", "v2");
const snapshotAt = flag("snapshot-at", null) === null ? null : Number(flag("snapshot-at", null));
const from = flag("from", null);
const until = flag("until", null) === null ? Infinity : Number(flag("until", null));
const slowMs = Number(flag("slow", "2000"));
const quietBefore = Number(flag("quiet-before", "0"));

const registry = createDefaultRegistry();
const controllersFor = (seats) => {
  const controllers = {};
  for (const seat of seats) {
    const c =
      bot === "v1" ? new HeuristicBotController(seat, registry) : new EvalBotController(seat, registry, {});
    const act = c.act.bind(c);
    c.act = (view) => {
      const t0 = performance.now();
      const action = act(view);
      const ms = performance.now() - t0;
      const s = view.state;
      if (s.turn.number >= quietBefore && (action.type === "activate-ability" || ms > slowMs)) {
        const sims = c.lastDecision?.simulations;
        console.log(
          `  t${s.turn.number} ${seat} ${s.turn.step}${s.awaiting ? ` (${s.awaiting.kind})` : ""} stack=${s.zones.shared.stack.length}` +
            ` -> ${describeMove(s, action, registry)} (${ms.toFixed(0)}ms${sims !== undefined ? `, ${sims} sims` : ""})`,
        );
      }
      return action;
    };
    controllers[seat] = c;
  }
  return controllers;
};

let game;
if (from !== null) {
  const snapshot = JSON.parse(readFileSync(from, "utf8"));
  game = Game.fromSnapshot(snapshot, { registry, controllers: controllersFor(snapshot.turnOrder) });
  console.log(`bot:replay — ${bot}, from ${from} (turn ${game.state.turn.number}, ${game.state.turn.step})`);
} else {
  const { seats, decks } = tableFor(seed, players);
  console.log(`bot:replay — ${bot}, seed ${seed}, ${players}p: ${seats.map((s, i) => `${s} ${decks[i].name}`).join(", ")}`);
  game = Game.create({
    seed,
    registry,
    controllers: controllersFor(seats),
    mulligans: true,
    rules: COMMANDER_RULES,
    decks: seats.map((player, i) => ({ player, cards: decks[i].cards, commander: decks[i].commander })),
  });
}

const started = performance.now();
let turnStart = started;
let turn = game.state.turn.number;
let saved = false;
game.advanceUntil((s) => {
  if (s.turn.number !== turn) {
    const now = performance.now();
    if (turn >= quietBefore) {
      console.log(
        `TURN ${turn} ${((now - turnStart) / 1000).toFixed(0)}s — ` +
          s.turnOrder.map((p) => `${p} ${s.players[p].life}${s.players[p].hasLost ? " (out)" : ""}`).join(", "),
      );
    }
    turn = s.turn.number;
    turnStart = now;
  }
  if (snapshotAt !== null && !saved && s.turn.number >= snapshotAt) {
    const dir = join(ROOT, ".scratch", "replays");
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `seed-${seed}-t${s.turn.number}.json`);
    writeFileSync(file, JSON.stringify({ ...game.snapshot(), eventLog: [] }));
    console.log(`snapshot at turn ${s.turn.number} (${s.turn.step}): ${file}`);
    saved = true;
  }
  return s.result.over || s.turn.number >= until;
});
const total = ((performance.now() - started) / 1000).toFixed(0);
console.log(
  game.state.result.over
    ? `GAME OVER — ${game.winner ?? "draw"} wins at turn ${game.state.turn.number}, ${total}s`
    : `stopped at turn ${game.state.turn.number}, ${total}s`,
);
process.exit(0);
