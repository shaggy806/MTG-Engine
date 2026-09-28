/**
 * What a creature put onto the battlefield attacking attacks (rule 508.4).
 *
 * "Its controller chooses which defending player, planeswalker a defending
 * player controls, or battle a defending player protects it's attacking as it
 * enters the battlefield (unless the effect that put it onto the battlefield
 * specifies what it's attacking)." In a two-player game with no planeswalker
 * there's nothing to choose and nobody is asked; in Commander every opponent
 * is a defending player (rule 802.2), so a Hero of Bladehold's two Soldiers
 * each have a real choice.
 *
 * The raise is `Game.putIntoAttack` (queued in `pendingEnterAttacking`, asked
 * by `promptNextEnterAttacking`). Each creature is already attacking its
 * first option while the question is open — nothing can happen in between,
 * since the decision is answered before anything else — and the answer
 * re-points it. Every creature offered needs an answer, from its own options.
 */

import type { Action, LegalAction } from "../actions.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { defineDecision } from "./define.js";

type Target = PlayerId | ObjectId;

export const enterAttacking = defineDecision({
  kind: "enter-attacking",

  hasSource: true,

  legal: (_ctx, awaiting): LegalAction[] => [
    {
      kind: "enter-attacking",
      creatures: awaiting.creatures.map((c) => ({ object: c.object, options: [...c.options] })),
    },
  ],

  whyCannot: (ctx, action, player): string | null => {
    const asked = `${player} is not being asked what creatures entering attacking attack`;
    if (action.type !== "enter-attacking") return asked;
    const awaiting = ctx.state.awaiting;
    if (awaiting === null || awaiting.kind !== "enter-attacking" || awaiting.player !== player) {
      return asked;
    }
    const seen = new Set<ObjectId>();
    for (const { object, target } of action.assignments) {
      const offered = awaiting.creatures.find((c) => c.object === object);
      if (offered === undefined) return `${object} isn't entering attacking`;
      if (seen.has(object)) return `${object} was given two things to attack`;
      seen.add(object);
      if (!offered.options.includes(target)) return `${object} can't attack ${target}`;
    }
    const missing = awaiting.creatures.find((c) => !seen.has(c.object));
    return missing === undefined ? null : `choose what ${missing.object} attacks`;
  },

  apply: (host, action): void => {
    if (action.type !== "enter-attacking") return;
    host.applyEnterAttacking(action.player, action.assignments);
  },

  ask: (controller, view, awaiting, player): Action => ({
    type: "enter-attacking",
    player,
    assignments: controller.chooseAttackTargets(view, awaiting.creatures),
  }),

  /**
   * One answer per option anyone has: every creature that may, at that
   * player or planeswalker, and the rest at their first option — the choice
   * that matters is nearly always "whom does the whole group hit", and a
   * per-creature product would be options ^ creatures rollouts.
   */
  candidates: (legal, player): Action[] => {
    if (legal.kind !== "enter-attacking") return [];
    const targets: Target[] = [];
    for (const c of legal.creatures) for (const o of c.options) if (!targets.includes(o)) targets.push(o);
    return targets.map((t) => ({
      type: "enter-attacking",
      player,
      assignments: legal.creatures.map((c) => ({
        object: c.object,
        target: c.options.includes(t) ? t : c.options[0],
      })),
    }));
  },

  // One uniform pick per creature, in order.
  randomAnswer: (legal, player, rng): Action => ({
    type: "enter-attacking",
    player,
    assignments: legal.creatures.map((c) => ({
      object: c.object,
      target: c.options[rng.pickIndex(c.options.length)],
    })),
  }),
});
