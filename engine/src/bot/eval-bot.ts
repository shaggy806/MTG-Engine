/**
 * A one-ply searching bot: at each priority window, enumerate the concrete
 * actions available, play each one out against a throwaway copy of the game,
 * score the result, and take the best.
 *
 * It extends {@link HeuristicBotController} rather than replacing it. Decisions
 * the engine waits on mid-resolution — a trigger's targets, modes, "you may",
 * sacrifices, discards, tutors, scry — are searched the same way as priority
 * moves (`decisions.ts`), with v1's answer as the candidate to beat; the few
 * that aren't searched (mulligans, combat damage order) keep it outright.
 *
 * Combat is searched separately, because one-ply is blind to it: attacks are
 * declared *before* blocks, so the state right after "declare attackers" shows
 * only tapped creatures. Attacks and blocks are built one pair at a time, each
 * candidate simulated through blocks and damage (`simulateCombat`), and never
 * enumerated — a ten-creature board against three opponents has about a
 * million attack declarations. Two checks frame every attack (see
 * `combat-math.ts`): swing with everything when that's lethal through the
 * best blocks, and never leave too little home to survive the crackback.
 *
 * See `docs/plans/smarter-bots.md` for the measurements and for why the
 * evaluation's feature list is shaped the way it is.
 */

import type { Action, AttackerDeclaration, BlockerDeclaration, LegalAction } from "../actions.js";
import type { CardRegistry } from "../cards.js";
import { withRequiredAttackers } from "../combat/attacking.js";
import { createDefaultRegistry } from "../cards.js";
import { HeuristicBotController } from "../controller.js";
import type { ControllerView, PlayerController } from "../controller.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import type { GameState } from "../state.js";
import { manaValue, parseManaCost } from "../mana.js";
import { computeCharacteristics, withComputedCache } from "../characteristics.js";
import { onlyUntilEndOfTurn } from "../effect-worth.js";
import { goadersOf } from "../goad.js";
import {
  modalPolarities,
  offerPolarities,
  pendingTargetPolarities,
  rankTargets,
  sideOf,
  specSide,
} from "../target-polarity.js";
import { candidateActions } from "./candidates.js";
import { collapseTwins } from "./twins.js";
import type { TargetRef } from "../target.js";
import type { Polarity } from "../target-polarity.js";
import { decisionCandidates } from "./decisions.js";
import { canBlock, combatCreatures, crackback, damageThrough, isLethal } from "./combat-math.js";
import type { CombatCreature } from "./combat-math.js";
import { DEFAULT_WEIGHTS, evaluateState, normalizeWeights } from "./evaluate.js";
import { lifeCost } from "./features.js";
import type { EvalWeights } from "./evaluate.js";
import {
  CombatRolloutController,
  MAX_BATCH,
  simulateAction,
  simulateCombat,
  simulateRepeated,
} from "./simulate.js";
import type { Horizon, RolloutPolicy } from "./simulate.js";

export interface EvalBotOptions {
  readonly weights?: EvalWeights;
  readonly horizon?: Horizon;
  /** How the other seats (and our own, after the candidate move) play a
   * priority rollout out. See `RolloutPolicy`. */
  readonly rollout?: RolloutPolicy;
  /**
   * Whether priority rollouts search our own decisions one level deep too
   * (a {@link DecisionRolloutController} in our seat), rather than taking
   * v1's answers. Without it, casting a creature whose "enters" trigger says
   * "you may" is scored as if we'd decline. Decisions the engine actually
   * asks us are always searched this way.
   */
  readonly rolloutDecisions?: boolean;
  /**
   * Ceiling on simulations per decision. The action space is small in
   * practice (median 2 concrete actions per window, 99th percentile around 9),
   * but a wide four-player board has been measured at 211 — this bounds the
   * worst case rather than letting it grow with the board. Attack and block
   * declarations get the same budget each.
   */
  readonly maxSimulations?: number;
  /**
   * Wall-clock ceiling on one decision, in milliseconds. **Off by default**,
   * and that default is deliberate.
   *
   * Counting simulations does not bound time, because a simulation's cost
   * grows with the board: on a four-player board of 200+ permanents a single
   * end-of-turn rollout costs ~400ms, so ten candidates is 4s and the
   * 200-simulation ceiling is over a minute. Measured worst cases were 2s at
   * two players and 14s at four, against a room's 350ms think pause.
   *
   * A clock fixes that, at the cost of the engine's determinism guarantee —
   * same seed plus same controllers no longer replays identically, because a
   * busier machine searches less. So it stays off for tests, the fuzzer and
   * the tuner, which need reproducibility, and `Room.addBot` turns it on for
   * live play, where a bounded response matters more than a reproducible one.
   *
   * When it expires the search returns the best candidate found *so far*, and
   * candidates are ordered so that "so far" is worth something: passing and
   * v1's own choice are scored first, so an early cutoff degrades to v1-quality
   * play rather than to whatever happened to be enumerated first.
   */
  readonly timeBudgetMs?: number;
  /**
   * Told every candidate a priority window or a decision simulates, with the
   * state its rollout ended in (`null` when the engine refused it), in the
   * order they were scored; the first of any tie is the one played, and a
   * window answered without a simulation reports nothing. For measurement: a
   * priority window's rollouts never read the weights, so `bot:fit-scenarios`
   * can replay its choice under any vector from these states alone. A
   * decision's rollouts can (a further decision inside one is searched with
   * them), and combat declarations aren't reported at all: that search is
   * steered by the weights as it goes.
   */
  readonly trace?: (action: Action, after: GameState | null) => void;
}

/**
 * What a search may still spend: simulations, and time.
 *
 * `until` is a `Date.now()` stamp rather than `performance.now()` — this module
 * is bundled into the client as well as run in the server, and millisecond
 * resolution is ample for a budget measured in hundreds of them.
 *
 * `simulations` and `ms` are what it has spent so far, every simulation
 * counted whether or not it came out of `left` (the passing baseline and v1's
 * attack are scored outside the count, so that count-bounded searches replay
 * exactly as they always have). They feed the predictive stop in {@link spent}.
 */
interface SearchBudget {
  left: number;
  readonly until: number;
  simulations: number;
  ms: number;
}

const newBudget = (left: number, until: number): SearchBudget => ({
  left,
  until,
  simulations: 0,
  ms: 0,
});

/**
 * Whether the search must stop: out of simulations, or out of time for
 * another *whole* one.
 *
 * The time test predicts rather than reacts. Checking only that the deadline
 * hasn't passed lets a simulation start a millisecond before it and run its
 * full length after — on a wide four-player board that is hundreds of
 * milliseconds, and it put 7% of priority searches, 15% of attack and block
 * declarations and 10% of other decisions over the room's 300ms budget (the
 * worst at 640ms). Stopping once the running mean no longer fits keeps the
 * overshoot to the variance of one simulation instead of its whole length.
 *
 * **Except for the first two.** Every search scores its two baselines first —
 * passing and v1's move, or v1's swing and the empty attack — so that an
 * expired search degrades to v1's play rather than to doing nothing. Predicted
 * from one expensive baseline, the second never ran: measured, 79 windows in
 * 24 four-player games passed where v1 would have acted in 65 of them. So the
 * prediction waits for both, and only the deadline itself can stop the second.
 */
