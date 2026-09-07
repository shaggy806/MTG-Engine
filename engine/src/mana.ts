/** Colors, mana, and mana costs. */

export type Color = "W" | "U" | "B" | "R" | "G";

/** A concrete unit of mana: one of the five colors, or colorless (`C`). */
export type ManaType = Color | "C";

export type ManaPool = Record<ManaType, number>;

export const COLORS: readonly Color[] = ["W", "U", "B", "R", "G"];
export const MANA_TYPES: readonly ManaType[] = ["W", "U", "B", "R", "G", "C"];

export const emptyPool = (): ManaPool => ({ W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 });

export const poolTotal = (pool: ManaPool): number =>
  MANA_TYPES.reduce((sum, type) => sum + pool[type], 0);

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
