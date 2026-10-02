/**
 * Ordering your own simultaneous triggered abilities (rule 603.3b): each
 * player puts the triggers they control on the stack in any order they
 * choose, after the active player's (APNAP).
 *
 * Asked only of a player who has said they order their own
 * (`GameState.ordersOwnTriggers`, the client's "order my triggers" setting),
 * and only when two or more of theirs are waiting and they aren't all the same
 * ability. Everyone else gets the engine's own order — the one this decision
 * offers first: a `stackFirst` ability placed first, the rest in the order
 * they triggered. The raise and the placing stay on `Game`
 * (`placePendingTriggers`); the answer reorders that player's waiting
 * triggers and resumes it.
 */

import type { Action, LegalAction } from "../actions.js";
import { defineDecision } from "./define.js";

/** Whether `order` names each of `count` indices exactly once. */
export function isTriggerOrder(order: readonly number[], count: number): boolean {
  if (order.length !== count) return false;
  const seen = new Set(order);
  return seen.size === count && order.every((i) => Number.isInteger(i) && i >= 0 && i < count);
}

export const orderTriggers = defineDecision({
  kind: "order-triggers",

  // The rules raise this, not a card.
  hasSource: false,

  legal: (_ctx, awaiting): LegalAction[] => [{ kind: "order-triggers", triggers: [...awaiting.triggers] }],

  whyCannot: (ctx, action, player): string | null => {
    const asked = `${player} is not being asked to order their triggers`;
    if (action.type !== "order-triggers") return asked;
    const awaiting = ctx.state.awaiting;
    if (awaiting === null || awaiting.kind !== "order-triggers" || awaiting.player !== player) return asked;
    return isTriggerOrder(action.order, awaiting.triggers.length)
      ? null
      : `name each of the ${awaiting.triggers.length} triggers once`;
  },

  apply: (host, action): void => {
    if (action.type !== "order-triggers") return;
    host.applyTriggerOrder(action.player, action.order);
  },

  ask: (controller, view, awaiting, player): Action => ({
    type: "order-triggers",
    player,
    order: controller.orderTriggers(view, awaiting.triggers),
  }),

  // No `candidates`: a bot never orders its own triggers (the engine orders
  // them), so a search never meets this decision.

  randomAnswer: (legal, player, rng): Action => {
    const order = legal.triggers.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = rng.pickIndex(i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
    return { type: "order-triggers", player, order };
  },
});
