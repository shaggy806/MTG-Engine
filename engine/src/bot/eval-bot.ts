/**
 * A one-ply searching bot: at each priority window, enumerate the concrete
 * actions available, play each one out against a throwaway copy of the game,
 * score the result, and take the best.
 *
 * It extends {@link HeuristicBotController} rather than replacing it, so every
 * `awaiting` decision — targeting a trigger, modes, sacrifices, scry,
 * mulligan, and both combat declarations — keeps the v1 answer. Only the
 * priority choice is searched. That keeps this a reviewable delta over a bot
 * that already plays whole games, and it's also the honest division: attacks
 * are declared *before* blocks, so a one-ply evaluation of "declare attackers"
 * sees only that its creatures are now tapped and scores it negative. Combat
 * needs its own treatment (simulate through the block step), which is the next
 * piece of work rather than something this class can do by accident.
 *
 * Costs about 0.5–1.7ms per decision against the 350ms `BOT_MIN_THINK_MS` the
 * room already waits out for client animations, so the search is invisible at
 * runtime. See `docs/plans/smarter-bots.md` for the measurements and for why
 * the evaluation's feature list is shaped the way it is.
 */

import type { Action } from "../actions.js";
import type { CardRegistry } from "../cards.js";
import { createDefaultRegistry } from "../cards.js";
import { HeuristicBotController } from "../controller.js";
import type { ControllerView } from "../controller.js";
import type { PlayerId } from "../primitives.js";
import { candidateActions } from "./candidates.js";
import { DEFAULT_WEIGHTS, evaluateState } from "./evaluate.js";
import type { EvalWeights } from "./evaluate.js";
import { simulateAction } from "./simulate.js";
import type { Horizon } from "./simulate.js";

export interface EvalBotOptions {
  readonly weights?: EvalWeights;
  readonly horizon?: Horizon;
  /**
   * Ceiling on simulations per decision. The action space is small in
   * practice (median 2 concrete actions per window, 99th percentile around 9),
   * but a wide four-player board has been measured at 211 — this bounds the
   * worst case at roughly 60ms rather than letting it grow with the board.
   */
  readonly maxSimulations?: number;
}

const DEFAULT_MAX_SIMULATIONS = 200;

export class EvalBotController extends HeuristicBotController {
  private readonly cards: CardRegistry;
  readonly weights: EvalWeights;
  private readonly horizon: Horizon;
  private readonly maxSimulations: number;

  constructor(
    playerId: PlayerId,
    registry: CardRegistry = createDefaultRegistry(),
    options: EvalBotOptions = {},
  ) {
    super(playerId, registry);
    this.cards = registry;
    this.weights = options.weights ?? DEFAULT_WEIGHTS;
    this.horizon = options.horizon ?? "turn";
    this.maxSimulations = options.maxSimulations ?? DEFAULT_MAX_SIMULATIONS;
  }

  act(view: ControllerView): Action {
    const inherited = super.act(view);
    // Anything the engine is explicitly waiting on keeps the v1 answer —
    // `super.act` has already routed it through `answerAwaited`.
    if (view.state.awaiting !== null) return inherited;

    const player = this.playerId;
    const pass: Action = { type: "pass-priority", player };

    // Passing is a candidate like any other, rolled out to the same horizon.
    // Scoring against "is this better than the current state" instead would
    // make the bot inactive-by-default and turn the zero point into an extra
    // implicit weight — a land drop sits almost exactly on it.
    let best: Action = pass;
    // Passing is always legal at a priority window, so a `null` here means the
    // simulation itself fell over; treat it as "no baseline" rather than
    // letting it veto every alternative.
    let bestScore = this.score(view, pass) ?? -Infinity;
    let budget = this.maxSimulations;

    for (const legal of view.legalActions()) {
      // Mana abilities are never worth a simulation: casting auto-pays, so
      // tapping for mana on its own gains nothing the evaluation could see,
      // and on a wide board they're nearly every candidate there is — 27 of
      // 30 on one 38-permanent board, which made a single decision a 2s search.
      if (legal.kind === "activate-ability" && this.isManaOnlyAbility(legal)) continue;
      for (const action of candidateActions(legal, player)) {
        if (budget <= 0) return best;
        budget -= 1;
        const score = this.score(view, action);
        if (score === null || score <= bestScore) continue;
        bestScore = score;
        best = action;
      }
    }
    return best;
  }

  /** `null` when the engine refused this concrete filling of a legal shape. */
  private score(view: ControllerView, action: Action): number | null {
    const after = simulateAction(view.state, this.cards, action, this.horizon);
    if (after === null) return null;
    return evaluateState(after, this.cards, this.playerId, this.weights);
  }
}
