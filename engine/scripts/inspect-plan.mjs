// What turn does the bot plan, and why that one?
//
//   npm run bot:plan -w engine
//   npm run bot:plan -w engine -- --at-turn 12 --players 4 --worlds 5 --depth 3
//
// A plan's *score* says almost nothing about why the search chose it. The end
// state does, so this prints the board three turns out for the chosen plan and
// for the two it beat — the empty plan (pass the whole turn) and v1's plan.
//
// That comparison is the one that matters. A plan scoring worse than passing is
// either a real read or a rollout-policy artefact, and the only way to tell is
// to look at what happened: the first position inspected this way showed a 2/1
// costing 21 points because v1 attacked it into a board it couldn't beat and it
// died, which is the policy's mistake being faithfully measured rather than the
// search's.

import { performance } from "node:perf_hooks";

import {
  COMMANDER_RULES,
  DEFAULT_WEIGHTS,
  Game,
  HeuristicBotController,
  candidateActions,
  createDefaultRegistry,
  evaluateState,
  rolloutPlan,
  sampleWorlds,
  searchTurnPlan,
} from "../dist/index.js";
import { tableFor } from "./bot-seating.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};

const players = Number(flag("players", "2"));
const sampleTurn = Number(flag("at-turn", "8"));
const seed = Number(flag("seed", "3"));
const worlds = Number(flag("worlds", "5"));
const depth = Number(flag("depth", String(players + 1)));
const minCandidates = Number(flag("min-candidates", "3"));

const registry = createDefaultRegistry();
const { seats, decks } = tableFor(seed, players);
const controllers = {};
for (const s of seats) controllers[s] = new HeuristicBotController(s, registry);

const game = Game.create({
  seed,
  registry,
  controllers,
  mulligans: true,
  rules: COMMANDER_RULES,
  decks: seats.map((player, i) => ({
    player,
    cards: decks[i].cards,
    commander: decks[i].commander,
  })),
});

game.advanceUntil((s) => {
  if (
    s.turn.number < sampleTurn ||
    s.awaiting !== null ||
    s.zones.shared.stack.length > 0 ||
    s.priority.holder === null ||
    s.turn.step !== "precombat-main"
  ) {
    return false;
  }
  const holder = s.priority.holder;
  return (
    game
      .legalActions(holder)
      .flatMap((legal) => candidateActions(legal, holder))
      .filter((a) => a.type !== "pass-priority").length >= minCandidates
  );
});

const me = game.state.priority.holder;
if (me === null) throw new Error("no priority holder at the sampled position");
const state = game.state;
const planTurn = state.turn.number;
const name = (id) => state.objects[id]?.cardName ?? String(id);

console.log(`turn ${planTurn}, ${players} players, seat ${me}, depth ${depth}, ${worlds} worlds\n`);
console.log(`  hand:  ${state.zones.perPlayer[me].hand.map(name).join(", ")}`);
for (const player of state.turnOrder) {
  const board = state.zones.shared.battlefield
    .filter((id) => state.objects[id].controller === player)
    .map(name);
  console.log(
    `  ${player === me ? "mine" : "  " + player}:  ${board.join(", ") || "(empty)"}` +
      `   life ${state.players[player].life}`,
  );
}

const started = performance.now();
const result = searchTurnPlan(state, registry, me, { worlds, depth });
const ms = performance.now() - started;

console.log(
  `\nsearch: ${ms.toFixed(0)}ms, ${result.evaluations} plan evaluations, ` +
    `score ${result.score.toFixed(1)}${result.keptHeuristic ? " (kept v1's plan)" : ""}`,
);
console.log(`plan (${result.plan.length} actions):`);
for (const action of result.plan) {
  console.log(`  ${action.type.padEnd(16)} ${name(action.card ?? action.source ?? "")}`);
}

// --- what each plan leads to -------------------------------------------

const sampled = sampleWorlds(state, me, 1);
if (sampled.length === 0) {
  console.log("\n(position can't be resampled, so no end states to show)");
} else {
  const [world] = sampled;
  const describe = (label, plan) => {
    const end = rolloutPlan(world, registry, me, plan, planTurn, depth);
    if (end === null) {
      console.log(`\n${label}: rollout refused`);
      return;
    }
    console.log(`\n${label}  score ${evaluateState(end, registry, me, DEFAULT_WEIGHTS).toFixed(1)}`);
    console.log(
      `  turn ${end.turn.number}   life ${end.turnOrder.map((p) => end.players[p].life).join("-")}` +
        `   hand ${end.zones.perPlayer[me].hand.length}`,
    );
    for (const player of end.turnOrder) {
      const board = end.zones.shared.battlefield
        .filter((id) => end.objects[id].controller === player)
        .map((id) => end.objects[id].cardName);
      console.log(`    ${player === me ? "mine  " : player.padEnd(6)} ${board.join(", ") || "(empty)"}`);
    }
  };

  console.log("\n--- where each plan ends up, on one sampled world ---");
  describe("chosen plan", result.plan);
  describe("empty plan (pass the whole turn)", []);
}
