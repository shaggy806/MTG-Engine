/**
 * v3's controller: plan the turn, then play it.
 *
 * A strict delta over {@link EvalBotController}, the same way that was a strict
 * delta over v1 — everything it doesn't override still works. Combat
 * declarations, the decisions the engine raises mid-resolution, and every
 * priority window on someone *else's* turn all keep v2's behaviour. The one
 * thing that changes is priority on our own turn, which is where the turn plan
 * replaces the per-window search.
 *
 * That split is deliberate rather than provisional. The measurement that
 * prompted v3 was about our own turn: within one turn the order of plays mostly
 * doesn't matter, so searching "which action first" searched the part that
 * didn't matter. On an opponent's turn the question is genuinely different —
 * whether to respond, once — and a per-window search is the right shape for it.
 *
 * ## No mid-turn replanning, and the measurement that says it can wait
 *
 * A plan is built once, at the first priority window of the turn, from sampled
 * worlds — and then executed in the real one, which is not the same world. When
 * a planned action turns out to be illegal it is dropped and the rest of the
 * plan carries on, which is a cheap degradation rather than a correction: the
 * remaining actions were chosen assuming the dropped one happened.
 *
 * Measured over 34 planned turns across 8 games, **6 of 60 planned actions were
 * refused by reality — a 10% divergence rate**, and none of it was opponent
 * counterplay, since the opponents were v1 bots that never respond. It comes
 * from our own library being reshuffled in the sampled worlds, so a plan that
 * leans on a card drawn mid-turn finds a different card there.
 *
 * At 10%, rebuilding the plan mid-turn isn't worth its complexity yet. **It
 * will be when the bot meets players who hold up instants**, because that adds
 * a source of divergence this number doesn't contain. The trigger to revisit is
 * human opponents, not a threshold on this rate.
 */

import type { Action } from "../actions.js";
import type { CardRegistry } from "../cards.js";
import { createDefaultRegistry } from "../cards.js";
import type { ControllerView } from "../controller.js";
import { activePlayerOf } from "../state.js";
import { isMainPhase } from "../turn.js";
import type { PlayerId } from "../primitives.js";
import { candidateActions } from "./candidates.js";
import { EvalBotController } from "./eval-bot.js";
import type { EvalBotOptions } from "./eval-bot.js";
import { searchTurnPlan } from "./plan.js";
import type { TurnPlan } from "./plan.js";

export interface PlanBotOptions extends EvalBotOptions {
  /** Player turns of rollout past the planned turn. Defaults to one full lap of
   * the table, so our own follow-up turn is inside the horizon. */
  readonly depth?: number;
  /** Sampled worlds per plan. */
  readonly worlds?: number;
  /** Ceiling on plan evaluations for one turn. */
  readonly maxEvaluations?: number;
  /**
   * Wall-clock ceiling on one turn's planning, in milliseconds.
   *
   * Separate from `timeBudgetMs`, which bounds a single v2-style decision.
   * Planning happens *once a turn* rather than at every priority window, so it
   * can afford to cost more than one window's search and still make a turn
   * cheaper overall.
   *
   * Unlike `timeBudgetMs` this defaults **on**, at
   * {@link DEFAULT_PLAN_BUDGET_MS}, because the failure it prevents is not a
   * slow game but an unusable one: unbounded, the worst planned turn measured
   * **87 seconds**. Pass `Infinity` where exact replays matter more than a
   * bounded turn — the unit tests do.
   */
  readonly planBudgetMs?: number;
}

/**
 * How long one turn's planning may take by default.
 *
 * Sized against what the search actually costs rather than against a UI pause:
 * a depth-3 rollout is 5-11ms depending on board size, three sampled worlds
 * make a plan evaluation 15-35ms, and a round of neighbours on a normal board
 * is a dozen or two of those. A second and a half covers several full rounds on
 * an ordinary board and degrades to a partial first round on a huge one, which
 * is the right shape: the neighbour ordering puts appends first, so a truncated
 * search still builds a turn rather than returning nothing.
 *
 * The live room's own pacing is a separate concern and much more generous —
 * one plan per turn against a 350ms pause *per bot action*, of which a turn has
 * several.
 */
export const DEFAULT_PLAN_BUDGET_MS = 1_500;

export class PlanBotController extends EvalBotController {
  private readonly planOptions: PlanBotOptions;
  private plan: TurnPlan = [];
  /** The turn `plan` was built for; -1 means "no plan". */
  private plannedTurn = -1;
  private index = 0;
  /** Set when the search couldn't run at all — a position that can't be safely
   * resampled — so the turn falls back to v2 rather than to passing. */
  private planFailed = false;

  constructor(
    playerId: PlayerId,
    registry: CardRegistry = createDefaultRegistry(),
    options: PlanBotOptions = {},
  ) {
    super(playerId, registry, options);
    this.planOptions = options;
  }

  act(view: ControllerView): Action {
    const state = view.state;
    // Combat declarations and mid-resolution decisions keep v2's search.
    if (state.awaiting !== null) return super.act(view);
    // On someone else's turn the question is "respond, or not" — one decision,
    // not a turn's worth, so v2's per-window search is the right tool.
    if (activePlayerOf(state) !== this.playerId) return super.act(view);

    if (this.plannedTurn !== state.turn.number) {
      // **Plan in a main phase, not at the first window of the turn.** The
      // first priority window of our own turn is in the upkeep, where sorcery
      // speed isn't available and almost nothing is castable, so a plan built
      // there is empty — and an empty plan means "pass the whole turn". Getting
      // this wrong made the bot skip every turn of every game: it lost 0-4
      // against v1 while finishing games in half a second, because it was
      // doing nothing at all.
      if (!isMainPhase(state.turn.step)) return super.act(view);
      this.buildPlan(view);
    }
    if (this.planFailed) return super.act(view);

    while (this.index < this.plan.length) {
      const next = this.plan[this.index];
      this.index += 1;
      if (this.isPlayable(view, next)) return next;
      // Reality refused it — see the note above on why the rest of the plan
      // still runs rather than being rebuilt.
    }
    // The plan is the whole turn. Passing here is what lets an omitted play
    // mean "I chose not to", which is the only way holding mana up is
    // expressible at all.
    return { type: "pass-priority", player: this.playerId };
  }

  private buildPlan(view: ControllerView): void {
    const state = view.state;
    const result = searchTurnPlan(state, this.cards, this.playerId, {
      weights: this.weights,
      depth: this.planOptions.depth,
      worlds: this.planOptions.worlds,
      maxEvaluations: this.planOptions.maxEvaluations,
      timeBudgetMs: this.planOptions.planBudgetMs ?? DEFAULT_PLAN_BUDGET_MS,
    });
    this.plan = result.plan;
    this.plannedTurn = state.turn.number;
    this.index = 0;
    // `evaluations === 0` means the search never got off the ground, which only
    // happens when the position can't be resampled. An empty plan that *was*
    // searched is a real choice — hold everything — and must not be confused
    // with a failure.
    this.planFailed = result.evaluations === 0;
  }

  /** Whether the engine would accept `action` right now. A planned action can
   * stop being legal, and letting `dispatch` refuse it would end the game. */
  private isPlayable(view: ControllerView, action: Action): boolean {
    const serialized = JSON.stringify(action);
    return view
      .legalActions()
      .flatMap((legal) => candidateActions(legal, this.playerId))
      .some((a) => JSON.stringify(a) === serialized);
  }
}
