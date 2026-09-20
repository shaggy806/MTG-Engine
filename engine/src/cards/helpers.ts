/**
 * Shared building blocks for card files — the `{T}: Add {C}` mana ability every
 * basic land carries, and the `basicLand` constructor itself. Imported by files
 * under `pool/` and `tokens/`.
 */

import type { ActivatedAbility } from "../abilities.js";
import type { Color, ManaType } from "../mana.js";
import { defineCard, type CardDefinition, type StaticAbility } from "./define.js";

/** The placeholder for "the chosen creature type" inside a
 * `choose-creature-type` effect's `then` — re-exported here because card files
 * import only from `define` and `helpers`. */
export { CHOSEN_CREATURE_TYPE } from "../effects.js";

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

/**
 * A "reveal land" (Port Town, Game Trail, Foreboding Ruins, Fortified
 * Village): "As ~ enters, you may reveal a [type] or [type] card from your
 * hand. If you don't, it enters tapped."
 *
 * Unlike a check land, the condition reads your *hand* rather than the
 * battlefield — and unlike a shock land, it isn't typed with the two basic
 * land types, so it doesn't itself turn on a check land. The engine reveals
 * automatically whenever it can; see `tappedUnlessRevealFromHand`.
 */
export const revealLand = (
  name: string,
  landTypes: readonly [string, string],
): CardDefinition => {
  const colors = landTypes
    .map((t) => BASIC_LAND_MANA[t])
    .filter((c): c is Color => c !== undefined);
  return defineCard({
    name,
    types: ["land"],
    text:
      `As ${name} enters, you may reveal ${withArticle(landTypes[0])} or ` +
      `${withArticle(landTypes[1])} card from your hand. If you don't, ` +
      `${name} enters tapped.\n` +
      `{T}: Add ${colors.map((c) => `{${c}}`).join(" or ")}.`,
    static: [
      {
        affects: { scope: "self" },
        replacement: {
          event: "enters-battlefield",
          tappedUnlessRevealFromHand: [...landTypes],
        },
        text:
          `As ${name} enters, you may reveal ${withArticle(landTypes[0])} or ` +
          `${withArticle(landTypes[1])} card from your hand. If you don't, ${name} enters tapped.`,
      },
    ],
    activated: colors.map((c) => manaTapAbility(c)),
  });
};

/**
 * A "tap land" — enters tapped, taps for either of two colours (Shivan Oasis,
 * Timber Gorge). `gainLife` adds the "when this enters, you gain 1 life"
 * clause of the common-land life cycle (Kazandu Refuge, Rugged Highlands).
 *
 * Deliberately *not* typed with its two basic land types: these are plain
 * nonbasic lands, so they don't switch on a check land the way a shock or
 * dual land does.
 */
export const tapLand = (
  name: string,
  landTypes: readonly [string, string],
  gainLife = false,
): CardDefinition => {
  const colors = landTypes
    .map((t) => BASIC_LAND_MANA[t])
    .filter((c): c is Color => c !== undefined);
  return defineCard({
    name,
    types: ["land"],
    text:
      `${name} enters tapped.\n` +
      (gainLife ? `When ${name} enters, you gain 1 life.\n` : "") +
      `{T}: Add ${colors.map((c) => `{${c}}`).join(" or ")}.`,
    static: [entersTappedStatic(name)],
    triggered: gainLife
      ? [
          {
            trigger: { on: "enters-battlefield", who: "self" },
            targets: [],
            effect: { kind: "gain-life", amount: 1 },
            resolve: null,
            text: `When ${name} enters, you gain 1 life.`,
          },
        ]
      : [],
    activated: colors.map((c) => manaTapAbility(c)),
  });
};

/**
 * A "Signet" (Azorius Signet, Dimir Signet, Rakdos Signet, …): a `{2}` artifact
 * with "{1}, {T}: Add [two colours]".
 *
 * Net +1 mana and colour-fixing, which is why it has a mana cost of its own —
 * see `ManaOption.genericCost`, the machinery that lets the auto-payer fund it
 * from other sources.
 */
export const signet = (name: string, colors: readonly [Color, Color]): CardDefinition =>
  defineCard({
    name,
    manaCost: "{2}",
    types: ["artifact"],
    text: `{1}, {T}: Add {${colors[0]}}{${colors[1]}}.`,
    activated: [
      {
        cost: { mana: "{1}", tap: true },
        targets: [],
        effect: { kind: "add-mana", mana: { oneOf: colors }, amount: 2 },
        resolve: null,
        text: `{1}, {T}: Add {${colors[0]}}{${colors[1]}}.`,
      },
    ],
  });

