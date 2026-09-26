/**
 * The legend rule (rule 704.5j): a player who controls two or more legendary
 * permanents with the same name chooses one of them to keep, and the rest are
 * put into their owners' graveyards.
 *
 * The raise stays on `Game`: the state-based check asks before anything moves
 * — one group at a time, in APNAP order of the players who control them — and
 * performs every move it found, these among them, once all its choices are
 * made, so they happen at once (rule 704.3). The kept permanents wait in
 * `GameState.legendRuleKeeps` until then.
 */

import type { Action, LegalAction } from "../actions.js";
import { defineDecision } from "./define.js";

export const legendRule = defineDecision({
  kind: "legend-rule",

  // The rules raise this — a state-based action — not a card.
  hasSource: false,

  legal: (_ctx, awaiting): LegalAction[] => [
    { kind: "legend-rule", name: awaiting.name, options: [...awaiting.options] },
  ],

  whyCannot: (ctx, action, player): string | null => {
    const asked = `${player} is not being asked which legendary permanent to keep`;
    if (action.type !== "legend-rule") return asked;
    const awaiting = ctx.state.awaiting;
    if (awaiting === null || awaiting.kind !== "legend-rule" || awaiting.player !== player) {
      return asked;
    }
    return awaiting.options.includes(action.keep)
      ? null
      : `${action.keep} is not one of the ${awaiting.name} permanents to choose between`;
  },

  apply: (host, action): void => {
    if (action.type !== "legend-rule") return;
    host.applyLegendRuleChoice(action.player, action.keep);
  },

  ask: (controller, view, awaiting, player): Action => ({
    type: "legend-rule",
    player,
    keep: controller.chooseLegendToKeep(view, awaiting.name, awaiting.options),
  }),

  /** Keeping each one: the search scores what's left either way (a copy
   * with counters, an untapped one, one that isn't summoning-sick). */
  candidates: (legal, player, limit): Action[] => {
    if (legal.kind !== "legend-rule") return [];
    return legal.options.slice(0, limit).map((keep) => ({ type: "legend-rule", player, keep }));
  },

  randomAnswer: (legal, player, rng): Action => ({
    type: "legend-rule",
    player,
    keep: legal.options[rng.pickIndex(legal.options.length)],
  }),
});
