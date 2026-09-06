/**
 * Shared building blocks for card files — the `{T}: Add {C}` mana ability every
 * basic land carries, and the `basicLand` constructor itself. Imported by files
 * under `pool/` and `tokens/`.
 */

import type { ActivatedAbility } from "../abilities.js";
import type { Color } from "../mana.js";
import { defineCard, type CardDefinition } from "./define.js";

/** The `{T}: Add {C}` ability every mana-producing basic land has. */
export const manaTapAbility = (mana: Color): ActivatedAbility => ({
  cost: { mana: null, tap: true },
  targets: [],
  effect: { kind: "add-mana", mana, amount: 1 },
  resolve: null,
  text: `{T}: Add {${mana}}.`,
});

const BASIC_LAND_MANA: Readonly<Record<string, Color>> = {
  Plains: "W",
  Island: "U",
  Swamp: "B",
  Mountain: "R",
  Forest: "G",
};

/**
 * The single color of mana a land taps for, or `null` if it is not a
 * mana-producing basic land. (Non-basic mana lands come later.)
 */
export function landProduces(def: CardDefinition): Color | null {
  if (!def.types.includes("land")) return null;
  for (const subtype of def.subtypes) {
    const color = BASIC_LAND_MANA[subtype];
    if (color !== undefined) return color;
  }
  return null;
}

export const basicLand = (
  name: string,
  subtype: string,
  produces: Color,
): CardDefinition =>
  defineCard({
    name,
    supertypes: ["basic"],
    types: ["land"],
    subtypes: [subtype],
    text: `({T}: Add {${produces}}.)`,
    activated: [manaTapAbility(produces)],
  });
