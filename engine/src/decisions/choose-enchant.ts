/**
 * What an Aura enchants when it enters the battlefield other than by
 * resolving as an Aura spell — reanimated, returned from exile, put there
 * from a library or a hand — and the effect doesn't say (rule 303.4f): the
 * player it's entering under chooses a permanent it could legally enchant.
 *
 * The raise stays on `Game`, in `askEnterChoice`, beside a Clone's copy: it's
 * asked before the Aura moves, so it enters attached. Like `choose-copy`, it
 * can begin without pausing — with nothing the Aura could enchant, nothing is
 * asked, and the Aura stays where it was (303.4g).
 */

import type { Action, LegalAction } from "../actions.js";
import { defineDecision } from "./define.js";
import { subsetOf } from "./shared/picks.js";

export const chooseEnchant = defineDecision({
  kind: "choose-enchant",

  // The entering Aura is the source, and the prompt names it.
  hasSource: true,

  legal: (_ctx, awaiting): LegalAction[] => [
    { kind: "choose-enchant", source: awaiting.source, options: [...awaiting.options] },
  ],

  whyCannot: (ctx, action, player): string | null => {
    const asked = `${player} is not being asked what an Aura enchants`;
    if (action.type !== "choose-enchant") return asked;
    const awaiting = ctx.state.awaiting;
    if (awaiting === null || awaiting.kind !== "choose-enchant" || awaiting.player !== player) {
      return asked;
    }
    return subsetOf(
      [action.enchant],
      awaiting.options,
      (id) => `${id} is not one of the permanents that Aura could enchant`,
    );
  },

  apply: (host, action): void => {
    if (action.type !== "choose-enchant") return;
    host.applyEnchantChoice(action.player, action.enchant);
  },

  ask: (controller, view, awaiting, player): Action => ({
    type: "choose-enchant",
    player,
    enchant: controller.chooseEnchant(view, awaiting.source, awaiting.options),
  }),

  /** Every option, capped, in battlefield order: whether an Aura is a boon
   * or a curse isn't something the options say, so the search decides. */
  candidates: (legal, player, limit): Action[] => {
    if (legal.kind !== "choose-enchant") return [];
    return legal.options.slice(0, limit).map((enchant) => ({ type: "choose-enchant", player, enchant }));
  },

  randomAnswer: (legal, player, rng): Action => ({
    type: "choose-enchant",
    player,
    enchant: legal.options[rng.pickIndex(legal.options.length)],
  }),
});
