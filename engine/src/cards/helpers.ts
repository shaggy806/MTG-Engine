/**
 * Shared building blocks for card files — the `{T}: Add {C}` mana ability every
 * basic land carries, and the `basicLand` constructor itself. Imported by files
 * under `pool/` and `tokens/`.
 */

import type { ActivatedAbility } from "../abilities.js";
import type { Color, ManaType } from "../mana.js";
import { defineCard, type CardDefinition, type StaticAbility } from "./define.js";

/** The `{T}: Add {C}` ability every mana-producing basic land has. */
export const manaTapAbility = (mana: Color): ActivatedAbility => ({
  cost: { mana: null, tap: true },
  targets: [],
  effect: { kind: "add-mana", mana, amount: 1 },
  resolve: null,
  text: `{T}: Add {${mana}}.`,
});

/**
 * A `{T}: Add …` mana ability for a rock or utility land — `mana` may be a
 * concrete type or `"any-color"` (Arcane Signet, Command Tower, Treasure),
 * `amount` defaults to 1, and `sacrifice: "self"` makes it a Treasure-style
 * one-shot ("{T}, Sacrifice this: …").
 */
export const addManaAbility = (opts: {
  mana: ManaType | "any-color";
  amount?: number;
  sacrifice?: "self";
  text: string;
}): ActivatedAbility => ({
  cost: {
    mana: null,
    tap: true,
    ...(opts.sacrifice === undefined ? {} : { sacrifice: opts.sacrifice }),
  },
  targets: [],
  effect: { kind: "add-mana", mana: opts.mana, amount: opts.amount ?? 1 },
  resolve: null,
  text: opts.text,
});

/**
 * The unconditional "~ enters the battlefield tapped" self-replacement most
 * nonbasic lands carry (Grovewatch Hollow, the temples, the trilands).
 */
export const entersTappedStatic = (name: string): StaticAbility => ({
  affects: { scope: "self" },
  replacement: { event: "enters-battlefield", tapped: true },
  text: `${name} enters the battlefield tapped.`,
});

/** "a Mountain" / "an Island" — the indefinite article for a land-type word. */
const withArticle = (word: string): string =>
  `${/^[AEIOU]/.test(word) ? "an" : "a"} ${word}`;

const BASIC_LAND_MANA: Readonly<Record<string, Color>> = {
  Plains: "W",
  Island: "U",
  Swamp: "B",
  Mountain: "R",
  Forest: "G",
};

/**
 * The "~ enters the battlefield tapped unless you control [one of these basic
 * land types]" self-replacement of the check-land cycle (Rootbound Crag,
 * Sulfur Falls, Hinterland Harbor).
 */
export const checkLandStatic = (
  name: string,
  landTypes: readonly [string, string],
): StaticAbility => ({
  affects: { scope: "self" },
  replacement: {
    event: "enters-battlefield",
    tappedUnless: { kind: "controls", filter: { subtypes: landTypes }, atLeast: 1 },
  },
  text: `${name} enters the battlefield tapped unless you control ${withArticle(
    landTypes[0],
  )} or ${withArticle(landTypes[1])}.`,
});

/**
 * A "shock land" (Blood Crypt, Overgrown Tomb, Stomping Ground): "As ~ enters
 * the battlefield, you may pay 2 life. If you don't, it enters tapped." Typed
 * with its two basic land types, so it also taps for both colours and counts
 * for a check land. Raised as a `pay-life-for-untapped` decision.
 */
export const shockLand = (
  name: string,
  landTypes: readonly [string, string],
): CardDefinition => {
  const colors = landTypes.map((t) => BASIC_LAND_MANA[t]).filter((c): c is Color => c !== undefined);
  return defineCard({
    name,
    types: ["land"],
    subtypes: [...landTypes],
    text:
      `As ${name} enters the battlefield, you may pay 2 life. ` +
      `If you don't, ${name} enters the battlefield tapped.\n` +
      `({T}: Add ${landTypes.map((t) => `{${BASIC_LAND_MANA[t]}}`).join(" or ")}.)`,
    static: [
      {
        affects: { scope: "self" },
        replacement: { event: "enters-battlefield", mayPayLife: 2 },
        text: `As ${name} enters the battlefield, you may pay 2 life. If you don't, ${name} enters the battlefield tapped.`,
      },
    ],
    activated: colors.map((c) => manaTapAbility(c)),
  });
};

