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
} from "../dist/index.js";
import { tableFor } from "./bot-seating.mjs";

const registry = createDefaultRegistry();

const SIGNS = FEATURE_KEYS.map((k) => featureSign(k));

/** `me`'s position relative to `them`, as the design vector for a fit. */
function difference(state, me, them, landCap) {
  const mine = playerFeatures(state, registry, me, true, landCap);
  const theirs = playerFeatures(state, registry, them, false, landCap);
  return FEATURE_KEYS.map((k, i) => SIGNS[i] * (mine[k] - theirs[k]));
}

/** v2's per-window search or v3's turn planner. The positions harvested should
 * be the ones the bot being fitted actually reaches, so the policy that plays
 * them has to match the architecture the weights are for. */
const botFor = (kind, seat, opts) =>
  kind === "v3"
    ? new PlanBotController(seat, registry, opts)
    : new EvalBotController(seat, registry, opts);

parentPort.on("message", ({ seed, weights, opponentWeights, horizon, rollout, botOptions, maxTurns, bot }) => {
  // Two players only: the difference vector is only well defined against a
  // single opponent, and `opponent`/`otherOpponents` — how a bigger table is
  // aggregated — are above this layer and not part of the fit.
  const players = 2;
  const { seats, decks } = tableFor(seed, players);
  const landCap = (weights ?? DEFAULT_WEIGHTS).landCap;

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

    const [a, b] = seats;
    const positions = [];
    let turn = game.state.turn.number;
    while (!game.state.result.over && positions.length < maxTurns) {
      game.advanceUntil((s) => s.turn.number !== turn);
      if (game.state.result.over) break;
      turn = game.state.turn.number;
      positions.push([
        difference(game.state, a, b, landCap),
        difference(game.state, b, a, landCap),
      ]);
    }
    // Whatever's left after the sampling cap still has to be played out, or
    // the rows have no label.
    if (!game.state.result.over) game.advance();

    const winner = game.winner;
    // `label` belongs to the first vector of each pair (seat `a`'s); the
    // second carries `1 - label`. A draw (rule 104.4a) is half a win for both.
    const label = winner === null ? 0.5 : winner === a ? 1 : 0;
    parentPort.postMessage({
      seed,
      label,
      turns: game.state.turn.number,
      deckA: decks[0].name,
      deckB: decks[1].name,
      positions,
    });
  } catch (error) {
    parentPort.postMessage({ seed, error: String(error?.message ?? error) });
  }
});
