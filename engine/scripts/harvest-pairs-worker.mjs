// One *sibling pair* per message — the causal training signal, as opposed to
// `harvest-worker.mjs`'s outcome-labelled positions.
//
// ## Why a pair, and why it fixes what the position harvest can't
//
// Labelling a position with "did this seat go on to win" teaches a model to
// recognise a winning position, which is not the same thing as recognising a
// good move, and the gap between them is where the evaluation goes wrong. It
// learns that twelve lands, a big library and a taxed commander all predict
// losing — all true, all useless, because a weight is applied to the *choice*
// and those features describe the situation the choice was made in. Non-negative
// coefficients, an excluded-term list and a hand-set prior are three patches for
// that one flaw; see `fit-weights.mjs`.
//
// A pair removes it by construction. Stop at one decision point, take two of the
// concrete actions available *there*, and play each of them out. Both
// continuations descend from the same position, so everything about "how far
// along, and how badly" is identical between them and cancels in the difference
// — what's left is only what the two moves themselves did. The label is which
// one actually won, which is causation rather than correlation.
//
// ## STATUS: a working prototype whose label is still too weak to fit on
//
// The idea is sound and the machinery works end to end, but as measured it does
// not yet produce enough signal to be worth fitting. Three findings, in the
// order they were hit, because each is a trap the next attempt would otherwise
// walk into:
//
// **1. One playout per sibling yields nothing.** Play each out once and label
// whichever won: over one game's 342 decision points, 236 offered a real choice,
// all 236 simulated, and **3** ended with the two siblings leading to different
// winners. A 1.3% yield, because a single move rarely decides a whole game of
// Magic. True of the real game too, and the credit-assignment problem in its
// plainest form.
//
// **2. Reseeding the PRNG does not randomise a playout.** The obvious fix is
// many playouts per sibling, but by mid-game the libraries are *already
// ordered*: every draw for the rest of the game is fixed in the snapshot, so a
// fresh `rngState` changes nothing and twenty "randomised" playouts return
// twenty identical games. The variance has to come from reshuffling the
// libraries — see `withShuffledLibraries`, which is also the more honest
// question, since it averages over the futures neither player can see.
//
// **3. Without common random numbers the comparison is pure noise; with them
// there is almost nothing left.** Comparing two siblings on *different* shuffles
// measures which one drew better, not which move was better: on that data the
// shipped evaluator — which beats v1 at 69.5% — appeared to rank pairs correctly
// only 13% of the time, an "anti-correlation" that was entirely an artefact.
// Sharing the shuffles between the two siblings (the standard variance reduction
// for a paired comparison) fixes it and reveals the real problem: **60 of 63
// pairs then come out as exact ties.** Given the same deck order, one move
// almost never changes who wins a full v1 playout.
//
// **Where that leaves it.** The horizon is the culprit — a move's effect is
// measurable over two or three turns and is swamped by twenty turns of v1's own
// noisy decisions. `--playout-turns N` truncates the rollout and scores the leaf
// with the current evaluation (TD-style), which helps: at three turns, 9 of 78
// pairs are distinguishable instead of 3 of 63, and the evaluator agrees with
// them 67% of the time. Still a ~12% yield, so this needs more work — a longer
// truncation, more pairs per game, or decision points filtered to ones where the
// candidates actually differ — before a fit on it means anything.
//
// The fitter's `--pairs` mode reads what this produces and is tested; it is
// waiting on data worth fitting, not the other way round.
//
// ## The one compromise
//
// The continuations run under v1 (`HeuristicBotController`), not the searching
// bot, purely for speed: a searching self-play game takes ~6s against v1's small
// fraction of that, and this design needs dozens of playouts per label.
//
// So the label is "which move leads somewhere better, as judged by v1 playing it
// out" rather than "...by the searching bot". That's a weaker value function,
// but still a causal comparison of two moves from one position, which is the
// property the whole exercise exists for. The *decision points* are real
// searching-bot self-play, so the positions stay on-policy even though the
// continuations aren't. It is also a prime suspect for finding 3: v1's own noise
// is part of what drowns the move being measured.

