/**
 * The `CardDefinition` shape and the `defineCard` builder.
 *
 * This is the *framework* for authoring cards — the vocabulary, not the pool.
 * The pool lives in `pool/` and `tokens/` (one file per card) and is stitched
 * together into `BUILTIN_CARDS` by the generated `generated.ts` (see
 * `scripts/gen-cards.mjs`). `cards.ts` re-exports everything here so existing
 * `import … from "./cards.js"` sites are unaffected.
 *
 * Behavior is authored declaratively (`effect`). Cards whose rules text the
 * declarative vocab can't express carry an imperative `resolve` script (the
 * escape hatch). Vanilla permanents need neither.
 */

import type { ActivatedAbility, TriggeredAbility } from "../abilities.js";
import type { EffectSpec, SpellResolver } from "../effects.js";
import type { Color } from "../mana.js";
import type { ReplacementSpec } from "../replacements.js";
import type { TargetSpec } from "../target.js";

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
  | "menace"
  | "indestructible"
  | "hexproof"
  | "flash";

/** Which objects a static ability applies its continuous effect to. */
export type AffectSpec =
  | { readonly scope: "self" }
  | {
      readonly scope: "creatures-you-control";
      readonly excludeSelf?: boolean;
      readonly subtype?: string;
    }
  | { readonly scope: "attached" };

/** A dynamic quantity a characteristic-defining ability can read (rule 604.3). */
export type CountSpec =
  | "cards-in-all-graveyards"
  | "creature-cards-in-all-graveyards"
  | "lands-you-control";

/**
 * A static ability: continuously modifies characteristics (rule 613 layers 6 /
 * 7b / 7d), and/or carries a `replacement` clause (rule 614 — applied by
 * `game.ts`, not by the layer fold).
 */
export interface StaticAbility {
  readonly affects: AffectSpec;
  /** A replacement effect (rule 614) — see `replacements.ts`. Phase 1a: only
   * `enters-battlefield` self-replacements. */
  readonly replacement?: ReplacementSpec;
  /** `[power, toughness]` bonus applied in layer 7d. */
  readonly grantPt?: readonly [number, number];
  /** Keywords granted in layer 6. */
  readonly grantKeywords?: readonly Keyword[];
  /** Layer 7b: set base power and toughness to a dynamic count (+ the given
   * offsets). Only meaningful with `affects.scope === "self"` (a CDA). */
  readonly setBasePtFromCount?: {
    readonly countOf: CountSpec;
    readonly plusPower: number;
    readonly plusToughness: number;
  };
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
  /** While this permanent is on the battlefield, its controller's top library
   * card is public knowledge (rule-text like Oracle of Mul Daya's "play with
   * the top card of your library revealed") — a zone-visibility effect, not
   * a characteristic, so it lives outside the `static` (layers 6/7) vocab. */
  readonly revealsOwnLibraryTop: boolean;
  /** An Aura whose controller controls the enchanted permanent for as long as
   * it stays attached (Mind Control — rule 613.1b, layer 2). */
  readonly controlEnchanted: boolean;
  /** This permanent enters as a copy of another permanent its controller
   * chooses (Clone — rule 707); `filter` narrows what may be copied. `null`
   * for a normal card. */
  readonly copyOnEnter: { readonly filter: "creature" } | null;
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
  revealsOwnLibraryTop?: boolean;
  controlEnchanted?: boolean;
  copyOnEnter?: { readonly filter: "creature" };
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
    revealsOwnLibraryTop: draft.revealsOwnLibraryTop ?? false,
    controlEnchanted: draft.controlEnchanted ?? false,
    copyOnEnter: draft.copyOnEnter ?? null,
  };
}

export function hasKeyword(def: CardDefinition, keyword: Keyword): boolean {
  return def.keywords.includes(keyword);
}
