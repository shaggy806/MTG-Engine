// What a v3 rollout costs, and what it shows that a v2 one doesn't.
//
//   npm run bot:rollout-cost -w engine
//   npm run bot:rollout-cost -w engine -- --depths 1,3,5 --worlds 1,3,5,10
//
// Step 1 of `docs/plans/bot-v3-search.md` is "determinization + D-turn
// rollouts, behind a flag, defaults unchanged, measure cost". This is the
// measurement. Nothing here changes how the bot plays; it only reports what the
// new machinery would cost if it were switched on, so the depth and
// world-count defaults are chosen from numbers rather than from taste.
//
// Two things it prints:
//
// - **Cost**, per rollout, at each depth. This is the budget question: a
//   decision costs roughly `candidates x worlds x rollout`, and the live room's
//   ceiling has to cover the worst case.
// - **Variance**, across sampled worlds at each world count. This is the
//   question the plan flags as the real risk: deeper rollouts mean more policy
//   noise, and if the spread across worlds swamps the difference between two
//   candidate actions then the search is measuring shuffles rather than moves.
//   `spread` is the standard deviation of one candidate's score across worlds;
//   `gap` is the difference between the best and second-best candidate's means.
//   **`gap` needs to clear `spread / sqrt(worlds)` for the ranking to mean
//   anything**, and that ratio is what decides `K`.

import { performance } from "node:perf_hooks";

import {
  COMMANDER_RULES,
  DEFAULT_WEIGHTS,
  Game,
  HeuristicBotController,
  asPlayerId,
  candidateActions,
  createDefaultRegistry,
  evaluateState,
  sampleWorlds,
  simulateTurns,
} from "../dist/index.js";
import { tableFor } from "./bot-seating.mjs";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const nums = (s) => s.split(",").map(Number);

const depths = nums(flag("depths", "1,3,5"));
const worldCounts = nums(flag("worlds", "1,3,5,10"));
const players = Number(flag("players", "2"));
const sampleTurn = Number(flag("at-turn", "6"));
const seed = Number(flag("seed", "3"));
const minCandidates = Number(flag("min-candidates", "3"));

const registry = createDefaultRegistry();

/** A real game from the bench's deck population, stopped at a mid-game
 * priority window where the seat has something to think about. */
function midGame() {
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
  // A position with only one thing to do measures nothing, and most priority
  // windows are exactly that. Hold out for one where the seat has a real
  // choice — `legalActions` in the predicate is dear, but this runs once.
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
    const options = game
      .legalActions(holder)
      .flatMap((legal) => candidateActions(legal, holder))
      .filter((a) => a.type !== "pass-priority");
    return options.length >= minCandidates;
  });
  return game;
}

const game = midGame();
const me = game.state.priority.holder;
if (me === null) throw new Error("no priority holder at the sampled position");

const permanents = game.state.zones.shared.battlefield.length;
const candidates = [
  { type: "pass-priority", player: me },
  ...game
    .legalActions(me)
    .flatMap((legal) => candidateActions(legal, me))
    .filter((a) => a.type !== "pass-priority"),
];

console.log(
  `position: turn ${game.state.turn.number}, ${players} players, ` +
    `${permanents} permanents, ${candidates.length} candidates, seat ${me}\n`,
);

// --- cost per rollout, by depth -----------------------------------------

console.log("cost of one rollout:");
const [world] = sampleWorlds(game.state, me, 1, seed);
if (world === undefined) throw new Error("position is not safe to determinize");

for (const turns of depths) {
  const reps = 20;
  const start = performance.now();
  let ok = 0;
  for (let i = 0; i < reps; i += 1) {
    if (simulateTurns(world, registry, candidates[0], { turns }, "playing") !== null) ok += 1;
  }
  const ms = (performance.now() - start) / reps;
  console.log(
    `  depth ${String(turns).padStart(2)} turns   ${ms.toFixed(2).padStart(7)}ms` +
      `   a ${candidates.length}-candidate decision at K=5: ${(ms * candidates.length * 5).toFixed(0)}ms` +
      (ok < reps ? `   (${reps - ok} refused)` : ""),
  );
}

// --- does the signal clear the noise? -----------------------------------

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) * (x - m), 0) / (xs.length - 1));
};

console.log("\ncan the search tell two candidates apart?");
for (const turns of depths) {
  for (const k of worldCounts) {
    const worlds = sampleWorlds(game.state, me, k, seed);
    // Every candidate is scored against the *same* sampled worlds — common
    // random numbers. Without this the comparison measures which candidate drew
    // better; v2 established that the hard way.
    const perCandidate = candidates.map((action) => {
      const scores = worlds
        .map((w) => simulateTurns(w, registry, action, { turns }, "playing"))
        .filter((s) => s !== null)
        .map((s) => evaluateState(s, registry, me, DEFAULT_WEIGHTS));
      return { mean: scores.length > 0 ? mean(scores) : -Infinity, spread: sd(scores) };
    });

    const ranked = [...perCandidate].sort((a, b) => b.mean - a.mean);
    const gap = ranked.length > 1 ? ranked[0].mean - ranked[1].mean : Infinity;
    const spread = mean(perCandidate.filter((c) => Number.isFinite(c.mean)).map((c) => c.spread));
    const stderr = spread / Math.sqrt(k);
    // A gap of exactly zero is not a close call, it is the *tie trap*: under a
    // rollout that plays the turn out, "pass" stops meaning "do nothing" and
    // starts meaning "let the policy play my turn". If the policy would take
    // the action anyway, the two lines converge to the identical state and the
    // search has nothing to choose between. Worth flagging separately from
    // merely-noisy, because the fix is different: a baseline change, not more
    // samples.
    const verdict = gap === 0 ? "IDENTICAL (tie trap)" : gap > 2 * stderr ? "SEPARATED" : "noise";
    console.log(
      `  depth ${String(turns).padStart(2)}  K=${String(k).padStart(2)}   ` +
        `spread ${spread.toFixed(1).padStart(6)}   stderr ${stderr.toFixed(1).padStart(6)}   ` +
        `gap ${gap.toFixed(1).padStart(6)}   ${verdict}`,
    );
    if (k === worldCounts[worldCounts.length - 1]) {
      for (const [i, c] of perCandidate.entries()) {
        console.log(`      ${String(c.mean.toFixed(1)).padStart(8)}  ${JSON.stringify(candidates[i])}`);
      }
    }
  }
}

console.log("\n`gap` is best minus second-best candidate; `stderr` is the noise on each.");
console.log("A row reading `noise` means the top two candidates are indistinguishable there.");
