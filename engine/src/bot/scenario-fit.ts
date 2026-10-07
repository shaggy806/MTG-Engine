/**
 * Fitting weights to scenarios: what would the weights have to be for v2 to
 * give the right answers? `npm run bot:fit-scenarios -w engine`, and step 8 of
 * `docs/plans/bot-effect-knowledge.md`.
 *
 * A scenario asked with one `act` is recorded once: every answer the bot
 * simulated there, the state its rollout reached read into features
 * (`outcomeOf`), and whether the scenario's judge calls that answer right. A
 * priority window's rollouts never read the weights — v1 plays every seat —
 * so from the record alone, the bot's choice under *any* vector is exact
 * arithmetic: the same `scoreOutcome` the bot runs, the first of any tie
 * played. A fit can then try thousands of vectors in the time one scenario
 * takes to play. A decision's rollouts can read the weights (a decision inside
 * one is searched with them), so a decision's replay is close rather than
 * exact, and every fit is checked by running the scenarios for real.
 *
 * This is comparison training — the way Deep Blue's evaluation was tuned to
 * agree with grandmasters' moves, and Bonanza's shogi evaluation with
 * professionals' (MMTO): weights under which the search picks the known-right
 * move, rather than weights that predict who wins (`bot:fit`, which found
 * `power` at 2.03 where play peaked at 0.5). Its weakness is the other side of
 * the same coin: it knows only the positions it is shown, so a fitted vector
 * is benched before anything ships.
 */

import type { Action } from "../actions.js";
import type { CardRegistry } from "../cards.js";
import { EvalBotController, TIE, UNSAFE } from "./eval-bot.js";
import { normalizeWeights, outcomeOf, scoreOutcome } from "./evaluate.js";
import type { EvalOutcome, EvalWeights } from "./evaluate.js";
import type { BotScenario, ScenarioResult } from "./scenarios.js";

export type WeightKey = keyof EvalWeights;

export interface RecordedAnswer {
  readonly action: Action;
  /** Where its rollout ended; `null` when the engine refused the answer. */
  readonly outcome: EvalOutcome | null;
  /** The scenario's judgement of this answer. */
  readonly right: boolean;
}

export interface ScenarioRecord {
  readonly name: string;
  readonly kind: "gate" | "training";
  /**
   * Every answer the bot simulated, in the order it scored them. Empty when it
   * answered without a search — a lone land, nothing worth considering — and
   * then no weight can change the answer.
   */
  readonly answers: readonly RecordedAnswer[];
  /** What the bot actually played under the recording vector. */
  readonly chosen: Action;
  readonly chosenRight: boolean;
  /** A priority window's replay is exact; a decision's may not be. */
  readonly exact: boolean;
  /** What the bot plays instead when its best answer is to pass — a due
   * cantrip (`EvalBotController.lastPassFallback`). */
  readonly passFallback?: Action | null;
  /** Candidates the bot plays as a pass if one scores best — wipes held for
   * after combat (`EvalBotController.lastHeldForCombat`). */
  readonly heldAsPass?: readonly Action[];
  /** Whether a tie with passing went to acting (`lastTiesAct`). */
  readonly tiesAct?: boolean;
  /** Candidates ranked below every safe one for the crackback (`lastUnsafe`). */
  readonly unsafe?: readonly Action[];
  /** A wipe the bot played a payoff before (`lastWipePayoff`). */
  readonly wipePayoff?: { readonly wipe: Action; readonly payoff: Action } | null;
}

/**
 * Play `scenario` once under `weights`, recording every answer weighed.
 * `null` for a scenario that isn't a position (a combat script), and the
 * scenario's own failure when its setup never reached the question.
 */
