/**
 * Declaring attackers (rule 508.1).
 *
 * One of the two kinds whose validator carries real rules rather than a
 * shape check — every declared attacker is run through
 * `combat/eligibility.ts`'s `whyCannotAttack`, and then through its attack
 * requirements (goad, encore, an attack-requirement rule), the rules that
 * constrain *which* defender rather than whether the creature may attack at
 * all. Then the declaration as a whole: every creature that must attack if
 * able is in it (`combat/attacking.ts`).
 *
 * The offer and the validator go through the same pair of functions, which is
 * an invariant worth stating: `defendersForAttacker` enumerates exactly what
 * `whyCannotAttack` + `attackRequirementsForbid` will accept. Enumerating
 * without goad is what let the fuzzer propose declarations `dispatch` then
 * refused.
 */

import type { Action, LegalAction } from "../actions.js";
import { withRequiredAttackers } from "../combat/attacking.js";
import type { AttackOffer } from "../combat/attacking.js";
import {
  attackRequirementsForbid,
  attackRequirementsReason,
  creatureDef,
  defendersForAttacker,
  legalDefenders,
  mustAttack,
  whyCannotAttack,
} from "../combat/eligibility.js";
import type { ObjectId, PlayerId } from "../primitives.js";
import { defineDecision } from "./define.js";
import type { DecisionReadCtx } from "./contract.js";

function attackersOffer(ctx: DecisionReadCtx, player: PlayerId): AttackOffer {
  const defenders = legalDefenders(ctx.state, ctx.registry, player);
  const defendersFor: Record<ObjectId, readonly (PlayerId | ObjectId)[]> = {};
  for (const id of ctx.state.zones.shared.battlefield) {
    const legal = defendersForAttacker(ctx.state, ctx.registry, player, id);
    if (legal.length > 0) defendersFor[id] = legal;
  }
  const eligible = Object.keys(defendersFor) as ObjectId[];
  return {
    kind: "declare-attackers",
    // The union across every attacker. NOT the list for any one of them —
    // `defendersFor` is that, per creature, and picking from the union builds
    // a declaration this module's own validator rejects.
    defenders,
    defendersFor,
    eligible,
    // Able to attack is being eligible: a legal defender to be sent at.
    mustAttack: eligible.filter((id) => mustAttack(ctx.state, ctx.registry, id)),
  };
}

const nameOf = (ctx: DecisionReadCtx, id: ObjectId): string => creatureDef(ctx.state, ctx.registry, id)?.name ?? id;

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
      // Rule 508.1d — as many of its requirements obeyed as can be: goad's
      // "attacks a player other than you if able" (701.15b), encore's
      // "attacks that opponent if able". One that can't be obeyed (only the
      // goader left to attack) rules nothing out.
      if (attackRequirementsForbid(ctx.state, ctx.registry, player, attacker, defender)) {
        return attackRequirementsReason(ctx.state, ctx.registry, attacker);
      }
    }
    // Rule 508.1d: every creature that must attack and can is declared. The
    // offer's `mustAttack` asked only of the ones left out, rather than
    // building the whole offer again (`attackingViolations` is that check
    // against the offer, for the client).
    const missing = ctx.state.zones.shared.battlefield.filter(
      (id) =>
        !seen.has(id) &&
        ctx.state.objects[id]?.controller === player &&
        mustAttack(ctx.state, ctx.registry, id) &&
        defendersForAttacker(ctx.state, ctx.registry, player, id).length > 0,
    );
    if (missing.length > 0) {
      return `${missing.map((id) => nameOf(ctx, id)).join(", ")} must attack if able`;
    }
    return null;
  },

  apply: (host, action): void => {
    if (action.type !== "declare-attackers") return;
    host.applyAttackerDeclarations(action.player, action.attackers);
  },

  // A controller that leaves out a creature that must attack — a bot's
  // policy, a test's scripted player — has it sent at the first defender it
  // may attack. A person is asked instead: the client won't confirm without
  // it.
  ask: (controller, view, _awaiting, player): Action => {
    const declared = controller.declareAttackers(view);
    const offer = view.legalActions().find((o): o is AttackOffer => o.kind === "declare-attackers");
    return {
      type: "declare-attackers",
      player,
      attackers: offer === undefined ? declared : withRequiredAttackers(declared, offer),
    };
  },

  /** Attacking is optional (rule 508.1a), so declaring nothing is the safe
   * answer for a seat skipping its own windows — unless something must
   * attack. A creature with only one defender it may attack is sent there;
   * one with a choice of defender is the seat's to make, so nothing is
   * answered for it. */
  autoAnswer: (_awaiting, player, legal): Action | null => {
    const offer = legal.find((o): o is AttackOffer => o.kind === "declare-attackers");
    const required = offer?.mustAttack ?? [];
    if (offer === undefined || required.some((id) => (offer.defendersFor[id] ?? []).length !== 1)) {
      return required.length === 0 ? { type: "declare-attackers", player, attackers: [] } : null;
    }
    return { type: "declare-attackers", player, attackers: withRequiredAttackers([], offer) };
  },

  // candidates: deliberately absent from `decisionCandidates`. Combat is not
  // enumerated as a decision at all — the searching bots build an attack one
  // attacker/defender pair at a time in `bot/combat-math.ts` and
  // `bot/eval-bot.ts`, because the subsets of a wide board are a
  // combinatorial trap and the useful cuts are structural rather than
  // arbitrary.

  randomAnswer: (legal, player, rng): Action => ({
    type: "declare-attackers",
    player,
    // The `filter` runs to completion before the `flatMap` starts, so every
    // eligible creature's coin flip is drawn before any defender is picked.
    // Fusing the two into one pass would interleave those draws and re-point
    // every seed, which is why this stays two passes. A creature that must
    // attack still draws its flip, and attacks whatever it came up.
    attackers: legal.eligible
      .filter((attacker) => rng.random() < 0.6 || legal.mustAttack.includes(attacker))
      .flatMap((attacker) => {
        // Per-attacker, not the union: a goaded creature may not be
        // sent at its goader while anyone else is available.
        const options = legal.defendersFor[attacker] ?? [];
        if (options.length === 0) return [];
        return [{ attacker, defender: options[rng.pickIndex(options.length)] }];
      }),
  }),
});
