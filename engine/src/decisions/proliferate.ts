/**
 * Proliferate (rule 701.27) — choose any number of players and permanents
 * that already have a counter, and give each one more of each kind it has.
 *
 * It is a *choice*, not something done to you: the proliferating player picks
 * the set, and picking nothing is a legal answer. That is why the validator
 * has no length check, and why the bot's candidate list includes the empty
 * set explicitly.
 */

import type { Action, LegalAction } from "../actions.js";
import type { TargetRef } from "../target.js";
import { defineDecision } from "./define.js";

/** A `TargetRef` as a comparable string — proliferate is the one decision
 * whose picks are players *or* objects, so neither id alone is a key. */
const refKey = (t: TargetRef): string =>
  t.kind === "player" ? `p:${t.player}` : `o:${t.object}`;

export const proliferate = defineDecision({
  kind: "proliferate",

  hasSource: true,

  legal: (_ctx, awaiting): LegalAction[] => [
    { kind: "proliferate", eligible: [...awaiting.eligible] },
  ],

  whyCannot: (ctx, action, player): string | null => {
    if (action.type !== "proliferate") return `${player} is not being asked to proliferate`;
    const awaiting = ctx.state.awaiting;
    if (awaiting === null || awaiting.kind !== "proliferate" || awaiting.player !== player) {
      return `${player} is not being asked to proliferate`;
    }
    const eligible = new Set(awaiting.eligible.map(refKey));
    const seen = new Set<string>();
    for (const target of action.chosen) {
      const k = refKey(target);
      if (!eligible.has(k)) return `${k} has no counters to proliferate`;
      if (seen.has(k)) return `${player} chose ${k} twice`;
      seen.add(k);
    }
    // No length check on purpose: zero is a legal answer (rule 701.27a).
    return null;
  },

  apply: (host, action): void => {
    if (action.type !== "proliferate") return;
    host.applyProliferate(action.player, action.chosen);
  },

  ask: (controller, view, awaiting, player): Action => ({
    type: "proliferate",
    player,
    chosen: controller.chooseProliferate(view, awaiting.eligible),
  }),

  /**
   * Three answers, not the 2^n subsets: proliferate is worth searching
   * precisely because *whose* permanent gets the counter matters, and the
   * interesting cut is "mine" vs "everything" vs "nothing". Anything finer is
   * a rollout spent distinguishing two of your own creatures.
   *
   * The three are de-duplicated, because on a board where every eligible
   * permanent is yours "mine" and "everything" are the same answer and
   * scoring it twice is wasted search.
   */
  candidates: (legal, player, _limit, helpers): Action[] => {
    if (legal.kind !== "proliferate") return [];
    const mine = legal.eligible.filter((t) =>
      t.kind === "player" ? t.player === player : helpers.controllerOf(t.object) === player,
    );
    const seen = new Set<string>();
    return [mine, legal.eligible, []]
      .filter((chosen) => {
        const key = chosen.map((t) => (t.kind === "player" ? t.player : t.object)).join(",");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((chosen) => ({ type: "proliferate", player, chosen }));
  },
});
