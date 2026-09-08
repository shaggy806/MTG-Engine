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
import type { EffectSpec, ModeOption, SpellResolver } from "../effects.js";
import type { CardFilter } from "../filter.js";
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
  | "flash"
  /** Can't be blocked (Invisible Stalker). Evasion, checked in combat. */
  | "unblockable"
  /** Daybound (rule 702.145 — ROADMAP Phase 10b): the front face of a modern
   * werewolf. As it becomes night, daybound permanents transform to their
   * nightbound back face; a daybound permanent enters transformed if it's
   * already night, and casting one makes it day if it's neither. */
  | "daybound"
  /** Nightbound (rule 702.146): the back face — it transforms back as it
   * becomes day. */
  | "nightbound";

/** Which objects a static ability applies its continuous effect to. */
export type AffectSpec =
  | { readonly scope: "self" }
  | {
      readonly scope: "creatures-you-control";
      readonly excludeSelf?: boolean;
      readonly subtype?: string;
    }
  /** Every land the source's controller controls (Chromatic Lantern). */
  | { readonly scope: "lands-you-control" }
  | { readonly scope: "attached" };

/** A combat restriction a static ability imposes on the objects it `affects`
 * (Pacifism: can't attack / can't block; Juggernaut: must attack if able). */
export type CombatRestriction = "cant-attack" | "cant-block" | "must-attack";

/** A dynamic quantity a characteristic-defining ability can read (rule 604.3). */
export type CountSpec =
  | "cards-in-all-graveyards"
  | "creature-cards-in-all-graveyards"
  | "lands-you-control";

/**
 * A condition gating a static ability (rule 604.3 — "as long as …"). Evaluated
 * live every time characteristics are recomputed, from the perspective of the
 * static's own permanent (its controller is "you"). When false, the static
 * contributes nothing — no P/T, no keywords, no granted abilities, no cost
 * change. ROADMAP Phase 11 EG-3.
 */
export type StaticCondition =
  /** You control at least `atLeast` permanents matching `filter` (Kird Ape —
   * "as long as you control a Forest"). */
  | { readonly kind: "controls"; readonly filter: CardFilter; readonly atLeast: number }
  /** It's your turn. */
  | { readonly kind: "your-turn" }
  /** Threshold (rule 702.27) — seven or more cards in your graveyard. */
  | { readonly kind: "threshold" }
  /** Metalcraft (rule 702.44) — you control three or more artifacts. */
  | { readonly kind: "metalcraft" };

/**
 * A static ability: continuously modifies characteristics (rule 613 layers 6 /
 * 7b / 7d), and/or carries a `replacement` clause (rule 614 — applied by
 * `game.ts`, not by the layer fold).
 */
