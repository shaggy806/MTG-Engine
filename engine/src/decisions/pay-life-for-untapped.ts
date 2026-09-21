/**
 * A shock land's "you may pay N life" (rule 614.13) — Steam Vents and friends
 * enter tapped unless their controller pays.
 *
 * **The one kind with no `begin*` method.** Every other decision is raised by
 * a `Game.beginX`; this one's raise is inlined in `moveObject`, inside the
 * enters-battlefield replacement that made the land tapped in the first place,
 * behind an `&& this.state.awaiting === null` guard that simply drops the
 * offer when another decision is already pending. That is worth knowing before
 * going looking: a search for the raise by naming convention will not find it,
 * and the guard means the choice is genuinely skippable rather than queued.
 *
 * The answer half is as small as a decision gets — the offer is two fields
 * echoed back, and the only thing to validate is that the player was asked.
 */

import type { Action, LegalAction } from "../actions.js";
import { defineDecision } from "./define.js";

export const payLifeForUntapped = defineDecision({
  kind: "pay-life-for-untapped",

  // The land that entered is the source, and the prompt names it.
  hasSource: true,

  legal: (_ctx, awaiting): LegalAction[] => [
    { kind: "pay-life-for-untapped", source: awaiting.source, life: awaiting.life },
  ],

  whyCannot: (ctx, action, player): string | null => {
    const asked = `${player} is not being asked about a shock land`;
    if (action.type !== "pay-life-for-untapped") return asked;
    const awaiting = ctx.state.awaiting;
    if (
      awaiting === null ||
      awaiting.kind !== "pay-life-for-untapped" ||
      awaiting.player !== player
    ) {
      return asked;
    }
    // Nothing else to check: both answers are always legal. Whether the land
    // is still on the battlefield, and whether the life can be afforded, are
    // decided when the answer is applied — the land can leave between the
    // offer and the reply.
    return null;
  },

  apply: (host, action): void => {
    if (action.type !== "pay-life-for-untapped") return;
    host.applyPayLifeForUntapped(action.player, action.pay);
  },

  ask: (controller, view, awaiting, player): Action => ({
    type: "pay-life-for-untapped",
    player,
    pay: controller.payLifeForUntapped(view, awaiting.source, awaiting.life),
  }),

  // Both answers, always — a binary choice needs no cap and no ranking, which
  // makes this the only searched kind that ignores `limit`.
  candidates: (legal, player): Action[] => {
    if (legal.kind !== "pay-life-for-untapped") return [];
    return [true, false].map((pay) => ({ type: "pay-life-for-untapped", player, pay }));
  },

  // Biased towards paying, so the fuzzer mostly plays on an untapped board
  // rather than stalling itself out on shocklands.
  randomAnswer: (_legal, player, rng): Action => ({
    type: "pay-life-for-untapped",
    player,
    pay: rng.random() < 0.7,
  }),
});
