// One self-play game per message, emitting the positions it passed through —
// the training set for `fit-weights.mjs`.
//
// ## What a row is
//
// A position is sampled at every *turn boundary*, which is deliberately the
// same place the bot's own search scores a candidate under `--horizon turn`
// (`simulate.ts` advances until `turn.number` changes). Fitting on the
// distribution the evaluator will actually be asked about is most of the point;
// sampled anywhere else — mid-combat, say, or in a main phase — the fit would
// learn a function of positions the search never sees.
//
// Each sampled position emits *both* seats' vectors, one labelled 1 and the
// other 0, which is how the fit is kept symmetric: any bias from the starting
// player always sitting in seat 0 cancels between the pair, and a perfectly
// even position can only come out 50/50.
//
// The vector is `featureSign(k) * (mine[k] - theirs[k])` — the same difference
// `evaluateState` takes at two players with `opponent` at 1, so a fitted
// coefficient drops straight into `EvalWeights` with no translation. Note that
// the pair is *not* simply `x` and `-x`: `handManaValue` is gated on `isMe`
// (only its owner may score a hand's contents), so it contributes each seat's
// own hand value to that seat's vector and zero to the other's. Computing both
// views properly rather than negating one is what keeps each row identical to
// what `evaluateState` would produce from that seat.

import { parentPort } from "node:worker_threads";

import {
  COMMANDER_RULES,
  DEFAULT_WEIGHTS,
  EvalBotController,
  PlanBotController,
  FEATURE_KEYS,
  Game,
  HeuristicBotController,
  createDefaultRegistry,
  featureSign,
  playerFeatures,
  scoreFeatures,
} from "../dist/index.js";
import { tableFor } from "./bot-seating.mjs";

const registry = createDefaultRegistry();

const SIGNS = FEATURE_KEYS.map((k) => featureSign(k));

/**
 * `me`'s position relative to the rest of the table, as the design vector for a
 * fit — the same quantity `evaluateState` reduces to a number.
 *
 * At two players that is simply `mine - theirs`. At more it has to reproduce
 * the *aggregation* the evaluation uses: the strongest opponent at full weight
 * and the average of the rest at `otherOpponents`. Fitting the per-feature
 * weights on a plain two-player difference and then running them at four was
 * fitting a game nobody plays, which is the same error the Phase 0 benchmark
 * made and had to be corrected for.
 *
 * Which opponent is "strongest" depends on the weights being fitted, which is
 * circular. It is resolved the way the bot itself resolves it: score the
 * opponents with the *current* weights and take that ordering. Approximate, and
 * the same approximation the policy is making while it plays.
 */
function difference(state, me, weights, landCap) {
  const mine = playerFeatures(state, registry, me, true, landCap);
  const others = state.turnOrder
    .filter((p) => p !== me && !state.players[p].hasLost)
    .map((p) => playerFeatures(state, registry, p, false, landCap))
    .map((f) => ({ f, score: scoreFeatures(f, weights) }))
    .sort((a, b) => b.score - a.score);

  if (others.length === 0) return FEATURE_KEYS.map((k, i) => SIGNS[i] * mine[k]);
  const [strongest, ...rest] = others;
  return FEATURE_KEYS.map((k, i) => {
    const restMean =
      rest.length > 0 ? rest.reduce((sum, o) => sum + o.f[k], 0) / rest.length : 0;
    const theirs = weights.opponent * strongest.f[k] + weights.otherOpponents * restMean;
    return SIGNS[i] * (mine[k] - theirs);
  });
}

/** v2's per-window search or v3's turn planner. The positions harvested should
 * be the ones the bot being fitted actually reaches, so the policy that plays
 * them has to match the architecture the weights are for. */
const botFor = (kind, seat, opts) =>
  kind === "v3"
    ? new PlanBotController(seat, registry, opts)
    : new EvalBotController(seat, registry, opts);

parentPort.on("message", ({ seed, weights, opponentWeights, horizon, rollout, botOptions, maxTurns, bot, players }) => {
  const w = weights ?? DEFAULT_WEIGHTS;
  const { seats, decks } = tableFor(seed, players);
  const landCap = w.landCap;

  const controllers = {};
  for (const [i, seat] of seats.entries()) {
    // Self-play by default. An `opponentWeights` of null seats v1 opposite,
    // which widens the distribution of positions the fit ever sees.
    const seatWeights = i === 0 ? weights : (opponentWeights ?? weights);
    controllers[seat] =
      seatWeights === null
        ? new HeuristicBotController(seat, registry)
        : botFor(bot, seat, { ...botOptions, weights: seatWeights, horizon, rollout });
  }

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

    // Every seat's view of every sampled position. At two players that is the
    // symmetric pair this used to emit; at four it is four rows, of which
    // exactly one is labelled a win.
    const positions = [];
    let turn = game.state.turn.number;
    while (!game.state.result.over && positions.length < maxTurns) {
      game.advanceUntil((s) => s.turn.number !== turn);
      if (game.state.result.over) break;
      turn = game.state.turn.number;
      positions.push(seats.map((seat) => difference(game.state, seat, w, landCap)));
    }
    // Whatever's left after the sampling cap still has to be played out, or
    // the rows have no label.
    if (!game.state.result.over) game.advance();

    const winner = game.winner;
    // A draw (rule 104.4a) is an equal share for everyone still standing.
    const labels = seats.map((seat) =>
      winner === null ? 1 / players : winner === seat ? 1 : 0,
    );
    parentPort.postMessage({
      seed,
      players,
      labels,
      turns: game.state.turn.number,
      decks: decks.map((d) => d.name),
      positions,
    });
  } catch (error) {
    parentPort.postMessage({ seed, error: String(error?.message ?? error) });
  }
});