export interface StaticAbility {
  readonly affects: AffectSpec;
  /** A condition gating this static (rule 604.3 — "as long as …"). When
   * present and false, the static contributes nothing. Re-evaluated on every
   * characteristics read, so it's live. ROADMAP Phase 11 EG-3. */
  readonly condition?: StaticCondition;
  /** A replacement effect (rule 614) — see `replacements.ts`. Phase 1a: only
   * `enters-battlefield` self-replacements. */
  readonly replacement?: ReplacementSpec;
  /** `[power, toughness]` bonus applied in layer 7d. */
  readonly grantPt?: readonly [number, number];
  /** Keywords granted in layer 6. */
  readonly grantKeywords?: readonly Keyword[];
  /** Activated abilities this static grants to every object it `affects`
   * (Chromatic Lantern: "Lands you control have '{T}: Add one mana of any
   * color.'"; Cryptolith Rite does the same for creatures). Rule 613 layer 6 —
   * ability enumeration (`legalActions` / `manaSources` / `activateAbility`)
   * consults these on top of a permanent's printed `activated`, appended after
   * them so printed-ability indices stay stable. */
  readonly grantsActivated?: readonly ActivatedAbility[];
  /** Combat restrictions imposed on the affected objects (Pacifism, Juggernaut). */
  readonly restrictions?: readonly CombatRestriction[];
  /** Protection (rule 702.16) — the affected object can't be targeted,
   * blocked, enchanted/equipped, or damaged by a source whose colour or type
   * matches (White Knight: `{ colors: ["B"] }`). */
  readonly protection?: {
    readonly colors?: readonly Color[];
    readonly types?: readonly CardType[];
  };
  /** Ward (rule 702.21) — an opponent targeting this permanent (`affects:
   * "self"`) must pay this or their spell/ability is countered. Applied at the
   * target's resolution, auto-paid if the opponent can afford it. */
  readonly ward?: { readonly mana?: string; readonly payLife?: number };
  /** Adjust the generic-mana cost of matching *spells* as they're cast
   * (Foundry Inspector: `{ applies: { type: "artifact", controlledBy: "you" },
   * reduceGeneric: 1 }`; Thalia: `{ applies: { notTypes: ["creature"] },
   * increaseGeneric: 1 }`). Rule 601.2f. `affects` is ignored — the filter
   * `applies` says what it hits. */
  readonly costModification?: {
    readonly applies: CardFilter;
    readonly reduceGeneric?: number;
    readonly increaseGeneric?: number;
  };
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
  /** Target slots, in order. Chosen when the spell is cast. Empty for a
   * `castModal` spell (its targets come from the chosen modes). */
  readonly targets: readonly TargetSpec[];
  /** A *targeted* modal spell (rule 700.2 — ROADMAP Phase 11 EG-2): the
   * caster picks `minModes..maxModes` modes *as it's cast* (601.2b), then
   * targets for those modes (601.2c). Each mode's `effect` applies with its
   * own target slice. `null` for a non-modal card; a non-targeted modal spell
   * uses the resolution-time `modal` {@link EffectSpec} instead. */
  readonly castModal: {
    readonly minModes: number;
    readonly maxModes: number;
    readonly modes: readonly ModeOption[];
  } | null;
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
  /** Starting loyalty for a planeswalker (rule 306.5b — it enters with this
   * many loyalty counters). `null` for a non-planeswalker. `defineCard`
   * synthesizes the enters-with-counters replacement from this. */
  readonly loyalty: number | null;
  /** Flashback (rule 702.34) — this instant/sorcery may be cast from its
   * owner's graveyard for `cost` instead of its mana cost; a spell so cast is
   * exiled instead of going anywhere else from the stack. `null` for a card
   * without flashback. */
  readonly flashback: { readonly cost: string } | null;
  /** Foretell (rule 702.144 — ROADMAP Phase 6b) — during your turn you may pay
   * `{2}` to exile this card from your hand face-down; on a later turn you may
   * cast it from exile for `cost`. `null` for a card without foretell. */
  readonly foretell: { readonly cost: string } | null;
  /** Escape (rule 702.139 — ROADMAP Phase 6b) — cast from your graveyard for
   * `cost` plus exiling `exileCount` other cards from your graveyard as an
   * additional cost. Unlike flashback the spell resolves normally (it can be
   * escaped again). `null` for a card without escape. */
  readonly escape: { readonly cost: string; readonly exileCount: number } | null;
  /** Suspend (rule 702.62 — ROADMAP Phase 6b) — instead of casting this from
   * your hand you may pay `cost` to exile it with `n` time counters; one comes
   * off at each of your upkeeps, and at zero it's cast for free (with haste if
   * it's a creature). `null` for a card without suspend. */
  readonly suspend: { readonly n: number; readonly cost: string } | null;
  /** Saga chapters (rule 714 — ROADMAP Phase 10). A Saga enters with one lore
   * counter and gains one at the start of its controller's precombat main
   * phase; each `SagaChapter` fires when the lore count reaches any number in
   * its `at`. After the final chapter's ability leaves the stack the Saga is
   * sacrificed (an SBA). `null` for a non-Saga. */
  readonly chapters: readonly SagaChapter[] | null;
  /** The faces of a multi-face card (rule 712 — ROADMAP Phase 10a/10b), by
   * name, front face first. Each name is registered under its own
   * `CardDefinition` like any card. A card with `faces` is cast/played by
   * choosing a face (`cast-spell` / `play-land` carry `face`); a transform
   * effect flips `GameObject.face` in place. `null` (or length < 2) for a
   * single-faced card. Every face's own `CardDefinition` should carry the same
   * `faces` list so `registry.get(backName).faces` works too. */
  readonly faces: readonly string[] | null;
  /** "This spell can't be countered." (rule 701.5f) — a `counter` effect / a
   * ward "counter it" clause does nothing to this spell. `false` for normal
   * cards. */
  readonly cantBeCountered: boolean;
  /** True for a *transforming* double-faced card (rule 712.4 — ROADMAP Phase
   * 10b): it's only ever cast/played as its front face, and turns over in
   * place via a transform effect / a day-night change (werewolves) / an
   * "enters transformed" clause. A modal DFC (`faces` set, `transform` false)
   * is cast by choosing a face and never turns over. Set on both faces. */
  readonly transform: boolean;
  /** Disturb (rule 702.150 — ROADMAP Phase 10) — a transforming DFC whose back
   * face may be cast from the graveyard for `cost`; a spell so cast is exiled
   * instead of going anywhere else (like flashback), and a permanent back face
   * enters transformed. Set on the front face's def. `null` without disturb. */
  readonly disturb: { readonly cost: string } | null;
  /** Adventure (rule 715 — ROADMAP Phase 10) — a creature card with an
   * instant/sorcery "adventure" as its second `faces` entry. Casting the
   * adventure exiles the card (rather than graveyard) with a "you may cast the
   * creature later from exile" permission. `true` on both faces. */
  readonly adventure: boolean;
}

