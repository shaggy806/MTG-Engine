/**
 * Rule 903.9 — a commander's owner may put it into the command zone, and it
 * is the **owner's** choice, made every time rather than configured once. Two
 * rules raise it: 903.9a, a state-based action, once the commander is in a
 * graveyard or exile; and 903.9b, a replacement effect, when it would be put
 * into a hand or library.
 *
 * The answer is a single boolean, which makes this the second-smallest
 * decision in the engine. Almost everything interesting about it is in the
 * raise, which stays on `Game`: the state-based check queues 903.9a offers
 * (`offerArrivedCommanders`), and `moveObject` defers a 903.9b move behind
 * this decision and parks it in `deferredCommanderMove`, with its callers
 * reading `moveObject`'s return so nothing proceeds past a move that hasn't
 * been answered yet. None of that is touched here.
 */

import type { Action, LegalAction } from "../actions.js";
import { defineDecision } from "./define.js";

export const commanderReplacement = defineDecision({
  kind: "commander-replacement",

  // The rules raise this, not a card: a state-based action or the
  // commander's own replacement effect, and there is no spell to name in the
  // prompt.
  hasSource: false,

  legal: (_ctx, awaiting): LegalAction[] => [
    {
      kind: "commander-replacement",
      commander: awaiting.commander,
      // Where it stays (a graveyard, exile) or goes (a hand, a library) if the
      // offer is declined — the client names it rather than just "move it?".
      intendedZone: awaiting.intendedZone,
    },
  ],

  whyCannot: (ctx, action, player): string | null => {
    const asked = `${player} is not being asked about a commander replacement`;
    if (action.type !== "commander-replacement") return asked;
    const awaiting = ctx.state.awaiting;
    if (
      awaiting === null ||
      awaiting.kind !== "commander-replacement" ||
      awaiting.player !== player
    ) {
      return asked;
    }
    // Both answers are always legal: the choice is the whole decision.
    return null;
  },

  apply: (host, action): void => {
    if (action.type !== "commander-replacement") return;
    host.applyCommanderChoice(action.player, action.toCommandZone);
  },

  ask: (controller, view, awaiting, player): Action => ({
    type: "commander-replacement",
    player,
    toCommandZone: controller.commanderReplacement(
      view,
      awaiting.commander,
      awaiting.intendedZone,
    ),
  }),

  // candidates: deliberately **not** searched — keeps v1's answer (the
  // command zone). Carried verbatim from `bot/decisions.ts`, because this is
  // a measured finding and an empty slot reads like an oversight:
  //
  //   The evaluation has no term for the command zone — `features.ts` never
  //   looks at that zone — while `graveyard` is worth 0.05 a card. So letting
  //   the commander die scored a hair *better* than saving it, every time,
  //   and the bot fed its commander to the graveyard on the first removal
  //   spell it saw. A rollout can't rescue that either: the commander is only
  //   worth something once recast, which is past the horizon.
  //
  //   Searching a decision the evaluation cannot price is worse than not
  //   searching it, which is the same reason mulligans and combat damage
  //   order are absent. Revisit if a "commander available to recast" feature
  //   is ever added and fitted.

  // Heavily biased towards the command zone, which is what a real game almost
  // always chooses — but not unanimous, so the graveyard branch stays fuzzed.
  randomAnswer: (_legal, player, rng): Action => ({
    type: "commander-replacement",
    player,
    toCommandZone: rng.random() < 0.85,
  }),
});
