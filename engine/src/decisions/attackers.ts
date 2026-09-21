/**
 * Declaring attackers (rule 508.1).
 *
 * One of the two kinds whose validator carries real rules rather than a
 * shape check — every declared attacker is run through
 * `combat/eligibility.ts`'s `whyCannotAttack`, and then through goad, which
 * is the one rule that constrains *which* defender rather than whether the
 * creature may attack at all.
 *
 * The offer and the validator go through the same pair of functions, which is
 * an invariant worth stating: `defendersForAttacker` enumerates exactly what
 * `whyCannotAttack` + `goadForbidsDefender` will accept. Enumerating without
 * goad is what let the fuzzer propose declarations `dispatch` then refused.
 */

import type { Action, LegalAction } from "../actions.js";
import {
  creatureDef,
  defendersForAttacker,
  goadForbidsDefender,
  legalDefenders,
  whyCannotAttack,
} from "../combat/eligibility.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { defineDecision } from "./define.js";
import type { DecisionReadCtx } from "./contract.js";

function attackersOffer(
  ctx: DecisionReadCtx,
  player: PlayerId,
): Extract<LegalAction, { kind: "declare-attackers" }> {
  const defenders = legalDefenders(ctx.state, ctx.registry, player);
  const defendersFor: Record<ObjectId, readonly (PlayerId | ObjectId)[]> = {};
  for (const id of ctx.state.zones.shared.battlefield) {
    const legal = defendersForAttacker(ctx.state, ctx.registry, player, id);
    if (legal.length > 0) defendersFor[id] = legal;
  }
  return {
    kind: "declare-attackers",
    // The union across every attacker. NOT the list for any one of them —
    // `defendersFor` is that, per creature, and picking from the union builds
    // a declaration this module's own validator rejects.
    defenders,
    defendersFor,
    eligible: Object.keys(defendersFor) as ObjectId[],
  };
}

export const attackers = defineDecision({
  kind: "attackers",

  // The rules ask for attackers; no card is behind the prompt.
  hasSource: false,

  legal: (ctx, _awaiting, player): LegalAction[] => [attackersOffer(ctx, player)],

  whyCannot: (ctx, action, player): string | null => {
    if (action.type !== "declare-attackers") {
      return `${player} is not being asked to declare attackers`;
    }
    const awaiting = ctx.state.awaiting;
    if (awaiting === null || awaiting.kind !== "attackers" || awaiting.player !== player) {
      return `${player} is not being asked to declare attackers`;
    }
    const seen = new Set<ObjectId>();
    for (const { attacker, defender } of action.attackers) {
      if (seen.has(attacker)) {
        return `${attacker} was declared as an attacker twice`;
      }
      seen.add(attacker);
      const why = whyCannotAttack(ctx.state, ctx.registry, player, attacker, defender);
      if (why !== null) return why;
      // Goad (rule 701.38b) — "attacks a player other than you if able". The
      // requirement only bites when some other defender was actually legal,
      // so a goaded creature with nowhere else to go may still attack its
      // goader.
      if (goadForbidsDefender(ctx.state, ctx.registry, player, attacker, defender)) {
        const name = creatureDef(ctx.state, ctx.registry, attacker)?.name ?? attacker;
        return `${name} is goaded and must attack someone else if able`;
      }
    }
    return null;
  },

  apply: (host, action): void => {
    if (action.type !== "declare-attackers") return;
    host.applyAttackerDeclarations(action.player, action.attackers);
  },

  ask: (controller, view, _awaiting, player): Action => ({
    type: "declare-attackers",
    player,
    attackers: controller.declareAttackers(view),
  }),

  // candidates: deliberately absent from `decisionCandidates`. Combat is not
  // enumerated as a decision at all — the searching bots build an attack one
  // attacker/defender pair at a time in `bot/combat-math.ts` and
  // `bot/eval-bot.ts`, because the subsets of a wide board are a
  // combinatorial trap and the useful cuts are structural rather than
  // arbitrary.
});