const spent = (budget: SearchBudget): boolean => {
  if (budget.left <= 0) return true;
  if (budget.until === Infinity) return false;
  const now = Date.now();
  if (now >= budget.until) return true;
  if (budget.simulations < 2) return false;
  return now + budget.ms / budget.simulations >= budget.until;
};

/** Run one simulation, charging its time to `budget`. */
function timed<T>(budget: SearchBudget, simulate: () => T): T {
  const started = Date.now();
  try {
    return simulate();
  } finally {
    budget.simulations += 1;
    budget.ms += Date.now() - started;
  }
}

/**
 * What the most recent decision cost — diagnostics only, never read by the
 * bot itself. It is how a test can tell that a window was answered without a
 * simulation (this suite may not spy on module functions), and what a
 * behaviour measurement reads instead of patching the class.
 */
export interface DecisionAudit {
  readonly kind: "priority" | "decision" | "attackers" | "blockers";
  readonly simulations: number;
  readonly ms: number;
}

const audit = (kind: DecisionAudit["kind"], budget: SearchBudget | null): DecisionAudit => ({
  kind,
  simulations: budget?.simulations ?? 0,
  ms: budget?.ms ?? 0,
});

/** Structural equality, for spotting v1's chosen action among the enumerated
 * candidates. An `Action` is a plain JSON-able record whose keys are built in
 * a fixed order by `candidateActions`, so comparing serialisations is exact
 * here and far simpler than a per-variant comparison. */
const sameAction = (a: Action, b: Action): boolean => JSON.stringify(a) === JSON.stringify(b);

const DEFAULT_MAX_SIMULATIONS = 200;

type DeclareAttackersLegal = Extract<LegalAction, { kind: "declare-attackers" }>;
type DeclareBlockersLegal = Extract<LegalAction, { kind: "declare-blockers" }>;

/** An attack that would leave us dead to the crackback scores below every safe
 * one, while still ordering the unsafe ones among themselves. */
const UNSAFE = -1e8;

/** Menace blocker pairs tried per attacker — pairs are quadratic in the
 * blockers, and the first few cover what matters. */
const MAX_MENACE_PAIRS = 6;

/**
 * Moves simulated per round of a combat climb. A combat simulation is far
 * dearer than a priority one — it runs blocks, damage and every trigger on
 * what is often the widest board of the game — and a four-player block with
 * 19 attackers and 5 blockers took 4s simulating every pair. Moves are ranked
 * by cheap arithmetic first and only the most promising are simulated.
 */
const MOVES_PER_ROUND = 8;

/** Two scores this close are a tie: the same end state reached by a
 * different order of floating-point sums. */
const TIE = 1e-9;

/** What a creature is worth to the evaluation, roughly: its creature, power
 * and toughness terms. Only used to rank moves, never to choose one. */
const creatureValue = (c: CombatCreature, w: EvalWeights): number =>
  w.creatures + w.power * Math.max(0, c.power) + w.toughness * Math.max(0, c.toughness);

/** Every order of `items` — few: the opponents at one table. */
function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [[...items]];
  return items.flatMap((item, i) =>
    permutations(items.filter((_, j) => j !== i)).map((rest) => [item, ...rest]),
  );
}

/**
 * Greedy local search: from `start`, repeatedly simulate the most promising
 * neighbours (by `estimate`) and move to the best one that beats where we are,
 * until none does or `budget` simulations are spent. Returns the best
 * declaration found and its score.
 */
function hillClimb<T>(
  start: readonly T[],
  neighbours: (current: readonly T[]) => { next: T[]; estimate: number }[],
  score: (declaration: readonly T[]) => number | null,
  budget: SearchBudget,
): [T[], number] {
  let current = [...start];
  budget.left -= 1;
  let currentScore = timed(budget, () => score(current)) ?? -Infinity;
  while (!spent(budget)) {
    const ranked = neighbours(current)
      .sort((a, b) => b.estimate - a.estimate)
      .slice(0, MOVES_PER_ROUND);
    let step: T[] | null = null;
    let stepScore = currentScore;
    for (const { next } of ranked) {
      if (spent(budget)) break;
      budget.left -= 1;
      const value = timed(budget, () => score(next));
      if (value !== null && value > stepScore) {
        step = next;
        stepScore = value;
      }
    }
    if (step === null) break;
    current = step;
    currentScore = stepScore;
  }
  return [current, currentScore];
}

/**
 * Rollouts one top-level decision may spend, and — separately — what every one
 * of those rollouts may spend on decisions *inside* it. Both are small because
 * they multiply: Windreader Sphinx ("whenever a creature with flying attacks,
 * you may draw a card") on a board of flyers raised a "you may" per attacker,
 * each rollout contained the rest of them, and with a 200-rollout budget and
 * 16 per nested decision one of those answers took 11.5s. Two nested rollouts
 * is exactly enough to accept or decline a "you may", the case the nesting is
 * for; Flameblast Dragon (a target, then "you may pay {X}{R}") still took
 * 4.9s on a four-player board at 16 and 4.
 */
const DECISION_ROLLOUTS = 12;
const NESTED_DECISION_ROLLOUTS = 2;

/**
 * The best answer to the decision pending in `view`, by playing each candidate
 * out to `horizon` and scoring it. Ties keep `inherited` — v1's answer — so a
 * search only ever changes an answer it can see is better.
 *
 * `selfFor` plays our own seat in each rollout (a fresh one per candidate, so
 * every candidate gets the same nested budget). At the top level it's a
 * {@link DecisionRolloutController}, so a decision that leads straight into
 * another is judged by what we'd really answer next: a trigger's target is
 * worth nothing if the "you may" after it is declined, which is exactly what
 * v1 would do.
 */
