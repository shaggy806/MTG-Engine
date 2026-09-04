/**
 * Card definitions and the registry that resolves a card name to its printed
 * characteristics.
 *
 * Behavior is authored declaratively (`effect`). Cards whose rules text the
 * declarative vocab can't express carry an imperative `resolve` script (the
 * escape hatch). Vanilla permanents need neither.
 */

import type { ActivatedAbility, TriggeredAbility } from "./abilities.js";
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

/** Which objects a static ability applies its continuous effect to. */
export type AffectSpec =
  | { readonly scope: "self" }
  | {
      readonly scope: "creatures-you-control";
      readonly excludeSelf?: boolean;
      readonly subtype?: string;
    }
  | { readonly scope: "attached" };

/**
 * A static ability that continuously modifies characteristics. Milestone 5a
 * covers rule 613 layers 6 (keyword grants) and 7d (P/T bonuses) only.
 */
export interface StaticAbility {
  readonly affects: AffectSpec;
  /** `[power, toughness]` bonus applied in layer 7d. */
  readonly grantPt?: readonly [number, number];
  /** Keywords granted in layer 6. */
  readonly grantKeywords?: readonly Keyword[];
  readonly text: string;
}

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
  /** Triggered abilities, in the order they appear on the card. */
  readonly triggered: readonly TriggeredAbility[];
  /** Static abilities (continuous effects). */
  readonly static: readonly StaticAbility[];
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
  triggered?: readonly TriggeredAbility[];
  static?: readonly StaticAbility[];
}

/** Build a {@link CardDefinition} from a partial draft, filling in defaults. */
export function defineCard(draft: CardDraft): CardDefinition {
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
    triggered: draft.triggered ?? [],
    static: draft.static ?? [],
  };
}