export function recordScenario(
  scenario: BotScenario,
  registry: CardRegistry,
  weights: EvalWeights,
): ScenarioRecord | ScenarioResult | null {
  if (scenario.position === undefined) return null;
  const position = scenario.position(registry);
  if (!("game" in position)) return position;
  const { game, player } = position;
  // Each outcome is read as the trace sees it, inside the bot's decision, so
  // that track records come off the scenario's real board as they did for
  // the bot (`withTrackRecordEvidence`), not off the position a rollout reached.
  const seen: { action: Action; outcome: EvalOutcome | null }[] = [];
  const bot = new EvalBotController(player, registry, {
    weights,
    trace: (action, after) =>
      seen.push({ action, outcome: after === null ? null : outcomeOf(after, registry, player, weights.landCap) }),
  });
  const exact = game.state.awaiting === null;
  const chosen = bot.act(game.controllerView(player));
  return {
    name: scenario.name,
    kind: scenario.kind ?? "gate",
    answers: seen.map(({ action, outcome }) => ({
      action,
      outcome,
      right: position.judge(action).passed,
    })),
    chosen,
    chosenRight: position.judge(chosen).passed,
    exact,
    passFallback: bot.lastPassFallback,
    heldAsPass: bot.lastHeldForCombat,
    tiesAct: bot.lastTiesAct,
    unsafe: bot.lastUnsafe,
    wipePayoff: bot.lastWipePayoff,
  };
}

/** The index of the answer the bot plays under `weights`: the first of the
 * best, as the search takes it — the first answer when every one failed. */
export function replayChoice(record: ScenarioRecord, weights: EvalWeights): number {
  const w = normalizeWeights(weights);
  const key = (a: Action | undefined): string => JSON.stringify(a);
  const unsafe = new Set((record.unsafe ?? []).map(key));
  let best = 0;
  let bestScore = -Infinity;
  record.answers.forEach((answer, i) => {
    if (answer.outcome === null) return;
    const score = scoreOutcome(answer.outcome, w) + (unsafe.has(key(answer.action)) ? UNSAFE : 0);
    // A tie with passing goes to acting under the `"acting"` rollout, as
    // the search breaks it.
    const tie =
      record.tiesAct === true &&
      record.answers[best]?.action.type === "pass-priority" &&
      answer.action.type !== "pass-priority" &&
      score >= bestScore - TIE;
    if (score > bestScore || tie) {
      best = i;
      bestScore = score;
    }
  });
  // A held wipe that scored best is played as a pass, and then no cantrip
  // spends its mana (`EvalBotController`'s priority search).
  const held = new Set((record.heldAsPass ?? []).map((a) => JSON.stringify(a)));
  const heldBest = held.has(JSON.stringify(record.answers[best]?.action));
  if (heldBest) {
    const pass = record.answers.findIndex((a) => a.action.type === "pass-priority");
    if (pass !== -1) return pass;
  }
  // A wipe that takes our creatures goes after a payoff that sees them go
  // (`payoffBeforeWipe`).
  const wipePayoff = record.wipePayoff;
  if (wipePayoff != null && key(record.answers[best]?.action) === key(wipePayoff.wipe)) {
    const at = record.answers.findIndex((a) => key(a.action) === key(wipePayoff.payoff));
    if (at !== -1) return at;
  }
  const fallback = record.passFallback;
  if (fallback != null && record.answers[best]?.action.type === "pass-priority") {
    const key = JSON.stringify(fallback);
    const at = record.answers.findIndex((a) => JSON.stringify(a.action) === key);
    if (at !== -1) return at;
  }
  return best;
}

/** Whether the bot gets the scenario right under `weights`, by replay. */
export function replayRight(record: ScenarioRecord, weights: EvalWeights): boolean {
  if (record.answers.length === 0) return record.chosenRight;
  return record.answers[replayChoice(record, weights)]?.right ?? false;
}

/**
 * How far the best right answer outscores the best wrong one under `weights`.
 * `Infinity` when there was nothing wrong to choose (or no search at all and
 * the answer was right); `-Infinity` when no right answer was ever weighed,
 * which no weight can fix — the search never considered it.
 */