function bestDecision(
  view: ControllerView,
  inherited: Action,
  cards: CardRegistry,
  weights: EvalWeights,
  horizon: Horizon,
  rollout: RolloutPolicy,
  budget: SearchBudget,
  selfFor?: () => PlayerController,
  trace?: EvalBotOptions["trace"],
): Action {
  const me = view.player;
  if (inherited.player !== me || budget.left <= 1 || spent(budget)) return inherited;
  const legal = view.legalActions().find((l) => l.kind !== "pass-priority");
  const candidates =
    legal === undefined
      ? null
      : decisionCandidates(
          withComputedCache(() => aimOffer(view.state, cards, me, legal)),
          me,
          (ids) => byManaValue(view.state, cards, ids),
          (id) => view.state.objects[id]?.controller,
          (player) => view.state.players[player]?.counters.poison ?? 0,
        );
  if (candidates === null || candidates.length === 0) return inherited;

  const score = (action: Action): number | null => {
    budget.left -= 1;
    const after = timed(budget, () =>
      simulateAction(view.state, cards, action, horizon, rollout, selfFor?.()),
    );
    trace?.(action, after);
    return after === null ? null : evaluateState(after, cards, me, weights);
  };
  let best = inherited;
  let bestScore = score(inherited) ?? -Infinity;
  const seen = JSON.stringify(inherited);
  for (const candidate of candidates) {
    if (spent(budget)) break;
    if (JSON.stringify(candidate) === seen) continue;
    const value = score(candidate);
    if (value !== null && value > bestScore) {
      best = candidate;
      bestScore = value;
    }
  }
  return best;
}

/**
 * `legal` with each target slot's options in the order worth simulating:
 * the side the slot's effect belongs on first, most valuable first
 * (`target-polarity.ts`), then the rest, least valuable first.
 *
 * Candidates are capped — `MAX_TARGET_COMBOS` (8) combinations of a spell or
 * ability, a dozen rollouts for a decision — and `legalTargets` lists the
 * players in turn order, then the battlefield oldest-first. So on a wide
 * four-player board the eight combinations v2 simulated for "destroy target
 * permanent" were the eight oldest permanents, lands from turn one, and the
 * threat worth destroying was never considered: measured, 27% of targeted
 * offers had more combinations than the cap, and 1,266 of those had an
 * opponent's target beyond it. Ranking first makes the cap cut the least
 * likely targets instead.
 *
 * Wrong-side options go last rather than away: Brash Taunter fighting its
 * own creature is a real play, and only the search can tell. A slot the
 * polarity can't read keeps the offer's order.
 */
export function aimOffer(
  state: GameState,
  cards: CardRegistry,
  me: PlayerId,
  legal: LegalAction,
): LegalAction {
  // Ranked, then twins cut to as many as there are slots (`bot/twins.ts`):
  // seven identical Scute Swarms are one option, not seven simulations.
  const aim = (options: readonly TargetRef[], polarity: Polarity | undefined, slots: number) =>
    collapseTwins(state, rankTargets(state, cards, me, options, polarity ?? "either"), slots);
  if (legal.kind === "choose-targets") {
    const polarities = pendingTargetPolarities(state, cards);
    return {
      ...legal,
      options: legal.options.map((options, i) => aim(options, polarities?.[i], legal.options.length)),
    };
  }
  if (legal.kind !== "cast-spell" && legal.kind !== "activate-ability") return legal;
  if (legal.kind === "cast-spell" && legal.castModal !== undefined) {
    // A targeted modal spell's modes carry targets of their own.
    const modal = legal.castModal;
    const byMode = modalPolarities(cards, legal);
    const slots = modal.modes.reduce((n, mode) => n + mode.targetOptions.length, 0);
    return {
      ...legal,
      castModal: {
        ...modal,
        modes: modal.modes.map((mode, m) => ({
          ...mode,
          targetOptions: mode.targetOptions.map((options, i) => aim(options, byMode?.[m]?.[i], slots)),
        })),
      },
    };
  }
  if (legal.targetOptions.length === 0) return legal;
  const polarities = offerPolarities(cards, legal);
  return {
    ...legal,
    targetOptions: legal.targetOptions.map((options, i) =>
      aim(options, polarities?.[i], legal.targetOptions.length),
    ),
  };
}

/** Highest mana value first — the order a capped tutor or discard search
 * tries cards in, so the cap cuts the least likely picks. */
function byManaValue(state: GameState, cards: CardRegistry, ids: readonly ObjectId[]): ObjectId[] {
  const mv = (id: ObjectId): number => {
    const name = state.objects[id]?.cardName;
    return name !== undefined && cards.has(name)
      ? manaValue(parseManaCost(cards.get(name).manaCost))
      : 0;
  };
  return [...ids].sort((a, b) => mv(b) - mv(a));
}

/**
 * Our own seat inside a decision's rollout: passes priority, fights combat
 * the way the rollout policy says, and searches any further decision one
 * level deep — with plain v1 answers beneath that, so it can't recurse — out
 * of one small budget for the whole rollout.
 */
class DecisionRolloutController extends CombatRolloutController {
  private readonly cards: CardRegistry;
  private readonly weights: EvalWeights;
  private readonly horizon: Horizon;
  private readonly rollout: RolloutPolicy;
  private readonly budget: SearchBudget = newBudget(NESTED_DECISION_ROLLOUTS, Infinity);

  constructor(
    playerId: PlayerId,
    cards: CardRegistry,
    weights: EvalWeights,
    horizon: Horizon,
    rollout: RolloutPolicy,
  ) {
    super(playerId, cards);
    this.cards = cards;
    this.weights = weights;
    this.horizon = horizon;
    this.rollout = rollout;
  }

  act(view: ControllerView): Action {
    const inherited = super.act(view);
    if (view.state.awaiting === null) return inherited;
    return bestDecision(
      view,
      inherited,
      this.cards,
      this.weights,
      this.horizon,
      this.rollout,
      this.budget,
    );
  }

  declareAttackers(view: ControllerView): readonly AttackerDeclaration[] {
    return this.rollout === "combat" || this.rollout === "acting" ? super.declareAttackers(view) : [];
  }

  declareBlockers(view: ControllerView): readonly BlockerDeclaration[] {
    return this.rollout === "passive" ? [] : super.declareBlockers(view);
  }
}

export class EvalBotController extends HeuristicBotController {
  private readonly cards: CardRegistry;
  readonly weights: EvalWeights;
  private readonly horizon: Horizon;
  private readonly rollout: RolloutPolicy;
  private readonly rolloutDecisions: boolean;
  private readonly maxSimulations: number;
  private readonly timeBudgetMs: number;
  private readonly trace: EvalBotOptions["trace"];
  /** The stack this bot last passed on, and on which turn — see
   * `holdPass`. */
  private passedOn: { readonly turn: number; readonly stack: readonly ObjectId[] } | null = null;
  /** The stack a searched action (not a pass) was chosen on — see
   * `holdPass`. */
  private actedOn: { readonly turn: number; readonly stack: readonly ObjectId[] } | null = null;
  /** A batch of activations under way — see `act` and `continueBatch`. */
  private batch: {
    readonly action: Action;
    /** Each activation at a target none before it took — see
     * `nextInBatch`. */
    readonly spread: boolean;
    readonly remaining: number;
    readonly turn: number;
    /** The stack's size before the first activation. */
    readonly base: number;
    /** The stack's size once our last activation went on it — or, while
     * the batch resolves, the last time we passed. */
    readonly stack: number;
  } | null = null;
  /** See {@link DecisionAudit}. Written, never read. */
  lastDecision: DecisionAudit | null = null;