/**
 * A "Battlebond land" (Morphic Pool, Sea of Clouds, Training Center, …): a
 * two-colour land that "enters tapped unless you have two or more opponents".
 *
 * Ten cards on one template, and the only reason they weren't authorable is
 * that nothing could ask how many opponents you had — hence the
 * `opponent-count` {@link StaticCondition}. In a Commander pod the condition
 * is usually true, which is the point of the cycle: these are untapped duals
 * in multiplayer and tapped ones in a duel.
 */
export const battlebondLand = (
  name: string,
  colors: readonly [Color, Color],
): CardDefinition =>
  defineCard({
    name,
    types: ["land"],
    text:
      `${name} enters tapped unless you have two or more opponents.
` +
      `{T}: Add {${colors[0]}} or {${colors[1]}}.`,
    static: [
      {
        affects: { scope: "self" },
        replacement: {
          event: "enters-battlefield",
          tappedUnless: { kind: "opponent-count", atLeast: 2 },
        },
        text: `${name} enters tapped unless you have two or more opponents.`,
      },
    ],
    activated: colors.map((c) => manaTapAbility(c)),
  });

const NUM_WORD: Readonly<Record<number, string>> = { 2: "two", 3: "three", 4: "four" };

/**
 * "~ enters the battlefield tapped unless you control [N] or more [basic lands
 * / other lands]" — Cinder Glade ("two or more basic lands"), Rockfall Vale
 * ("two or more other lands", + a `painIfUntapped` on the card).
 */
/**
 * A "tri-land" (Arcane Sanctum, Nomad Outpost, Savage Lands, …): an untyped
 * land that enters tapped and taps for any one of three colours.
 *
 * Two cycles of five share this shape exactly. Untyped on purpose — unlike
 * {@link tapLand} these carry no basic land types, so nothing else keys off
 * them (a check land doesn't see one as a Swamp).
 */
/**
 * An Odyssey "filter land" (Darkwater Catacombs, Skycloud Expanse, …):
 * "{1}, {T}: Add [two colours]".
 *
 * The same economics as a {@link signet} — net +1 mana and colour-fixing, paid
 * for with generic — so it reaches the auto-payer the same way, as a
 * "converter" the planner funds from ordinary sources and orders last. Not to
 * be confused with the Shadowmoor filter lands (Flooded Grove), whose
 * activation cost is a *hybrid* pip.
 */
export const filterLand = (
  name: string,
  colors: readonly [Color, Color],
): CardDefinition =>
  defineCard({
    name,
    types: ["land"],
    text: `{1}, {T}: Add {${colors[0]}}{${colors[1]}}.`,
    activated: [
      {
        cost: { mana: "{1}", tap: true },
        targets: [],
        effect: { kind: "add-mana", mana: { oneOf: colors }, amount: 2 },
        resolve: null,
        text: `{1}, {T}: Add {${colors[0]}}{${colors[1]}}.`,
      },
    ],
  });

export const triLand = (
  name: string,
  colors: readonly [Color, Color, Color],
): CardDefinition =>
  defineCard({
    name,
    types: ["land"],
    text: `${name} enters tapped.
{T}: Add {${colors[0]}}, {${colors[1]}}, or {${colors[2]}}.`,
    static: [entersTappedStatic(name)],
    activated: colors.map((c) => manaTapAbility(c)),
  });

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
 * The Streets-of-New-Capenna tri-land fetch cycle (Cabaretti Courtyard,
 * Riveteers Overlook, …): "When this land enters, sacrifice it. When you do,
 * search your library for a basic [A], [B], or [C] card, put it onto the
 * battlefield tapped, then shuffle and you gain 1 life."
 *
 * Unlike {@link fetchLand} it is a *trigger*, not an activated ability — the
 * land never taps for mana itself and never sits on the battlefield, so it has
 * no mana abilities at all. The "when you do" reflexive trigger is the
 * `sacrifice-source` effect's `then`, which only runs if the sacrifice
 * actually happened.
 */
