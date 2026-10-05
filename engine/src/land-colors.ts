/**
 * Which colours a bot's mana can't make yet, and which lands would fix that —
 * what a fetch land, a Cultivate or a Farseek should go and find.
 *
 * Both bots used to take lands in library order: v1 the first ones offered,
 * v2 the same once its search scored every land alike (the evaluation counts
 * lands, not their colours), so a three-colour deck cracked its fetches for a
 * third Forest while a blue card sat stuck in hand. `newColorsFirst` orders
 * the lands that make a colour the bot needs and can't yet produce ahead of
 * the rest, for v1's pick and for the front of v2's capped candidate list,
 * where ties fall to v1's answer.
 *
 * "Needs" is the commander's colour identity, or — with no commander — the
 * colours of the mana costs in hand. "Can produce" is read off the printed
 * mana abilities and basic land types of the permanents the bot controls: a
 * coarse reading (an animated or type-changed land reads as printed) that
 * only has to order a handful of lands. Pure over the state; no `bot/` import.
 */

import type { CardRegistry } from "./cards.js";
import type { CardDefinition } from "./cards/define.js";
import { intrinsicManaColors } from "./characteristics.js";
import type { EffectSpec } from "./effects.js";
import { COLORS, parseManaCost } from "./mana.js";
import type { Color } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";

const isColor = (m: string): m is Color => (COLORS as readonly string[]).includes(m);

/** The colours one `add-mana` effect can make, for a player whose commander
 * identity is `identity`. */
function addManaColors(effect: EffectSpec | null | undefined, identity: readonly Color[]): Color[] {
  if (effect === null || effect === undefined) return [];
  if (effect.kind === "sequence") return effect.effects.flatMap((e) => addManaColors(e, identity));
  if (effect.kind !== "add-mana") return [];
  const mana = effect.mana;
  if (typeof mana === "string") {
    if (mana === "any-color" || mana === "chosen") return [...COLORS];
    if (mana === "commander-identity") return [...identity];
    return isColor(mana) ? [mana] : [];
  }
  if ("oneOf" in mana) return mana.oneOf.filter(isColor);
  if ("all" in mana) return mana.all.filter(isColor);
  return [];
}

/** The colours `def`'s printed mana abilities make. */
function printedManaColors(def: CardDefinition, identity: readonly Color[]): Color[] {
  return (def.activated ?? []).flatMap((ability) => addManaColors(ability.effect, identity));
}

/** The colours permanent or card `id` could make mana of. */
function colorsOf(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
  identity: readonly Color[],
): Set<Color> {
  const object = state.objects[id];
  if (object === undefined || !registry.has(object.cardName)) return new Set();
  return new Set([
    ...intrinsicManaColors(state, registry, object),
    ...printedManaColors(registry.get(object.cardName), identity),
  ]);
}

/** The colours `me` needs and has no permanent to make. */
export function missingColors(state: GameState, registry: CardRegistry, me: PlayerId): Set<Color> {
  const identity = state.players[me]?.commanderIdentity ?? [];
  const needed = new Set<Color>(identity);
  if (needed.size === 0) {
    for (const id of state.zones.perPlayer[me]?.hand ?? []) {
      const name = state.objects[id]?.cardName;
      if (name === undefined || !registry.has(name)) continue;
      const cost = parseManaCost(registry.get(name).manaCost);
      for (const c of COLORS) if (cost.colored[c] > 0) needed.add(c);
    }
  }
  for (const id of state.zones.shared.battlefield) {
    if (needed.size === 0) break;
    if (state.objects[id]?.controller !== me) continue;
    for (const c of colorsOf(state, registry, id, identity)) needed.delete(c);
  }
  return needed;
}

/**
 * How much each missing colour is wanted: one, plus a point for each of its
 * mana symbols among the spells in hand and the commanders waiting in the
 * command zone — and a quarter of that when a land in hand already makes it.
 * The Sultai autopsy (seed 73): two colours missing, a fetch took a Swamp
 * with Sunken Hollow in hand and five green spells waiting, and the deck sat
 * six turns with no green source.
 */
