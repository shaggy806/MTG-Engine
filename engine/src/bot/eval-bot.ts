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
import { candidateActions } from "./candidates.js";
import { decisionCandidates } from "./decisions.js";
import { canBlock, combatCreatures, crackback, damageThrough, isLethal } from "./combat-math.js";
import type { CombatCreature } from "./combat-math.js";
import { DEFAULT_WEIGHTS, evaluateState, normalizeWeights } from "./evaluate.js";
import type { EvalWeights } from "./evaluate.js";
import { CombatRolloutController, simulateAction, simulateCombat } from "./simulate.js";
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
}

/**
 * What a search may still spend: simulations, and time.
 *
 * `until` is a `Date.now()` stamp rather than `performance.now()` — this module
 * is bundled into the client as well as run in the server, and millisecond
 * resolution is ample for a budget measured in hundreds of them.
 */
interface SearchBudget {
  left: number;
  readonly until: number;
}

const spent = (budget: SearchBudget): boolean =>
  budget.left <= 0 || (budget.until !== Infinity && Date.now() >= budget.until);

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

/** What a creature is worth to the evaluation, roughly: its creature, power
 * and toughness terms. Only used to rank moves, never to choose one. */
const creatureValue = (c: CombatCreature, w: EvalWeights): number =>
  w.creatures + w.power * Math.max(0, c.power) + w.toughness * Math.max(0, c.toughness);

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
  let currentScore = score(current) ?? -Infinity;
  while (!spent(budget)) {
    const ranked = neighbours(current)
      .sort((a, b) => b.estimate - a.estimate)
      .slice(0, MOVES_PER_ROUND);
    let step: T[] | null = null;
    let stepScore = currentScore;
    for (const { next } of ranked) {
      if (spent(budget)) break;
      budget.left -= 1;
      const value = score(next);
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
): Action {
  const me = view.player;
  if (inherited.player !== me || budget.left <= 1 || spent(budget)) return inherited;
  const legal = view.legalActions().find((l) => l.kind !== "pass-priority");
  const candidates =
    legal === undefined
      ? null
      : decisionCandidates(
          legal,
          me,
          (ids) => byManaValue(view.state, cards, ids),
          (id) => view.state.objects[id]?.controller,
          (player) => view.state.players[player]?.counters.poison ?? 0,
        );
  if (candidates === null || candidates.length === 0) return inherited;

  const score = (action: Action): number | null => {
    budget.left -= 1;
    const after = simulateAction(view.state, cards, action, horizon, rollout, selfFor?.());
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
  private readonly budget: SearchBudget = { left: NESTED_DECISION_ROLLOUTS, until: Infinity };

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
    return this.rollout === "combat" ? super.declareAttackers(view) : [];
  }

  declareBlockers(view: ControllerView): readonly BlockerDeclaration[] {
    return this.rollout === "passive" ? [] : super.declareBlockers(view);
  }
}

export class EvalBotController extends HeuristicBotController {
  /** Protected so the v3 `PlanBotController` can reach it; every other field
   * here stays private. */
  protected readonly cards: CardRegistry;
  readonly weights: EvalWeights;
  private readonly horizon: Horizon;
  private readonly rollout: RolloutPolicy;
  private readonly rolloutDecisions: boolean;
  private readonly maxSimulations: number;
  private readonly timeBudgetMs: number;

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
  }

  act(view: ControllerView): Action {
    const inherited = super.act(view);
    // `super.act` has already routed anything the engine is waiting on
    // through `answerAwaited`, which calls back into this class's own
    // `declareAttackers`/`declareBlockers`. The rest are searched here.
    if (view.state.awaiting !== null) return this.decide(view, inherited);

    const player = this.playerId;
    const pass: Action = { type: "pass-priority", player };

    // Passing is a candidate like any other, rolled out to the same horizon.
    // Scoring against "is this better than the current state" instead would
    // make the bot inactive-by-default and turn the zero point into an extra
    // implicit weight — a land drop sits almost exactly on it.
    const budget = this.budget();
    let best: Action = pass;
    // Passing is always legal at a priority window, so a `null` here means the
    // simulation itself fell over; treat it as "no baseline" rather than
    // letting it veto every alternative.
    budget.left -= 1;
    let bestScore = this.score(view, pass) ?? -Infinity;

    const candidates: Action[] = [];
    for (const legal of view.legalActions()) {
      // Mana abilities are never worth a simulation: casting auto-pays, so
      // tapping for mana on its own gains nothing the evaluation could see,
      // and on a wide board they're nearly every candidate there is — 27 of
      // 30 on one 38-permanent board, which made a single decision a 2s search.
      if (legal.kind === "activate-ability" && this.isManaOnlyAbility(legal)) continue;
      candidates.push(...candidateActions(legal, player));
    }

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
    if (lands.length === 1) return lands[0];
    if (lands.length > 1) {
      let bestLand = lands[0];
      let bestLandScore = -Infinity;
      for (const land of lands) {
        if (spent(budget)) break;
        budget.left -= 1;
        const score = this.score(view, land);
        if (score !== null && score > bestLandScore) {
          bestLandScore = score;
          bestLand = land;
        }
      }
      return bestLand;
    }

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

    for (const action of candidates) {
      if (spent(budget)) break;
      budget.left -= 1;
      const score = this.score(view, action);
      if (score === null || score <= bestScore) continue;
      bestScore = score;
      best = action;
    }
    return best;
  }

  /** A fresh budget for one decision. */
  private budget(left: number = this.maxSimulations): SearchBudget {
    return {
      left,
      until: this.timeBudgetMs === Infinity ? Infinity : Date.now() + this.timeBudgetMs,
    };
  }

  /**
   * Answer a pending decision: every candidate answer played out like a
   * priority move, v1's (`inherited`) the one to beat.
   */
  private decide(view: ControllerView, inherited: Action): Action {
    return bestDecision(
      view,
      inherited,
      this.cards,
      this.weights,
      this.horizon,
      this.rollout,
      this.budget(Math.min(DECISION_ROLLOUTS, this.maxSimulations)),
      () => this.selfInRollouts(),
    );
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

    // If the crackback kills us even when we hold everything back, holding
    // back buys nothing: drop the constraint and race.
    const deadAnyway = this.crackbackLethal(state);

    const alpha = this.alphaStrike(state, legal, deadAnyway);
    if (alpha !== null) return alpha;

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
    // and kill it.
    const estimate = (d: AttackerDeclaration): number => {
      const attacker = mine.get(d.attacker);
      if (attacker === undefined) return -Infinity;
      const blockers = blockersFor(defendingPlayer(d.defender)).filter((b) => canBlock(b, attacker));
      const dies = blockers.some(
        (b) => b.damage >= attacker.toughness || b.keywords.has("deathtouch"),
      );
      const unblocked = blockers.length === 0 ? attacker.damage * w.life : 0;
      return unblocked + attacker.damage - (dies ? creatureValue(attacker, w) : 0);
    };

    // Built one attacker at a time, keeping each only if it improves the
    // simulated result — then compared against v1's all-out swing, which
    // catches attacks that only work together.
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
      this.budget(),
    );
    const fallbackScore = fallback.length > 0 ? score(fallback) : null;
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

    // Cheap arithmetic to decide which moves are worth a simulation: the damage
    // a block stops, plus the attacker if the blockers kill it, less each
    // blocker the attacker kills.
    const estimate = (move: readonly BlockerDeclaration[]): number => {
      const attacker = creatures.get(move[0].attacker);
      const blockers = move.map((b) => creatures.get(b.blocker));
      if (attacker === undefined || blockers.some((b) => b === undefined)) return -Infinity;
      const damage = attacker.damage * (attacker.keywords.has("double-strike") ? 2 : 1);
      const toughness = blockers.reduce((sum, b) => sum + (b?.toughness ?? 0), 0);
      const stopped = attacker.keywords.has("trample") ? Math.min(damage, toughness) : damage;
      const power = blockers.reduce((sum, b) => sum + (b?.damage ?? 0), 0);
      let value = stopped * w.life;
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
    const [best] = hillClimb(fallback, neighbours, score, this.budget());
    return best;
  }

  /**
   * Swing with everything at an opponent when that's lethal through their
   * best blocks. At a multiplayer table killing one player doesn't end the
   * game, so the swing still has to leave us alive to everyone else's
   * crackback.
   */
  private alphaStrike(
    state: GameState,
    legal: DeclareAttackersLegal,
    deadAnyway: boolean,
  ): AttackerDeclaration[] | null {
    const me = this.playerId;
    const mine = combatCreatures(state, this.cards, me, false).filter(
      (c, i, all) =>
        all.findIndex((m) => m.id === c.id) === i && c.damage > 0 && legal.eligible.includes(c.id),
    );
    const living = state.turnOrder.filter((p) => p !== me && !state.players[p].hasLost);
    for (const defender of living) {
      if (!legal.defenders.includes(defender)) continue;
      const attackers = mine.filter((c) => (legal.defendersFor[c.id] ?? []).includes(defender));
      if (attackers.length === 0) continue;
      const blockers = combatCreatures(state, this.cards, defender, true);
      if (!isLethal(state, defender, damageThrough(attackers, blockers))) continue;

      const declaration = attackers.map((c) => ({ attacker: c.id, defender }));
      if (living.length === 1 || deadAnyway) return declaration;
      const after = simulateCombat(state, this.cards, {
        type: "declare-attackers",
        player: me,
        attackers: withRequiredAttackers(declaration, legal),
      });
      if (after !== null && !this.crackbackLethal(after)) return declaration;
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
  private score(view: ControllerView, action: Action): number | null {
    const after = simulateAction(
      view.state,
      this.cards,
      action,
      this.horizon,
      this.rollout,
      this.rolloutDecisions ? this.selfInRollouts() : undefined,
    );
    if (after === null) return null;
    return evaluateState(after, this.cards, this.playerId, this.weights);
  }
}
