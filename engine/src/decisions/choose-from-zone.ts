/**
 * Picking cards out of a zone you are being shown — the answer half of every
 * tutor, every "look at the top N", every graveyard recursion and every
 * impulse exile.
 *
 * The widest payload of any decision (the `AwaitingDecision` carries fourteen
 * fields) and one of the narrowest answers: of all that context, the choice
 * itself only needs what may be picked and how many. Everything else —
 * which zone the cards came from, where the picked ones go, where the rest
 * go, whether to shuffle, what to run afterwards — is the *raise* and the
 * *apply*, and stays on `Game`.
 *
 * That asymmetry is why only four fields are projected here. Four different
 * raise sites (`beginZoneChoice`, `beginLibrarySearch`, `impulseExile`,
 * `returnFromGraveyardByEffect`) produce this decision, and
 * `applyChooseFromZone` carries three statement orderings that matter —
 * revealing before moving, shuffling before a `library-top` destination, and
 * a **bare** `prepareForPriority` rather than the guarded one `applyScry`
 * uses. None of that moves.
 */

import type { Action, LegalAction } from "../actions.js";
import { defineDecision } from "./define.js";
import { noDuplicates, subsetOf, withinRange } from "./shared/picks.js";
import { subsetsBetween } from "./shared/subsets.js";

export const chooseFromZone = defineDecision({
  kind: "choose-from-zone",

  hasSource: true,

  legal: (_ctx, awaiting): LegalAction[] => [
    {
      kind: "choose-from-zone",
      // `ids` is everything being shown; `eligible` is the subset that may be
      // picked. A tutor shows a whole library and lets you take one card of a
      // type, so the two genuinely differ.
      ids: [...awaiting.ids],
      eligible: [...awaiting.eligible],
      min: awaiting.min,
      max: awaiting.max,
    },
  ],

  whyCannot: (ctx, action, player): string | null => {
    if (action.type !== "choose-from-zone") {
      return `${player} is not being asked to choose from a zone`;
    }
    const awaiting = ctx.state.awaiting;
    if (
      awaiting === null ||
      awaiting.kind !== "choose-from-zone" ||
      awaiting.player !== player
    ) {
      return `${player} is not being asked to choose from a zone`;
    }
    const chosen = action.chosen;
    return (
      noDuplicates(chosen, `${player} chose the same card twice`) ??
      withinRange(
        chosen,
        awaiting.min,
        awaiting.max,
        (got, min, max) =>
          `${player} must choose between ${min} and ${max} card(s), chose ${got}`,
      ) ??
      subsetOf(
        chosen,
        awaiting.eligible,
        (id) => `${player} chose ${id}, not an eligible candidate`,
      )
    );
  },

  apply: (host, action): void => {
    if (action.type !== "choose-from-zone") return;
    host.applyChooseFromZone(action.player, action.chosen);
  },

  ask: (controller, view, awaiting, player): Action => ({
    type: "choose-from-zone",
    player,
    chosen: controller.chooseFromZone(view, awaiting.eligible, awaiting.min, awaiting.max),
  }),

  /**
   * Every legal-sized subset, smallest first, with the eligible cards ranked
   * best-first before subsetting.
   *
   * The ranking matters more here than anywhere else: a tutor over a
   * sixty-card library has vastly more subsets than the cap allows, so what
   * survives truncation is whatever `order` put at the front. Without it the
   * bot would tutor for the first card in library order.
   */
  candidates: (legal, player, limit, helpers): Action[] => {
    if (legal.kind !== "choose-from-zone") return [];
    return subsetsBetween(helpers.order(legal.eligible), legal.min, legal.max, limit).map(
      (chosen) => ({ type: "choose-from-zone", player, chosen }),
    );
  },
});
