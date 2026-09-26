/**
 * What a Clone-style permanent enters as a copy of (rule 707.9) — asked
 * before it moves, however it's entering (`Game.askEnterChoice`, rule 614.12).
 *
 * `null` is a real answer — "copy nothing" — and leaves the permanent as its
 * own printed self, which for a vanilla Clone means a 0/0 that dies to a
 * state-based action immediately.
 *
 * Worth knowing about the raise, which stays on `Game`: this is the one kind
 * that can *begin without pausing*. `askEnterChoice` records "copy nothing"
 * and carries on when there is nothing on the battlefield to copy, rather
 * than raising a decision with an empty option list — pinned by
 * `clone.test.ts`'s "with no creatures to copy, it never pauses and just
 * dies".
 */

import type { Action, LegalAction } from "../actions.js";
import type { ObjectId } from "../primitives.js";
import { defineDecision } from "./define.js";
import { subsetOf } from "./shared/picks.js";

export const chooseCopy = defineDecision({
  kind: "choose-copy",

  // The entering clone is the source, and the prompt names it.
  hasSource: true,

  legal: (_ctx, awaiting): LegalAction[] => [
    { kind: "choose-copy", source: awaiting.source, options: [...awaiting.options] },
  ],

  whyCannot: (ctx, action, player): string | null => {
    if (action.type !== "choose-copy") return `${player} is not being asked what to copy`;
    const awaiting = ctx.state.awaiting;
    if (awaiting === null || awaiting.kind !== "choose-copy" || awaiting.player !== player) {
      return `${player} is not being asked what to copy`;
    }
    // `null` means "copy nothing", which is always available; only a named
    // permanent has to have been offered.
    if (action.copy === null) return null;
    return subsetOf(
      [action.copy],
      awaiting.options,
      (id) => `${id} is not one of the permanents that may be copied`,
    );
  },

  apply: (host, action): void => {
    if (action.type !== "choose-copy") return;
    host.applyCopyChoice(action.player, action.copy);
  },

  ask: (controller, view, awaiting, player): Action => ({
    type: "choose-copy",
    player,
    copy: controller.chooseCopy(view, awaiting.source, awaiting.options),
  }),

  /**
   * Every option, plus "copy nothing", capped.
   *
   * The cap is applied to the concatenated list **after** appending `null`,
   * which is deliberately preserved rather than tidied: on a board wider than
   * `MAX_DECISION_CANDIDATES` creatures the "copy nothing" candidate is the
   * one that falls off the end. That is the behaviour every recorded
   * `bot:bench` number was measured against, and this branch takes no
   * `order()` re-ranking either, so the options arrive in battlefield order.
   */
  candidates: (legal, player, limit): Action[] => {
    if (legal.kind !== "choose-copy") return [];
    const options: (ObjectId | null)[] = [...legal.options, null];
    return options.slice(0, limit).map((copy) => ({ type: "choose-copy", player, copy }));
  },

  randomAnswer: (legal, player, rng): Action => {
    // Usually copy the biggest thing; sometimes copy nothing. The `&&`
    // short-circuits, so an empty `options` draws **no** random number at all
    // — preserved deliberately, because the draw count is part of the seed
    // trajectory every `play:random` replay depends on.
    const copy =
      legal.options.length > 0 && rng.random() < 0.9
        ? legal.options[rng.pickIndex(legal.options.length)]
        : null;
    return { type: "choose-copy", player, copy };
  },
});
