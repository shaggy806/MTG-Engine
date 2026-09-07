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

/**
 * Parse a cost string like `"{2}{G}{G}"`, `"{X}{R}"`, or `"{C}{C}"`. Supports
 * generic (`{N}`), the five colored symbols, `{C}` (colorless), and `{X}`.
 * Hybrid (`{W/U}`), twobrid (`{2/W}`), and Phyrexian (`{W/P}`) are not
 * supported yet.
 */
export function parseManaCost(text: string | null): ManaCost {
  const colored: Record<Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
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
    } else if (isColor(symbol)) {
      colored[symbol] += 1;
    } else {
      throw new Error(`unsupported mana symbol: ${token}`);
    }
  }
  return { generic, colored, colorless, x };
}

/** Mana value (converted mana cost). `{X}` counts as 0 (rule 202.3f). */
export function manaValue(cost: ManaCost): number {
  return (
    COLORS.reduce((sum, color) => sum + cost.colored[color], cost.generic) +
    cost.colorless
  );
}
