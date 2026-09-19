// How often does v3 actually plan its turn, and when does it stop?
//
//   npm run bot:census -w engine
//   npm run bot:census -w engine -- --players 4 --games 6 --budget 1000 --turns 14
//
// `bot:plan` inspects one position deeply. This is the other question: across
// whole games, how many of the bot's own turns does the plan search actually
// decide, and how many fall through to v2? Both are "v3 played the turn" from
// the outside, and they are not the same thing at all.
//
// A turn reaches v2 four different ways, only one of which is a failure:
//
//   planned     the search ran and beat v1's plan — v3 proper
//   kept-v1     the search ran, found nothing better, adopted v1's plan
//   empty       the search ran and chose to do nothing (a real decision, and
//               the one that shows up as a bot passing a whole turn)
//   failed      the search never got off the ground (no evaluation fit in the
//               budget, or the position couldn't be resampled) — v2 takes the
//               turn
//
// The per-turn table is there because the interesting failure is not a rate
// but a *cliff*: rollout cost grows with the board, so the budget stops
// covering a whole evaluation somewhere in the midgame and every turn after
// that is v2 wearing v3's name.

import {
  COMMANDER_RULES,
  Game,
  PlanBotController,
  createDefaultRegistry,
} from "../dist/index.js";
import { tableFor } from "./bot-seating.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};

const players = Number(flag("players", "4"));
const games = Number(flag("games", "4"));
const budgetMs = Number(flag("budget", "1000"));
const maxTurn = Number(flag("turns", "14"));

const registry = createDefaultRegistry();

/**
 * Records each search as it happens rather than polling `lastSearch`.
 *
 * Polling misses almost everything: `Game.advance()` covers a lot of ground
 * per call, so several of the bot's turns can go by between two looks and only
 * the last search of each is still there to read.
 */
class CensusBot extends PlanBotController {
  act(view) {
    const before = this.lastSearch;
    const action = super.act(view);
    if (this.lastSearch !== null && this.lastSearch !== before) record(this.lastSearch);
    return action;
  }
}

/** turn -> { planned, keptV1, empty, failed, ms[] } */
const byTurn = new Map();
const bucket = (turn) => {
  let b = byTurn.get(turn);
  if (b === undefined) {
    b = { planned: 0, keptV1: 0, empty: 0, failed: 0, ms: [], evaluations: [] };
    byTurn.set(turn, b);
  }
  return b;
};

function record(audit) {
  const b = bucket(audit.turn);
  b.ms.push(audit.ms);
  b.evaluations.push(audit.evaluations);
  if (audit.failed) b.failed += 1;
  else if (audit.planLength === 0) b.empty += 1;
  else if (audit.keptHeuristic) b.keptV1 += 1;
  else b.planned += 1;
}

for (let seed = 1; seed <= games; seed += 1) {
  const { seats, decks } = tableFor(seed, players);
  const bots = {};
  for (const seat of seats) {
    bots[seat] = new CensusBot(seat, registry, {
      timeBudgetMs: 300,
      planBudgetMs: budgetMs,
    });
  }
  const game = Game.create({
    seed,
    registry,
    controllers: bots,
    mulligans: true,
    rules: COMMANDER_RULES,
    decks: seats.map((player, i) => ({
      player,
      cards: decks[i].cards,
      commander: decks[i].commander,
    })),
  });

  let guard = 0;
  while (!game.state.result.over && game.state.turn.number <= maxTurn && guard < 40_000) {
    guard += 1;
    game.advance();
  }
  process.stderr.write(`seed ${seed} done (turn ${game.state.turn.number})\n`);
}

const median = (xs) => {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

const total = { planned: 0, keptV1: 0, empty: 0, failed: 0 };
const turns = [...byTurn.keys()].sort((a, b) => a - b);
console.log(`\nv3 plan census — ${players} players, ${games} games, ${budgetMs}ms plan budget\n`);
console.log("  TURN  PLANNED  KEPT-V1  EMPTY  FAILED   MED ms   MED evals");
for (const turn of turns) {
  const b = byTurn.get(turn);
  total.planned += b.planned;
  total.keptV1 += b.keptV1;
  total.empty += b.empty;
  total.failed += b.failed;
  console.log(
    `  ${String(turn).padStart(4)}  ${String(b.planned).padStart(7)}  ${String(b.keptV1).padStart(7)}` +
      `  ${String(b.empty).padStart(5)}  ${String(b.failed).padStart(6)}` +
      `  ${String(median(b.ms)).padStart(6)}  ${String(median(b.evaluations)).padStart(10)}`,
  );
}
const sum = total.planned + total.keptV1 + total.empty + total.failed;
const pct = (n) => (sum === 0 ? "0" : ((n / sum) * 100).toFixed(1));
console.log(
  `\n  ${sum} planned turns: ${pct(total.planned)}% planned, ${pct(total.keptV1)}% kept v1's, ` +
    `${pct(total.empty)}% empty, ${pct(total.failed)}% failed\n`,
);
