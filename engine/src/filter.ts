/**
 * `CardFilter` — a pure predicate over a game object and its *computed*
 * characteristics (rule 613 layers baked in via `computeCharacteristics`).
 *
 * Every clause that is present must match (logical AND). It is the shared
 * vocabulary for "which objects does this effect / trigger / target / search
 * apply to", generalizing the old `{ type?, subtype? }` `ZoneChoiceFilter`.
 * Introduced in ROADMAP Phase 2; reused by every later phase.
 *
 * Off the battlefield (a library / graveyard card) `computeCharacteristics`
 * degrades to printed values, which is what a library search / graveyard
 * filter wants.
 */

import {
  computeCharacteristics,
  effectiveColors,
  effectiveSubtypes,
  effectiveTypes,
} from "./characteristics.js";
import type { CardRegistry, CardType, Keyword, Supertype } from "./cards.js";
import type { Color } from "./mana.js";
import { manaValue, parseManaCost } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import { printedCardName } from "./state.js";
import type { GameState } from "./state.js";

/** A numeric comparison clause, e.g. `{ op: "lte", n: 2 }` = "≤ 2". */
export interface NumCompare {
  readonly op: "eq" | "ne" | "lt" | "lte" | "gt" | "gte";
  readonly n: number;
}

export function compareNum(value: number, cmp: NumCompare): boolean {
  switch (cmp.op) {
    case "eq":
      return value === cmp.n;
    case "ne":
      return value !== cmp.n;
    case "lt":
      return value < cmp.n;
    case "lte":
      return value <= cmp.n;
    case "gt":
      return value > cmp.n;
    case "gte":
      return value >= cmp.n;
    default:
      return false;
  }
}

export interface CardFilter {
  /** Must have ALL of these card types. */
  readonly types?: readonly CardType[];
  /** Convenience for a single required type. */
  readonly type?: CardType;
  /** Must have NONE of these card types. */
  readonly notTypes?: readonly CardType[];
  /** Must have AT LEAST ONE of these card types — an OR (Takenuma, Abandoned
   * Mire's Channel: "a creature or planeswalker card" — needed-cards-adjacent,
   * mirrors `subtypes`' OR semantics). */
  readonly typesAnyOf?: readonly CardType[];
  /** Must have this subtype (creature type, land type, …). */
  readonly subtype?: string;
  /** Must have AT LEAST ONE of these subtypes — an OR (Farseek: "a Plains,
   * Island, Swamp, or Mountain card"; a checkland's "a Mountain or a Forest"). */
  readonly subtypes?: readonly string[];
  /** Must have this supertype (`"legendary"`, `"basic"`, …). */
  readonly supertype?: Supertype;
  /** Exact true printed card name. */
  readonly name?: string;
  /** Current colours must include ALL of these. */
  readonly colors?: readonly Color[];
  /** Current colours must include NONE of these (Doom Blade: `["B"]`). */
  readonly notColors?: readonly Color[];
  /** Must be colourless. */
  readonly colorless?: boolean;
  readonly manaValue?: NumCompare;
  readonly power?: NumCompare;
  readonly toughness?: NumCompare;
  /** Controlled by the filtering player (`"you"`) or anyone else (`"opponent"`). */
  readonly controlledBy?: "you" | "opponent";
  /** Owned by the filtering player / anyone else (zone-agnostic, for graveyards). */
  readonly ownedBy?: "you" | "opponent";
  readonly keyword?: Keyword;
  /** Must NOT have this keyword (Magmaquake: "each creature without flying" —
   * needed-cards P13). */
  readonly notKeyword?: Keyword;
  readonly tapped?: boolean;
  readonly token?: boolean;
}

export interface FilterContext {
  /** Whose perspective `"you"` / `"opponent"` are evaluated from. */
  readonly you: PlayerId;
}

/** Does object `id` satisfy every clause of `filter`? */
export function matchesFilter(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
  filter: CardFilter,
  ctx: FilterContext,
): boolean {
  const object = state.objects[id];
  if (object === undefined) return false;

  // Types, subtypes and colours are self-contained (layers 4 / 3 / 5 come only
  // from the object's own modifiers), so they're answered without the layer
  // fold. Only `keyword` / `power` / `toughness` need external statics — and
  // the fold is expensive enough that it's worth deferring: a static
  // ability's condition (Kird Ape's "you control a Forest") runs this over the
  // whole battlefield every time anything reads its characteristics.
  const types = effectiveTypes(registry, object);
  if (filter.type !== undefined && !types.includes(filter.type)) return false;
  if (filter.types !== undefined && !filter.types.every((t) => types.includes(t))) {
    return false;
  }
  if (filter.notTypes !== undefined && filter.notTypes.some((t) => types.includes(t))) {
    return false;
  }
  if (filter.typesAnyOf !== undefined && !filter.typesAnyOf.some((t) => types.includes(t))) {
    return false;
  }
  if (filter.subtype !== undefined || filter.subtypes !== undefined) {
    const subtypes = effectiveSubtypes(registry, object);
    if (filter.subtype !== undefined && !subtypes.includes(filter.subtype)) return false;
    if (
      filter.subtypes !== undefined &&
      !filter.subtypes.some((s) => subtypes.includes(s))
    ) {
      return false;
    }
  }
  if (
    filter.supertype !== undefined &&
    !registry.get(printedCardName(object)).supertypes.includes(filter.supertype)
  ) {
    return false;
  }
  if (filter.name !== undefined && printedCardName(object) !== filter.name) return false;

  if (
    filter.colors !== undefined ||
    filter.notColors !== undefined ||
    filter.colorless === true
  ) {
    const colors = effectiveColors(registry, object);
    if (filter.colors !== undefined && !filter.colors.every((col) => colors.has(col))) {
      return false;
    }
    if (filter.notColors !== undefined && filter.notColors.some((col) => colors.has(col))) {
      return false;
    }
    if (filter.colorless === true && colors.size > 0) return false;
  }

  if (
    filter.manaValue !== undefined &&
    !compareNum(manaValue(parseManaCost(registry.get(printedCardName(object)).manaCost)), filter.manaValue)
  ) {
    return false;
  }
  // Cheap, purely-positional clauses before the expensive fold below.
  if (filter.controlledBy === "you" && object.controller !== ctx.you) return false;
  if (filter.controlledBy === "opponent" && object.controller === ctx.you) return false;
  if (filter.ownedBy === "you" && object.owner !== ctx.you) return false;
  if (filter.ownedBy === "opponent" && object.owner === ctx.you) return false;
  if (filter.tapped !== undefined && object.tapped !== filter.tapped) return false;
  if (filter.token !== undefined && object.isToken !== filter.token) return false;

  // Only these four need the layer fold (external anthems / keyword grants).
  if (
    filter.power !== undefined ||
    filter.toughness !== undefined ||
    filter.keyword !== undefined ||
    filter.notKeyword !== undefined
  ) {
    const c = computeCharacteristics(state, registry, id);
    if (filter.power !== undefined && !compareNum(c.power, filter.power)) return false;
    if (filter.toughness !== undefined && !compareNum(c.toughness, filter.toughness)) {
      return false;
    }
    if (filter.keyword !== undefined && !c.keywords.has(filter.keyword)) return false;
    if (filter.notKeyword !== undefined && c.keywords.has(filter.notKeyword)) return false;
  }

  return true;
}
