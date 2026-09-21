/**
 * Discarding from hand — the cleanup step's hand-size trim, a Mind Rot, a
 * cost that says "discard a card".
 *
 * **This kind used to have no arm at all.** It was the implicit fallthrough
 * that both `legalActions`' awaiting block and `answerAwaited` landed on
 * after every other kind had been checked, reading `awaiting.count` off
 * whatever was left. That accident was the engine's only compile-time
 * guarantee that a new `AwaitingDecision` variant had been handled — it broke
 * the build, several hundred lines from the variant, with an error about a
 * missing `count`. `DECISION_ACTIONS` is the chosen canary now, and this is
 * an ordinary module like the rest.
 *
 * `awaiting.fromEffect` is the one field that isn't about the choice: it
 * distinguishes the cleanup-step trim (the turn's own bookkeeping, no card
 * behind it) from a discard an effect caused, which is why this kind's
 * `hasSource` is conditional where every other kind's is a constant.
 */

import type { Action, LegalAction } from "../actions.js";
import { defineDecision } from "./define.js";
import { exactCount, noDuplicates, subsetOf } from "./shared/picks.js";
import { combinations } from "./shared/subsets.js";

export const discard = defineDecision({
  kind: "discard",

  // The one kind where this genuinely varies: the cleanup-step hand-size
  // trim is the turn's own bookkeeping with no card behind it, while a
  // discard an effect caused has one.
  hasSource: (awaiting) => awaiting.fromEffect === true,

  legal: (ctx, awaiting, player): LegalAction[] => [
    {
      kind: "discard",
      count: awaiting.count,
      // The whole hand is offered; unlike most kinds there is no narrower
      // `eligible` list, because any card in hand may be discarded.
      from: [...ctx.state.zones.perPlayer[player].hand],
    },
  ],

  whyCannot: (ctx, action, player): string | null => {
    if (action.type !== "discard") return `${player} is not being asked to discard`;
    const awaiting = ctx.state.awaiting;
    if (awaiting === null || awaiting.kind !== "discard" || awaiting.player !== player) {
      return `${player} is not being asked to discard`;
    }
    const cards = action.cards;
    // Count before duplicates here, unlike `sacrifice`, which checks the
    // other way round. Preserved rather than harmonised: both orders are
    // reachable and the messages are asserted.
    return (
      exactCount(
        cards,
        awaiting.count,
        (got, want) => `${player} must discard exactly ${want} card(s), chose ${got}`,
      ) ??
      noDuplicates(cards, `${player} chose the same card twice to discard`) ??
      subsetOf(
        cards,
        ctx.state.zones.perPlayer[player].hand,
        (id) => `${player} tried to discard ${id}, not in hand`,
      )
    );
  },

  apply: (host, action): void => {
    if (action.type !== "discard") return;
    host.applyDiscard(action.player, action.cards);
  },

  ask: (controller, view, awaiting, player): Action => {
    const hand = view.state.zones.perPlayer[player].hand.map((id) => view.state.objects[id]);
    return { type: "discard", player, cards: controller.chooseDiscards(hand, awaiting.count) };
  },

  /** Combinations of exactly `count`, cheapest first — `order` reversed, for
   * the same reason as `sacrifice`: what you throw away should be your worst
   * card, and a capped list should keep the cheap ones. */
  candidates: (legal, player, limit, helpers): Action[] => {
    if (legal.kind !== "discard") return [];
    return combinations([...helpers.order(legal.from)].reverse(), legal.count, limit).map(
      (cards) => ({ type: "discard", player, cards }),
    );
  },
});
