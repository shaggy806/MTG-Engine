/**
 * A "reveal land" (Port Town, Game Trail, Foreboding Ruins, Fortified
 * Village): "As this land enters, you may reveal a [type] or [type] card from
 * your hand. If you don't, this land enters tapped."
 *
 * Asked before the land moves (`Game.askEnterChoice`, rule 614.12), like a
 * Clone's copy, so it enters already tapped or untapped. The offer is the
 * qualifying cards in hand; `null` — reveal nothing — is always a legal
 * answer, and the only reason to give it is to keep the hand hidden. With no
 * qualifying card the land never asks and just enters tapped. The card
 * revealed is shown to every player (rule 701.20a).
 */

import type { Action, LegalAction } from "../actions.js";
import type { ObjectId } from "../primitives.js";
import { defineDecision } from "./define.js";
import { subsetOf } from "./shared/picks.js";

export const revealForUntapped = defineDecision({
  kind: "reveal-for-untapped",

  // The entering land is the source, and the prompt names it.
  hasSource: true,

  legal: (_ctx, awaiting): LegalAction[] => [
    { kind: "reveal-for-untapped", source: awaiting.source, options: [...awaiting.options] },
  ],

  whyCannot: (ctx, action, player): string | null => {
    const asked = `${player} is not being asked about a reveal land`;
    if (action.type !== "reveal-for-untapped") return asked;
    const awaiting = ctx.state.awaiting;
    if (awaiting === null || awaiting.kind !== "reveal-for-untapped" || awaiting.player !== player) {
      return asked;
    }
    if (action.reveal === null) return null;
    return subsetOf(
      [action.reveal],
      awaiting.options,
      (id) => `${id} is not one of the cards that may be revealed`,
    );
  },

  apply: (host, action): void => {
    if (action.type !== "reveal-for-untapped") return;
    host.applyRevealForUntapped(action.player, action.reveal);
  },

  ask: (controller, view, awaiting, player): Action => ({
    type: "reveal-for-untapped",
    player,
    reveal: controller.revealForUntapped(view, awaiting.source, awaiting.options),
  }),

  // Which card is revealed changes nothing but what the opponents learn, so
  // the search needs only one of each answer: reveal (the first card), or not.
  candidates: (legal, player): Action[] => {
    if (legal.kind !== "reveal-for-untapped") return [];
    const options: (ObjectId | null)[] = [...legal.options.slice(0, 1), null];
    return options.map((reveal) => ({ type: "reveal-for-untapped", player, reveal }));
  },

  // Mostly reveal, so the fuzzer plays on an untapped board.
  randomAnswer: (legal, player, rng): Action => ({
    type: "reveal-for-untapped",
    player,
    reveal: rng.random() < 0.8 ? legal.options[rng.pickIndex(legal.options.length)] : null,
  }),
});
