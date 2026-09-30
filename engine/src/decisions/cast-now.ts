/**
 * "You may cast [a card]" while a spell or ability resolves — Chandra,
 * Acolyte of Flame's −2 ("You may cast target instant or sorcery card with
 * mana value 3 or less from your graveyard"), Baral's Expertise ("you may
 * cast a spell with mana value 4 or less from your hand without paying its
 * mana cost") — raised by the `cast-now` effect.
 *
 * The spell is cast by the ordinary rules (601.2): modes, X, kicker, targets
 * and costs, everything a `cast-spell` from priority carries, only with
 * timing ignored (608.2g). So the offer *is* the `cast-spell` offers
 * (`via: "effect"`) of every card on offer, worked out as the decision was
 * raised, and the answer carries one of them built into a `cast-spell`
 * action — or `null`, since the card only says "may". `Game.applyCastNow`
 * checks it with `whyCannotCastSpell` (which holds it to the offer's terms:
 * free, and a spell its filter matches) and casts it; the resolution that
 * asked picks up after.
 */

import type { Action, LegalAction } from "../actions.js";
import type { PlayerId } from "../primitives.js";
import type { AwaitingDecision } from "../state.js";
import { defineDecision } from "./define.js";
import { randomCast } from "./shared/random-cast.js";

export const castNow = defineDecision({
  kind: "cast-now",

  hasSource: true,

  legal: (_ctx, awaiting): LegalAction[] => [offerOf(awaiting)],

  whyCannot: (ctx, action, player: PlayerId): string | null => {
    const awaiting = ctx.state.awaiting;
    if (action.type !== "cast-now" || awaiting === null || awaiting.kind !== "cast-now" || awaiting.player !== player) {
      return `${player} is not being asked to cast a card`;
    }
    if (action.cast === null) return null;
    if (action.cast.player !== player || !awaiting.cards.includes(action.cast.card) || action.cast.via !== "effect") {
      return "that isn't a cast of a card on offer";
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
    cast: controller.chooseCastNow(view, offerOf(awaiting)),
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

/** The decision as its player is offered it. */
function offerOf(awaiting: Extract<AwaitingDecision, { kind: "cast-now" }>): Extract<LegalAction, { kind: "cast-now" }> {
  return {
    kind: "cast-now",
    source: awaiting.source,
    cards: [...awaiting.cards],
    ...(awaiting.looked !== undefined ? { looked: [...awaiting.looked] } : {}),
    free: awaiting.free,
    casts: [...awaiting.offers],
  };
}
