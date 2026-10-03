/**
 * Choosing targets for something already on its way to the stack.
 *
 * **Two state machines behind one kind**, which is why this one went last.
 * A triggered ability that needs a real target parks in
 * `state.pendingTargetedTrigger`; a spell being cast for free (suspend,
 * cascade) parks in `state.pendingTargetedCast`. Both raise this same
 * decision, and `Game.applyChooseTargets` resumes whichever was parked —
 * `placeTriggerOnStack`'s `"done" | "paused"` sentinel, `castCardWithoutPaying`'s
 * cascade short-circuit and `upkeepStep`'s suspended-cast stash are all on
 * the other side of that resume, and none of them move.
 *
 * The module has to know about the split for exactly one reason: what counts
 * as the *source* of the targeting differs. A pending cast is still a card,
 * so protection and DEBT clauses read its printed characteristics; a pending
 * trigger's source is a permanent, which may already have left the
 * battlefield (rule 608.2b), in which case there is no source at all.
 *
 * **`normalizeTargets` is called on both paths.** `dispatch` and
 * `canDispatch` each applied it before handing `action.targets` on, so a
 * module that applied it in only one place would validate a different shape
 * than it applies. Both hops are reproduced here.
 */

import type { Action, LegalAction } from "../actions.js";
import type { PlayerId } from "../primitives.js";
import { divisionOf, normalizeTargets, sameTargetRef } from "../target.js";
import type { ResolvedTargets } from "../target.js";
import { cardSource, invalidTargetReason } from "../targeting.js";
import type { TargetSource } from "../targeting.js";
import type { ObjectId } from "../primitives.js";
import { defineDecision } from "./define.js";
import type { DecisionReadCtx } from "./contract.js";
import { targetCombos } from "./shared/target-combos.js";

/**
 * The {@link TargetSource} behind a parked decision — a card for a pending
 * cast; for a pending trigger, its permanent (an identity-less source once
 * that has left, rule 608.2b) together with what a target filter's dynamic
 * operand reads, which only `Game` can answer.
 */
function sourceForPending(ctx: DecisionReadCtx, source: ObjectId): TargetSource | undefined {
  if (ctx.state.pendingTargetedCast !== null) {
    return cardSource(ctx.registry.get(ctx.state.objects[source].cardName), source);
  }
  return ctx.pendingTriggerTargetSource();
}

type ChooseTargetsAwaiting = Extract<NonNullable<DecisionReadCtx["state"]["awaiting"]>, { kind: "choose-targets" }>;

/**
 * New targets for a copy of a spell (rule 707.10c): one answer per slot, each
 * either the target the slot has now — kept even if it's no longer legal —
 * or a legal target for that slot. When every target is legal the whole set
 * is checked together, so "two target creatures" can't become the same
 * creature twice (rule 601.2c).
 */
function whyNotCopyTargets(
  ctx: DecisionReadCtx,
  awaiting: ChooseTargetsAwaiting,
  chosen: ResolvedTargets,
  player: PlayerId,
): string | null {
  const current = awaiting.current ?? [];
  if (chosen.length !== current.length) {
    return `the copy has ${current.length} target(s) to keep or change, not ${chosen.length}`;
  }
  for (let i = 0; i < chosen.length; i += 1) {
    const target = chosen[i];
    if (target === undefined) return "a copy keeps the same number of targets";
    if (!awaiting.options[i].some((o) => sameTargetRef(o, target))) {
      return `that isn't a legal new target for slot ${i + 1}`;
    }
  }
  const source = cardSource(ctx.registry.get(awaiting.cardName), awaiting.source);
  const whole = invalidTargetReason(ctx.state, ctx.registry, awaiting.specs, chosen, player, awaiting.cardName, source);
  // A target kept although it's no longer legal fails the whole-set check,
  // and is still allowed: it's the one choice that needs no legality.
  const keptStale = chosen.some(
    (t, i) =>
      t !== undefined &&
      sameTargetRef(t, current[i]) &&
      invalidTargetReason(ctx.state, ctx.registry, [awaiting.specs[i]], [t], player, awaiting.cardName, source) !== null,
  );
  return keptStale ? null : whole;
}

export const chooseTargets = defineDecision({
  kind: "choose-targets",

  hasSource: true,

  legal: (_ctx, awaiting): LegalAction[] => [
    {
      kind: "choose-targets",
      source: awaiting.source,
      cardName: awaiting.cardName,
      specs: [...awaiting.specs],
      options: awaiting.options.map((o) => [...o]),
      ...(awaiting.current !== undefined ? { current: [...awaiting.current] } : {}),
      ...(awaiting.divide !== undefined ? { divide: awaiting.divide } : {}),
    },
  ],

  whyCannot: (ctx, action, player: PlayerId): string | null => {
    if (action.type !== "choose-targets") {
      return `${player} is not being asked to choose targets`;
    }
    const awaiting = ctx.state.awaiting;
    if (awaiting === null || awaiting.kind !== "choose-targets" || awaiting.player !== player) {
      return `${player} is not being asked to choose targets`;
    }
    if (awaiting.current !== undefined) return whyNotCopyTargets(ctx, awaiting, normalizeTargets(action.targets), player);
    // A divided amount (rule 603.3d): one share per target of the group, at
    // least 1 each, all of it — or none said, and an even split.
    if (awaiting.divide === undefined) {
      if (action.division !== undefined && action.division.length > 0) return "this ability divides nothing";
    } else {
      const division = divisionOf(awaiting.divide, normalizeTargets(action.targets), action.division);
      if (typeof division === "string") return division;
    }
    return invalidTargetReason(
      ctx.state,
      ctx.registry,
      awaiting.specs,
      // Same normalisation the apply does — see the module header.
      normalizeTargets(action.targets),
      player,
      awaiting.cardName,
      sourceForPending(ctx, awaiting.source),
    );
  },

  apply: (host, action): void => {
    if (action.type !== "choose-targets") return;
    host.applyChooseTargets(action.player, normalizeTargets(action.targets), action.division);
  },

  ask: (controller, view, awaiting, player): Action => ({
    type: "choose-targets",
    player,
    targets: controller.chooseTargets(view, awaiting.cardName, awaiting.specs, awaiting.options),
  }),

  /** One combination per candidate, breadth-first so the cap bites on the
   * later slots rather than starving the first. An optional slot offers
   * `null` alongside its targets, because declining is a real choice. */
  candidates: (legal, player, limit): Action[] => {
    if (legal.kind !== "choose-targets") return [];
    return targetCombos(legal.options, limit, legal.specs).map((targets) => ({
      type: "choose-targets",
      player,
      targets,
    }));
  },

  randomAnswer: (legal, player, rng): Action => ({
    type: "choose-targets",
    player,
    targets: rng.pickTargets(legal.options, legal.specs),
  }),
});