  constructor(
    playerId: PlayerId,
    registry: CardRegistry = createDefaultRegistry(),
    options: EvalBotOptions = {},
  ) {
    super(playerId, registry);
    this.cards = registry;
    // Every vector the bot ever runs on goes through this, so the land-drop
    // invariant holds for hand-written champions and tuner mutations alike
    // rather than depending on each of them to get it right.
    this.weights = normalizeWeights(options.weights ?? DEFAULT_WEIGHTS);
    this.horizon = options.horizon ?? "turn";
    this.rollout = options.rollout ?? "combat";
    this.rolloutDecisions = options.rolloutDecisions ?? false;
    this.maxSimulations = options.maxSimulations ?? DEFAULT_MAX_SIMULATIONS;
    this.timeBudgetMs = options.timeBudgetMs ?? Infinity;
    this.trace = options.trace;
  }

  act(view: ControllerView): Action {
    this.lastDecision = null;
    const continued = this.continueBatch(view) ?? this.holdPass(view);
    this.passedOn = null;
    this.actedOn = null;
    if (continued !== null) {
      this.lastDecision = audit("priority", null);
      if (continued.type === "pass-priority") this.rememberPass(view);
      return continued;
    }
    const inherited = super.act(view);
    // `super.act` has already routed anything the engine is waiting on
    // through `answerAwaited`, which calls back into this class's own
    // `declareAttackers`/`declareBlockers`. The rest are searched here.
    if (view.state.awaiting !== null) return this.decide(view, inherited);

    const player = this.playerId;
    const pass: Action = { type: "pass-priority", player };

    const candidates: Action[] = [];
    // Candidates that help an opponent's attacker with something lasting:
    // kept only if the defending player dies (`opponentPump`).
    const mustKill = new Map<Action, PlayerId>();
    // A read-only region: ranking targets folds every option's
    // characteristics, and nothing changes the state until the simulations
    // below, which run outside it.
    withComputedCache(() => {
      for (const legal of view.legalActions()) {
        // Mana abilities are never worth a simulation: casting auto-pays, so
        // tapping for mana on its own gains nothing the evaluation could see,
        // and on a wide board they're nearly every candidate there is — 27 of
        // 30 on one 38-permanent board, which made a single decision a 2s search.
        if (legal.kind === "activate-ability" && this.isManaOnlyAbility(legal)) continue;
        // An until-end-of-turn pump where it can't matter (`wastedNow`): the
        // rollout plays our own seat passively, so mana it would have cast
        // spells with looks free to spend, and v2 pumped away its upkeep.
        if (this.wastedNow(view.state, legal)) continue;
        // Mana our own main phase could cast a spell with, spent in our upkeep
        // (`holdsManaForMain`): the rollouts never show that spell.
        if (this.holdsManaForMain(view.state, legal)) continue;
        for (const action of candidateActions(aimOffer(view.state, this.cards, player, legal), player)) {
          const verdict = this.opponentPump(view.state, legal, action);
          if (verdict === "drop") continue;
          if (verdict !== "ok") mustKill.set(action, verdict.kills);
          candidates.push(action);
        }
      }
    });

    // **Nothing to choose between, nothing to simulate.** Passing used to be
    // rolled out to the end of the turn *before* the candidates were listed,
    // so a window whose only other options were mana abilities — most of the
    // windows in a game, since every seat gets priority at every step — paid a
    // full rollout to learn nothing. Measured over 40 four-player games: 71k
    // of 91k windows, a third of all the bot's CPU, and in a live room all of
    // it on the server's one thread.
    if (candidates.length === 0) {
      this.lastDecision = audit("priority", null);
      return pass;
    }
    const budget = this.budget();

    // **A land drop is not weighed against passing.** Playing a land costs
    // nothing but the card, doesn't use the turn, and leaves another priority
    // window to spend afterwards, so declining one is never right — and the
    // evaluation gets it wrong far too easily, because `hand` prices a land in
    // hand like any other card (see `normalizeWeights`). v1 has always played
    // a land first; the search must not be a way to lose that.
    //
    // *Which* land is a real decision, though, so several are still searched
    // against each other — just never against doing nothing. A land drop
    // carrying a `face` is excluded: that's an MDFC, where taking the land
    // side means giving up a spell, which is exactly the trade the search is
    // for.
    const lands = candidates.filter((a) => a.type === "play-land" && a.face === undefined);
    if (lands.length === 1) {
      this.lastDecision = audit("priority", null);
      return lands[0];
    }
    if (lands.length > 1) {
      let bestLand = lands[0];
      let bestLandScore = -Infinity;
      for (const land of lands) {
        if (spent(budget)) break;
        budget.left -= 1;
        const score = this.score(view, land, budget);
        if (score !== null && score > bestLandScore) {
          bestLandScore = score;
          bestLand = land;
        }
      }
      this.lastDecision = audit("priority", budget);
      return bestLand;
    }

    // Passing is a candidate like any other, rolled out to the same horizon.
    // Scoring against "is this better than the current state" instead would
    // make the bot inactive-by-default and turn the zero point into an extra
    // implicit weight — a land drop sits almost exactly on it.
    let best: Action = pass;
    // Passing is always legal at a priority window, so a `null` here means the
    // simulation itself fell over; treat it as "no baseline" rather than
    // letting it veto every alternative.
    budget.left -= 1;
    let bestScore = this.score(view, pass, budget) ?? -Infinity;

    // v1's own pick goes first, because under a wall-clock budget the search
    // may not reach the end of this list — and what it has scored by then is
    // what it plays. Enumeration order is an accident of `legalActions`, so
    // without this an early cutoff would leave the bot choosing between
    // passing and whichever card happened to be enumerated first. Scoring v1's
    // choice first makes the floor "v1's move, or passing, whichever actually
    // measured better", which is a policy worth degrading to.
    const inheritedFirst = candidates.findIndex((a) => sameAction(a, inherited));
    if (inheritedFirst > 0) {
      const [preferred] = candidates.splice(inheritedFirst, 1);
      candidates.unshift(preferred);
    }

    // Under the `"acting"` rollout, passing is scored with the spells our own
    // seat casts later in the turn, so it ties with casting the first of them
    // now; the tie goes to acting — to passing, the bot would put every play
    // off until the last window of its turn. Against each other, candidates
    // still need to be strictly better.
    const tiesAct = this.rollout === "acting";
    for (const action of candidates) {
      if (spent(budget)) break;
      budget.left -= 1;
      const victim = mustKill.get(action);
      const score = this.score(view, action, budget, victim);
      if (score === null) continue;
      const beats =
        score > bestScore || (tiesAct && best.type === "pass-priority" && score >= bestScore - TIE);
      if (!beats) continue;
      bestScore = score;
      best = action;
    }

    // **Batches.** An ability that can be activated again at once — a pump,
    // firebreathing, "{R}: Dragons you control get +1/+0" — is also tried as
    // many times in a row as the mana allows, as one candidate: twelve mana
    // for +6/+0 is weighed as a whole, where one activation at a time asks
    // twelve times whether two mana for +1/+0 is worth a search (Lathliss on a
    // pile of Treasures: a dozen activations, each a full search, one game
    // past a bench's time limit). Scored after every single move, so under a
    // clock they're the first thing dropped.
    // One batch per ability, from its best-ranked candidate — two for a
    // targeted one: every activation at the same target (a ping at a
    // two-toughness creature, a pump on one attacker) and each at a new one
    // (Scavenging Ooze eating a graveyard), for the simulation to choose
    // between.
    let batch: { readonly times: number; readonly spread: boolean } | null = null;
    const batched = new Set<string>();
    for (const action of candidates) {
      if (action.type !== "activate-ability" || mustKill.has(action)) continue;
      const key = `${action.source}:${action.abilityIndex}`;
      if (batched.has(key)) continue;
      batched.add(key);
      const targeted = (action.targets ?? []).some((t) => t !== null);
      for (const spread of targeted ? [false, true] : [false]) {
        if (spent(budget)) break;
        budget.left -= 1;
        const result = timed(budget, () =>
          simulateRepeated(
            view.state,
            this.cards,
            action,
            this.horizon,
            this.rollout,
            this.rolloutDecisions ? this.selfInRollouts() : undefined,
            MAX_BATCH,
            (game, previous) =>
              this.nextInBatch(
                game.state,
                // Only this ability's offers: the whole list plans a mana
                // payment for every ability on the board, per activation.
                previous.type === "activate-ability"
                  ? game.legalActivationsOf(this.playerId, previous.source)
                  : [],
                previous,
                spread,
              ),
          ),
        );
        if (result === null || result.times < 2) continue;
        const score = evaluateState(result.state, this.cards, this.playerId, this.weights);
        if (score <= bestScore) continue;
        bestScore = score;
        best = action;
        batch = { times: result.times, spread };
      }
    }
    if (batch !== null && best.type === "activate-ability") {
      const base = view.state.zones.shared.stack.length;
      this.batch = {
        action: best,
        spread: batch.spread,
        remaining: batch.times - 1,
        turn: view.state.turn.number,
        base,
        stack: base + 1,
      };
    }
    this.lastDecision = audit("priority", budget);
    if (best.type === "pass-priority") this.rememberPass(view);
    else if (this.batch === null && view.state.awaiting === null) {
      this.actedOn = { turn: view.state.turn.number, stack: [...view.state.zones.shared.stack] };
    }
    return best;
  }

