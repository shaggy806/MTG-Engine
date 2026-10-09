/**
 * "Add N mana in any combination of …" (rule 608.2d — the choice is made as
 * the mana is added): how many of each colour, as one decision.
 *
 * `effects.ts`' `addManaChoice` lists the splits as modes while there are at
 * most 35 of them; past that (four units over five colours already) it raises
 * this. Before it, each unit's colour was its own modes choice, so Klauth,
 * Unrivaled Ancient's attack with fifty power asked fifty times (a live
 * report, 2026-10-08).
 *
 * No `candidates`: the evaluation doesn't read the pool's colours, so the
 * search could only tie them; v2 takes v1's answer (`chooseManaSplit`, the
 * colours the hand needs).
 */

import type { Action, LegalAction } from "../actions.js";
import type { ManaType } from "../mana.js";
import { defineDecision } from "./define.js";

/** `counts` as a full table over `colors` — every colour present, a missing
 * one 0. */
export function splitOver(
  colors: readonly ManaType[],
  counts: Readonly<Partial<Record<ManaType, number>>>,
): Record<ManaType, number> {
  const out = {} as Record<ManaType, number>;
  for (const color of colors) out[color] = counts[color] ?? 0;
  return out;
}

export const splitMana = defineDecision({
  kind: "split-mana",

  // The mana comes from the spell or ability adding it.
  hasSource: true,

  legal: (_ctx, awaiting): LegalAction[] => [
    { kind: "split-mana", colors: [...awaiting.colors], amount: awaiting.amount },
  ],

  whyCannot: (ctx, action, player): string | null => {
    if (action.type !== "split-mana") return `${player} is not being asked to split mana`;
    const awaiting = ctx.state.awaiting;
    if (awaiting === null || awaiting.kind !== "split-mana" || awaiting.player !== player) {
      return `${player} is not being asked to split mana`;
    }
    let total = 0;
    for (const [color, count] of Object.entries(action.counts)) {
      if (count === undefined || count === 0) continue;
      if (!awaiting.colors.includes(color as ManaType)) return `{${color}} is not one of the colours offered`;
      if (!Number.isInteger(count) || count < 0) return `${count} {${color}} is not a whole number of mana`;
      total += count;
    }
    return total === awaiting.amount ? null : `the split adds ${total} mana, not ${awaiting.amount}`;
  },

  apply: (host, action): void => {
    if (action.type !== "split-mana") return;
    host.applyManaSplit(action.player, action.counts);
  },

  ask: (controller, view, awaiting, player): Action => ({
    type: "split-mana",
    player,
    counts: controller.chooseManaSplit(view, awaiting.colors, awaiting.amount),
  }),

  randomAnswer: (legal, player, rng): Action => {
    if (legal.kind !== "split-mana") throw new Error("split-mana offered a different decision");
    const counts: Partial<Record<ManaType, number>> = {};
    for (let i = 0; i < legal.amount; i += 1) {
      const color = legal.colors[Math.floor(rng.random() * legal.colors.length)] ?? legal.colors[0];
      counts[color] = (counts[color] ?? 0) + 1;
    }
    return { type: "split-mana", player, counts };
  },
});
