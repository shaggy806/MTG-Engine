// One bot-vs-bot game per message, for `tune-bot.mjs`'s worker pool.
//
// The candidate (v2, `EvalBotController`) alternates seats with the benchmark
// (v1, `HeuristicBotController`) by seed parity, so the play/draw advantage
// cancels over a run rather than being baked into the result.

import { parentPort } from "node:worker_threads";

import {
  EvalBotController,
  Game,
  HeuristicBotController,
  SAMPLE_DECKS,
  asPlayerId,
  createDefaultRegistry,
} from "../dist/index.js";

const SEATS = ["alice", "bob", "carol", "dave"].map(asPlayerId);
// One registry for the life of the worker: it's immutable card data, and
// rebuilding it per game dwarfs the game itself.
const registry = createDefaultRegistry();

parentPort.on("message", ({ seed, weights, opponentWeights, players, horizon }) => {
  const seats = SEATS.slice(0, players);
  // Seat parity alternates which seat the candidate occupies.
  const candidateSeat = seats[seed % seats.length];

  // `opponentWeights` set means a head-to-head between two weight vectors
  // (what `tune` does); absent means measure against the v1 bot (`bench`).
  const controllers = {};
  for (const seat of seats) {
    if (seat === candidateSeat) {
      controllers[seat] = new EvalBotController(seat, registry, { weights, horizon });
    } else if (opponentWeights !== undefined && opponentWeights !== null) {
      controllers[seat] = new EvalBotController(seat, registry, {
        weights: opponentWeights,
        horizon,
      });
    } else {
      controllers[seat] = new HeuristicBotController(seat, registry);
    }
  }

  try {
    const game = Game.create({
      seed,
      registry,
      controllers,
      decks: seats.map((player, i) => ({
        player,
        cards: SAMPLE_DECKS[i % SAMPLE_DECKS.length].cards,
        commander: SAMPLE_DECKS[i % SAMPLE_DECKS.length].commander,
      })),
    });
    game.advance();
    const winner = game.winner;
    parentPort.postMessage({
      outcome: winner === null ? "draw" : winner === candidateSeat ? "win" : "loss",
    });
  } catch (error) {
    parentPort.postMessage({ error: String(error?.message ?? error) });
  }
});