import { parentPort } from "node:worker_threads";

import {
  COMMANDER_RULES,
  DEFAULT_WEIGHTS,
  EvalBotController,
  FEATURE_KEYS,
  Game,
  HeuristicBotController,
  candidateActions,
  createDefaultRegistry,
  evaluateState,
  featureSign,
  playerFeatures,
  simulateAction,
} from "../dist/index.js";
import { tableFor } from "./bot-seating.mjs";

const registry = createDefaultRegistry();
const SIGNS = FEATURE_KEYS.map((k) => featureSign(k));

/** `me`'s position relative to `them`, exactly as `evaluateState` reads it. */
function difference(state, me, them, landCap) {
  const mine = playerFeatures(state, registry, me, true, landCap);
  const theirs = playerFeatures(state, registry, them, false, landCap);
  return FEATURE_KEYS.map((k, i) => SIGNS[i] * (mine[k] - theirs[k]));
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A copy of `state` with every library reshuffled — one possible future, drawn
 * fresh.
 *
 * This is where a playout's variance has to come from, and getting it wrong was
 * the first attempt: reseeding `rngState` looks like it should randomise the
 * continuation and does almost nothing, because by mid-game the libraries are
 * *already ordered*. Every draw for the rest of the game is fixed in the
 * snapshot, so the PRNG only governs whatever shuffles are still to come, and
 * twenty "randomised" playouts returned twenty identical games.
 *
 * Reshuffling is also the more honest question to be asking. Averaging over
 * draw orders is averaging over the thing neither player knows, so the label
 * becomes "does this move do better across the futures that could happen"
 * rather than "did it happen to win the one future baked into this seed".
 */
function withShuffledLibraries(state, rng) {
  const next = structuredClone({ ...state, eventLog: [], rngState: Math.floor(rng() * 0xffffffff) });
  for (const player of next.turnOrder) {
    const library = next.zones.perPlayer[player].library;
    for (let i = library.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [library[i], library[j]] = [library[j], library[i]];
    }
  }
  return next;
}

/**
 * How often `me` wins from `state` under v1, over `n` playouts, using the shuffle
 * seeds in `seeds`. v1 rather than the searching bot purely for speed — see the
 * note above.
 *
 * `seeds` is supplied by the caller rather than drawn here so that the two
 * siblings of a pair are played against the *same* set of futures — common
 * random numbers, the standard variance reduction for a paired comparison.
 * Twenty playouts put a standard error of about 0.11 on each side's rate
 * independently, which is wider than most of the differences being measured;
 * sharing the draws cancels most of that, because the question is which move is
 * better given the same deck, not which move drew better.
 */
function winRate(state, me, seeds, turns, weights) {
  let wins = 0;
  let value = 0;
  let samples = 0;
  for (const seed of seeds) {
    const controllers = {};
    for (const player of state.turnOrder) controllers[player] = new HeuristicBotController(player, registry);
    try {
      const sim = Game.fromSnapshot(withShuffledLibraries(state, mulberry32(seed)), { registry, controllers });
      if (turns > 0) {
        // Truncated: run a few turns and score the leaf with the current
        // evaluation, TD-style. See "the horizon problem" above.
        const until = sim.state.turn.number + turns;
        sim.advanceUntil((s) => s.turn.number >= until);
        value += sim.state.result.over
          ? (sim.winner === me ? 1 : sim.winner === null ? 0 : -1) * 1e3
          : evaluateState(sim.state, registry, me, weights);
      } else {
        sim.advance();
      }
      if (sim.winner === me) wins += 1;
      samples += 1;
    } catch {
      // A playout that throws is one sample lost, not a reason to lose the pair.
    }
  }
  return { wins, value: samples > 0 ? value / samples : 0, samples };
}

parentPort.on("message", ({ seed, weights, horizon, botOptions, maxTurns, pairsPerGame, playoutsPerSide, playoutTurns }) => {
  const players = 2;
  const { seats, decks } = tableFor(seed, players);
  const landCap = (weights ?? DEFAULT_WEIGHTS).landCap;
  const rng = mulberry32(seed * 2654435761);

  const controllers = {};
  for (const seat of seats) {
    controllers[seat] = new EvalBotController(seat, registry, { ...botOptions, weights, horizon });
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

    // Decision points are collected by hooking `act`, not by walking the turn
    // structure: `act` is called exactly once per decision, whereas a turn
    // boundary lands in the untap step, which has no priority window at all.
    // Reservoir sampling keeps `pairsPerGame` of them uniformly without holding
    // a snapshot of every decision in a long game.
    const reservoir = [];
    let seen = 0;
    for (const seat of seats) {
      const controller = controllers[seat];
      const act = controller.act.bind(controller);
      controller.act = (view) => {
        // Priority windows only. The decisions the engine raises mid-resolution
        // are answered elsewhere, and combat declarations are built
        // constructively rather than enumerated, so neither has a candidate
        // list to sample two siblings from.
        if (view.state.awaiting === null && seen < maxTurns) {
          seen += 1;
          const point = { state: structuredClone({ ...view.state, eventLog: [] }), me: seat };
          if (reservoir.length < pairsPerGame) reservoir.push(point);
          else {
            const r = Math.floor(rng() * seen);
            if (r < pairsPerGame) reservoir[r] = point;
          }
        }
        return act(view);
      };
    }

    game.advance();

    const pairs = [];
    for (const { state, me } of reservoir) {
      const them = seats.find((s) => s !== me);
      const options = Game.fromSnapshot(state, { registry })
        .legalActions(me)
        .flatMap((legal) => candidateActions(legal, me))
        .filter((a) => a.type !== "pass-priority");
      // A window with one move is not a decision. `pass` goes back in as one
      // side of the pair, since "do this or do nothing" is the commonest real
      // choice the bot faces.
      if (options.length === 0) continue;
      const choices = [...options, { type: "pass-priority", player: me }];

      const i = Math.floor(rng() * choices.length);
      let j = Math.floor(rng() * (choices.length - 1));
      if (j >= i) j += 1;

      const stateA = simulateAction(state, registry, choices[i], horizon, "combat");
      const stateB = simulateAction(state, registry, choices[j], horizon, "combat");
      // `legalActions` enumerates a shape whose concrete filling can still be
      // refused; a refusal is expected, not exceptional.
      if (stateA === null || stateB === null) continue;

      const seeds = Array.from({ length: playoutsPerSide }, () => Math.floor(rng() * 0xffffffff));
      const w = weights ?? DEFAULT_WEIGHTS;
      const a = winRate(stateA, me, seeds, playoutTurns, w);
      const b = winRate(stateB, me, seeds, playoutTurns, w);
      // Neither move ever wins: the position is lost and the choice within it
      // says nothing. (Both *always* winning is the same story and gives a
      // 0.5 label, which is harmless.) Not a filter in truncated mode, where
      // the leaf value carries the signal instead of the win counts.
      if (playoutTurns === 0 && a.wins + b.wins === 0) continue;

      pairs.push({
        xA: difference(stateA, me, them, landCap),
        xB: difference(stateB, me, them, landCap),
        winsA: a.wins,
        winsB: b.wins,
        valueA: a.value,
        valueB: b.value,
        turn: state.turn.number,
      });
    }

    parentPort.postMessage({ seed, pairs, playouts: playoutsPerSide, playoutTurns, turns: game.state.turn.number, visited: seen });
  } catch (error) {
    parentPort.postMessage({ seed, error: String(error?.message ?? error) });
  }
});
