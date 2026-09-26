/** Colors, mana, and mana costs. */

// Type-only, so nothing here participates in a runtime cycle — `filter.ts`
// and `effects.ts` both import this module for real.
import type { CardType, Supertype } from "./cards/define.js";
import type { EffectSpec } from "./effects.js";
import type { CardFilter } from "./filter.js";
import type { ObjectId } from "./primitives.js";
import { hasSubtype } from "./subtypes.js";

export type Color = "W" | "U" | "B" | "R" | "G";

/** A concrete unit of mana: one of the five colors, or colorless (`C`). */
export type ManaType = Color | "C";

export type ManaPool = Record<ManaType, number>;

export const COLORS: readonly Color[] = ["W", "U", "B", "R", "G"];
export const MANA_TYPES: readonly ManaType[] = ["W", "U", "B", "R", "G", "C"];

export const emptyPool = (): ManaPool => ({ W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 });

export const poolTotal = (pool: ManaPool): number =>
  MANA_TYPES.reduce((sum, type) => sum + pool[type], 0);

/**
 * What a restricted unit of mana may be spent on (rule 106.6b) — "Spend this
 * mana only to cast a creature spell of the chosen type" and its relatives.
 *
 * Both clauses are optional and at least one must be set; a unit whose
 * restriction permits neither the spell nor the ability in front of it simply
 * can't pay for it. `text` is for the log and the mana display, and is the
 * card's own wording.
 */
export interface ManaRestriction {
  /** Spells this mana may be cast with (Ancient Ziggurat: any creature
   * spell). Matched against the card being cast, which is still in its
   * pre-cast zone at payment time — so this reads printed characteristics,
   * which is what "a creature spell" means. */
  readonly spell?: CardFilter;
  /** Permanents whose *activated abilities* this mana may also pay for
   * (Eldrazi Temple, Castle Garenbrig: "…or activate abilities of Eldrazi").
   * Absent means the mana is for casting only. */
  readonly abilityOf?: CardFilter;
  readonly text: string;
}

/**
 * One unit of mana sitting in a player's pool (rule 106.4).
 *
 * The pool is a **list of units** rather than a count per colour, because
 * three printed things need to know about one *particular* unit of mana and
 * not just how much there is: a restriction on what it may be spent on, a
 * rider that fires when it is spent (Path of Ancestry), and mana that
 * survives the end of a step (Savage Ventmaw). A count can carry none of
 * those. {@link poolCounts} rebuilds the old view for everything that only
 * wants totals.
 *
 * In practice the pool is empty almost all the time — the engine auto-pays,
 * so mana is usually made and spent inside one operation and never lands
 * here. It lands here when a player activates a mana ability by hand, and
 * that is exactly the path where an untagged pool would lose the restriction
 * and let Cavern of Souls' mana pay for anything.
 */
export interface ManaUnit {
  readonly type: ManaType;
  readonly restriction?: ManaRestriction;
  /** "You don't lose this mana as steps and phases end" (Savage Ventmaw).
   * Still emptied at cleanup — the permission is for the turn, not forever. */
  readonly persists?: boolean;
  /** "This mana lasts until end of combat" (firebending): kept as the
   * combat phase's steps end, lost as it does. */
  readonly untilEndOfCombat?: boolean;
  /** "…and that spell can't be countered" (Cavern of Souls, Delighted
   * Halfling) — a property the *spell* gains by being paid for with this
   * mana, so it can't live on the land's own card definition. */
  readonly uncounterable?: boolean;
  /** Fires when this unit is spent — Path of Ancestry's "When that mana is
   * spent to cast a creature spell that shares a creature type with your
   * commander, scry 1". Carried as plain data so it survives a snapshot. */
  readonly onSpend?: ManaSpendRider;
  /** What made it — see {@link ManaOrigin}. */
  readonly from?: ManaOrigin;
}

/**
 * What made a unit of mana: the card types, subtypes and supertypes of the
 * source of the ability or spell that added it, as they were when it did —
 * "mana from an artifact", "mana from a Treasure". Taken as the mana is
 * made, because the source is often gone by the time the mana is spent (a
 * Treasure sacrificed for it). Extra mana a triggered mana ability adds
 * (rule 605.1b — "whenever you tap a creature for mana, add an additional
 * {G}") is that ability's source's, not the tapped permanent's.
 */
export interface ManaOrigin {
  readonly types: readonly CardType[];
  readonly subtypes: readonly string[];
  readonly supertypes: readonly Supertype[];
}

/** Which sources of mana count — a `CardFilter.manaFrom` clause. Every field
 * given must match. */
export interface ManaFromSpec {
  readonly type?: CardType;
  readonly subtype?: string;
  readonly supertype?: Supertype;
}

/** Whether mana made by `origin` is mana from what `spec` names. A source
 * that was every creature type (changeling) made mana from each of them. */