const define = defineCard;

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
    name: "Goblin Raider",
    manaCost: "{1}{R}",
    colors: ["R"],
    types: ["creature"],
    subtypes: ["Goblin"],
    power: 2,
    toughness: 2,
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
  define({
    name: "Giant Growth",
    manaCost: "{G}",
    colors: ["G"],
    types: ["instant"],
    text: "Target creature gets +3/+3 until end of turn.",
    targets: ["creature"],
    effect: {
      kind: "modify-pt",
      target: 0,
      power: 3,
      toughness: 3,
      duration: "end-of-turn",
    },
  }),
  define({
    name: "Jump",
    manaCost: "{U}",
    colors: ["U"],
    types: ["instant"],
    text: "Target creature gains flying until end of turn.",
    targets: ["creature"],
    effect: {
      kind: "grant-keyword",
      target: 0,
      keyword: "flying",
      duration: "end-of-turn",
    },
  }),
  define({
    name: "Disenchant",
    manaCost: "{1}{W}",
    colors: ["W"],
    types: ["instant"],
    text: "Destroy target permanent.",
    targets: ["permanent"],
    effect: { kind: "destroy", target: 0 },
  }),
  define({
    name: "Glorious Anthem",
    manaCost: "{1}{W}{W}",
    colors: ["W"],
    types: ["enchantment"],
    text: "Creatures you control get +1/+1.",
    static: [
      {
        affects: { scope: "creatures-you-control" },
        grantPt: [1, 1],
        text: "Creatures you control get +1/+1.",
      },
    ],
  }),
  define({
    name: "Levitation",
    manaCost: "{2}{U}",
    colors: ["U"],
    types: ["enchantment"],
    text: "Creatures you control have flying.",
    static: [
      {
        affects: { scope: "creatures-you-control" },
        grantKeywords: ["flying"],
        text: "Creatures you control have flying.",
      },
    ],
  }),
  define({
    name: "Goblin Chieftain",
    manaCost: "{1}{R}{R}",
    colors: ["R"],
    types: ["creature"],
    subtypes: ["Goblin"],
    power: 2,
    toughness: 2,
    keywords: ["haste"],
    text: "Other Goblin creatures you control get +1/+1 and have haste.",
    static: [
      {
        affects: {
          scope: "creatures-you-control",
          subtype: "Goblin",
          excludeSelf: true,
        },
        grantPt: [1, 1],
        grantKeywords: ["haste"],
        text: "Other Goblin creatures you control get +1/+1 and have haste.",
      },
    ],
  }),
  define({
    name: "Elvish Visionary",
    manaCost: "{1}{G}",
    colors: ["G"],
    types: ["creature"],
    subtypes: ["Elf", "Shaman"],
    power: 1,
    toughness: 1,
    text: "When Elvish Visionary enters the battlefield, draw a card.",
    triggered: [
      {
        trigger: { on: "enters-battlefield", who: "self" },
        targets: [],
        effect: { kind: "draw", amount: 1 },
        resolve: null,
        text: "When Elvish Visionary enters the battlefield, draw a card.",
      },
    ],
  }),
  define({
    name: "Vengeful Ghoul",
    manaCost: "{2}{B}",
    colors: ["B"],
    types: ["creature"],
    subtypes: ["Zombie"],
    power: 2,
    toughness: 2,
    text: "When Vengeful Ghoul dies, it deals 2 damage to any target.",
    triggered: [
      {
        trigger: { on: "dies", who: "self" },
        targets: ["any-target"],
        effect: { kind: "damage", amount: 2, target: 0 },
        resolve: null,
        text: "When Vengeful Ghoul dies, it deals 2 damage to any target.",
      },
    ],
  }),
  define({
    name: "Phyrexian Arena",
    manaCost: "{1}{B}{B}",
    colors: ["B"],
    types: ["enchantment"],
    text: "At the beginning of your upkeep, you draw a card and you lose 1 life.",
    triggered: [
      {
        trigger: { on: "step-begins", step: "upkeep", who: "you" },
        targets: [],
        effect: null,
        resolve: (ctx) => {
          ctx.draw(ctx.controller, 1);
          ctx.loseLife(ctx.controller, 1);
        },
        text: "At the beginning of your upkeep, draw a card and lose 1 life.",
      },
    ],
  }),
  define({
    name: "Wildwood Sentinel",
    manaCost: "{2}{G}",
    colors: ["G"],
    types: ["creature"],
    subtypes: ["Treefolk"],
    power: 2,
    toughness: 2,
    text: "{2}: Put a +1/+1 counter on Wildwood Sentinel.",
    activated: [
      {
        cost: { mana: "{2}", tap: false },
        targets: [],
        effect: {
          kind: "add-counter",
          target: "source",
          counter: "+1/+1",
          amount: 1,
        },
        resolve: null,
        text: "{2}: Put a +1/+1 counter on Wildwood Sentinel.",
      },
    ],
  }),
  define({
    name: "White Knight",
    manaCost: "{W}{W}",
    colors: ["W"],
    types: ["creature"],
    subtypes: ["Human", "Knight"],
    power: 2,
    toughness: 2,
    keywords: ["first-strike"],
    text: "First strike",
  }),
  define({
    name: "Fencing Ace",
    manaCost: "{1}{W}",
    colors: ["W"],
    types: ["creature"],
    subtypes: ["Human", "Soldier"],
    power: 1,
    toughness: 1,
    keywords: ["double-strike"],
    text: "Double strike",
  }),
  define({
    name: "Craw Wurm",
    manaCost: "{4}{G}{G}",
    colors: ["G"],
    types: ["creature"],
    subtypes: ["Wurm"],
    power: 6,
    toughness: 4,
    keywords: ["trample"],
    text: "Trample",
  }),
  define({
    name: "Typhoid Rats",
    manaCost: "{B}",
    colors: ["B"],
    types: ["creature"],
    subtypes: ["Rat"],
    power: 1,
    toughness: 1,
    keywords: ["deathtouch"],
    text: "Deathtouch",
  }),
  define({
    name: "Vampire Nighthawk",
    manaCost: "{1}{B}{B}",
    colors: ["B"],
    types: ["creature"],
    subtypes: ["Vampire", "Shaman"],
    power: 2,
    toughness: 3,
    keywords: ["flying", "deathtouch", "lifelink"],
    text: "Flying, deathtouch, lifelink",
  }),
  define({
    name: "Boggart Brute",
    manaCost: "{1}{B}",
    colors: ["B"],
    types: ["creature"],
    subtypes: ["Goblin", "Warrior"],
    power: 3,
    toughness: 2,
    keywords: ["menace"],
    text: "Menace",
  }),

  // --- tokens ---------------------------------------------------------
  define({
    name: "Phyrexian Wurm Token (Deathtouch)",
    types: ["artifact", "creature"],
    subtypes: ["Phyrexian", "Wurm"],
    power: 3,
    toughness: 3,
    keywords: ["deathtouch"],
    text: "Deathtouch",
  }),
  define({
    name: "Phyrexian Wurm Token (Lifelink)",
    types: ["artifact", "creature"],
    subtypes: ["Phyrexian", "Wurm"],
    power: 3,
    toughness: 3,
    keywords: ["lifelink"],
    text: "Lifelink",
  }),
  define({
    name: "Soldier Token",
    colors: ["W"],
    types: ["creature"],
    subtypes: ["Soldier"],
    power: 1,
    toughness: 1,
  }),
  define({
    name: "Raise the Alarm",
    manaCost: "{1}{W}",
    colors: ["W"],
    types: ["instant"],
    text: "Create two 1/1 white Soldier creature tokens.",
    effect: { kind: "create-token", token: "Soldier Token", count: 2 },
  }),
  define({
    name: "Wurmcoil Engine",
    manaCost: "{6}",
    types: ["artifact", "creature"],
    subtypes: ["Wurm"],
    power: 6,
    toughness: 6,
    keywords: ["deathtouch", "lifelink"],
    text:
      "Deathtouch, lifelink. When Wurmcoil Engine dies, create a 3/3 colorless " +
      "Phyrexian Wurm artifact creature token with deathtouch and a 3/3 " +
      "colorless Phyrexian Wurm artifact creature token with lifelink.",
    triggered: [
      {
        trigger: { on: "dies", who: "self" },
        targets: [],
        effect: null,
        resolve: (ctx) => {
          ctx.createToken("Phyrexian Wurm Token (Deathtouch)", 1);
          ctx.createToken("Phyrexian Wurm Token (Lifelink)", 1);
        },
        text:
          "When Wurmcoil Engine dies, create a 3/3 deathtouch Wurm and a 3/3 " +
          "lifelink Wurm.",
      },
    ],
  }),

  // --- auras & equipment -----------------------------------------------
  define({
    name: "Holy Strength",
    manaCost: "{W}",
    colors: ["W"],
    types: ["enchantment"],
    subtypes: ["Aura"],
    text: "Enchant creature. Enchanted creature gets +1/+2.",
    targets: ["creature"],
    static: [
      {
        affects: { scope: "attached" },
        grantPt: [1, 2],
        text: "Enchanted creature gets +1/+2.",
      },
    ],
  }),
  define({
    name: "Bonesplitter",
    manaCost: "{1}",
    types: ["artifact"],
    subtypes: ["Equipment"],
    text: "Equipped creature gets +2/+0. Equip {1}",
    static: [
      {
        affects: { scope: "attached" },
        grantPt: [2, 0],
        text: "Equipped creature gets +2/+0.",
      },
    ],
    activated: [
      {
        cost: { mana: "{1}", tap: false },
        targets: ["creature-you-control"],
        effect: { kind: "attach", target: 0 },
        resolve: null,
        text: "Equip {1}",
        sorcerySpeed: true,
      },
    ],
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
