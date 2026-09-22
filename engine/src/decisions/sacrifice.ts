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
import type { DecisionReadCtx } from "./contract.js";
import { defineDecision } from "./define.js";
import { exactCount, subsetOf, withinCopies } from "./shared/picks.js";
import { combinations } from "./shared/subsets.js";

/**
 * How many permanents each eligible entry stands for, for the entries that
 * stand for more than one — a compacted token stack (see CLAUDE.md, "Token
 * stacking"). Empty on any board without one, which is nearly all of them.
 */
function stackSizes(
  ctx: DecisionReadCtx,
  eligible: readonly ObjectId[],
): Record<ObjectId, number> {
  const copies: Record<ObjectId, number> = {};
  for (const id of eligible) {
    const n = ctx.state.objects[id]?.stackCount ?? 1;
    if (n > 1) copies[id] = n;
  }
  return copies;
}

/** The eligible entries expanded one per permanent they stand for, capped at
 * `count` repeats since no answer ever needs more. This is the list an answer
 * is really chosen from. */
function expand(eligible: readonly ObjectId[], copies: Readonly<Record<ObjectId, number>>, count: number): ObjectId[] {
  const pool: ObjectId[] = [];
  for (const id of eligible) {
    for (let i = 0; i < Math.min(copies[id] ?? 1, count); i += 1) pool.push(id);
  }
  return pool;
}

export const sacrifice = defineDecision({
  kind: "sacrifice",

  hasSource: true,

  legal: (ctx, awaiting): LegalAction[] => {
    // A compacted token stack is one eligible entry standing for every token
    // in it. Say how many, so an answer may name it that many times: without
    // this, "sacrifice three" against nine Goblins in one stack offered one
    // entry, no answer of three distinct ids existed, and the game stalled.
    const copies = stackSizes(ctx, awaiting.eligible);
    const entries = Object.keys(copies).length;
    return [
      {
        kind: "sacrifice",
        count: awaiting.count,
        eligible: [...awaiting.eligible],
        ...(entries > 0 ? { copies } : {}),
      },
    ];
  },

  whyCannot: (ctx, action, player): string | null => {
    if (action.type !== "sacrifice") return `${player} is not being asked to sacrifice`;
    const awaiting = ctx.state.awaiting;
    if (awaiting === null || awaiting.kind !== "sacrifice" || awaiting.player !== player) {
      return `${player} is not being asked to sacrifice`;
    }
    const picked = action.permanents;
    return (
      withinCopies(
        picked,
        stackSizes(ctx, awaiting.eligible),
        (id, limit) =>
          limit === 1
            ? `${player} chose the same permanent twice`
            : `${player} chose ${id} more than the ${limit} it stands for`,
      ) ??
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
    // `order` ranks the distinct entries; a stack's repeats then sit together
    // in the expanded pool, so the combinations stay cheapest-first.
    const ranked = [...helpers.order(legal.eligible)].reverse();
    const pool = expand(ranked, legal.copies ?? {}, legal.count);
    const seen = new Set<string>();
    const out: Action[] = [];
    for (const permanents of combinations(pool, legal.count, limit)) {
      // Two members of one stack are interchangeable, so combinations over the
      // expanded pool repeat themselves; key on the multiset, not the list.
      const key = [...permanents].sort().join(",");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ type: "sacrifice", player, permanents });
    }
    return out;
  },

  randomAnswer: (legal, player, rng): Action => {
    const pool = expand(legal.eligible, legal.copies ?? {}, legal.count);
    const permanents: ObjectId[] = [];
    for (let i = 0; i < legal.count && pool.length > 0; i += 1) {
      permanents.push(pool.splice(rng.pickIndex(pool.length), 1)[0]);
    }
    return { type: "sacrifice", player, permanents };
  },
});
