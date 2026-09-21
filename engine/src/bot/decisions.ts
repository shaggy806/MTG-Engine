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
  const decision = decisionForOffer(legal);
  if (decision === undefined) return null;
  return decision.candidates?.(legal, player, MAX_DECISION_CANDIDATES, { order, controllerOf }) ?? null;
}