export const sacrificeFetchLand = (
  name: string,
  landTypes: readonly [string, string, string],
): CardDefinition => {
  const text =
    `When ${name} enters, sacrifice it. When you do, search your library for a basic ` +
    `${landTypes[0]}, ${landTypes[1]}, or ${landTypes[2]} card, put it onto the ` +
    `battlefield tapped, then shuffle and you gain 1 life.`;
  return defineCard({
    name,
    types: ["land"],
    text,
    triggered: [
      {
        trigger: { on: "enters-battlefield", who: "self" },
        targets: [],
        effect: {
          kind: "sacrifice-source",
          then: {
            kind: "sequence",
            effects: [
              {
                kind: "search-library",
                filter: { type: "land", supertype: "basic", subtypes: landTypes },
                destination: "battlefield",
                // "Search … for a basic land card" is mandatory on the printed
                // card, but a whiff has to be legal, and `min: 0` is how the
                // engine expresses "take one if there is one".
                min: 0,
                max: 1,
                enterTapped: true,
              },
              { kind: "gain-life", amount: 1 },
            ],
          },
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
 * A "scry land" (the Theros temple cycle — Temple of Epiphany, Temple of
 * Silence): enters tapped, scries 1 on the way in, taps for either of two
 * colours.
 */
export const scryLand = (name: string, colors: readonly [Color, Color]): CardDefinition =>
  defineCard({
    name,
    types: ["land"],
    text:
      `${name} enters the battlefield tapped.\n` +
      `When ${name} enters the battlefield, scry 1.\n` +
      `{T}: Add {${colors[0]}} or {${colors[1]}}.`,
    static: [entersTappedStatic(name)],
    triggered: [
      {
        trigger: { on: "enters-battlefield", who: "self" },
        targets: [],
        effect: { kind: "scry", amount: 1 },
        resolve: null,
        text: `When ${name} enters the battlefield, scry 1.`,
      },
    ],
    activated: colors.map((c) => manaTapAbility(c)),
  });

/**
 * A "slow land" (the Innistrad: Midnight Hunt / Crimson Vow cycle — Shipwreck
 * Marsh, Deserted Beach): "enters tapped unless you control two or more *other*
 * lands". Same shape as `Rockfall Vale` without its pain rider.
 */
export const slowLand = (name: string, colors: readonly [Color, Color]): CardDefinition =>
  defineCard({
    name,
    types: ["land"],
    text:
      `${name} enters the battlefield tapped unless you control two or more other lands.\n` +
      `{T}: Add {${colors[0]}} or {${colors[1]}}.`,
    static: [enterTappedUnlessLands(name, 2, "any")],
    activated: colors.map((c) => manaTapAbility(c)),
  });

/**
 * An original dual land (Underground Sea, Tundra): two basic land types and
 * nothing else — no printed rules text at all, since both mana abilities come
 * from the types.
 */
export const dualLand = (
  name: string,
  landTypes: readonly [string, string],
): CardDefinition => {
  const colors = landTypes
    .map((t) => BASIC_LAND_MANA[t])
    .filter((c): c is Color => c !== undefined);
  return defineCard({
    name,
    types: ["land"],
    subtypes: [...landTypes],
    text: `({T}: Add ${colors.map((c) => `{${c}}`).join(" or ")}.)`,
    activated: colors.map((c) => manaTapAbility(c)),
  });
};

/**
 * An artifact land (Seat of the Synod, Vault of Whispers) — a land that is also
 * an artifact, tapping for one fixed colour.
 */
export const artifactLand = (name: string, produces: Color): CardDefinition =>
  defineCard({
    name,
    types: ["artifact", "land"],
    text: `{T}: Add {${produces}}.`,
    activated: [manaTapAbility(produces)],
  });

/**
 * A "Medallion" (Jet Medallion, Ruby Medallion): a {2} artifact making your
 * spells of one colour cost {1} less.
 */
export const medallion = (name: string, color: Color): CardDefinition => {
  const text = `${colorWord(color)} spells you cast cost {1} less to cast.`;
  return defineCard({
    name,
    manaCost: "{2}",
    types: ["artifact"],
    text,
    static: [
      {
        affects: { scope: "self" },
        costModification: { applies: { colors: [color] }, reduceGeneric: 1 },
        text,
      },
    ],
  });
};

const COLOR_WORD: Readonly<Record<Color, string>> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
};
const colorWord = (c: Color): string => COLOR_WORD[c];

/**
 * A "Talisman" (Talisman of Dominance, Talisman of Progress, …): a {2} artifact
 * with exactly a pain land's ability set — "{T}: Add {C}." plus "{T}: Add {A} or
 * {B}. ~ deals 1 damage to you." The auto-payer reaches for the painless option
 * first, same as `painLand`.
 */
export const talisman = (name: string, colors: readonly [Color, Color]): CardDefinition =>
  defineCard({
    name,
    manaCost: "{2}",
    types: ["artifact"],
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
