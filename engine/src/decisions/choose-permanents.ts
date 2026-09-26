/**
 * Choosing permanents as an effect resolves, with no targeting — "untap up to
 * two lands" (Snap, Frantic Search, Peregrine Drake). An instruction that
 * doesn't say "target" is carried out as it applies (rule 608.2c), so the
 * choice is made then, among whatever matches then: nothing is chosen as the
 * spell is cast, a hexproof permanent can be chosen, and nothing chosen can
 * make the spell fizzle.
 *
 * The raise is `Game.beginChoosePermanents`, reached from the
 * `choose-permanents` effect; the answer applies that effect's `then` to each
 * permanent picked. A compacted token stack is one entry that may be named up
 * to its size, as `sacrifice`'s is.
 */

import type { Action, LegalAction } from "../actions.js";
import type { ObjectId } from "../primitives.js";
import type { DecisionReadCtx } from "./contract.js";
import { defineDecision } from "./define.js";
import { subsetOf, withinCopies } from "./shared/picks.js";

/** How many permanents each stack entry stands for, where more than one. */
function stackSizes(ctx: DecisionReadCtx, eligible: readonly ObjectId[]): Record<ObjectId, number> {
  const copies: Record<ObjectId, number> = {};
  for (const id of eligible) {
    const n = ctx.state.objects[id]?.stackCount ?? 1;
    if (n > 1) copies[id] = n;
  }
  return copies;
}

export const choosePermanents = defineDecision({
  kind: "choose-permanents",

  hasSource: true,

  legal: (ctx, awaiting): LegalAction[] => {
    const copies = stackSizes(ctx, awaiting.eligible);
    return [
      {
        kind: "choose-permanents",
        eligible: [...awaiting.eligible],
        min: awaiting.min,
        max: awaiting.max,
        prompt: awaiting.prompt,
        ...(Object.keys(copies).length > 0 ? { copies } : {}),
      },
    ];
  },

  whyCannot: (ctx, action, player): string | null => {
    const asked = `${player} is not being asked to choose permanents`;
    if (action.type !== "choose-permanents") return asked;
    const awaiting = ctx.state.awaiting;
    if (awaiting === null || awaiting.kind !== "choose-permanents" || awaiting.player !== player) {
      return asked;
    }
    const picked = action.permanents;
    if (picked.length < awaiting.min || picked.length > awaiting.max) {
      return awaiting.min === awaiting.max
        ? `${player} must choose exactly ${awaiting.max}, chose ${picked.length}`
        : `${player} must choose from ${awaiting.min} to ${awaiting.max}, chose ${picked.length}`;
    }
    return (
      withinCopies(picked, stackSizes(ctx, awaiting.eligible), (id, limit) =>
        limit === 1
          ? `${player} chose the same permanent twice`
          : `${player} chose ${id} more than the ${limit} it stands for`,
      ) ?? subsetOf(picked, awaiting.eligible, (id) => `${id} can't be chosen`)
    );
  },

  apply: (host, action): void => {
    if (action.type !== "choose-permanents") return;
    host.applyChoosePermanents(action.player, action.permanents);
  },

  ask: (controller, view, awaiting, player): Action => ({
    type: "choose-permanents",
    player,
    permanents: controller.choosePermanents(view, awaiting.eligible, awaiting.min, awaiting.max),
  }),

  /**
   * A few answers rather than every subset: as many of your own as allowed
   * (what "untap up to two lands" nearly always wants), as few as allowed,
   * and as many as allowed from the whole list — so the search can tell
   * whether reaching past your own permanents is ever worth it.
   */
  candidates: (legal, player, _limit, helpers): Action[] => {
    if (legal.kind !== "choose-permanents") return [];
    const mine = legal.eligible.filter((id) => helpers.controllerOf(id) === player);
    const theirs = legal.eligible.filter((id) => helpers.controllerOf(id) !== player);
    const fit = (list: readonly ObjectId[]): ObjectId[] => {
      const out = list.slice(0, legal.max);
      for (const id of [...mine, ...theirs]) {
        if (out.length >= legal.min) break;
        if (!out.includes(id)) out.push(id);
      }
      return out;
    };
    const answers = [fit(mine), fit([]), fit(legal.eligible)];
    const seen = new Set<string>();
    return answers
      .filter((picked) => {
        const key = picked.join(",");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((permanents) => ({ type: "choose-permanents", player, permanents }));
  },

  // A random number of distinct entries within the bounds.
  randomAnswer: (legal, player, rng): Action => {
    const pool = [...legal.eligible];
    const count = legal.min + rng.pickIndex(Math.min(legal.max, pool.length) - legal.min + 1);
    const permanents: ObjectId[] = [];
    while (permanents.length < count && pool.length > 0) {
      permanents.push(pool.splice(rng.pickIndex(pool.length), 1)[0]);
    }
    return { type: "choose-permanents", player, permanents };
  },
});
