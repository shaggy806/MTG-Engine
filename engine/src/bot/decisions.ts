/**
 * The concrete answers to a decision the engine is waiting on — Phase 4 of
 * `docs/plans/smarter-bots.md`.
 *
 * v1's answers to these are placeholders: the first legal target (which can be
 * its own creature), decline every "you may", take the minimum from a tutor
 * (nothing, for "up to"), sacrifice whatever is listed first, never scry a
 * card away. `EvalBotController` plays each candidate here out like any other
 * move and keeps v1's answer only when nothing beats it.
 *
 * Every list is capped: a sacrifice or tutor over a big board is a
 * combinatorial trap, and the marginal combination is almost never the best.
 * Decisions left out on purpose — mulligans (before the game, where a rollout
 * to the end of a turn means nothing), combat damage order and assignment
 * (v1's lethal-in-order is already right), naming a creature type and
 * changing text (no rollout sees the difference) — return `null`.
 */

import type { Action, LegalAction } from "../actions.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { targetCombos } from "./candidates.js";

/** Per-decision ceiling on candidate answers. */
export const MAX_DECISION_CANDIDATES = 32;

/** Scry/surveil looks at most this many cards exhaustively (2^n subsets). */
const MAX_SCRY_EXHAUSTIVE = 5;

/** Every `k`-element subset of `items`, in order, stopping at `limit`. */
export function combinations<T>(items: readonly T[], k: number, limit: number): T[][] {
  const out: T[][] = [];
  const pick = (start: number, chosen: T[]): void => {
    if (out.length >= limit) return;
    if (chosen.length === k) {
      out.push([...chosen]);
      return;
    }
    for (let i = start; i <= items.length - (k - chosen.length); i += 1) {
      chosen.push(items[i]);
      pick(i + 1, chosen);
      chosen.pop();
      if (out.length >= limit) return;
    }
  };
  if (k >= 0 && k <= items.length) pick(0, []);
  return out;
}

/** Subsets of size `min`..`max`, smallest first, stopping at `limit`. */
function subsetsBetween<T>(items: readonly T[], min: number, max: number, limit: number): T[][] {
  const out: T[][] = [];
  for (let k = Math.max(0, min); k <= Math.min(max, items.length); k += 1) {
    out.push(...combinations(items, k, limit - out.length));
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Candidate answers to the pending decision `legal` describes, for `player`,
 * or `null` when this kind of decision isn't searched.
 */
export function decisionCandidates(
  legal: LegalAction,
  player: PlayerId,
  /** Most valuable first, for where a list is capped: tutors try the best
   * cards first, sacrifices and discards the cheapest. Defaults to the order
   * offered. */
  order: (ids: readonly ObjectId[]) => readonly ObjectId[] = (ids) => ids,
  /** Who controls an object — only the `proliferate` branch needs it, which
   * is entirely about whose permanent gets the counter. Without it that
   * branch degrades to "all or nothing", never to a wrong answer. */
  controllerOf: (id: ObjectId) => PlayerId | undefined = () => undefined,
): Action[] | null {
  const limit = MAX_DECISION_CANDIDATES;
  switch (legal.kind) {
    case "choose-targets":
      return targetCombos(legal.options, limit, legal.specs).map((targets) => ({
        type: "choose-targets",
        player,
        targets,
      }));
    case "choose-modes": {
      const indices = legal.modeTexts.map((_, i) => i);
      const xValues = legal.xCost === undefined ? [undefined] : [legal.xCost.maxX, 0];
      return subsetsBetween(indices, legal.minModes, legal.maxModes, limit).flatMap((modes) =>
        xValues.map(
          (xValue): Action => ({
            type: "choose-modes",
            player,
            modes,
            ...(xValue !== undefined ? { xValue } : {}),
          }),
        ),
      );
    }
    case "sacrifice":
      return combinations([...order(legal.eligible)].reverse(), legal.count, limit).map((permanents) => ({
        type: "sacrifice",
        player,
        permanents,
      }));
    case "discard":
      return combinations([...order(legal.from)].reverse(), legal.count, limit).map((cards) => ({
        type: "discard",
        player,
        cards,
      }));
    case "choose-from-zone":
      return subsetsBetween(order(legal.eligible), legal.min, legal.max, limit).map((chosen) => ({
        type: "choose-from-zone",
        player,
        chosen,
      }));
    case "scry": {
      const cards = legal.cards;
      const subsets: ObjectId[][] =
        cards.length <= MAX_SCRY_EXHAUSTIVE
          ? subsetsBetween(cards, 0, cards.length, limit)
          : [[], [...cards], ...cards.map((card) => [card])];
      return subsets.map((away) => ({ type: "scry", player, away }));
    }
    case "choose-copy":
      return [...legal.options, null].slice(0, limit).map((copy) => ({
        type: "choose-copy",
        player,
        copy,
      }));
    case "pay-life-for-untapped":
      return [true, false].map((pay) => ({ type: "pay-life-for-untapped", player, pay }));
    case "proliferate": {
      // Not the 2^n subsets: proliferate is worth searching precisely because
      // whose permanent gets the counter matters, and the interesting cut is
      // "mine" vs "everything" vs "nothing". Anything finer is a rollout
      // spent distinguishing two of your own creatures.
      const mine = legal.eligible.filter((t) =>
        t.kind === "player" ? t.player === player : controllerOf(t.object) === player,
      );
      const seen = new Set<string>();
      return [mine, legal.eligible, []]
        .filter((chosen) => {
          const key = chosen.map((t) => (t.kind === "player" ? t.player : t.object)).join(",");
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((chosen) => ({ type: "proliferate", player, chosen }));
    }
    // `commander-replacement` is deliberately **not** searched, and keeps
    // v1's answer (the command zone).
    //
    // The evaluation has no term for the command zone — `features.ts` never
    // looks at that zone — while `graveyard` is worth 0.05 a card. So letting
    // the commander die scored a hair *better* than saving it, every time,
    // and the bot fed its commander to the graveyard on the first removal
    // spell it saw. A rollout can't rescue that either: the commander is only
    // worth something once recast, which is past the horizon.
    //
    // Searching a decision the evaluation cannot price is worse than not
    // searching it, which is the same reason mulligans and combat damage
    // order are absent. Revisit if a "commander available to recast" feature
    // is ever added and fitted.
    default:
      return null;
  }
}
