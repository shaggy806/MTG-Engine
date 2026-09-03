/**
 * Card definitions and the registry that resolves a card name to its printed
 * characteristics.
 *
 * Behavior is authored declaratively (`effect`). Cards whose rules text the
 * declarative vocab can't express carry an imperative `resolve` script (the
 * escape hatch). Vanilla permanents need neither.
 */

import type { ActivatedAbility } from "./abilities.js";
import type { EffectSpec, SpellResolver } from "./effects.js";
import type { Color } from "./mana.js";
import type { TargetSpec } from "./target.js";

export type CardType =
  | "land"
  | "creature"
  | "artifact"
  | "enchantment"
  | "instant"
  | "sorcery"
  | "planeswalker"
  | "battle";

export type Supertype = "basic" | "legendary" | "snow" | "world";

export type Keyword =
  | "flying"
  | "reach"
  | "haste"
  | "vigilance"
  | "defender"
  | "first-strike"
  | "double-strike"
  | "trample"
  | "deathtouch"
  | "lifelink"
  | "menace";

/** Printed characteristics of a card. Immutable reference data. */
export interface CardDefinition {
  readonly name: string;
  readonly manaCost: string | null;
  readonly colors: readonly Color[];
  readonly supertypes: readonly Supertype[];
  readonly types: readonly CardType[];
  readonly subtypes: readonly string[];
  readonly power: number | null;
  readonly toughness: number | null;
  readonly keywords: readonly Keyword[];
  readonly text: string;
  /** Target slots, in order. Chosen when the spell is cast. */
  readonly targets: readonly TargetSpec[];
  /** Declarative resolution effect, or `null`. */
  readonly effect: EffectSpec | null;
  /** Imperative resolution script (takes precedence over `effect`), or `null`. */
  readonly resolve: SpellResolver | null;
  /** Activated abilities, in the order they appear on the card. */
  readonly activated: readonly ActivatedAbility[];
}

interface CardDraft {
  name: string;
  manaCost?: string;
  colors?: readonly Color[];
  supertypes?: readonly Supertype[];
  types: readonly CardType[];
  subtypes?: readonly string[];
  power?: number;
  toughness?: number;
  keywords?: readonly Keyword[];
  text?: string;
  targets?: readonly TargetSpec[];
  effect?: EffectSpec;
  resolve?: SpellResolver;
  activated?: readonly ActivatedAbility[];
}

function define(draft: CardDraft): CardDefinition {
  return {
    name: draft.name,
    manaCost: draft.manaCost ?? null,
    colors: draft.colors ?? [],
    supertypes: draft.supertypes ?? [],
    types: draft.types,
    subtypes: draft.subtypes ?? [],
    power: draft.power ?? null,
    toughness: draft.toughness ?? null,
    keywords: draft.keywords ?? [],
    text: draft.text ?? "",
    targets: draft.targets ?? [],
    effect: draft.effect ?? null,
    resolve: draft.resolve ?? null,
    activated: draft.activated ?? [],
  };
}

export function hasKeyword(def: CardDefinition, keyword: Keyword): boolean {
  return def.keywords.includes(keyword);
}

/** The `{T}: Add {C}` ability every mana-producing basic land has. */
const manaTapAbility = (mana: Color): ActivatedAbility => ({
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

const basicLand = (
  name: string,
  subtype: string,
  produces: Color,
): CardDefinition =>
  define({
    name,
    supertypes: ["basic"],
    types: ["land"],
    subtypes: [subtype],
    text: `({T}: Add {${produces}}.)`,
    activated: [manaTapAbility(produces)],
  });

/** The built-in card pool. */
export const BUILTIN_CARDS: readonly CardDefinition[] = [
  basicLand("Plains", "Plains", "W"),
  basicLand("Island", "Island", "U"),
  basicLand("Swamp", "Swamp", "B"),
  basicLand("Mountain", "Mountain", "R"),
  basicLand("Forest", "Forest", "G"),
  define({
    name: "Grizzly Bears",
    manaCost: "{1}{G}",
    colors: ["G"],
    types: ["creature"],
    subtypes: ["Bear"],
    power: 2,
    toughness: 2,
  }),
  define({
    name: "Hill Giant",
    manaCost: "{3}{R}",
    colors: ["R"],
    types: ["creature"],
    subtypes: ["Giant"],
    power: 3,
    toughness: 3,
  }),
  define({
    name: "Rumbling Baloth",
    manaCost: "{3}{G}",
    colors: ["G"],
    types: ["creature"],
    subtypes: ["Beast"],
    power: 4,
    toughness: 4,
  }),
  define({
    name: "Raging Goblin",
    manaCost: "{R}",
    colors: ["R"],
    types: ["creature"],
    subtypes: ["Goblin", "Berserker"],
    power: 1,
    toughness: 1,
    keywords: ["haste"],
  }),
  define({
    name: "Serra Angel",
    manaCost: "{3}{W}{W}",
    colors: ["W"],
    types: ["creature"],
    subtypes: ["Angel"],
    power: 4,
    toughness: 4,
    keywords: ["flying", "vigilance"],
  }),
  define({
    name: "Giant Spider",
    manaCost: "{3}{G}",
    colors: ["G"],
    types: ["creature"],
    subtypes: ["Spider"],
    power: 2,
    toughness: 4,
    keywords: ["reach"],
  }),
  define({
    name: "Wall of Wood",
    manaCost: "{G}",
    colors: ["G"],
    types: ["creature"],
    subtypes: ["Wall"],
    power: 0,
    toughness: 3,
    keywords: ["defender"],
  }),
  define({
    name: "Llanowar Elves",
    manaCost: "{G}",
    colors: ["G"],
    types: ["creature"],
    subtypes: ["Elf", "Druid"],
    power: 1,
    toughness: 1,
    text: "{T}: Add {G}.",
    activated: [manaTapAbility("G")],
  }),
  define({
    name: "Prodigal Sorcerer",
    manaCost: "{2}{U}",
    colors: ["U"],
    types: ["creature"],
    subtypes: ["Human", "Wizard"],
    power: 1,
    toughness: 1,
    text: "{T}: Prodigal Sorcerer deals 1 damage to any target.",
    activated: [
      {
        cost: { mana: null, tap: true },
        targets: ["any-target"],
        effect: { kind: "damage", amount: 1, target: 0 },
        resolve: null,
        text: "{T}: Prodigal Sorcerer deals 1 damage to any target.",
      },
    ],
  }),
  define({
    name: "Lightning Bolt",
    manaCost: "{R}",
    colors: ["R"],
    types: ["instant"],
    text: "Lightning Bolt deals 3 damage to any target.",
    targets: ["any-target"],
    effect: { kind: "damage", amount: 3, target: 0 },
  }),
];

export class CardRegistry {
  private readonly byName = new Map<string, CardDefinition>();

  register(def: CardDefinition): this {
    if (this.byName.has(def.name)) {
      throw new Error(`card already registered: ${def.name}`);
    }
    this.byName.set(def.name, def);
    return this;
  }

  has(name: string): boolean {
    return this.byName.has(name);
  }

  get(name: string): CardDefinition {
    const def = this.byName.get(name);
    if (def === undefined) throw new Error(`unknown card: ${name}`);
    return def;
  }

  get size(): number {
    return this.byName.size;
  }
}

export function createDefaultRegistry(): CardRegistry {
  const registry = new CardRegistry();
  for (const card of BUILTIN_CARDS) registry.register(card);
  return registry;
}
