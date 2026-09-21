/**
 * Scry and surveil (rules 701.17 and 701.42) — look at the top N of your
 * library and choose which to move away, to the bottom or to the graveyard.
 *
 * One `AwaitingDecision` covers both, distinguished by `awaiting.mode`: the
 * choice a player makes is identical, and only `Game.applyScry` cares which
 * zone the cards leave for.
 *
 * The first kind migrated onto the registry, chosen because it exercises
 * every member of the contract while being small enough to read in one sitting.
 */

import type { Action, LegalAction } from "../actions.js";
import type { ObjectId } from "../primitives.js";
import { defineDecision } from "./define.js";
import { noDuplicates, subsetOf } from "./shared/picks.js";
import { subsetsBetween } from "./shared/subsets.js";

/** Scry/surveil looks at most this many cards exhaustively (2^n subsets). */
const MAX_SCRY_EXHAUSTIVE = 5;

export const scry = defineDecision({
  kind: "scry",

  // A scry always comes from the card or ability that asked for it.
  hasSource: true,

  legal: (_ctx, awaiting): LegalAction[] => [
    { kind: "scry", mode: awaiting.mode, cards: [...awaiting.cards] },
  ],

  whyCannot: (ctx, action, player): string | null => {
    if (action.type !== "scry") return `${player} is not being asked to scry`;
    const awaiting = ctx.state.awaiting;
    if (awaiting === null || awaiting.kind !== "scry" || awaiting.player !== player) {
      return `${player} is not being asked to scry`;
    }
    const away = action.away;
    return (
      noDuplicates(away, `${player} chose the same card twice`) ??
      subsetOf(away, awaiting.cards, (id) => `${id} was not among the cards looked at`)
    );
  },

  apply: (host, action): void => {
    if (action.type !== "scry") return;
    host.applyScry(action.player, action.away);
  },

  ask: (controller, view, awaiting, player): Action => ({
    type: "scry",
    player,
    away: controller.chooseScry(view, awaiting.cards, awaiting.mode),
  }),

  candidates: (legal, player, limit): Action[] => {
    if (legal.kind !== "scry") return [];
    const cards = legal.cards;
    // Past a handful of cards the 2^n subsets stop being worth a rollout
    // each, so fall back to the three that actually differ in kind: keep
    // everything, bottom everything, or bottom exactly one.
    const subsets: ObjectId[][] =
      cards.length <= MAX_SCRY_EXHAUSTIVE
        ? subsetsBetween(cards, 0, cards.length, limit)
        : [[], [...cards], ...cards.map((card) => [card])];
    return subsets.map((away) => ({ type: "scry", player, away }));
  },

  randomAnswer: (legal, player, rng): Action => ({
    type: "scry",
    player,
    away: legal.cards.filter(() => rng.random() < 0.5),
  }),
});
