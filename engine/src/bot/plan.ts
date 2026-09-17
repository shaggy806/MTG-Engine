/**
 * Turn-plan search — v3's answer to what the bot actually decides.
 *
 * ## Why a plan and not an action
 *
 * v2 searched one priority window at a time: enumerate the actions available
 * now, simulate each, take the best. That is the wrong unit, and the
 * measurement is unambiguous. At a real turn-8 position with eleven candidates,
 * rolled three turns deep with every seat playing, **eight of them produced a
 * literally identical end state** — same battlefield, same hand size, same life
 * totals — and seven scored identically to passing.
 *
 * The reason is structural: within one turn the order of most plays does not
 * matter, and a policy that plays the whole affordable set gets there whichever
 * action you force first. So the question "which action now?" is mostly a
 * question with no answer. The real question is **which set of plays to make
 * this turn**, with their targets and the attack — and that is a plan.
 *
 * ## What a plan is, and the one rule that gives it meaning
 *
 * A {@link TurnPlan} is the ordered list of actions this seat intends to take
 * this turn. Scoring one means playing it out and then letting the policy run
 * `depth` turns past it, averaged over sampled worlds.
 *
 * The load-bearing rule is what happens when the plan runs out: **our seat
 * passes for the rest of that turn.** A plan is the *complete* specification of
 * our turn, not a prefix the policy finishes. Letting v1 pick up where the plan
 * stopped would reintroduce exactly the collapse above — every plan would end in
 * the same v1 turn — and it would make "hold up mana" inexpressible, since the
 * policy would always spend it. Declining to act has to be a thing the bot can
 * choose, and an omitted play is how it says so.
 *
 * From the *next* turn on the same seat plays normally again, because the
 * rollout past our own turn is a forecast, not a plan.
 */

