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
import { normalizeTargets } from "../target.js";
import { cardSource, invalidTargetReason, permanentSource } from "../targeting.js";
import type { TargetSource } from "../targeting.js";
import type { ObjectId } from "../primitives.js";
import { defineDecision } from "./define.js";
import type { DecisionReadCtx } from "./contract.js";
import { targetCombos } from "./shared/target-combos.js";

/**
 * The {@link TargetSource} behind a parked decision — a card for a pending
 * cast, a permanent for a pending trigger, or nothing when that permanent has
 * already left (rule 608.2b).
 */
function sourceForPending(ctx: DecisionReadCtx, source: ObjectId): TargetSource | undefined {
  if (ctx.state.pendingTargetedCast !== null) {
    return cardSource(ctx.registry.get(ctx.state.objects[source].cardName));
  }
  return ctx.state.objects[source] !== undefined
    ? permanentSource(ctx.state, ctx.registry, source)
    : undefined;
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
    host.applyChooseTargets(action.player, normalizeTargets(action.targets));
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
});