/** One chapter ability of a Saga (rule 714.2c). `at` lists the lore-counter
 * counts that fire it — usually `[1]` / `[2]` / `[3]`, but a shared "I, II"
 * ability uses `[1, 2]`. Shaped like a targeted triggered ability. */
export interface SagaChapter {
  readonly at: readonly number[];
  readonly targets: readonly TargetSpec[];
  readonly effect: EffectSpec | null;
  readonly resolve: SpellResolver | null;
  readonly text: string;
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
  castModal?: {
    readonly minModes: number;
    readonly maxModes: number;
    readonly modes: readonly ModeOption[];
  };
  effect?: EffectSpec;
  resolve?: SpellResolver;
  activated?: readonly ActivatedAbility[];
  triggered?: readonly TriggeredAbility[];
  static?: readonly StaticAbility[];
  revealsOwnLibraryTop?: boolean;
  controlEnchanted?: boolean;
  copyOnEnter?: { readonly filter: "creature" };
  loyalty?: number;
  flashback?: { readonly cost: string };
  foretell?: { readonly cost: string };
  suspend?: { readonly n: number; readonly cost: string };
  escape?: { readonly cost: string; readonly exileCount: number };
  chapters?: readonly SagaChapter[];
  faces?: readonly string[];
  cantBeCountered?: boolean;
  transform?: boolean;
  disturb?: { readonly cost: string };
  adventure?: boolean;
}

/** Build a {@link CardDefinition} from a partial draft, filling in defaults. */
export function defineCard(draft: CardDraft): CardDefinition {
  const loyalty = draft.loyalty ?? null;
  // A planeswalker enters with `loyalty` loyalty counters (rule 306.5b) —
  // synthesized as an enters-with-counters self-replacement so the existing
  // `moveObject` / Doubling Season machinery applies unchanged.
  const loyaltyStatic: readonly StaticAbility[] =
    loyalty === null
      ? []
      : [
          {
            affects: { scope: "self" },
            replacement: {
              event: "enters-battlefield",
              counters: { kind: "loyalty", amount: loyalty },
            },
            text: `${draft.name} enters with ${loyalty} loyalty counters.`,
          },
        ];
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
    castModal: draft.castModal ?? null,
    effect: draft.effect ?? null,
    resolve: draft.resolve ?? null,
    activated: draft.activated ?? [],
    triggered: draft.triggered ?? [],
    static: [...(draft.static ?? []), ...loyaltyStatic],
    revealsOwnLibraryTop: draft.revealsOwnLibraryTop ?? false,
    controlEnchanted: draft.controlEnchanted ?? false,
    copyOnEnter: draft.copyOnEnter ?? null,
    loyalty,
    flashback: draft.flashback ?? null,
    foretell: draft.foretell ?? null,
    suspend: draft.suspend ?? null,
    escape: draft.escape ?? null,
    chapters: draft.chapters ?? null,
    faces: draft.faces ?? null,
    cantBeCountered: draft.cantBeCountered ?? false,
    transform: draft.transform ?? false,
    disturb: draft.disturb ?? null,
    adventure: draft.adventure ?? false,
  };
}

export function hasKeyword(def: CardDefinition, keyword: Keyword): boolean {
  return def.keywords.includes(keyword);
}
