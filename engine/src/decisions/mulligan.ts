/**
 * The opening-hand phase — the London mulligan, plus the bottoming that pays
 * for it.
 *
 * **One decision kind, two actions.** Every other kind is answered by exactly
 * one `Action` type; this one is answered by `mulligan` while a player is
 * still deciding and by `put-on-bottom` once they have kept, switching on
 * that player's own `hands[player].step`. Both halves live in one
 * `AwaitingDecision` because they are one phase, and a player can be in
 * different halves of it from their opponents.
 *
 * **And it is the one parallel decision.** Every other kind asks
 * `awaiting.player`; this one asks everybody still in `hands` at once, which
 * is why {@link mulligan.mayAct} exists at all — it is the sole override of
 * the registry's default.
 */

import type { Action, LegalAction } from "../actions.js";
import { defineDecision } from "./define.js";
import { exactCount, noDuplicates, subsetOf } from "./shared/picks.js";
import { mulliganCardsOwed } from "./shared/mulligan-math.js";

export const mulligan = defineDecision({
  kind: "mulligan",

  // Before the game proper; no card is behind it.
  hasSource: false,

  /** The parallel phase: anyone still holding an undecided hand may act, not
   * just the `awaiting.player` pointer. The only `mayAct` override in the
   * engine — and it used to be written out identically in three files. */
  mayAct: (awaiting, player) => awaiting.hands[player] !== undefined,

  legal: (ctx, awaiting, player): LegalAction[] => {
    const hand = awaiting.hands[player];
    return hand.step === "decide"
      ? [{ kind: "mulligan", count: hand.taken }]
      : [
          {
            kind: "put-on-bottom",
            count: mulliganCardsOwed(hand.taken, ctx.state.rules.freeFirstMulligan),
            from: [...ctx.state.zones.perPlayer[player].hand],
          },
        ];
  },

  whyCannot: (ctx, action, player): string | null => {
    const awaiting = ctx.state.awaiting;
    const step = awaiting?.kind === "mulligan" ? awaiting.hands[player]?.step : undefined;

    if (action.type === "mulligan") {
      if (awaiting === null || awaiting.kind !== "mulligan" || step !== "decide") {
        return `${player} is not being asked about a mulligan`;
      }
      // Keep or throw back; both are always available while deciding.
      return null;
    }

    if (action.type === "put-on-bottom") {
      if (awaiting === null || awaiting.kind !== "mulligan" || step !== "bottom") {
        return `${player} is not being asked to put cards on the bottom of their library`;
      }
      const cards = action.cards;
      const owed = mulliganCardsOwed(
        awaiting.hands[player].taken,
        ctx.state.rules.freeFirstMulligan,
      );
      return (
        exactCount(
          cards,
          owed,
          (got, want) =>
            `${player} must put exactly ${want} card(s) on the bottom, chose ${got}`,
        ) ??
        noDuplicates(cards, `${player} chose the same card twice`) ??
        subsetOf(
          cards,
          ctx.state.zones.perPlayer[player].hand,
          (id) => `${player} tried to put ${id} on the bottom, not in hand`,
        )
      );
    }

    return `${player} is not being asked about a mulligan`;
  },

  apply: (host, action): void => {
    if (action.type === "mulligan") host.applyMulligan(action.player, action.keep);
    else if (action.type === "put-on-bottom") {
      host.applyPutOnBottom(action.player, action.cards);
    }
  },

  ask: (controller, view, awaiting, player): Action => {
    const hand = awaiting.hands[player];
    if (hand.step === "bottom") {
      const held = view.state.zones.perPlayer[player].hand.map((id) => view.state.objects[id]);
      return {
        type: "put-on-bottom",
        player,
        cards: controller.chooseBottomOfLibrary(
          held,
          mulliganCardsOwed(hand.taken, view.state.rules.freeFirstMulligan),
        ),
      };
    }
    return { type: "mulligan", player, keep: !controller.mulligan(view, hand.taken) };
  },

  // candidates: deliberately absent — the searching bots do not roll out
  // mulligan decisions. A rollout to the end of a turn means nothing before
  // the game has started, so the opening hand is scored by `bot/mulligan.ts`
  // instead, which all three bots share through v1.
});
