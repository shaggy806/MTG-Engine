/**
 * Splitting a blocked attacker's combat damage among its blockers — rule
 * 510.1c. Since *Foundations* there is no damage assignment order: any
 * division among the blockers is legal, and only trample needs lethal on each
 * before any goes over (702.19b).
 *
 * The narrowest read of any decision in the engine: the validator looks at
 * `state.awaiting` and nothing else. Everything it needs — how much power
 * there is, what counts as lethal to each blocker, whether the excess may
 * trample over — was computed when the decision was raised and is carried on
 * the `AwaitingDecision` itself. That is deliberate: the blockers' toughness
 * can change between the offer and the answer, and the offer is what the
 * player answered.
 *
 * The rule itself lives in `combat/damage.ts` as `damageAssignmentViolations`,
 * shared with `Game`; only the "is this player being asked" guard is here,
 * because that message is asserted by two tests and reaches the client
 * verbatim.
 */

import type { Action, LegalAction } from "../actions.js";
import { damageAssignmentViolations, standardAssignment } from "../combat/damage.js";
import { defineDecision } from "./define.js";

export const assignCombatDamage = defineDecision({
  kind: "assign-combat-damage",

  // Combat damage is the rules' own bookkeeping; no card is behind it.
  hasSource: false,

  legal: (_ctx, awaiting): LegalAction[] => [
    {
      kind: "assign-combat-damage",
      attacker: awaiting.attacker,
      blockers: [...awaiting.blockers],
      power: awaiting.power,
      lethal: [...awaiting.lethal],
      trample: awaiting.trample,
    },
  ],

  whyCannot: (ctx, action, player): string | null => {
    if (action.type !== "assign-combat-damage") {
      return `${player} is not being asked to assign combat damage`;
    }
    const awaiting = ctx.state.awaiting;
    if (
      awaiting === null ||
      awaiting.kind !== "assign-combat-damage" ||
      awaiting.player !== player
    ) {
      return `${player} is not being asked to assign combat damage`;
    }
    return damageAssignmentViolations(awaiting, action.assignment);
  },

  apply: (host, action): void => {
    if (action.type !== "assign-combat-damage") return;
    host.applyAssignCombatDamage(action.player, action.assignment);
  },

  ask: (controller, view, awaiting, player): Action => ({
    type: "assign-combat-damage",
    player,
    assignment: controller.assignCombatDamage(view, {
      attacker: awaiting.attacker,
      blockers: awaiting.blockers,
      power: awaiting.power,
      lethal: awaiting.lethal,
      trample: awaiting.trample,
    }),
  }),

  // candidates: not searched yet. This opted out when damage had to go
  // lethal-in-order, which left almost nothing to choose. Now that any split
  // is legal, which blocker dies is a real choice, and one a static score can
  // price (it sees what's left on the board), but the default
  // (`standardAssignment`: kill as many as possible, cheapest first) hasn't
  // been benched against a searched one. Measure before adding it: emitted
  // candidates re-point every `bot:bench` number.

  randomAnswer: (legal, player, rng): Action => {
    // Any division among the blockers is legal (510.1c), so half the time deal
    // the power out a point at a time to random blockers; it always sums to
    // the power, so nothing tramples over.
    if (legal.blockers.length > 0 && rng.random() < 0.5) {
      const assignment = legal.blockers.map(() => 0);
      for (let i = 0; i < legal.power; i += 1) {
        assignment[rng.pickIndex(assignment.length)] += 1;
      }
      return { type: "assign-combat-damage", player, assignment };
    }
    // Otherwise start from the standard split, then sometimes pile extra onto
    // a blocker instead of trampling it over — still legal.
    const assignment = standardAssignment(legal);
    const spare = legal.power - assignment.reduce((sum, n) => sum + n, 0);
    if (spare > 0 && assignment.length > 0 && rng.random() < 0.5) {
      assignment[rng.pickIndex(assignment.length)] += spare;
    }
    return { type: "assign-combat-damage", player, assignment };
  },
});
