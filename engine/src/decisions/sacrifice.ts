/**
 * Choosing what to sacrifice — an edict's victim, a sacrifice cost's fodder,
 * an Altar's food.
 *
 * The answer half only. The *queue* behind it stays on `Game` and is the
 * complicated part: `sacrificeByEffect` can raise one of these per player in
 * APNAP order, `pendingSacrifices`/`pendingSacrificeVictims` carry the rest
 * while one player answers, and `promptNextSacrifice` drains them across
 * several fixpoint iterations. This module never sees any of that — it
 * answers whichever single prompt is currently up.
 *
 * An edict is also the reason `decisionSource` exists: by the time the
 * sacrifice is asked, the card that caused it has usually finished resolving
 * and is in a graveyard, so the prompt has to carry its name separately or
 * name nothing at all.
 */

import type { Action, LegalAction } from "../actions.js";
import type { ObjectId } from "../primitives.js";
import { defineDecision } from "./define.js";
import { exactCount, noDuplicates, subsetOf } from "./shared/picks.js";
import { combinations } from "./shared/subsets.js";

export const sacrifice = defineDecision({
  kind: "sacrifice",

  hasSource: true,

  legal: (_ctx, awaiting): LegalAction[] => [
    { kind: "sacrifice", count: awaiting.count, eligible: [...awaiting.eligible] },
  ],

  whyCannot: (ctx, action, player): string | null => {
    if (action.type !== "sacrifice") return `${player} is not being asked to sacrifice`;
    const awaiting = ctx.state.awaiting;
    if (awaiting === null || awaiting.kind !== "sacrifice" || awaiting.player !== player) {
      return `${player} is not being asked to sacrifice`;
    }
    const picked = action.permanents;
    return (
      noDuplicates(picked, `${player} chose the same permanent twice`) ??
      exactCount(
        picked,
        awaiting.count,
        (got, want) => `${player} must sacrifice exactly ${want}, chose ${got}`,
      ) ??
      subsetOf(picked, awaiting.eligible, (id) => `${id} is not an eligible sacrifice`)
    );
  },

  apply: (host, action): void => {
    if (action.type !== "sacrifice") return;
    host.applySacrifice(action.player, action.permanents);
  },

  ask: (controller, view, awaiting, player): Action => ({
    type: "sacrifice",
    player,
    permanents: controller.chooseSacrifices(view, awaiting.eligible, awaiting.count),
  }),

  /**
   * Combinations of exactly `count`, cheapest first.
   *
   * `order` ranks most valuable first, so it is **reversed**: given the
   * choice, a bot sacrifices its worst permanent, and when the list is capped
   * the survivors should be the cheap ones. The reverse is load-bearing, not
   * stylistic — dropping it would make every capped sacrifice offer up the
   * bot's best permanents.
   */
  candidates: (legal, player, limit, helpers): Action[] => {
    if (legal.kind !== "sacrifice") return [];
    return combinations([...helpers.order(legal.eligible)].reverse(), legal.count, limit).map(
      (permanents) => ({ type: "sacrifice", player, permanents }),
    );
  },

  randomAnswer: (legal, player, rng): Action => {
    const pool = [...legal.eligible];
    const permanents: ObjectId[] = [];
    for (let i = 0; i < legal.count && pool.length > 0; i += 1) {
      permanents.push(pool.splice(rng.pickIndex(pool.length), 1)[0]);
    }
    return { type: "sacrifice", player, permanents };
  },
});