export const manaOriginMatches = (origin: ManaOrigin, spec: ManaFromSpec): boolean =>
  (spec.type === undefined || origin.types.includes(spec.type)) &&
  (spec.subtype === undefined || hasSubtype(origin.subtypes, spec.subtype)) &&
  (spec.supertype === undefined || origin.supertypes.includes(spec.supertype));

/** A triggered ability that fires when one unit of mana is spent on a
 * matching spell (rule 106.12 / 603.2e). */
export interface ManaSpendRider {
  /** The permanent that made the mana — `ctx.source` when the rider fires. */
  readonly source: ObjectId;
  readonly sourceName: string;
  /** Only fires if the spell paid for matches. Absent means any spell. */
  readonly spell?: CardFilter;
  readonly effect: EffectSpec;
  readonly text: string;
}

/** Totals per mana type — the count view of a pool of units. */
export const poolCounts = (units: readonly ManaUnit[]): ManaPool => {
  const pool = emptyPool();
  for (const unit of units) pool[unit.type] += 1;
  return pool;
};

/** One way to pay a single hybrid / twobrid / Phyrexian pip (rule 107.4e–g).
 * A pip is a list of these alternatives; paying it means satisfying any one. */
export type HybridOption =
  | { readonly kind: "color"; readonly color: Color }
  /** twobrid — the `{2}` half of `{2/W}` (`amount` is always 2 in practice). */
  | { readonly kind: "generic"; readonly amount: number }
  /** Phyrexian — the `{P}` half of `{W/P}`: pay 2 life instead of the pip. */
  | { readonly kind: "phyrexian" };

/** A single hybrid pip: the alternative payments it accepts, in the symbol's
 * written order (`{2/W}` → `[{2}, {W}]`, `{W/P}` → `[{W}, {P}]`). */
export type HybridPip = readonly HybridOption[];

/** A parsed mana cost: a generic amount plus per-color requirements. */
export interface ManaCost {
  readonly generic: number;
  readonly colored: Record<Color, number>;
  /** `{C}` pips — must be paid with colorless mana specifically (rule 107.4c). */
  readonly colorless: number;
  /** Number of `{X}` symbols in the cost (0 for most cards, 1 for an X spell).
   * The chosen value of X is multiplied by this and added to `generic` when
   * the cost is actually paid — see `Game.effectiveCost`. */
  readonly x: number;
  /** Hybrid / twobrid / Phyrexian pips, each resolved to one of its
   * alternatives at payment time (see `Game.resolveHybridCost`). */
  readonly hybrid: readonly HybridPip[];
  /** Generic reduction left over once the generic part reached `{0}`, for
   * the `{2}` halves of twobrid pips (`{2/W}`) — but only the ones paid with
   * generic mana (the Spectral Procession ruling), which is decided at
   * payment time, so it's carried here rather than baked into a pip. See
   * `reduceManaCost` and `resolveHybridCost`. */
  readonly twobridReduction?: number;
}

function isColor(value: string): value is Color {
  return (
    value === "W" ||
    value === "U" ||
    value === "B" ||
    value === "R" ||
    value === "G"
  );
}

/** Parse one `/`-joined pip body (`"W/U"`, `"2/W"`, `"W/P"`, `"G/U/P"`). */
function parseHybridPip(body: string): HybridPip {
  return body.split("/").map((part): HybridOption => {
    if (/^\d+$/.test(part)) return { kind: "generic", amount: Number(part) };
    if (part === "P") return { kind: "phyrexian" };
    if (isColor(part)) return { kind: "color", color: part };
    throw new Error(`unsupported mana symbol: {${body}}`);
  });
}

/**
 * Parse a cost string like `"{2}{G}{G}"`, `"{X}{R}"`, `"{C}{C}"`, `"{2/W}{2/W}"`,
 * or `"{R/P}"`. Supports generic (`{N}`), the five colored symbols, `{C}`
 * (colorless), `{X}`, `{S}` (snow — modeled as generic, since no snow permanent
 * exists to distinguish it), and hybrid / twobrid / Phyrexian pips (`{W/U}`,
 * `{2/W}`, `{W/P}`).
 */
export function parseManaCost(text: string | null): ManaCost {
  const colored: Record<Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  const hybrid: HybridPip[] = [];
  let generic = 0;
  let colorless = 0;
  let x = 0;
  for (const token of text?.match(/\{[^}]+\}/g) ?? []) {
    const symbol = token.slice(1, -1);
    if (/^\d+$/.test(symbol)) {
      generic += Number(symbol);
    } else if (symbol === "X") {
      x += 1;
    } else if (symbol === "C") {
      colorless += 1;
    } else if (symbol === "S") {
      generic += 1;
    } else if (isColor(symbol)) {
      colored[symbol] += 1;
    } else if (symbol.includes("/")) {
      hybrid.push(parseHybridPip(symbol));
    } else {
      throw new Error(`unsupported mana symbol: ${token}`);
    }
  }
  return { generic, colored, colorless, x, hybrid };
}

