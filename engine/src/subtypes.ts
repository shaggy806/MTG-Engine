/**
 * Subtype lists, and the two entries in one that stand for **every** type of a
 * kind: {@link EVERY_CREATURE_TYPE} and {@link EVERY_LAND_TYPE}.
 *
 * Changeling (rule 702.73a) is "this object is every creature type", and a
 * card can make a land "every land type" (Omo, Queen of Vesuva). Spelling
 * that out as ~300 creature types in every subtype list, snapshot and mana
 * unit would work, but it would also reach the client's type line and every
 * menu that lists a permanent's subtypes. So a subtype list carries one marker
 * instead, and everything that asks "is it a Goblin?" asks through
 * {@link hasSubtype}, which knows what the marker means. A marker is a string
 * no real subtype can be, so a plain `includes` never mistakes it for one — it
 * just can't see what it stands for, which is why nothing that reads a
 * permanent's subtypes may use one.
 *
 * Where a marker comes from: changeling puts {@link EVERY_CREATURE_TYPE} into a
 * creature's subtypes as the first thing layer 4 does (rule 613.3 — a
 * characteristic-defining ability applies before other effects in its layer),
 * in every zone (rule 604.3); and any type-changing effect can add either one
 * as an ordinary `addSubtypes` entry ("is every creature type", "is every land
 * type in addition to its other types"). A later effect that sets a creature's
 * subtypes replaces the marker like any other subtype (Turn to Frog on a
 * changeling makes it just a Frog — Mistform Ultimus's ruling).
 */

import { CREATURE_TYPES } from "./creature-types.js";

/** "Is every creature type" (rule 702.73a, changeling) in a subtype list. */
export const EVERY_CREATURE_TYPE = "(every creature type)";

/** "Is every land type" in a subtype list. Only a land can have land types
 * (rule 205.3d), so only an effect that reaches lands should add it. */
export const EVERY_LAND_TYPE = "(every land type)";

/** The land types (rule 205.3i). Five of them are the basic land types, each
 * with an intrinsic mana ability (rule 305.6) that the engine doesn't yet
 * grant to a land for having the type — `static:basic-land-type-mana` in
 * `cards/top-commanders-gaps.json`. A land that is every land type is a
 * Forest to every filter, but taps only for what its own abilities say. */
export const LAND_TYPES: readonly string[] = [
  "Cave",
  "Desert",
  "Forest",
  "Gate",
  "Island",
  "Lair",
  "Locus",
  "Mine",
  "Mountain",
  "Plains",
  "Planet",
  "Power-Plant",
  "Sphere",
  "Swamp",
  "Tower",
  "Town",
  "Urza's",
];

const CREATURE_TYPE_SET: ReadonlySet<string> = new Set(CREATURE_TYPES);
const LAND_TYPE_SET: ReadonlySet<string> = new Set(LAND_TYPES);

/** Whether `subtype` is a creature type (rule 205.3m). */
export function isCreatureType(subtype: string): boolean {
  return CREATURE_TYPE_SET.has(subtype);
}

/** Whether `subtype` is a land type (rule 205.3i). */
export function isLandType(subtype: string): boolean {
  return LAND_TYPE_SET.has(subtype);
}

/** Whether `subtype` is one of the two markers rather than a real subtype. */
export function isTypeMarker(subtype: string): boolean {
  return subtype === EVERY_CREATURE_TYPE || subtype === EVERY_LAND_TYPE;
}

/**
 * Whether a subtype list has `subtype` — the one way to ask. A list with
 * {@link EVERY_CREATURE_TYPE} has every creature type, and one with
 * {@link EVERY_LAND_TYPE} every land type.
 *
 * A marker can be *asked about* too, and then means "any type of that kind":
 * `hasSubtype(goblinsTypes, EVERY_CREATURE_TYPE)` is true, because a Goblin
 * has a creature type. That is what "shares a creature type with" needs when
 * the other side is every creature type — a changeling commander shares one
 * with every creature that has any (Path of Ancestry) — so a list of the other
 * side's subtypes, marker and all, can be handed to a filter's `subtypes`.
 */
export function hasSubtype(subtypes: readonly string[], subtype: string): boolean {
  if (subtypes.includes(subtype)) return true;
  if (subtype === EVERY_CREATURE_TYPE) return subtypes.some((s) => CREATURE_TYPE_SET.has(s));
  if (subtype === EVERY_LAND_TYPE) return subtypes.some((s) => LAND_TYPE_SET.has(s));
  if (CREATURE_TYPE_SET.has(subtype)) return subtypes.includes(EVERY_CREATURE_TYPE);
  if (LAND_TYPE_SET.has(subtype)) return subtypes.includes(EVERY_LAND_TYPE);
  return false;
}

/** `subtypes` without the markers — the subtypes a type line prints. */
export function withoutTypeMarkers(subtypes: readonly string[]): readonly string[] {
  return subtypes.some(isTypeMarker) ? subtypes.filter((s) => !isTypeMarker(s)) : subtypes;
}