  /** After passing with something on the stack, what that stack was — see
   * `holdPass`. */
  private rememberPass(view: ControllerView): void {
    const stack = view.state.zones.shared.stack;
    this.passedOn =
      stack.length > 0 && view.state.awaiting === null
        ? { turn: view.state.turn.number, stack: [...stack] }
        : null;
  }

  /**
   * Pass again, without a search, when all that has happened since this bot
   * last passed is that the stack it passed on has been resolving: the stack
   * now is the bottom of that one, with nothing added. Passing was scored as
   * everyone passing until that stack resolved, so the answer is already
   * made — the same "resolve all" as a batch's own (`continueBatch`), for a
   * bot watching someone else's. Without it, nine stacked pumps meant nine
   * more searches for every seat at the table, several seconds each on a big
   * board. Anything new on the stack — a response, a trigger — or a decision
   * or a new turn is searched as usual.
   */
  private holdPass(view: ControllerView): Action | null {
    const state = view.state;
    const stack = state.zones.shared.stack;
    // Just after a searched action: the stack it was chosen on plus the one
    // spell or ability it put there, ours. The action was scored as that and
    // then everyone passing until it resolved, so this window is already
    // decided — a cast used to cost a second full search here, before its
    // caster passed on its own spell.
    const acted = this.actedOn;
    if (
      acted !== null &&
      state.awaiting === null &&
      state.turn.number === acted.turn &&
      stack.length === acted.stack.length + 1 &&
      acted.stack.every((id, i) => stack[i] === id) &&
      state.objects[stack[stack.length - 1]]?.controller === this.playerId
    ) {
      return { type: "pass-priority", player: this.playerId };
    }
    const held = this.passedOn;
    if (held === null) return null;
    if (
      state.awaiting !== null ||
      state.turn.number !== held.turn ||
      stack.length === 0 ||
      stack.length >= held.stack.length ||
      stack.some((id, i) => held.stack[i] !== id)
    ) {
      return null;
    }
    return { type: "pass-priority", player: this.playerId };
  }

  /**
   * The rest of a batch the search chose (see `act`), without searching
   * again: the next activation, and once they're all on the stack, a pass at
   * every window while they resolve — "resolve all" — since the candidate
   * that won was scored as exactly that, the batch activated and then
   * passed through. Searching those windows again cost a full search each
   * on a big board: nine pumps resolving one at a time were nine more.
   *
   * `null`, dropping the batch, once anything but the batch has happened
   * since: another object on the stack (an opponent's response, a trigger),
   * a decision, a new turn, the ability no longer on offer, or the batch
   * resolved.
   */
  private continueBatch(view: ControllerView): Action | null {
    const batch = this.batch;
    this.batch = null;
    if (batch === null || batch.action.type !== "activate-ability") return null;
    const state = view.state;
    if (state.awaiting !== null || state.turn.number !== batch.turn) return null;
    const action = batch.action;
    const stack = state.zones.shared.stack;
    if (batch.remaining <= 0) {
      // Resolving: pass while everything above where the batch began is
      // still one of its own activations.
      const above = stack.slice(batch.base);
      const onlyOurs =
        above.length > 0 &&
        above.every((id) => {
          const object = state.objects[id];
          return (
            object?.kind === "ability" &&
            object.abilityKind === "activated" &&
            object.controller === this.playerId &&
            object.sourceObjectId === action.source &&
            object.abilityIndex === action.abilityIndex
          );
        });
      if (!onlyOurs || stack.length > batch.stack) return null;
      this.batch = { ...batch, stack: stack.length };
      return { type: "pass-priority", player: this.playerId };
    }
    if (stack.length !== batch.stack) return null;
    const following = this.nextInBatch(state, view.legalActions(), action, batch.spread);
    if (following === null) return null;
    this.batch = {
      ...batch,
      action: following,
      remaining: batch.remaining - 1,
      stack: batch.stack + 1,
    };
    return following;
  }