export function scenarioMargin(record: ScenarioRecord, weights: EvalWeights): number {
  if (record.answers.length === 0) return record.chosenRight ? Infinity : -Infinity;
  const w = normalizeWeights(weights);
  let right = -Infinity;
  let wrong = -Infinity;
  for (const answer of record.answers) {
    if (answer.outcome === null) continue;
    const score = scoreOutcome(answer.outcome, w);
    if (answer.right) right = Math.max(right, score);
    else wrong = Math.max(wrong, score);
  }
  if (wrong === -Infinity) return Infinity;
  if (right === -Infinity) return -Infinity;
  return right - wrong;
}

export interface FitOptions {
  /** Where the fit starts, and what it is penalised for straying from. */
  readonly base: EvalWeights;
  /** The weights it may move; the rest keep `base`'s values. */
  readonly free: readonly WeightKey[];
  /** How far a training scenario's right answer must win by — a tie is a
   * coin flip, not a pass. In evaluation points: `hand` is 2 a card. */
  readonly margin?: number;
  /** How far a gate scenario must stay right by — or by what it had at base,
   * if less: one right only by a tie-break (ranked first) may stay that way. */
  readonly gateMargin?: number;
  /** What moving a weight costs, per multiple of its base value moved — so
   * doubling `power` costs as much as doubling `library`, and switching on a
   * term that is zero costs that much per 0.5 of it. */
  readonly lambda?: number;
  /** How much more a gate scenario's shortfall costs than a training one's. */
  readonly gateCost?: number;
  /** `[follower, leader]` pairs held equal — `idlePower` exists to cancel
   * `power`, so it moves with it. */
  readonly tied?: readonly (readonly [WeightKey, WeightKey])[];
}

const DEFAULTS = { margin: 0.5, gateMargin: 0.1, lambda: 0.5, gateCost: 10 };

/** The scale a weight whose base is zero is moved against. */
const ZERO_SCALE = 0.5;

/** How many multiples of its own size `key` has moved from `base`. */
function movedBy(key: WeightKey, value: number, base: EvalWeights): number {
  const from = base[key];
  return Math.abs(value - from) / (from !== 0 ? Math.abs(from) : ZERO_SCALE);
}

/** A shortfall is counted up to this many points, so one hopeless scenario
 * (a wrong answer that wins the game in its rollout) can't swamp the rest. */
const MAX_SHORTFALL = 5;

/**
 * What the fit minimises: each scenario's shortfall from the margin it must
 * win by (a gate scenario's weighted `gateCost`), plus `lambda` for every
 * multiple of its own size a free weight has moved from `base`. A scenario no
 * weight can reach adds a constant.
 */
export function fitLoss(
  records: readonly ScenarioRecord[],
  weights: EvalWeights,
  options: FitOptions,
): number {
  const { margin, gateMargin, lambda, gateCost } = { ...DEFAULTS, ...options };
  let total = 0;
  for (const record of records) {
    const m = scenarioMargin(record, weights);
    if (m === -Infinity) continue;
    const target =
      record.kind === "gate"
        ? Math.min(gateMargin, Math.max(0, scenarioMargin(record, options.base)))
        : margin;
    const shortfall = Math.min(MAX_SHORTFALL, Math.max(0, target - m));
    total += (record.kind === "gate" ? gateCost : 1) * shortfall;
  }
  for (const key of options.free) total += lambda * movedBy(key, weights[key], options.base);
  return total;
}

export interface FitResult {
  readonly weights: EvalWeights;
  readonly loss: number;
  readonly baseLoss: number;
  /** Passes over every free weight before none moved. */
  readonly sweeps: number;
}

/**
 * Weights that must not fall below another: the invariants the evaluation's
 * comments record, which a fit would otherwise trade away for a scenario.
 * `otherPermanents` below `hand` makes casting a mana rock a loss (Sol Ring
 * scored -1 against passing when it was). `lands` and `extraLands` are held
 * above `hand` by `normalizeWeights` already.
 */
