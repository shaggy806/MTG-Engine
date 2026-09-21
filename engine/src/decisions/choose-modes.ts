/**
 * Choosing a modal spell or ability's modes (rule 700.2) — "choose one —",
 * "choose two", "choose one or both", Charms and Commands.
 *
 * Only the *non-targeted* modal path comes through here. A modal spell whose
 * modes take targets is declared with `CardDefinition.castModal` and resolved
 * at cast time instead, because the targets have to be chosen along with the
 * modes rather than after them.
 *
 * Some modes carry a cost with `{X}` in it ("you may pay {X}{R}"), which is
 * why the offer can include an `xCost` ceiling — the one field here the
 * module cannot compute for itself.
 */

import type { Action, LegalAction } from "../actions.js";
import { parseManaCost } from "../mana.js";
import { defineDecision } from "./define.js";
import { noDuplicates, withinRange } from "./shared/picks.js";
import { subsetsBetween } from "./shared/subsets.js";

export const chooseModes = defineDecision({
  kind: "choose-modes",

  hasSource: true,

  legal: (ctx, awaiting): LegalAction[] => [
    {
      kind: "choose-modes",
      source: awaiting.source,
      minModes: awaiting.minModes,
      maxModes: awaiting.maxModes,
      modeTexts: awaiting.modes.map((m) => m.text),
      // "You may pay {X}{R}" — tell the driver how large X may be.
      ...(awaiting.cost !== undefined && parseManaCost(awaiting.cost).x > 0
        ? { xCost: { maxX: ctx.maxAffordableAbilityX(awaiting.player, awaiting.cost) } }
        : {}),
    },
  ],

  whyCannot: (ctx, action, player): string | null => {
    if (action.type !== "choose-modes") return `${player} is not being asked to choose modes`;
    const awaiting = ctx.state.awaiting;
    if (awaiting === null || awaiting.kind !== "choose-modes" || awaiting.player !== player) {
      return `${player} is not being asked to choose modes`;
    }
    const chosen = action.modes;
    const duplicate = noDuplicates(chosen, `${player} chose the same mode twice`);
    if (duplicate !== null) return duplicate;
    const count = withinRange(
      chosen,
      awaiting.minModes,
      awaiting.maxModes,
      (got, min, max) =>
        `${player} must choose between ${min} and ${max} mode(s), chose ${got}`,
    );
    if (count !== null) return count;
    for (const i of chosen) {
      if (i < 0 || i >= awaiting.modes.length || !Number.isInteger(i)) {
        return `${i} is not a valid mode index`;
      }
    }
    return null;
  },

  apply: (host, action): void => {
    if (action.type !== "choose-modes") return;
    host.applyModesChoice(action.player, action.modes, action.xValue);
  },

  ask: (controller, view, awaiting, player): Action => ({
    type: "choose-modes",
    player,
    modes: controller.chooseModes(
      view,
      awaiting.minModes,
      awaiting.maxModes,
      awaiting.modes.map((m) => m.text),
    ),
  }),

  /**
   * Every legal combination of modes, smallest first, crossed with the two X
   * values worth trying.
   *
   * Only the extremes of X: paying the most affordable and paying nothing.
   * The interesting question is whether to sink mana into the mode at all,
   * and a rollout per intermediate value buys almost nothing for a
   * multiplicative cost in candidates.
   */
  candidates: (legal, player, limit): Action[] => {
    if (legal.kind !== "choose-modes") return [];
    const indices = legal.modeTexts.map((_, i) => i);
    const xValues = legal.xCost === undefined ? [undefined] : [legal.xCost.maxX, 0];
    return subsetsBetween(indices, legal.minModes, legal.maxModes, limit).flatMap((modes) =>
      xValues.map(
        (xValue): Action => ({
          type: "choose-modes",
          player,
          modes,
          ...(xValue !== undefined ? { xValue } : {}),
        }),
      ),
    );
  },

  randomAnswer: (legal, player, rng): Action => {
    const count =
      legal.minModes + Math.floor(rng.random() * (legal.maxModes - legal.minModes + 1));
    const pool = legal.modeTexts.map((_text, i) => i);
    const modes: number[] = [];
    for (let i = 0; i < count && pool.length > 0; i += 1) {
      modes.push(pool.splice(rng.pickIndex(pool.length), 1)[0]);
    }
    return { type: "choose-modes", player, modes };
  },
});