/** Mana value of one hybrid pip (rule 202.3f): the greatest among its
 * alternatives — `{W/U}` → 1, `{2/W}` → 2, `{W/P}` → 1. */
function hybridPipValue(pip: HybridPip): number {
  return Math.max(
    0,
    ...pip.map((option) => (option.kind === "generic" ? option.amount : 1)),
  );
}

/** Mana value (converted mana cost). `{X}` counts as 0 (rule 202.3f). */
export function manaValue(cost: ManaCost): number {
  return (
    COLORS.reduce((sum, color) => sum + cost.colored[color], cost.generic) +
    cost.colorless +
    cost.hybrid.reduce((sum, pip) => sum + hybridPipValue(pip), 0)
  );
}

/**
 * One coloured cost reduction ("costs {W}{B} less" — rule 118.7): how many
 * of each colour it takes off, and whether what finds no coloured pip to take
 * is lost (`coloredOnly` — "this effect reduces only the amount of colored
 * mana you pay") or comes off the generic part instead (rules 118.7b/c).
 */
export interface ColoredReduction {
  readonly colors: Readonly<Record<Color, number>>;
  readonly coloredOnly: boolean;
}

/** The coloured symbols of `text` as a per-colour count, for a
 * {@link ColoredReduction} (`"{W}{B}"` → one W, one B). */
export function coloredReductionOf(text: string, coloredOnly: boolean, times = 1): ColoredReduction {
  const colors = { ...parseManaCost(text).colored };
  for (const color of COLORS) colors[color] *= times;
  return { colors, coloredOnly };
}

/**
 * `cost` with cost reductions applied (rule 601.2f), none of which can take
 * it below nothing.
 *
 * Coloured reductions go first: each takes a pip of its colour, else a hybrid
 * pip that includes the colour (rule 118.7e — that pip is paid as the
 * colour), preferring a twobrid pip since its other half is the dearer one;
 * what's left comes off the generic part unless `coloredOnly`.
 *
 * A generic reduction larger than the generic part carries over as
 * `twobridReduction`, for whichever twobrid pips end up paid with generic
 * mana: rule 601.2f has the payment for each hybrid pip chosen before the
 * total cost is, and a generic reduction applies to a monocolored hybrid pip
 * only if it's paid generically (the Spectral Procession ruling). Any other
 * excess is lost — a cost can't go below nothing.
 */
export function reduceManaCost(
  cost: ManaCost,
  reduceGeneric: number,
  colored: readonly ColoredReduction[] = [],
): ManaCost {
  const nextColored = { ...cost.colored };
  const hybrid: HybridPip[] = [...cost.hybrid];
  let generic = cost.generic;
  let reduction = Math.max(0, reduceGeneric);
  for (const { colors, coloredOnly } of colored) {
    for (const color of COLORS) {
      let left = colors[color];
      const take = Math.min(left, nextColored[color]);
      nextColored[color] -= take;
      left -= take;
      while (left > 0) {
        const hasColor = (pip: HybridPip) =>
          pip.some((o) => o.kind === "color" && o.color === color);
        let index = hybrid.findIndex((pip) => hasColor(pip) && pip.some((o) => o.kind === "generic"));
        if (index < 0) index = hybrid.findIndex(hasColor);
        if (index < 0) break;
        hybrid.splice(index, 1);
        left -= 1;
      }
      if (left > 0 && !coloredOnly) reduction += left;
    }
  }
  generic -= reduction;
  let twobridReduction = cost.twobridReduction ?? 0;
  if (generic < 0) {
    const twobridGeneric = hybrid.reduce(
      (sum, pip) => sum + Math.max(0, ...pip.map((o) => (o.kind === "generic" ? o.amount : 0))),
      0,
    );
    twobridReduction = Math.min(twobridGeneric, twobridReduction - generic);
    generic = 0;
  }
  return {
    generic,
    colored: nextColored,
    colorless: cost.colorless,
    x: cost.x,
    hybrid,
    ...(twobridReduction > 0 ? { twobridReduction } : {}),
  };
}

/** The least mana `cost` could be paid with, each hybrid pip at its cheapest
 * half — for comparing two versions of one cost, not for paying either. */
export function cheapestManaAmount(cost: ManaCost): number {
  return (
    COLORS.reduce((sum, color) => sum + cost.colored[color], cost.generic) +
    cost.colorless +
    cost.hybrid.reduce(
      (sum, pip) =>
        sum + Math.min(...pip.map((option) => (option.kind === "generic" ? option.amount : 1))),
      0,
    )
  );
}