export const FIT_FLOORS: Partial<Record<WeightKey, WeightKey>> = { otherPermanents: "hand" };

const floorOf = (key: WeightKey, weights: EvalWeights): number => {
  const floor = FIT_FLOORS[key];
  return floor === undefined ? 0 : weights[floor];
};

/** Values worth trying for one weight: fractions and multiples of its base,
 * steps either side of where it is now, and a few round numbers — rounded to
 * hundredths, because the result is meant to be read. */
function candidateValues(base: number, current: number, floor: number): number[] {
  const ceiling = Math.max(base * 4, 4);
  const values = new Set<number>();
  const add = (v: number) => {
    if (v >= floor && v <= ceiling) values.add(Math.round(v * 100) / 100);
  };
  for (const f of [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]) add(base * f);
  for (const step of [0.05, 0.1, 0.25, 0.5, 1, 2]) {
    add(current + step);
    add(current - step);
  }
  for (const v of [0, 0.1, 0.25, 0.5, 1, 2, 3, 4]) add(v);
  return [...values].sort((a, b) => a - b);
}

/**
 * Coordinate descent: each free weight in turn set to the candidate value that
 * lowers the loss most, sweep after sweep until none moves. Crude, but the
 * loss is cheap (a few thousand dot products), piecewise linear, and the
 * answer is meant to be a handful of readable changes, not an optimum to the
 * third decimal.
 */
