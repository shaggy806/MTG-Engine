// One bot-vs-bot game per message, for `tune-bot.mjs`'s worker pool.
//
// Games are played the way a live room plays them — Commander rules (40 life,
// free first mulligan) with the mulligan phase on — because weights tuned for
// any other game are tuned for a game nobody plays.
//
// Seeds come in blocks of `players` games. Every game in a block uses the same
// seating of decks, and the candidate takes a different seat in each, so over
// a block it plays every deck in the pairing from every position: neither the
// decks' relative strength nor the play/draw advantage is baked into the
// result. Each block takes the next seating from a fixed shuffle of every
// ordering of `players` distinct decks drawn from `SAMPLE_DECKS`.

import { parentPort } from "node:worker_threads";
import { performance } from "node:perf_hooks";

import {
  COMMANDER_RULES,
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

/** Every ordering of `k` distinct indices below `n`. */
function permutations(n, k) {
  if (k === 0) return [[]];
  const out = [];
  for (const rest of permutations(n, k - 1)) {
    for (let i = 0; i < n; i += 1) if (!rest.includes(i)) out.push([...rest, i]);
  }
  return out;
}

/** Deterministic Fisher-Yates, so every worker agrees on the seating order. */
function shuffled(list, seed) {
  let a = seed >>> 0;
  const rng = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const seatingsByPlayers = new Map();
function seatingFor(players, block) {
  let seatings = seatingsByPlayers.get(players);
  if (seatings === undefined) {
    seatings = shuffled(permutations(SAMPLE_DECKS.length, players), 0x5ea7 + players);
    seatingsByPlayers.set(players, seatings);
  }
  return seatings[block % seatings.length];
}

parentPort.on("message", ({ seed, weights, opponentWeights, players, horizon, rollout, botOptions }) => {
  const seats = SEATS.slice(0, players);
  const game0 = seed - 1;
  const seating = seatingFor(players, Math.floor(game0 / players));
  const candidateSeat = seats[game0 % players];

  // `opponentWeights` set means a head-to-head between two weight vectors
  // (what `tune` does); absent means measure against the v1 bot (`bench`).
  const controllers = {};
  for (const seat of seats) {
    if (seat === candidateSeat) {
      controllers[seat] = new EvalBotController(seat, registry, { ...botOptions, weights, horizon, rollout });
    } else if (opponentWeights !== undefined && opponentWeights !== null) {
      controllers[seat] = new EvalBotController(seat, registry, {
        ...botOptions,
        weights: opponentWeights,
        horizon,
        rollout,
      });
    } else {
      controllers[seat] = new HeuristicBotController(seat, registry);
    }
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

  const decks = seats.map((_, i) => SAMPLE_DECKS[seating[i]]);
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
      candidateDeck: decks[game0 % players].name,
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