const NUM_WORD: Readonly<Record<number, string>> = { 2: "two", 3: "three", 4: "four" };

/**
 * "~ enters the battlefield tapped unless you control [N] or more [basic lands
 * / other lands]" — Cinder Glade ("two or more basic lands"), Rockfall Vale
 * ("two or more other lands", + a `painIfUntapped` on the card).
 */
export const enterTappedUnlessLands = (
  name: string,
  atLeast: number,
  what: "basic" | "any",
): StaticAbility => ({
  affects: { scope: "self" },
  replacement: {
    event: "enters-battlefield",
    tappedUnless: {
      kind: "controls",
      filter: what === "basic" ? { supertype: "basic", type: "land" } : { type: "land" },
      atLeast,
    },
  },
  text: `${name} enters the battlefield tapped unless you control ${
    NUM_WORD[atLeast] ?? atLeast
  } or more ${what === "basic" ? "basic lands" : "other lands"}.`,
});

/**
 * A "tri-land pain land" (the SNC "-Courtyard" / "-Overlook" cycle): enters
 * tapped, "{T}, Pay 1 life: Add one of three colours". Each colour is a
 * mana ability with a `payLife: 1` cost (auto-paid by the mana planner).
 */
export const trikeland = (
  name: string,
  colors: readonly [Color, Color, Color],
): CardDefinition =>
  defineCard({
    name,
    types: ["land"],
    text:
      `${name} enters the battlefield tapped.\n` +
      `{T}, Pay 1 life: Add {${colors[0]}}, {${colors[1]}}, or {${colors[2]}}.`,
    static: [entersTappedStatic(name)],
    activated: colors.map((c) => ({
      cost: { mana: null, tap: true, payLife: 1 },
      targets: [],
      effect: { kind: "add-mana" as const, mana: c, amount: 1 },
      resolve: null,
      text: `{T}, Pay 1 life: Add {${c}}.`,
    })),
  });

/**
 * A "{T}, Pay 1 life, Sacrifice ~: Search your library for a [type-A] or
 * [type-B] card, put it onto the battlefield, then shuffle" fetch land
 * (Wooded Foothills, Bloodstained Mire, Verdant Catacombs).
 */
export const fetchLand = (
  name: string,
  landTypes: readonly [string, string],
): CardDefinition => {
  const text = `{T}, Pay 1 life, Sacrifice ${name}: Search your library for ${withArticle(
    landTypes[0],
  )} or ${withArticle(landTypes[1])} card, put it onto the battlefield, then shuffle.`;
  return defineCard({
    name,
    types: ["land"],
    text,
    activated: [
      {
        cost: { mana: null, tap: true, sacrifice: "self", payLife: 1 },
        targets: [],
        effect: {
          kind: "search-library",
          filter: { type: "land", subtypes: landTypes },
          destination: "battlefield",
          min: 0,
          max: 1,
        },
        resolve: null,
        text,
      },
    ],
  });
};

/**
 * A "pain land" (Karplusan Forest, Shivan Reef, Yavimaya Coast): "{T}: Add
 * {C}." plus "{T}: Add {A} or {B}. ~ deals 1 damage to you." — the coloured
 * tap hurts, the colourless one doesn't. The auto-payer reaches for the
 * painless option first (see `Game.chooseOption`).
 */
export const painLand = (
  name: string,
  colors: readonly [Color, Color],
): CardDefinition =>
  defineCard({
    name,
    types: ["land"],
    text:
      "{T}: Add {C}.\n" +
      `{T}: Add {${colors[0]}} or {${colors[1]}}. ${name} deals 1 damage to you.`,
    activated: [
      {
        cost: { mana: null, tap: true },
        targets: [],
        effect: { kind: "add-mana", mana: "C", amount: 1 },
        resolve: null,
        text: "{T}: Add {C}.",
      },
      ...colors.map((c) => ({
        cost: { mana: null, tap: true },
        targets: [],
        effect: {
          kind: "add-mana" as const,
          mana: c,
          amount: 1,
          painToController: 1,
        },
        resolve: null,
        text: `{T}: Add {${c}}. ${name} deals 1 damage to you.`,
      })),
    ],
  });

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
