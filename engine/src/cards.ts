/**
 * Card definitions and the registry that resolves a card name to its printed
 * characteristics.
 *
 * Behavior is authored declaratively (the fields below). Cards whose rules text
 * the declarative model can't yet express carry an imperative {@link CardScript}
 * escape hatch. Milestone 1 ships only vanilla cards, so no script is used yet.
 */

import type { Color } from "./mana.js";

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

/** Imperative escape hatch for behavior the declarative model can't express. */
export interface CardScript {
  readonly [hook: string]: unknown;
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
  readonly text: string;
  readonly script: CardScript | null;
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
  text?: string;
  script?: CardScript;
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
    text: draft.text ?? "",
    script: draft.script ?? null,
  };
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
  });

/** The small built-in card pool used by milestone 1. */
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