  /**
   * The next activation of a batch. Unspread, `previous` again while its
   * targets are still legal. Spread, the same ability aimed at the best
   * target that none of the batch's activations already on the stack has
   * taken (the ranking the search uses) — Scavenging Ooze eating one
   * graveyard card after another, each its own full search before; a target
   * stays legal until the activation aimed at it resolves, so repeating the
   * action would only fizzle. `null` once the ability isn't offered, nothing
   * is left to aim at, or the best of it is on the wrong side of the table
   * (the Ooze with only our own graveyard left).
   */
  private nextInBatch(
    state: GameState,
    legal: readonly LegalAction[],
    previous: Action,
    spread: boolean,
  ): Action | null {
    if (previous.type !== "activate-ability") return null;
    if (state.awaiting !== null || state.priority.holder !== this.playerId) return null;
    const offer = legal.find(
      (l): l is Extract<LegalAction, { kind: "activate-ability" }> =>
        l.kind === "activate-ability" &&
        l.source === previous.source &&
        l.abilityIndex === previous.abilityIndex,
    );
    if (offer === undefined) return null;
    const targeted = (previous.targets ?? []).some((t) => t !== null);
    if (!spread || !targeted) {
      const stillLegal = (previous.targets ?? []).every(
        (target, i) =>
          target === null ||
          (offer.targetOptions[i] ?? []).some(
            (option) => JSON.stringify(option) === JSON.stringify(target),
          ),
      );
      return stillLegal ? previous : null;
    }
    // What this ability's activations on the stack are already aimed at.
    const taken = new Set<string>();
    for (const id of state.zones.shared.stack) {
      const object = state.objects[id];
      if (
        object?.kind !== "ability" ||
        object.sourceObjectId !== previous.source ||
        object.abilityIndex !== previous.abilityIndex
      ) {
        continue;
      }
      for (const target of object.targets ?? []) {
        if (target !== undefined) taken.add(JSON.stringify(target));
      }
    }
    const fresh = {
      ...offer,
      targetOptions: offer.targetOptions.map((options) =>
        options.filter((option) => !taken.has(JSON.stringify(option))),
      ),
    };
    if (fresh.targetOptions.some((options, i) => options.length === 0 && offer.targetOptions[i].length > 0)) {
      return null;
    }
    const polarities = offerPolarities(this.cards, offer);
    const aimed = withComputedCache(() => aimOffer(state, this.cards, this.playerId, fresh));
    const [following] = candidateActions(aimed, this.playerId);
    if (following === undefined || following.type !== "activate-ability") return null;
    const wrongSide = (following.targets ?? []).some((target, i) => {
      const polarity = polarities?.[i];
      if (target === null || (polarity !== "harm" && polarity !== "help")) return false;
      if (specSide(offer.targetSpecs[i]) !== "any") return false;
      return sideOf(state, target, this.playerId) !== (polarity === "harm" ? "opponent" : "own");
    });
    return wrongSide ? null : following;
  }

  /** A fresh budget for one decision. */
  private budget(left: number = this.maxSimulations): SearchBudget {
    return newBudget(
      left,
      this.timeBudgetMs === Infinity ? Infinity : Date.now() + this.timeBudgetMs,
    );
  }

  /**
   * Answer a pending decision: every candidate answer played out like a
   * priority move, v1's (`inherited`) the one to beat.
   */
  private decide(view: ControllerView, inherited: Action): Action {
    const budget = this.budget(Math.min(DECISION_ROLLOUTS, this.maxSimulations));
    const answer = bestDecision(
      view,
      inherited,
      this.cards,
      this.weights,
      this.horizon,
      this.rollout,
      budget,
      () => this.selfInRollouts(),
      this.trace,
    );
    // A combat declaration reaches here too, already searched — and recorded —
    // by its own method on the way through `super.act`; `bestDecision` has no
    // candidates for it, so that record is the one worth keeping.
    this.lastDecision ??= audit("decision", budget);
    return answer;
  }

  private selfInRollouts(): DecisionRolloutController {
    return new DecisionRolloutController(
      this.playerId,
      this.cards,
      this.weights,
      this.horizon,
      this.rollout,
    );
  }

  // --- combat -------------------------------------------------------------

  declareAttackers(view: ControllerView): readonly AttackerDeclaration[] {
    const legal = view
      .legalActions()
      .find((o): o is DeclareAttackersLegal => o.kind === "declare-attackers");
    const fallback = super.declareAttackers(view);
    if (legal === undefined || legal.eligible.length === 0 || legal.defenders.length === 0) {
      return fallback;
    }
    const state = view.state;
    const me = this.playerId;
    const w = this.weights;
    // One budget for the whole declaration — the alpha check, v1's swing and
    // the climb — so the deadline covers everything the declaration simulates,
    // not just the climb. Only the climb draws on its simulation count, as it
    // always has.
    const budget = this.budget();

    // If the crackback kills us even when we hold everything back, holding
    // back buys nothing: drop the constraint and race.
    const deadAnyway = this.crackbackLethal(state);

    const alpha = this.alphaStrike(state, legal, deadAnyway, budget);
    if (alpha !== null) {
      this.lastDecision = audit("attackers", budget);
      return alpha;
    }

    // A creature that must attack is in every declaration the engine takes,
    // so a candidate is scored with it (at its first defender, where `ask`
    // puts it) unless the candidate already sends it somewhere.
    const score = (attackers: readonly AttackerDeclaration[]): number | null => {
      const after = simulateCombat(state, this.cards, {
        type: "declare-attackers",
        player: me,
        attackers: withRequiredAttackers(attackers, legal),
      });
      if (after === null) return null;
      const value = evaluateState(after, this.cards, me, w);
      if (after.result.over || deadAnyway) return value;
      return this.crackbackLethal(after) ? UNSAFE + value : value;
    };

    const mine = new Map(combatCreatures(state, this.cards, me, false).map((c) => [c.id, c]));
    const blockersOf = new Map<PlayerId, CombatCreature[]>();
    const defendingPlayer = (defender: PlayerId | ObjectId): PlayerId =>
      state.players[defender as PlayerId] !== undefined
        ? (defender as PlayerId)
        : state.objects[defender as ObjectId].controller;
    const blockersFor = (player: PlayerId): CombatCreature[] => {
      let list = blockersOf.get(player);
      if (list === undefined) {
        list = combatCreatures(state, this.cards, player, true);
        blockersOf.set(player, list);
      }
      return list;
    };

    // Cheap arithmetic to decide which moves are worth a simulation: the
    // damage it would deal, less the attacker if something there can block
    // and kill it. Damage to a player is priced at their life, with the
    // evaluation's bend below `LIFE_DANGER_AT`; to a planeswalker, flat.
    const estimate = (d: AttackerDeclaration): number => {
      const attacker = mine.get(d.attacker);
      if (attacker === undefined) return -Infinity;
      const blockers = blockersFor(defendingPlayer(d.defender)).filter((b) => canBlock(b, attacker));
      const dies = blockers.some(
        (b) => b.damage >= attacker.toughness || b.keywords.has("deathtouch"),
      );
      const player = state.players[d.defender as PlayerId];
      const unblocked =
        blockers.length > 0
          ? 0
          : player !== undefined
            ? lifeCost(player.life, attacker.damage, w)
            : attacker.damage * w.life;
      return unblocked + attacker.damage - (dies ? creatureValue(attacker, w) : 0);
    };

    // v1's swing is scored first, for the reason v1's move is at a priority
    // window: under a deadline, what has been scored is what can be played,
    // and it is the one alternative worth having in hand. It is compared with
    // the climb's result at the end, which catches attacks that only work
    // together; it costs nothing from the climb's simulation count.
    const fallbackScore = fallback.length > 0 ? timed(budget, () => score(fallback)) : null;

    // Built one attacker at a time, keeping each only if it improves the
    // simulated result.
    const [built, builtScore] = hillClimb<AttackerDeclaration>(
      [],
      (current) =>
        legal.eligible
          .filter((id) => (mine.get(id)?.damage ?? 0) > 0)
          .filter((id) => !current.some((d) => d.attacker === id))
          .flatMap((attacker) =>
            (legal.defendersFor[attacker] ?? []).map((defender) => {
              const move = { attacker, defender };
              return { next: [...current, move], estimate: estimate(move) };
            }),
          ),
      score,
      budget,
    );
    this.lastDecision = audit("attackers", budget);
    return fallbackScore !== null && fallbackScore > builtScore ? fallback : built;
  }

