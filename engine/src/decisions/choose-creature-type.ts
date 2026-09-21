/**
 * Naming a creature type — Crippling Fear's "choose a creature type", Urza's
 * Incubator's on-enter choice, and anything else that asks for one word out
 * of rule 205.3m's catalogue.
 *
 * Two shapes behind one kind, told apart by `awaiting.catalog`. A short fixed
 * list (a card that offers three types) is a row of buttons; a `catalog`
 * choice is all ~300 types, which is a search box — and unusable without a
 * head start, which is what {@link suggestedCreatureTypes} is for.
 *
 * Distinct from `choose-text`, which swaps one creature-type *word* on a
 * permanent and deliberately offers a short menu instead of the catalogue.
 */

import type { Action, LegalAction } from "../actions.js";
import type { CardRegistry } from "../cards.js";
import { computeCharacteristics } from "../characteristics.js";
import { CREATURE_TYPES } from "../creature-types.js";
import type { PlayerId } from "../primitives.js";
import { printedCardName } from "../state.js";
import type { GameState } from "../state.js";
import { defineDecision } from "./define.js";
import { subsetOf } from "./shared/picks.js";

const CREATURE_TYPE_SET: ReadonlySet<string> = new Set(CREATURE_TYPES);

/** How many types a catalog choice suggests up front. */
const SUGGESTED_CREATURE_TYPES = 8;

/**
 * The creature types most represented among `player`'s own cards and the
 * whole battlefield, most common first (ties alphabetical). What a catalog
 * choice suggests up front — see `LegalAction`'s `suggested`.
 *
 * Counts each card once per creature type it has. Off the battlefield that's
 * its printed types; on it, the computed ones, so an animated or type-changed
 * permanent counts as what it currently is.
 *
 * Computed here rather than stored on the `AwaitingDecision` because it reads
 * the chooser's own library, which only the engine may look at — putting it
 * in state would put it in everyone's view.
 */
export function suggestedCreatureTypes(
  state: Readonly<GameState>,
  registry: CardRegistry,
  player: PlayerId,
): string[] {
  const counts = new Map<string, number>();
  const tally = (types: readonly string[]): void => {
    for (const t of types) {
      if (CREATURE_TYPE_SET.has(t)) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  };
  const own = state.zones.perPlayer[player];
  for (const id of [...own.hand, ...own.library, ...own.graveyard]) {
    const def = registry.get(printedCardName(state.objects[id]));
    if (def.types.includes("creature")) tally(def.subtypes);
  }
  for (const id of state.zones.shared.command) {
    const object = state.objects[id];
    if (object.owner !== player) continue;
    const def = registry.get(printedCardName(object));
    if (def.types.includes("creature")) tally(def.subtypes);
  }
  for (const id of state.zones.shared.battlefield) {
    const c = computeCharacteristics(state, registry, id);
    if (c.types.includes("creature")) tally(c.subtypes);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, SUGGESTED_CREATURE_TYPES)
    .map(([t]) => t);
}

export const chooseCreatureType = defineDecision({
  kind: "choose-creature-type",

  hasSource: true,

  legal: (ctx, awaiting, player): LegalAction[] => [
    {
      kind: "choose-creature-type",
      source: awaiting.source,
      options: [...awaiting.options],
      catalog: awaiting.catalog,
      // Only a catalog choice needs suggestions; a short fixed list is
      // already its own menu.
      suggested: awaiting.catalog
        ? suggestedCreatureTypes(ctx.state, ctx.registry, player)
        : [],
    },
  ],

  whyCannot: (ctx, action, player): string | null => {
    if (action.type !== "choose-creature-type") {
      return `${player} is not being asked to choose a creature type`;
    }
    const awaiting = ctx.state.awaiting;
    if (
      awaiting === null ||
      awaiting.kind !== "choose-creature-type" ||
      awaiting.player !== player
    ) {
      return `${player} is not being asked to choose a creature type`;
    }
    return subsetOf(
      [action.creatureType],
      awaiting.options,
      (type) => `${type} is not one of the offered creature types`,
    );
  },

  apply: (host, action): void => {
    if (action.type !== "choose-creature-type") return;
    host.applyCreatureTypeChoice(action.player, action.creatureType);
  },

  ask: (controller, view, awaiting, player): Action => {
    // The suggestions were computed into the offer, so read them back off it
    // rather than recomputing — a controller can only see its own view, and
    // the engine already did the library scan that produced them.
    const offered = view
      .legalActions()
      .find(
        (a): a is Extract<LegalAction, { kind: "choose-creature-type" }> =>
          a.kind === "choose-creature-type",
      );
    return {
      type: "choose-creature-type",
      player,
      creatureType: controller.chooseCreatureType(
        view,
        awaiting.source,
        awaiting.options,
        offered?.suggested ?? [],
      ),
    };
  },

  // candidates: deliberately absent — no rollout sees the difference between
  // one named creature type and another, so every candidate scores the same
  // and searching only costs time. Same measured opt-out as `choose-text`.

  randomAnswer: (legal, player, rng): Action => {
    // Mostly a suggested type, so a choice keyed to it (Urza's Incubator's
    // cost reduction, Distant Melody's draw) actually gets exercised — out of
    // 350 types a uniform pick almost never names one that matters. Still
    // sometimes anything at all, to keep that path fuzzed. As in
    // `choose-copy`, the `&&` short-circuits and no suggestions means no
    // random draw here; that call count is load-bearing.
    const pool =
      legal.suggested.length > 0 && rng.random() < 0.8 ? legal.suggested : legal.options;
    const creatureType = pool[rng.pickIndex(pool.length)];
    return { type: "choose-creature-type", player, creatureType };
  },
});
