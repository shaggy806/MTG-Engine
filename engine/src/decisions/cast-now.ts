/**
 * "You may cast that card" while a spell or ability resolves — Chandra,
 * Acolyte of Flame's −2 ("You may cast target instant or sorcery card with
 * mana value 3 or less from your graveyard"), raised by the `cast-now`
 * effect.
 *
 * The spell is cast by the ordinary rules (601.2): modes, X, kicker, targets
 * and costs, everything a `cast-spell` from priority carries, only with
 * timing ignored (608.2g). So the offer *is* the card's `cast-spell` offers
 * (`via: "effect"`), worked out as the decision was raised, and the answer
 * carries one of them built into a `cast-spell` action — or `null`, since
 * the card only says "may". `Game.applyCastNow` checks it with
 * `whyCannotCastSpell` and casts it; the resolution that asked picks up
 * after.
 */

import type { Action, LegalAction } from "../actions.js";
import type { PlayerId } from "../primitives.js";
import { defineDecision } from "./define.js";
import { randomCast } from "./shared/random-cast.js";

export const castNow = defineDecision({
  kind: "cast-now",

  hasSource: true,

  legal: (_ctx, awaiting): LegalAction[] => [
    { kind: "cast-now", card: awaiting.card, cardName: awaiting.cardName, casts: [...awaiting.offers] },
  ],

  whyCannot: (ctx, action, player: PlayerId): string | null => {
    const awaiting = ctx.state.awaiting;
    if (action.type !== "cast-now" || awaiting === null || awaiting.kind !== "cast-now" || awaiting.player !== player) {
      return `${player} is not being asked to cast a card`;
    }
    if (action.cast === null) return null;
    if (action.cast.player !== player || action.cast.card !== awaiting.card || action.cast.via !== "effect") {
      return `that isn't a cast of ${awaiting.cardName}`;
    }
    return ctx.whyCannotCastNow(action.cast);
  },

  apply: (host, action): void => {
    if (action.type !== "cast-now") return;
    host.applyCastNow(action.player, action.cast);
  },

  ask: (controller, view, awaiting, player): Action => ({
    type: "cast-now",
    player,
    cast: controller.chooseCastNow(view, {
      kind: "cast-now",
      card: awaiting.card,
      cardName: awaiting.cardName,
      casts: awaiting.offers,
    }),
  }),

  /** Decline, or one of the ways to cast it, uniformly — built at random. */
  randomAnswer: (legal, player, rng): Action => {
    const pick = rng.pickIndex(legal.casts.length + 1);
    return { type: "cast-now", player, cast: pick === 0 ? null : randomCast(legal.casts[pick - 1], player, rng) };
  },

  // candidates: absent for now. A cast needs the whole of the bots' cast
  // building (modes, X, targets — `bot/candidates.ts`), which a decision
  // module can't import without a cycle; the searching bot falls back to
  // v1's answer (`chooseCastNow`), as for the other kinds without one.
});