export function fitWeights(records: readonly ScenarioRecord[], options: FitOptions): FitResult {
  const tie = (w: EvalWeights): EvalWeights => {
    let out = w;
    for (const [follower, leader] of options.tied ?? []) {
      if (out[follower] !== out[leader]) out = { ...out, [follower]: out[leader] };
    }
    return out;
  };
  let weights = tie({ ...options.base });
  let loss = fitLoss(records, weights, options);
  const baseLoss = loss;
  let sweeps = 0;
  while (sweeps < 50) {
    sweeps += 1;
    let moved = false;
    for (const key of options.free) {
      let bestValue = weights[key];
      let bestLoss = loss;
      for (const value of candidateValues(options.base[key], weights[key], floorOf(key, weights))) {
        if (value === weights[key]) continue;
        const trial = fitLoss(records, tie({ ...weights, [key]: value }), options);
        if (trial < bestLoss - 1e-9) {
          bestLoss = trial;
          bestValue = value;
        }
      }
      if (bestValue !== weights[key]) {
        weights = tie({ ...weights, [key]: bestValue });
        loss = bestLoss;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return { weights, loss, baseLoss, sweeps };
}

/** The weights a fit may move by default: all but the unit (`hand`, 2 a
 * card), the anchor for the table (`opponent`), a threshold that is a
 * feature's parameter rather than a weight (`landCap`), the two that only
 * steer combat (which the replay can't see) and a follower (`idlePower`). */
export const FIT_FIXED: readonly WeightKey[] = [
  "hand",
  "opponent",
  "landCap",
  "crackbackParanoia",
  "crackbackMargin",
  "crackbackGrowth",
  "idlePower",
];

export const FIT_TIED: readonly (readonly [WeightKey, WeightKey])[] = [["idlePower", "power"]];

export interface Lever {
  readonly key: WeightKey;
  readonly value: number;
  /** The scenario's margin with `key` at `value` and every other weight at base. */
  readonly margin: number;
  /** How many multiples of its own size the weight had to move. */
  readonly moved: number;
  /** Scenarios right at base that this change alone makes wrong. */
  readonly breaks: readonly string[];
}

/** A lever has to win its scenario by at least this much — a margin of a
 * hundredth of a point is a tie that happens to fall the right way. */
const LEVER_MARGIN = 0.1;

/**
 * For one scenario, each single weight that gets it right on its own: the
 * value nearest its current one that does, and what that change alone breaks
 * — the menu a hand-tuner picks from, least damage first. A scenario with no
 * lever needs a feature, not a weight.
 */
export function leversFor(
  target: ScenarioRecord,
  records: readonly ScenarioRecord[],
  current: EvalWeights,
  free: readonly WeightKey[],
  tied: readonly (readonly [WeightKey, WeightKey])[] = [],
): Lever[] {
  const tie = (w: EvalWeights): EvalWeights => {
    let out = w;
    for (const [follower, leader] of tied) out = { ...out, [follower]: out[leader] };
    return out;
  };
  const rightNow = new Map(records.map((r) => [r.name, replayRight(r, current)]));
  const levers: Lever[] = [];
  for (const key of free) {
    const from = current[key];
    const values = new Set<number>();
    for (const f of [0, 0.1, 0.25, 0.5, 0.75, 1.25, 1.5, 2, 3, 4, 6, 8, 10]) {
      values.add(Math.round(from * f * 100) / 100);
    }
    for (const v of [0, 0.05, 0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 6, 8, 10]) values.add(v);
    const nearestFirst = [...values]
      .filter((v) => v >= floorOf(key, current) && v !== from)
      .sort((a, b) => movedBy(key, a, current) - movedBy(key, b, current));
    for (const value of nearestFirst) {
      const w = tie({ ...current, [key]: value });
      const margin = scenarioMargin(target, w);
      if (!(margin >= LEVER_MARGIN)) continue;
      const breaks = records
        .filter((r) => r !== target && rightNow.get(r.name) === true && !replayRight(r, w))
        .map((r) => r.name);
      levers.push({ key, value, margin, moved: movedBy(key, value, current), breaks });
      break;
    }
  }
  return levers.sort((a, b) => a.breaks.length - b.breaks.length || a.moved - b.moved);
}

export interface HandTuned {
  readonly weights: EvalWeights;
  /** The levers pulled, in order, each with the scenario it fixed. */
  readonly pulled: readonly {
    readonly scenario: string;
    readonly key: WeightKey;
    readonly from: number;
    readonly value: number;
  }[];
  /** Scenarios still wrong when no clean lever was left. */
  readonly unfixed: readonly string[];
}

/**
 * Tuning by hand, automated: of the scenarios the vector gets wrong, pull the
 * cheapest lever that breaks nothing right now, then look again from the new
 * vector — levers interact (valuing cards in hand makes every spell dearer to
 * cast), so each is found against the vector as it stands, not the base.
 * Unlike a joint fit, every change is one scenario's and reads as such.
 */
export function handTune(
  records: readonly ScenarioRecord[],
  base: EvalWeights,
  free: readonly WeightKey[],
  tied: readonly (readonly [WeightKey, WeightKey])[] = [],
): HandTuned {
  const tie = (w: EvalWeights): EvalWeights => {
    let out = w;
    for (const [follower, leader] of tied) out = { ...out, [follower]: out[leader] };
    return out;
  };
  let weights = tie({ ...base });
  const pulled: { scenario: string; key: WeightKey; from: number; value: number }[] = [];
  for (let step = 0; step < records.length; step += 1) {
    let best: { scenario: string; lever: Lever; cost: number } | null = null;
    for (const record of records.filter((r) => !replayRight(r, weights))) {
      const lever = leversFor(record, records, weights, free, tied).find((l) => l.breaks.length === 0);
      if (lever === undefined) continue;
      // Cheapest measured from the base, so a weight isn't walked far from
      // it one small step at a time.
      const cost = movedBy(lever.key, lever.value, base);
      if (best === null || cost < best.cost) best = { scenario: record.name, lever, cost };
    }
    if (best === null) break;
    const { key, value } = best.lever;
    pulled.push({ scenario: best.scenario, key, from: weights[key], value });
    weights = tie({ ...weights, [key]: value });
  }
  const unfixed = records.filter((r) => !replayRight(r, weights)).map((r) => r.name);
  return { weights, pulled, unfixed };
}