  declareBlockers(view: ControllerView): readonly BlockerDeclaration[] {
    const legal = view
      .legalActions()
      .find((o): o is DeclareBlockersLegal => o.kind === "declare-blockers");
    const fallback = super.declareBlockers(view);
    if (legal === undefined || legal.eligible.length === 0) return fallback;
    const state = view.state;
    const me = this.playerId;
    const w = this.weights;

    const score = (blocks: readonly BlockerDeclaration[]): number | null => {
      const after = simulateCombat(state, this.cards, {
        type: "declare-blockers",
        player: me,
        blocks,
      });
      return after === null ? null : evaluateState(after, this.cards, me, w);
    };

    const creatures = new Map<ObjectId, CombatCreature>();
    for (const player of state.turnOrder) {
      for (const c of combatCreatures(state, this.cards, player, false)) creatures.set(c.id, c);
    }
    const kills = (x: CombatCreature, y: CombatCreature): boolean =>
      x.damage >= y.toughness || x.keywords.has("deathtouch");

    // Everything attacking us or our planeswalkers, as if unblocked — what a
    // block's stopped damage comes off the end of.
    const hitsUs = (id: ObjectId): boolean => {
      const target = state.objects[id]?.attacking ?? null;
      if (target === null) return false;
      return target === me || state.objects[target as ObjectId]?.controller === me;
    };
    let incoming = 0;
    for (const c of creatures.values()) {
      if (hitsUs(c.id)) incoming += c.damage * (c.keywords.has("double-strike") ? 2 : 1);
    }
    const life = state.players[me].life;

    // Cheap arithmetic to decide which moves are worth a simulation: the damage
    // a block stops, plus the attacker if the blockers kill it, less each
    // blocker the attacker kills. Stopped damage is priced as the last of
    // what's coming in, with the evaluation's bend below `LIFE_DANGER_AT`, so
    // at 8 life a block that keeps us out of single digits ranks high.
    const estimate = (move: readonly BlockerDeclaration[]): number => {
      const attacker = creatures.get(move[0].attacker);
      const blockers = move.map((b) => creatures.get(b.blocker));
      if (attacker === undefined || blockers.some((b) => b === undefined)) return -Infinity;
      const damage = attacker.damage * (attacker.keywords.has("double-strike") ? 2 : 1);
      const toughness = blockers.reduce((sum, b) => sum + (b?.toughness ?? 0), 0);
      const stopped = attacker.keywords.has("trample") ? Math.min(damage, toughness) : damage;
      const power = blockers.reduce((sum, b) => sum + (b?.damage ?? 0), 0);
      let value =
        lifeCost(life, incoming, w) - lifeCost(life, Math.max(0, incoming - stopped), w);
      if (power >= attacker.toughness || blockers.some((b) => b?.keywords.has("deathtouch"))) {
        value += creatureValue(attacker, w);
      }
      for (const b of blockers) if (b !== undefined && kills(attacker, b)) value -= creatureValue(b, w);
      return value;
    };

    // A move adds one blocker — or, against menace, two at once, since one
    // alone is illegal — or takes one block back, so a climb that starts from
    // v1's blocks can undo a chump it didn't need.
    const neighbours = (current: readonly BlockerDeclaration[]) => {
      const out: { next: BlockerDeclaration[]; estimate: number }[] = [];
      const used = new Set(current.map((b) => b.blocker));
      const free = legal.eligible.filter((e) => !used.has(e.blocker));
      for (const entry of free) {
        for (const attacker of entry.canBlock) {
          if (legal.menaceAttackers.includes(attacker)) continue;
          const move = [{ blocker: entry.blocker, attacker }];
          out.push({ next: [...current, ...move], estimate: estimate(move) });
        }
      }
      for (const attacker of legal.menaceAttackers) {
        const able = free.filter((e) => e.canBlock.includes(attacker));
        let pairs = 0;
        for (let i = 0; i < able.length && pairs < MAX_MENACE_PAIRS; i += 1) {
          for (let j = i + 1; j < able.length && pairs < MAX_MENACE_PAIRS; j += 1) {
            const move = [
              { blocker: able[i].blocker, attacker },
              { blocker: able[j].blocker, attacker },
            ];
            out.push({ next: [...current, ...move], estimate: estimate(move) });
            pairs += 1;
          }
        }
      }
      for (const attacker of new Set(current.map((b) => b.attacker))) {
        const move = current.filter((b) => b.attacker === attacker);
        out.push({
          next: current.filter((b) => b.attacker !== attacker),
          estimate: -estimate(move),
        });
      }
      return out;
    };

    // Starting from v1's blocks matters: v1 already chump-blocks when facing
    // lethal, a position a one-blocker-at-a-time climb from nothing can't get
    // out of when no single chump is enough by itself.
    const budget = this.budget();
    const [best] = hillClimb(fallback, neighbours, score, budget);
    this.lastDecision = audit("blockers", budget);
    return best;
  }

