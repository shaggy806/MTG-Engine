/**
 * Ordering the creatures blocking one attacker (rule 509.2) — the attacking
 * player says which blocker takes damage first.
 *
 * A pure permutation: the answer must contain exactly the blockers already
 * declared, each once, in some order. Nothing is added or removed, which is
 * why the validator can be a set comparison rather than a rules check.
 *
 * The *queue* stays on `Game`. A multi-blocked attacker parks in
 * `pendingBlockerOrders`, drained one `order-blockers` at a time by
 * `promptNextBlockerOrder`; this module answers whichever attacker is
 * currently up and knows nothing about the rest.
 */

import type { Action, LegalAction } from "../actions.js";
import { defineDecision } from "./define.js";

export const orderBlockers = defineDecision({
  kind: "order-blockers",

  // Declaring an order is the rules' bookkeeping, not a card's effect.
  hasSource: false,

  legal: (ctx, awaiting): LegalAction[] => [
    {
      kind: "order-blockers",
      attacker: awaiting.attacker,
      // Read live off the attacker rather than off the decision: a blocker
      // can leave the battlefield between the block being declared and the
      // order being asked for.
      blockers: [...ctx.state.objects[awaiting.attacker].blockedBy],
    },
  ],

  whyCannot: (ctx, action, player): string | null => {
    if (action.type !== "order-blockers") return `${player} is not being asked to order blockers`;
    const awaiting = ctx.state.awaiting;
    if (awaiting === null || awaiting.kind !== "order-blockers" || awaiting.player !== player) {
      return `${player} is not being asked to order blockers`;
    }
    if (awaiting.attacker !== action.attacker) {
      return `expected an order for ${awaiting.attacker}, got ${action.attacker}`;
    }
    const order = action.order;
    const current = ctx.state.objects[action.attacker]?.blockedBy ?? [];
    const valid =
      order.length === current.length &&
      new Set(order).size === order.length &&
      order.every((id) => current.includes(id));
    if (!valid) return "blocker order must be a permutation of the blockers";
    return null;
  },

  apply: (host, action): void => {
    if (action.type !== "order-blockers") return;
    host.applyBlockerOrder(action.player, action.attacker, action.order);
  },

  ask: (controller, view, awaiting, player): Action => {
    const blockers = view.state.objects[awaiting.attacker].blockedBy;
    return {
      type: "order-blockers",
      player,
      attacker: awaiting.attacker,
      order: controller.orderBlockers(view, awaiting.attacker, [...blockers]),
    };
  },

  // candidates: deliberately not searched — v1's answer (the declared order,
  // unchanged) is already right. Combined with `assign-combat-damage`'s
  // lethal-in-order split it produces the standard result, and the
  // permutations of a blocker list are a combinatorial trap for a decision
  // whose outcomes a rollout can barely tell apart.

  // A Fisher-Yates shuffle of the declared order: every permutation is legal,
  // so the fuzzer takes them uniformly rather than favouring the default.
  randomAnswer: (legal, player, rng): Action => {
    const order = [...legal.blockers];
    for (let i = order.length - 1; i > 0; i -= 1) {
      const j = rng.pickIndex(i + 1);
      const tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }
    return { type: "order-blockers", player, attacker: legal.attacker, order };
  },
});
