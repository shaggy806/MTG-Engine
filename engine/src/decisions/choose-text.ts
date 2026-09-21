/**
 * Changing one creature-type word on a permanent — Artificial Evolution and
 * friends, the engine's single supported slice of layer 3 text-changing.
 *
 * The player names a type the permanent currently has (`fromOptions`) and a
 * type to replace it with (`toOptions`). Both menus are short by design: the
 * full creature-type catalogue would make this a 300-entry picker for a
 * mechanic a handful of cards use, so the choice is drawn from
 * {@link CHANGEABLE_CREATURE_TYPES} instead. Naming a creature type from the
 * whole catalogue is a different decision kind (`choose-creature-type`),
 * which does offer all of them.
 */

import type { Action, LegalAction } from "../actions.js";
import { defineDecision } from "./define.js";
import { subsetOf } from "./shared/picks.js";

/**
 * The creature types Artificial Evolution (layer 3 text-change) offers as the
 * old / new word — the ones the card pool actually cares about, so the choice
 * stays a short menu. "Wall" is deliberately excluded as a *new* type (the
 * card forbids it); that filtering happens in `Game.beginTextChoice`, which
 * raises the decision and so still imports this list.
 */
export const CHANGEABLE_CREATURE_TYPES: readonly string[] = [
  "Goblin", "Elf", "Bear", "Zombie", "Vampire", "Bird",
  "Spirit", "Elemental", "Frog", "Insect", "Angel", "Wall",
];

export const chooseText = defineDecision({
  kind: "choose-text",

  hasSource: true,

  legal: (_ctx, awaiting): LegalAction[] => [
    {
      kind: "choose-text",
      source: awaiting.source,
      target: awaiting.target,
      fromOptions: [...awaiting.fromOptions],
      toOptions: [...awaiting.toOptions],
    },
  ],

  whyCannot: (ctx, action, player): string | null => {
    if (action.type !== "choose-text") {
      return `${player} is not being asked to change any text`;
    }
    const awaiting = ctx.state.awaiting;
    if (awaiting === null || awaiting.kind !== "choose-text" || awaiting.player !== player) {
      return `${player} is not being asked to change any text`;
    }
    return (
      subsetOf(
        [action.from],
        awaiting.fromOptions,
        (word) => `${word} is not a creature type on that permanent`,
      ) ??
      subsetOf(
        [action.to],
        awaiting.toOptions,
        (word) => `${word} is not an allowed new creature type`,
      )
    );
  },

  apply: (host, action): void => {
    if (action.type !== "choose-text") return;
    host.applyTextChoice(action.player, action.from, action.to);
  },

  ask: (controller, view, awaiting, player): Action => {
    const [from, to] = controller.chooseText(view, awaiting.fromOptions, awaiting.toOptions);
    return { type: "choose-text", player, from, to };
  },

  // candidates: deliberately absent — the bots do not search this kind, for
  // the reason `bot/decisions.ts` records for its whole opt-out list: no
  // rollout sees the difference between one renamed creature type and
  // another, so every candidate scores the same and the search only costs
  // time. An empty slot here is a measured finding, not an unfinished TODO.
});