  /**
   * Attack for the kill when some opponent is dead through their best
   * blocks — as many opponents as the attackers can kill at once. Each order
   * of the killable opponents is tried (at most six, at four players), each
   * taking the fewest attackers its kill needs from what the ones before it
   * left: sending everything at the first opponent in reach killed one player
   * when the same creatures, split, killed two. Killing one player doesn't
   * end a multiplayer game, so a plan still has to leave us alive to the
   * crackback of whoever survives it; the most kills that does is played,
   * with the attackers left over piled onto a player being killed (a margin
   * against a trick) unless keeping them home is what survives.
   */
  private alphaStrike(
    state: GameState,
    legal: DeclareAttackersLegal,
    deadAnyway: boolean,
    budget: SearchBudget,
  ): AttackerDeclaration[] | null {
    const me = this.playerId;
    const mine = combatCreatures(state, this.cards, me, false).filter(
      (c, i, all) =>
        all.findIndex((m) => m.id === c.id) === i && c.damage > 0 && legal.eligible.includes(c.id),
    );
    const living = state.turnOrder.filter((p) => p !== me && !state.players[p].hasLost);
    const blockersOf = new Map(
      living.map((p) => [p, combatCreatures(state, this.cards, p, true)] as const),
    );
    const canAttack = (c: CombatCreature, defender: PlayerId): boolean =>
      (legal.defendersFor[c.id] ?? []).includes(defender);
    // The fewest of `pool` that kill `defender` through their best blocks:
    // the biggest first until it's lethal, then each one dropped, smallest
    // first, that it stays lethal without. `null` when all of them don't.
    const killWith = (
      defender: PlayerId,
      pool: readonly CombatCreature[],
    ): CombatCreature[] | null => {
      const blockers = blockersOf.get(defender) ?? [];
      const lethal = (attackers: readonly CombatCreature[]): boolean =>
        isLethal(state, defender, damageThrough(attackers, blockers));
      const able = pool.filter((c) => canAttack(c, defender)).sort((a, b) => b.damage - a.damage);
      const chosen: CombatCreature[] = [];
      for (const c of able) {
        chosen.push(c);
        if (lethal(chosen)) break;
      }
      if (chosen.length === 0 || !lethal(chosen)) return null;
      for (let i = chosen.length - 1; i >= 0; i -= 1) {
        const without = chosen.filter((_, j) => j !== i);
        if (without.length > 0 && lethal(without)) chosen.splice(i, 1);
      }
      return chosen;
    };

    const killable = living.filter(
      (p) => legal.defenders.includes(p) && killWith(p, mine) !== null,
    );
    if (killable.length === 0) return null;

    interface Plan {
      readonly kills: number;
      readonly used: number;
      readonly declaration: AttackerDeclaration[];
    }
    const plans: Plan[] = [];
    const seen = new Set<string>();
    const add = (declaration: AttackerDeclaration[], kills: number, used: number): void => {
      const key = declaration
        .map((d) => `${d.attacker}>${d.defender}`)
        .sort()
        .join(",");
      if (seen.has(key)) return;
      seen.add(key);
      plans.push({ kills, used, declaration });
    };
    for (const order of permutations(killable)) {
      let pool = [...mine];
      const killed: PlayerId[] = [];
      const declaration: AttackerDeclaration[] = [];
      for (const defender of order) {
        const set = killWith(defender, pool);
        if (set === null) continue;
        killed.push(defender);
        for (const c of set) declaration.push({ attacker: c.id, defender });
        pool = pool.filter((c) => !set.includes(c));
      }
      const piled = [...declaration];
      for (const c of pool) {
        const target = killed.find((p) => canAttack(c, p));
        if (target !== undefined) piled.push({ attacker: c.id, defender: target });
      }
      add(piled, killed.length, declaration.length);
      add(declaration, killed.length, declaration.length);
    }
    // Most kills first; among equals, the fewest attackers the kills need,
    // then the piled-on plan before the lean one (the order they were added).
    const ranked = plans
      .map((plan, index) => ({ plan, index }))
      .sort((a, b) => b.plan.kills - a.plan.kills || a.plan.used - b.plan.used || a.index - b.index)
      .map(({ plan }) => plan);

    for (const plan of ranked) {
      if (plan.kills === living.length || deadAnyway) return plan.declaration;
      const after = timed(budget, () =>
        simulateCombat(state, this.cards, {
          type: "declare-attackers",
          player: me,
          attackers: withRequiredAttackers(plan.declaration, legal),
        }),
      );
      if (after !== null && !this.crackbackLethal(after)) return plan.declaration;
    }
    return null;
  }

  /** Would every opponent swinging at us before we untap again be lethal,
   * keeping `crackbackMargin` life in reserve? */
  private crackbackLethal(state: GameState): boolean {
    const through = crackback(state, this.cards, this.playerId, this.weights.crackbackParanoia);
    return isLethal(state, this.playerId, through, -this.weights.crackbackMargin);
  }

  /** `null` when the engine refused this concrete filling of a legal shape. */
  /**
   * Whether `action` may help an opponent's creature, by the rule the user
   * set (2026-09-27): helping an opponent's creature is only worth it while
   * it attacks someone else — never one at home, never one attacking us —
   * and then when the help ends at end of turn, or the creature is goaded by
   * us (it can't turn on us), or, for anything lasting (a +1/+1 counter, an
   * Aura), when it kills the player being attacked. `ok`, `drop`, or the
   * player whose death the candidate is kept for.
   */
  private opponentPump(
    state: GameState,
    legal: LegalAction,
    action: Action,
  ): "ok" | "drop" | { readonly kills: PlayerId } {
    if (legal.kind !== "cast-spell" && legal.kind !== "activate-ability") return "ok";
    if (legal.kind === "cast-spell" && legal.castModal !== undefined) return "ok";
    if (action.type !== "cast-spell" && action.type !== "activate-ability") return "ok";
    const polarities = offerPolarities(this.cards, legal);
    if (polarities === null) return "ok";
    const me = this.playerId;
    let kills: PlayerId | null = null;
    for (const [i, target] of (action.targets ?? []).entries()) {
      if (polarities[i] !== "help" || target === null || target.kind !== "object") continue;
      const object = state.objects[target.object];
      if (object === undefined || object.zone !== "battlefield" || object.controller === me) continue;
      if (!computeCharacteristics(state, this.cards, target.object).types.includes("creature")) continue;
      const attacking = object.attacking;
      if (attacking === null) return "drop";
      const defender =
        state.players[attacking as PlayerId] !== undefined
          ? (attacking as PlayerId)
          : state.objects[attacking as ObjectId]?.controller;
      if (defender === undefined || defender === me) return "drop";
      if (goadersOf(state, this.cards, target.object).includes(me)) continue;
      if (onlyUntilEndOfTurn(this.offerEffect(legal))) continue;
      kills = defender;
    }
    return kills === null ? "ok" : { kills };
  }

  private score(
    view: ControllerView,
    action: Action,
    budget: SearchBudget,
    /** Kept only if this player has lost by the end of the rollout. */
    mustKill?: PlayerId,
  ): number | null {
    const after = timed(budget, () =>
      simulateAction(
        view.state,
        this.cards,
        action,
        this.horizon,
        this.rollout,
        this.rolloutDecisions ? this.selfInRollouts() : undefined,
      ),
    );
    this.trace?.(action, after);
    if (after === null) return null;
    if (mustKill !== undefined && after.players[mustKill]?.hasLost !== true) return null;
    return evaluateState(after, this.cards, this.playerId, this.weights);
  }
}
