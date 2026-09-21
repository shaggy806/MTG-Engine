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
import { decisionForOffer } from "../decisions/registry.js";
import { combinations, subsetsBetween } from "../decisions/shared/subsets.js";
import { targetCombos } from "./candidates.js";

// Re-exported from their new home so `bot/candidates.ts` and
// `eval-bot-combat.test.ts` import exactly what they imported before. A
// decision module cannot reach into `bot/`, which is why they moved.
export { combinations, subsetsBetween };

/** Per-decision ceiling on candidate answers. */
export const MAX_DECISION_CANDIDATES = 32;

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
  const decision = decisionForOffer(legal);
  if (decision !== undefined) {
    return decision.candidates?.(legal, player, limit, { order, controllerOf }) ?? null;
  }
  switch (legal.kind) {
    case "choose-targets":
      return targetCombos(legal.options, limit, legal.specs).map((targets) => ({
        type: "choose-targets",
        player,
        targets,
      }));
    case "discard":
      return combinations([...order(legal.from)].reverse(), legal.count, limit).map((cards) => ({
        type: "discard",
        player,
        cards,
      }));
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
