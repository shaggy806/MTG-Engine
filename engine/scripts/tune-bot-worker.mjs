// One bot-vs-bot game per message, for `tune-bot.mjs`'s worker pool.
//
// Games are played the way a live room plays them — Commander rules (40 life,
// free first mulligan) with the mulligan phase on — because weights tuned for
// any other game are tuned for a game nobody plays.
//
// Deck seating comes from `bot-seating.mjs`; the other seats are filled from
// `opponents`, a list of specs — `weights: null` is the v1
// `HeuristicBotController`, anything else an `EvalBotController` on that
// vector. More than one spec means a *mixed* table: at four players a
// candidate sat opposite three copies of one policy learns to farm that
// policy, which is neither a real pod nor a measurement of general strength.

import { parentPort } from "node:worker_threads";
import { performance } from "node:perf_hooks";

import {
  COMMANDER_RULES,
  EvalBotController,
  Game,
  HeuristicBotController,
  PlanBotController,
  createDefaultRegistry,
} from "../dist/index.js";
import { tableFor } from "./bot-seating.mjs";

// One registry for the life of the worker: it's immutable card data, and
// rebuilding it per game dwarfs the game itself.
const registry = createDefaultRegistry();

/** Which searching bot to build: v2's per-window search or v3's turn planner. */
const botFor = (kind, seat, opts) =>
  kind === "v3"
    ? new PlanBotController(seat, registry, opts)
    : new EvalBotController(seat, registry, opts);

parentPort.on("message", ({ seed, weights, opponents, players, horizon, rollout, botOptions, bot }) => {
  const { seats, block, measuredSeat: candidateSeat, decks } = tableFor(seed, players);

  // Opponents are dealt round-robin to the seats the candidate isn't in, in
  // turn order, so a given seed always produces the same table. The list is
  // rotated once per *block* rather than per game: with more opponents than
  // seats a fixed start would only ever seat the first few, while rotating
  // inside a block would undo the block's whole purpose of holding everything
  // but the candidate's seat constant.
  const controllers = {};
  const opponentIds = [];
  let taken = block;
  for (const seat of seats) {
    if (seat === candidateSeat) {
      controllers[seat] = botFor(bot, seat, { ...botOptions, weights, horizon, rollout });
      continue;
    }
    const spec = opponents[taken % opponents.length];
    taken += 1;
    opponentIds.push(spec.id);
    controllers[seat] =
      spec.weights === null
        ? new HeuristicBotController(seat, registry)
        : botFor(spec.bot ?? "v2", seat, { ...botOptions, weights: spec.weights, horizon, rollout });
  }

  // Time the candidate's own decisions: the search has to fit inside the
  // room's think pause, and the worst case is what matters there, not the
  // mean.
  const candidate = controllers[candidateSeat];
  const act = candidate.act.bind(candidate);
  let decisions = 0;
  let decisionMs = 0;
  let maxDecisionMs = 0;
  candidate.act = (view) => {
    const start = performance.now();
    try {
      return act(view);
    } finally {
      const ms = performance.now() - start;
      decisions += 1;
      decisionMs += ms;
      if (ms > maxDecisionMs) maxDecisionMs = ms;
    }
  };

  const startedAt = performance.now();
  try {
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
    game.advance();
    const winner = game.winner;
    parentPort.postMessage({
      seed,
      outcome: winner === null ? "draw" : winner === candidateSeat ? "win" : "loss",
      candidateDeck: decks[seats.indexOf(candidateSeat)].name,
      opponents: opponentIds,
      turns: game.state.turn.number,
      ms: performance.now() - startedAt,
      decisions,
      decisionMs,
      maxDecisionMs,
    });
  } catch (error) {
    parentPort.postMessage({ seed, error: String(error?.message ?? error) });
  }
});
