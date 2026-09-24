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
import type { GameObject, GameState } from "./state.js";

/**
 * A numeric comparison clause, e.g. `{ op: "lte", n: 2 }` = "≤ 2".
 *
 * `n: "x"` reads the `{X}` chosen for the spell or ability that's applying
 * the filter (Steel Hellkite: "each nonland permanent with mana value X").
 * It needs `FilterContext.x`; without one it compares against 0.
 */
export interface NumCompare {
  readonly op: "eq" | "ne" | "lt" | "lte" | "gt" | "gte";
  readonly n: number | "x";
}

export function compareNum(value: number, cmp: NumCompare, x = 0): boolean {
  const n = cmp.n === "x" ? x : cmp.n;
  switch (cmp.op) {
    case "eq":
      return value === n;
    case "ne":
      return value !== n;
    case "lt":
      return value < n;
    case "lte":
      return value <= n;
    case "gt":
      return value > n;
    case "gte":
      return value >= n;
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
  /** Must have NONE of these subtypes — Cruel Revival's "target **non-Zombie**
   * creature", Crippling Fear's "creatures that aren't of the chosen type". */
  readonly notSubtypes?: readonly string[];
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
  /** Must be multicoloured — two or more colours (rule 105.4). `false` matches
   * mono-coloured *and* colourless, which is what "nonmulticolored" means.
   * Not expressible as `colors`, which asks for specific ones. */
  readonly multicolored?: boolean;
  readonly manaValue?: NumCompare;
  /** How much mana was actually spent to cast it (The Emperor of Palamecia:
   * "if at least four mana was spent to cast it") — see
   * `GameObject.manaSpent`. `0` for something that wasn't cast. */
  readonly manaSpent?: NumCompare;
  /**
   * How many counters of a given kind are on the object — Rishkar's "each
   * creature you control **with a counter on it**", Undying's "if it had no
   * +1/+1 counters on it".
   *
   * `kind` omitted counts every counter of every kind, which is what a bare
   * "with a counter on it" means.
   */
  readonly counters?: { readonly kind?: string; readonly compare: NumCompare };
  /** Currently attacking (Kangee's Lieutenant: "attacking creatures with
   * flying get +1/+1"). */
  readonly attacking?: boolean;
  /** Currently blocking — the mirror of `attacking` (Kangee, Sky Warden's
   * "blocking creatures with flying get +0/+2"). */
  readonly blocking?: boolean;
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
  /** Is (or isn't) a commander (rule 903.3) — Fierce Guardianship's "if you
   * control a commander" gate. */
  readonly isCommander?: boolean;
  /** Must NOT have this supertype — "nonlegendary", "nonbasic". */
  readonly notSupertype?: Supertype;
  /** Must NOT be this card — "a card not named …". */
  readonly notName?: string;
  /** Has an Equipment attached to it, whoever controls the Equipment (rule
   * 301.5). */
  readonly equipped?: boolean;
  /** Has an Aura attached to it, whoever controls the Aura (rule 303.4). */
  readonly enchanted?: boolean;
  /**
   * Is **modified** (rule 700.9): has a counter of any kind on it, is
   * equipped, or is enchanted by an Aura its *own controller* controls
   * (Chishiro, the Shattered Blade). An opponent's Aura doesn't count; an
   * opponent's Equipment does.
   */
  readonly modified?: boolean;
  /**
   * Is (or isn't) a card in a graveyard that was put there **from a library
   * this turn** — Captain N'ghathrod's "target artifact or creature card in an
   * opponent's graveyard that was put there from a library this turn". Milling
   * is the usual way; surveil and other library-to-graveyard moves count too,
   * and a discarded or destroyed card never does. See
   * `GameObject.putIntoGraveyardFromLibraryOnTurn`.
   */
  readonly putIntoGraveyardFromLibraryThisTurn?: boolean;
  /**
   * At least one of these filters must match, as well as every other clause
   * here — the "or" a flat clause list can't say: historic ("artifact,
   * legendary, or Saga"), "enchanted or equipped", "black and/or red".
   */
  readonly anyOf?: readonly CardFilter[];
}

export interface FilterContext {
  /** Whose perspective `"you"` / `"opponent"` are evaluated from. */
  readonly you: PlayerId;
  /** The `{X}` of the spell or ability applying this filter, for a
   * `NumCompare` written as `{ n: "x" }`. Defaults to 0. */
  readonly x?: number;
  /**
   * Read an object that has just left the battlefield as it last existed
   * there (rule 603.10a) — for a trigger filter matched against the permanent
   * whose leaving fired it. Today that covers `controlledBy`: the move has
   * already reverted control to the owner, and "a creature you control dies"
   * means whoever controlled it as it died (`GameObject.lastKnownController`).
   * No effect on an object whose last move wasn't off the battlefield.
   */
  readonly lastKnown?: boolean;
}

/** What is attached to `id` on the battlefield, for the attachment clauses.
 * Attachments leave with the permanent, so off the battlefield it's none. */
function attachmentsOf(
  state: GameState,
  registry: CardRegistry,
  id: ObjectId,
): { equipped: boolean; enchanted: boolean; enchantedByController: boolean } {
  const out = { equipped: false, enchanted: false, enchantedByController: false };
  const host = state.objects[id];
  if (host === undefined || host.zone !== "battlefield") return out;
  for (const other of state.zones.shared.battlefield) {
    const o = state.objects[other];
    if (o === undefined || o.attachedTo !== id) continue;
    const subtypes = effectiveSubtypes(registry, o);
    if (subtypes.includes("Equipment")) out.equipped = true;
    if (subtypes.includes("Aura")) {
      out.enchanted = true;
      if (o.controller === host.controller) out.enchantedByController = true;
    }
  }
  return out;
}

/**
 * The mana cost an object's mana value is read from: the face that's up,
 * except that a transforming double-faced permanent with its back face up
 * uses its **front** face's (rule 712.8e — a flipped Bloodline Keeper is
 * still mana value 4, though Lord of Lineage prints no cost). A modal DFC's
 * back face is a card face you cast or play, and uses its own.
 */
export function printedManaCost(registry: CardRegistry, object: GameObject): string | null {
  const def = registry.get(printedCardName(object));
  const front = def.faces?.[0];
  if (def.transform === true && front !== undefined && front !== def.name && registry.has(front)) {
    return registry.get(front).manaCost;
  }
  return def.manaCost;
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

  // A permanent whose controller has left the game takes no further part in
  // it: nothing counts it, targets it, or sweeps it up.
  //
  // Rule 800.4a removes a departing player's objects from the game. Here they
  // leave *play* but stay on the board, which is what happens at a real
  // table — an eliminated player's battlefield sits there for everyone to
  // read. Functionally they are gone, which is the half the rules are about;
  // the client tints the quadrant so nobody mistakes them for live.
  if (object.zone === "battlefield" && state.players[object.controller]?.hasLost === true) {
    return false;
  }

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
  if (
    filter.subtype !== undefined ||
    filter.subtypes !== undefined ||
    filter.notSubtypes !== undefined
  ) {
    const subtypes = effectiveSubtypes(registry, object);
    if (filter.subtype !== undefined && !subtypes.includes(filter.subtype)) return false;
    if (
      filter.subtypes !== undefined &&
      !filter.subtypes.some((s) => subtypes.includes(s))
    ) {
      return false;
    }
    if (
      filter.notSubtypes !== undefined &&
      filter.notSubtypes.some((s) => subtypes.includes(s))
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
  if (
    filter.notSupertype !== undefined &&
    registry.get(printedCardName(object)).supertypes.includes(filter.notSupertype)
  ) {
    return false;
  }
  if (filter.name !== undefined && printedCardName(object) !== filter.name) return false;
  if (filter.notName !== undefined && printedCardName(object) === filter.notName) return false;

  if (
    filter.colors !== undefined ||
    filter.notColors !== undefined ||
    filter.colorless === true ||
    filter.multicolored !== undefined
  ) {
    const colors = effectiveColors(registry, object);
    if (filter.colors !== undefined && !filter.colors.every((col) => colors.has(col))) {
      return false;
    }
    if (filter.notColors !== undefined && filter.notColors.some((col) => colors.has(col))) {
      return false;
    }
    if (filter.colorless === true && colors.size > 0) return false;
    if (filter.multicolored !== undefined && colors.size >= 2 !== filter.multicolored) {
      return false;
    }
  }

  if (filter.blocking !== undefined && (object.blocking !== null) !== filter.blocking) {
    return false;
  }
  if (filter.attacking !== undefined) {
    // Off the battlefield, `attacking` has already been cleared by the move
    // that took it there — fall back to the snapshot (rule 608.2h).
    const attacking =
      object.zone === "battlefield" ? object.attacking !== null : object.wasAttacking === true;
    if (attacking !== filter.attacking) return false;
  }
  if (filter.counters !== undefined) {
    const held = filter.counters.kind === undefined
      ? Object.values(object.counters).reduce((n, v) => n + (v ?? 0), 0)
      : (object.counters[filter.counters.kind] ?? 0);
    if (!compareNum(held, filter.counters.compare, ctx.x)) return false;
  }
  if (filter.manaValue !== undefined) {
    // On the stack, {X} counts as the value chosen for it (rule 202.3e) — a
    // Fireball cast for 5 is a mana value 6 spell. Everywhere else it's 0.
    const cost = parseManaCost(printedManaCost(registry, object));
    const mv =
      manaValue(cost) + (object.zone === "stack" ? cost.x * Math.max(0, object.xValue ?? 0) : 0);
    if (!compareNum(mv, filter.manaValue, ctx.x)) return false;
  }
  if (filter.manaSpent !== undefined && !compareNum(object.manaSpent ?? 0, filter.manaSpent, ctx.x)) {
    return false;
  }
  // Cheap, purely-positional clauses before the expensive fold below.
  const controller =
    ctx.lastKnown === true && object.zone !== "battlefield"
      ? (object.lastKnownController ?? object.controller)
      : object.controller;
  if (filter.controlledBy === "you" && controller !== ctx.you) return false;
  if (filter.controlledBy === "opponent" && controller === ctx.you) return false;
  if (filter.ownedBy === "you" && object.owner !== ctx.you) return false;
  if (filter.ownedBy === "opponent" && object.owner === ctx.you) return false;
  if (filter.tapped !== undefined && object.tapped !== filter.tapped) return false;
  if (filter.token !== undefined && object.isToken !== filter.token) return false;
  if (filter.isCommander !== undefined && object.isCommander !== filter.isCommander) return false;
  if (filter.putIntoGraveyardFromLibraryThisTurn !== undefined) {
    const milled =
      object.zone === "graveyard" &&
      object.putIntoGraveyardFromLibraryOnTurn === state.turn.number;
    if (milled !== filter.putIntoGraveyardFromLibraryThisTurn) return false;
  }
  if (
    filter.equipped !== undefined ||
    filter.enchanted !== undefined ||
    filter.modified !== undefined
  ) {
    const attached = attachmentsOf(state, registry, id);
    if (filter.equipped !== undefined && attached.equipped !== filter.equipped) return false;
    if (filter.enchanted !== undefined && attached.enchanted !== filter.enchanted) return false;
    if (filter.modified !== undefined) {
      const modified =
        Object.values(object.counters).some((n) => (n ?? 0) > 0) ||
        attached.equipped ||
        attached.enchantedByController;
      if (modified !== filter.modified) return false;
    }
  }
  if (
    filter.anyOf !== undefined &&
    !filter.anyOf.some((each) => matchesFilter(state, registry, id, each, ctx))
  ) {
    return false;
  }

  // Only these four need the layer fold (external anthems / keyword grants).
  if (
    filter.power !== undefined ||
    filter.toughness !== undefined ||
    filter.keyword !== undefined ||
    filter.notKeyword !== undefined
  ) {
    const c = computeCharacteristics(state, registry, id);
    if (filter.power !== undefined && !compareNum(c.power, filter.power, ctx.x)) return false;
    if (filter.toughness !== undefined && !compareNum(c.toughness, filter.toughness, ctx.x)) {
      return false;
    }
    if (filter.keyword !== undefined && !c.keywords.has(filter.keyword)) return false;
    if (filter.notKeyword !== undefined && c.keywords.has(filter.notKeyword)) return false;
  }

  return true;
}