import type { Action, LegalAction } from "../actions.js";
import type { CardRegistry } from "../cards.js";
import { HeuristicBotController } from "../controller.js";
import type { ControllerView, PlayerController } from "../controller.js";
import { Game } from "../game.js";
import type { PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import { candidateActions } from "./candidates.js";
import { sampleWorlds } from "./determinize.js";
import { DEFAULT_WEIGHTS, evaluateState } from "./evaluate.js";
import type { EvalWeights } from "./evaluate.js";
import { PlayingRolloutController } from "./simulate.js";

/** The ordered actions a seat intends to take on one turn. */
export type TurnPlan = readonly Action[];

export interface PlanSearchOptions {
  readonly weights?: EvalWeights;
  /** Player turns of rollout past the planned turn. Defaults to
   * `turnOrder.length + 1` — far enough to come back round to ourselves, so the
   * plan, every opponent's answer and our follow-up all sit inside it. */
  readonly depth?: number;
  /** Sampled worlds per plan. Every plan is scored against the *same* ones. */
  readonly worlds?: number;
  /** Ceiling on plan evaluations for one turn. */
  readonly maxEvaluations?: number;
  /** Wall-clock ceiling for one turn's search, in milliseconds. Off by
   * default, so tests and the fuzzer keep replaying identically. */
  readonly timeBudgetMs?: number;
}

const DEFAULT_WORLDS = 5;
const DEFAULT_MAX_EVALUATIONS = 120;

/** A rollout may not run forever; scaled by depth so a deep one isn't
 * truncated at the same tick a shallow one is. */
const STEPS_PER_TURN = 400;

/** An improvement smaller than this is noise, not a better plan. Plans are
 * compared as means over a handful of noisy rollouts, and without a threshold
 * the climb chases sampling error and keeps appending worthless actions. */
const MIN_GAIN = 0.5;

const sameAction = (a: Action, b: Action): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * The concrete actions worth planning at `view`, pass excluded.
 *
 * Mana abilities are left out for the reason v1 and v2 both left them out:
 * casting auto-pays, so activating one on its own can only strand the source.
 * In a plan they would also be pure noise — an action that changes nothing the
 * evaluation can see, multiplying the branching at every step of the climb.
 */
function planCandidates(view: ControllerView, me: PlayerId): Action[] {
  const out: Action[] = [];
  for (const legal of view.legalActions()) {
    if (legal.kind === "pass-priority") continue;
    if (legal.kind === "activate-ability" && (legal as { manaAbility?: boolean }).manaAbility === true) {
      continue;
    }
    out.push(...candidateActions(legal as LegalAction, me));
  }
  return out.filter((a) => a.type !== "pass-priority");
}

/**
 * Plays a fixed plan on the planned turn, then passes; plays as v1 on every
 * later turn.
 *
 * It also *captures* the candidate actions available at the moment the plan
 * runs out — that's the frontier the climb extends from, and capturing it here
 * is far cheaper and more exact than re-deriving the state afterwards.
 */
export class PlanController extends HeuristicBotController {
  private index = 0;
  /** Candidates at the point the plan was exhausted, or null if it never was. */
  frontier: Action[] | null = null;
  /** Planned actions played, and planned actions found illegal and dropped.
   * The second is the divergence rate — how often reality departs from the
   * sampled world the plan was built in — and it decides whether replanning
   * mid-turn is worth building. */
  executed = 0;
  skipped = 0;

  private readonly plan: TurnPlan;
  private readonly planTurn: number;
  private readonly captureFrontier: boolean;

  constructor(
    playerId: PlayerId,
    registry: CardRegistry,
    plan: TurnPlan,
    planTurn: number,
    captureFrontier: boolean,
  ) {
    super(playerId, registry);
    this.plan = plan;
    this.planTurn = planTurn;
    this.captureFrontier = captureFrontier;
  }

  act(view: ControllerView): Action {
    const state = view.state;
    // Decisions raised mid-resolution, and combat declarations, still get v1's
    // answer: a plan covers priority actions only, for now.
    if (state.awaiting !== null) return super.act(view);
    if (state.turn.number !== this.planTurn) return super.act(view);

    while (this.index < this.plan.length) {
      const next = this.plan[this.index];
      this.index += 1;
      // A planned action can stop being legal — the plan was built on one
      // sampled world and this is another, or an opponent responded. Skip it
      // rather than letting `dispatch` throw and lose the whole rollout.
      if (planCandidates(view, this.playerId).some((a) => sameAction(a, next))) {
        this.executed += 1;
        return next;
      }
      this.skipped += 1;
    }

    if (this.captureFrontier && this.frontier === null) {
      this.frontier = planCandidates(view, this.playerId);
    }
    // The plan is the whole turn. Passing here is what makes an omitted play
    // mean "I chose not to" rather than "the policy will get to it".
    return { type: "pass-priority", player: this.playerId };
  }
}

/** Records what v1 does with the turn, to seed the climb with a plan that is
 * already competent. */
class RecordingController extends HeuristicBotController {
  readonly recorded: Action[] = [];

  private readonly planTurn: number;

  constructor(playerId: PlayerId, registry: CardRegistry, planTurn: number) {
    super(playerId, registry);
    this.planTurn = planTurn;
  }

  act(view: ControllerView): Action {
    const action = super.act(view);
    if (
      view.state.awaiting === null &&
      view.state.turn.number === this.planTurn &&
      action.type !== "pass-priority"
    ) {
      this.recorded.push(action);
    }
    return action;
  }
}

function controllersFor(
  state: GameState,
  registry: CardRegistry,
  me: PlayerId,
  self: PlayerController,
): Record<PlayerId, PlayerController> {
  const controllers: Record<PlayerId, PlayerController> = {};
  for (const player of state.turnOrder) {
    controllers[player] =
      player === me ? self : new PlayingRolloutController(player, registry);
  }
  return controllers;
}

/**
 * Play `plan` out in `world` and run `depth` turns past it — one sample of what
 * a plan leads to.
 *
 * Exported because a plan's *score* is nearly useless for working out why the
 * search chose what it did; the end state is what tells you, and reconstructing
 * it by hand from the outside is fiddly enough to get wrong.
 */
export function rolloutPlan(
  world: GameState,
  registry: CardRegistry,
  me: PlayerId,
  plan: TurnPlan,
  planTurn: number,
  depth: number,
): GameState | null {
  return rollout(world, registry, me, new PlanController(me, registry, plan, planTurn, false), depth);
}

/** Run one world forward `depth` turns with `self` in our seat. */
function rollout(
  world: GameState,
  registry: CardRegistry,
  me: PlayerId,
  self: PlayerController,
  depth: number,
): GameState | null {
  const until = world.turn.number + Math.max(1, depth);
  try {
    const sim = Game.fromSnapshot(
      { ...world, eventLog: [] },
      { registry, controllers: controllersFor(world, registry, me, self) },
    );
    let steps = 0;
    sim.advanceUntil((s) => {
      steps += 1;
      return steps > STEPS_PER_TURN * depth || s.turn.number >= until;
    });
    return sim.state;
  } catch {
    return null;
  }
}

/**
 * The mean score of `plan` across `worlds`.
 *
 * Every plan in one search is scored against the same sampled worlds — common
 * random numbers. Without that, the comparison measures which plan drew better
 * rather than which plan was better, which v2 demonstrated the expensive way.
 */
export function scorePlan(
  worlds: readonly GameState[],
  registry: CardRegistry,
  me: PlayerId,
  plan: TurnPlan,
  planTurn: number,
  depth: number,
  weights: EvalWeights,
): number {
  let total = 0;
  let counted = 0;
  for (const world of worlds) {
    const end = rollout(world, registry, me, new PlanController(me, registry, plan, planTurn, false), depth);
    if (end === null) continue;
    total += evaluateState(end, registry, me, weights);
    counted += 1;
  }
  return counted === 0 ? -Infinity : total / counted;
}

/** The actions available at the point `plan` runs out, on the real state. */
function frontierAfter(
  state: GameState,
  registry: CardRegistry,
  me: PlayerId,
  plan: TurnPlan,
  planTurn: number,
): Action[] {
  const self = new PlanController(me, registry, plan, planTurn, true);
  try {
    const sim = Game.fromSnapshot(
      { ...state, eventLog: [] },
      { registry, controllers: controllersFor(state, registry, me, self) },
    );
    let steps = 0;
    sim.advanceUntil((s) => {
      steps += 1;
      return steps > STEPS_PER_TURN || self.frontier !== null || s.turn.number !== planTurn;
    });
  } catch {
    return [];
  }
  return self.frontier ?? [];
}

/**
 * One step's worth of neighbouring plans: append a play, swap one out for a
 * different play available at that point, or drop one.
 *
 * **Append alone is not enough**, and the bug that proved it is worth keeping
 * in mind. The climb is seeded with v1's plan; v1 aims removal at the first
 * legal target, which was a 2/2 standing next to a 6/4. With only `append`
 * available, the better target was unreachable — the Murder was already in the
 * plan and nothing could change *which* creature it killed, so the search
 * stopped on the worse of two plans it had correctly scored (-24.1 against
 * -8.1). Swapping is what makes targets searchable at all.
 *
 * Dropping matters for the mirror reason: it is how the climb walks back a play
 * that v1 wanted and the rollouts say is a mistake.
 *
 * The frontier for position `i` is computed from the plan *prefix* before it,
 * because what's available at that point depends on everything played earlier.
 */
function planNeighbours(
  state: GameState,
  registry: CardRegistry,
  me: PlayerId,
  plan: TurnPlan,
  planTurn: number,
): TurnPlan[] {
  const out: TurnPlan[] = [];
  const seen = new Set<string>([JSON.stringify(plan)]);
  const add = (candidate: TurnPlan): void => {
    const key = JSON.stringify(candidate);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(candidate);
  };

  for (const action of frontierAfter(state, registry, me, plan, planTurn)) {
    add([...plan, action]);
  }
  for (let i = 0; i < plan.length; i += 1) {
    add([...plan.slice(0, i), ...plan.slice(i + 1)]);
    for (const action of frontierAfter(state, registry, me, plan.slice(0, i), planTurn)) {
      add([...plan.slice(0, i), action, ...plan.slice(i + 1)]);
    }
  }
  return out;
}

/** What v1 would do with this turn — the plan the climb has to beat. */
function heuristicPlan(
  state: GameState,
  registry: CardRegistry,
  me: PlayerId,
  planTurn: number,
): TurnPlan {
  const self = new RecordingController(me, registry, planTurn);
  try {
    const sim = Game.fromSnapshot(
      { ...state, eventLog: [] },
      { registry, controllers: controllersFor(state, registry, me, self) },
    );
    let steps = 0;
    sim.advanceUntil((s) => {
      steps += 1;
      return steps > STEPS_PER_TURN || s.turn.number !== planTurn;
    });
  } catch {
    return [];
  }
  return self.recorded;
}

export interface PlanSearchResult {
  readonly plan: TurnPlan;
  readonly score: number;
  /** Plan evaluations spent, for budgeting and for the bench's report. */
  readonly evaluations: number;
  /** Whether the search kept v1's plan rather than finding a better one. */
  readonly keptHeuristic: boolean;
}

/**
 * Search a plan for `me`'s current turn.
 *
 * The climb is greedy and constructive, like the combat builder: start from the
 * empty plan and from v1's, then repeatedly try appending each action available
 * at the plan's end, keeping the best append that clears {@link MIN_GAIN}.
 * Nothing is enumerated — a turn's action sequences are a combinatorial space
 * and the marginal ordering almost never matters.
 *
 * The empty plan is always a candidate, which is how "do nothing this turn,
 * hold everything up" stays on the table.
 */
export function searchTurnPlan(
  state: GameState,
  registry: CardRegistry,
  me: PlayerId,
  options: PlanSearchOptions = {},
): PlanSearchResult {
  const weights = options.weights ?? DEFAULT_WEIGHTS;
  const depth = options.depth ?? state.turnOrder.length + 1;
  const worldCount = options.worlds ?? DEFAULT_WORLDS;
  const maxEvaluations = options.maxEvaluations ?? DEFAULT_MAX_EVALUATIONS;
  const until =
    options.timeBudgetMs === undefined ? Infinity : Date.now() + options.timeBudgetMs;
  const planTurn = state.turn.number;

  const worlds = sampleWorlds(state, me, worldCount);
  // A state that can't be safely resampled (something mid-resolution) gets no
  // plan; the caller falls back to v1.
  if (worlds.length === 0) {
    return { plan: [], score: -Infinity, evaluations: 0, keptHeuristic: true };
  }

  let evaluations = 0;
  const spent = (): boolean => evaluations >= maxEvaluations || Date.now() >= until;
  const score = (plan: TurnPlan): number => {
    evaluations += 1;
    return scorePlan(worlds, registry, me, plan, planTurn, depth, weights);
  };

  let best: TurnPlan = [];
  let bestScore = score(best);
  let keptHeuristic = false;

  // v1's turn is the plan to beat. Seeding the climb with it matters for the
  // same reason it does in combat: a greedy climb from nothing can't reach a
  // line whose parts are only worth taking together.
  const v1Plan = heuristicPlan(state, registry, me, planTurn);
  if (v1Plan.length > 0) {
    const v1Score = score(v1Plan);
    if (v1Score >= bestScore) {
      best = v1Plan;
      bestScore = v1Score;
      keptHeuristic = true;
    }
  }

  while (!spent()) {
    const neighbours = planNeighbours(state, registry, me, best, planTurn);
    if (neighbours.length === 0) break;

    // Pick the best neighbour on raw score, *then* apply the threshold once.
    // Folding `MIN_GAIN` into the running comparison instead makes the climb
    // order-dependent — an action 0.6 better than the incumbent would beat a
    // later one 0.9 better, because the later one had to clear the earlier
    // one's score *plus* the margin. That cost the "removal takes the biggest
    // threat" scenario: whichever target the frontier happened to list first
    // won.
    let stepPlan: TurnPlan | null = null;
    let stepScore = -Infinity;
    for (const candidate of neighbours) {
      if (spent()) break;
      const value = score(candidate);
      if (value > stepScore) {
        stepPlan = candidate;
        stepScore = value;
      }
    }
    // The threshold is about "is doing this worth anything at all", which is a
    // question about the incumbent, not about the other neighbours.
    if (stepPlan === null || stepScore <= bestScore + MIN_GAIN) break;
    best = stepPlan;
    bestScore = stepScore;
    keptHeuristic = false;
  }

  return { plan: best, score: bestScore, evaluations, keptHeuristic };
}