function colorWants(
  state: GameState,
  registry: CardRegistry,
  me: PlayerId,
  missing: ReadonlySet<Color>,
  identity: readonly Color[],
): Map<Color, number> {
  const want = new Map<Color, number>([...missing].map((c) => [c, 1]));
  const inHand = new Set<Color>();
  const zones = state.zones.perPlayer[me];
  const waiting = state.zones.shared.command.filter((id) => state.objects[id]?.owner === me);
  for (const id of [...(zones?.hand ?? []), ...waiting]) {
    const name = state.objects[id]?.cardName;
    if (name === undefined || !registry.has(name)) continue;
    const def = registry.get(name);
    if (def.types.includes("land")) {
      for (const c of colorsOf(state, registry, id, identity)) inHand.add(c);
      continue;
    }
    const cost = parseManaCost(def.manaCost);
    for (const c of missing) want.set(c, (want.get(c) ?? 1) + cost.colored[c]);
  }
  for (const c of inHand) if (want.has(c)) want.set(c, (want.get(c) ?? 1) / 4);
  return want;
}

/**
 * `ids` — cards a search or a "look at" may take — best first: the lands that
 * make the most wanted missing colours (`colorWants`), then the ones that make
 * the colours we have the fewest sources of, counting each land as it's taken,
 * so a search for two takes two different basics. Ties keep the order given.
 * Only reorders a choice among lands alone: a tutor that could take anything
 * is left to whatever ranks it.
 *
 * Reported from a live game (2026-10-04): Encroaching Dragonstorm found two
 * Forests for a Temur deck with an Island and a Mountain on offer — Command
 * Tower already made every colour, so nothing was "missing" and library order
 * stood.
 */
export function newColorsFirst(
  state: GameState,
  registry: CardRegistry,
  me: PlayerId,
  ids: readonly ObjectId[],
): ObjectId[] {
  const lands = ids.every((id) => {
    const name = state.objects[id]?.cardName;
    return name !== undefined && registry.has(name) && registry.get(name).types.includes("land");
  });
  if (!lands || ids.length < 2) return [...ids];
  const identity = state.players[me]?.commanderIdentity ?? [];
  const missing = missingColors(state, registry, me);
  const want = missing.size === 0 ? new Map<Color, number>() : colorWants(state, registry, me, missing, identity);
  // What each colour the deck uses is made by now: the permanents we control.
  const useful = new Set<Color>(identity.length > 0 ? identity : COLORS);
  const sources = new Map<Color, number>([...useful].map((c) => [c, 0]));
  for (const id of state.zones.shared.battlefield) {
    if (state.objects[id]?.controller !== me) continue;
    for (const c of colorsOf(state, registry, id, identity)) {
      if (sources.has(c)) sources.set(c, (sources.get(c) ?? 0) + 1);
    }
  }
  const colors = new Map(ids.map((id) => [id, colorsOf(state, registry, id, identity)]));
  const score = (id: ObjectId): number => {
    let missingGain = 0;
    let spread = 0;
    for (const c of colors.get(id) ?? []) {
      missingGain += want.get(c) ?? 0;
      if (sources.has(c)) spread += 1 / (1 + (sources.get(c) ?? 0));
    }
    // A missing colour outranks any spread.
    return missingGain * 100 + spread;
  };
  const left = [...ids];
  const out: ObjectId[] = [];
  while (left.length > 0) {
    let best = 0;
    for (let i = 1; i < left.length; i += 1) if (score(left[i]) > score(left[best])) best = i;
    const [id] = left.splice(best, 1);
    out.push(id);
    for (const c of colors.get(id) ?? []) {
      if (sources.has(c)) sources.set(c, (sources.get(c) ?? 0) + 1);
      want.delete(c);
    }
  }
  return out;
}
