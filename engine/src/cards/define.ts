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

import type { ActivatedAbility, CostReductionAmount, TriggeredAbility } from "../abilities.js";
import type { EffectSpec, ModeOption, SpellResolver } from "../effects.js";
import type { AggregateOf, AggregateSpec, CardFilter, NumCompare } from "../filter.js";
import type { Color } from "../mana.js";
import type { ReplacementSpec } from "../replacements.js";
import type { ZoneType } from "../state.js";
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

/**
 * One branch of a choice of additional costs (rule 601.2b) — see
 * `CardDefinition.additionalCost.options`.
 *
 * Exactly one field is set per option in every card authored so far, but
 * nothing depends on that: an option with two fields is paid in full, and is
 * how "discard a card **and** pay 2 life or …" would be written.
 *
 * `mana` is extra generic/coloured mana folded onto the printed cost, the
 * same mechanism kicker uses (Redirect Lightning: "pay 5 life or pay {2}").
 * It is a cost *increase*, not a replacement.
 */
export interface AdditionalCostOption {
  /** What this option is called in the UI ("Pay 3 life"). Shown on the
   * variant's button, so it has to read as an imperative on its own. */
  readonly text: string;
  readonly sacrifice?: CardFilter;
  readonly discard?: number;
  readonly payLife?: number;
  readonly mana?: string;
}

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
  /** Can't be the target of ANY spell or ability, even its controller's own
   * (rule 702.18 — stronger than hexproof, which only blocks opponents —
   * needed-cards P15, Lightning Greaves). */
  | "shroud"
  | "flash"
  /** Can't be blocked (Invisible Stalker). Evasion, checked in combat. */
  | "unblockable"
  /** Fear (rule 702.36) — blockable only by artifact creatures and/or black
   * creatures. */
  | "fear"
  /** Intimidate (rule 702.13) — blockable only by artifact creatures and/or
   * creatures sharing a colour with it (Vela the Night-Clad). */
  | "intimidate"
  /** Landwalk (rule 702.14) — can't be blocked as long as the defending
   * player controls a land of that type. One keyword per land type a card
   * prints: the five basic types, and Desert (Hazezon, Shaper of Sand). The
   * rule lives in `combat/eligibility.ts`'s `LANDWALK`. */
  | "plainswalk"
  | "islandwalk"
  | "swampwalk"
  | "mountainwalk"
  | "forestwalk"
  | "desertwalk"
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
      /**
       * Only creatures that have a counter on them — Rishkar's "each creature
       * you control **with a counter on it** has '{T}: Add {G}'". `kind`
       * omitted means a counter of any kind, which is what that wording means.
       *
       * Narrower than a full `CardFilter` on purpose: `staticAffects` runs on
       * every characteristics read and is deliberately given no `GameState`,
       * and a counter count is answerable from the object alone.
       */
      readonly withCounter?: { readonly kind?: string };
      /** Only *token* creatures — "Zombie tokens you control have flying"
       * (Eternal Skylord). Like `withCounter`, answerable from the object
       * alone, which is why it's a flag here rather than a `CardFilter`. */
      readonly tokenOnly?: boolean;
      /** Only creatures whose colours include the source's `chosenOnEnter`
       * colour — Heraldic Banner's "creatures you control **of the chosen
       * color**". */
      readonly chosenColorOnly?: boolean;
      /**
       * Only creatures with this keyword — Sephara's "other creatures you
       * control **with flying** have indestructible".
       *
       * Matched against the creature's *current* keywords — flying from an
       * Aura or an anthem counts, a creature that lost its abilities has
       * none (rule 613.8a). `collectStaticEffects` applies keyword-scoped
       * statics in a second pass, after the grants they depend on.
       */
      readonly withKeyword?: Keyword;
    }
  /**
   * Every creature on the battlefield, whoever controls it — Gravitational
   * Shift's "creatures with flying get +2/+0". Takes the same narrowing
   * clauses as `creatures-you-control`, and for the same reason they're
   * flags rather than a `CardFilter`: `staticAffects` runs on every
   * characteristics read and is given no `GameState`.
   */
  | {
      readonly scope: "all-creatures";
      readonly excludeSelf?: boolean;
      readonly subtype?: string;
      readonly withKeyword?: Keyword;
      /** Only creatures *without* the keyword — the other half of
       * Gravitational Shift ("creatures without flying get -2/-0"). */
      readonly withoutKeyword?: Keyword;
    }
  /** Every land the source's controller controls (Chromatic Lantern). */
  | { readonly scope: "lands-you-control" }
  | { readonly scope: "attached" };

/** A combat restriction a static ability imposes on the objects it `affects`
 * (Pacifism: can't attack / can't block; Juggernaut: must attack if able;
 * Lure: all creatures able to block this one must do so — rule 509.1c). */
export type CombatRestriction =
  | "cant-attack"
  | "cant-block"
  | "must-attack"
  | "must-be-blocked";

/**
 * A dynamic quantity a characteristic-defining ability can read (rule 604.3).
 * "You" is the object's controller — its owner, off the battlefield, since a
 * CDA works in every zone.
 */
export type CountSpec =
  | "cards-in-all-graveyards"
  /** How many cards are in its controller's hand (Psychosis Crawler) — its
   * owner's, off the battlefield. */
  | "cards-in-your-hand"
  /** Battlefield permanents matching a filter, a token stack counting as
   * every token in it (`permanentCount`) — Beanstalk Giant's "the number of
   * lands you control" is `{ countOf: { type: "land", controlledBy: "you" } }`.
   * The CDA's own object is counted when it matches, as the rules say. */
  | { readonly countOf: CardFilter }
  /** Cards in **all** graveyards matching a filter — Mortivore's "creature
   * cards in all graveyards". `ownedBy: "you"` narrows it to your own. */
  | { readonly countInGraveyard: CardFilter };

/**
 * A per-player running total the engine keeps for the current turn, readable
 * by a card as a condition ({@link StaticCondition}) or an amount
 * (`EffectAmount`'s `turnStat`).
 *
 * Deliberately a short list. These are the three the pool actually needs,
 * measured against the top 2000 cards and the top 500 commanders rather than
 * guessed: about ten cards each for the two life totals and three for draws.
 * Two candidates were dropped on the same evidence — "damage dealt this
 * turn" had no real users once the regex false-positives were read, and
 * "permanents that entered this turn" is a *per-object* question already
 * answered by `GameObject.enteredBattlefieldOnTurn`, not a count.
 *
 * Spells cast, creatures died and lands played are also tracked per turn,
 * but as their own `PlayerState` fields with their own conditions, and are
 * not folded in here: ~60 call sites read them, and moving those would be a
 * large mechanical change for no behaviour.
 */
export type TurnStat = "life-lost" | "life-gained" | "cards-drawn";

/**
 * A condition gating a static ability (rule 604.3 — "as long as …"). Evaluated
 * live every time characteristics are recomputed, from the perspective of the
 * static's own permanent (its controller is "you"). When false, the static
 * contributes nothing — no P/T, no keywords, no granted abilities, no cost
 * change. ROADMAP Phase 11 EG-3.
 *
 * The same union is also a triggered ability's intervening-if clause
 * ({@link TriggeredAbility.condition} — rule 603.4), where it's checked as the
 * trigger fires and again as it resolves.
 */
export type StaticCondition =
  /** You control at least `atLeast` permanents matching `filter` (Kird Ape —
   * "as long as you control a Forest"). A static's condition leaves its own
   * permanent out of the count (`ConditionOptions.includeSelf`); `countsSelf`
   * puts it back, for a count the printed text includes it in (Jetmir, Nexus
   * of Revels — "as long as you control three or more creatures", Jetmir being
   * one). Keep such a `filter` to type/subtype/colour clauses, which
   * `matchesFilter` answers without folding the source's own characteristics. */
  | {
      readonly kind: "controls";
      readonly filter: CardFilter;
      readonly atLeast: number;
      /**
       * "If you control **another** Wizard". A *static* ability's condition
       * already leaves its own permanent out (see `ConditionOptions`); this
       * is for a triggered ability's intervening-if and a `conditional`
       * effect, which count the source unless told not to. One permanent,
       * not one object: the rest of a token stack still counts.
       */
      readonly excludeSelf?: boolean;
      /** Leave out whatever target slot `excludeTarget` names — "if you
       * control a creature **other than that creature**". Only meaningful
       * where there are targets (a `conditional` effect); ignored on a
       * static ability. */
      readonly excludeTarget?: number;
      readonly countsSelf?: boolean;
    }
  /**
   * A sum or maximum over matching battlefield permanents compared against a
   * number — Finneas, Ace Archer's "if creatures you control have **total
   * power 10 or greater**" is `{ value: { aggregate: "sum", of: "power",
   * filter: { type: "creature", controlledBy: "you" } }, compare: { op:
   * "gte", n: 10 } }`. A token stack counts once per token in a sum.
   *
   * On a *static* ability the source's own value is left out, as every
   * board-scanning condition does (its characteristics are what is being
   * computed); a triggered ability and a `conditional` effect count it.
   */
  | {
      readonly kind: "aggregate";
      readonly value: AggregateSpec;
      readonly compare: NumCompare;
    }
  /**
   * The source's own power / toughness / mana value is the greatest among
   * the permanents matching `filter` — "if ~'s power is **greater than each
   * other creature's power**" (`strict`, where a tie fails) or "~ has the
   * greatest power among creatures you control" (a tie still has the
   * greatest, rule-wise). Vacuously true when nothing else matches. Another
   * member of the source's own token stack is an "other" creature, and has
   * the same value.
   *
   * On a static ability the source's own value is read with that static's
   * condition switched off (the re-entrancy guard), so a static whose own
   * P/T grant would change the answer is not modeled.
   */
  | {
      readonly kind: "source-greatest";
      readonly of: AggregateOf;
      readonly filter: CardFilter;
      readonly strict?: boolean;
    }
  /** *Some one* opponent controls at least `atLeast` permanents matching
   * `filter` (Defense of the Heart — "if an opponent controls three or more
   * creatures"). Each opponent is counted separately — three creatures spread
   * across two opponents doesn't satisfy `atLeast: 3`. `filter` is evaluated
   * with that opponent as its "you". needed-cards P7. */
  | {
      readonly kind: "opponent-controls";
      readonly filter: CardFilter;
      readonly atLeast: number;
    }
  /** Your opponents control at least `atLeast` permanents matching `filter`
   * *combined* (Turbulent Fen — "unless your opponents control eight or more
   * lands"; plural "opponents" sums across all of them, unlike the singular
   * "an opponent" of `opponent-controls`). `filter` is evaluated with each
   * permanent's own controller as its "you". needed-cards P17. */
  | {
      readonly kind: "opponents-control-total";
      readonly filter: CardFilter;
      readonly atLeast: number;
    }
  /**
   * You have at least `atLeast` opponents still in the game — the Battlebond
   * cycle's "unless you have two or more opponents" (Morphic Pool, Sea of
   * Clouds, ...), which is a check on the *table* rather than on any board.
   *
   * Players who have lost don't count, so a four-player game that has become
   * a duel stops satisfying it, which is what the printed card says.
   */
  | { readonly kind: "opponent-count"; readonly atLeast: number }
  /** It's your turn. */
  | { readonly kind: "your-turn" }
  /** Who is the monarch (rule 720): you, or any opponent (Queen Marchesa's
   * "if an opponent is the monarch"). False while nobody is. */
  | { readonly kind: "monarch"; readonly who: "you" | "opponent" }
  /** How many cards are in your hand, inclusive bounds (Flubs, the Fool: "if
   * you have no cards in hand" is `atMost: 0`; hellbent the same). */
  | { readonly kind: "hand-size"; readonly atMost?: number; readonly atLeast?: number }
  /** Threshold (rule 702.27) — seven or more cards in your graveyard. */
  | { readonly kind: "threshold" }
  /** Delirium (rule 702.120) — four or more *card types* among the cards in
   * your graveyard. Counts distinct types, not cards: one artifact creature
   * is two of the four. A card's printed types are what count — layer
   * effects don't reach a graveyard. */
  | { readonly kind: "delirium" }
  /** Metalcraft (rule 702.44) — you control three or more artifacts. */
  | { readonly kind: "metalcraft" }
  /**
   * A per-turn running total reached `atLeast` (Y'shtola: "if a player lost
   * 4 or more life this turn"; The Gaffer: "if you gained 3 or more life
   * this turn"; Bloodchief Ascension: "if an opponent lost 2 or more").
   *
   * `who` is what the printed wording turns on, and getting it wrong
   * silently changes the card: **any-player** includes you (Y'shtola),
   * **opponent** is satisfied by any single opponent counted on their own
   * (not the sum), and **you** is only your own total. `atLeast: 1` is the
   * plain "lost life this turn".
   */
  | {
      readonly kind: "turn-stat";
      readonly stat: TurnStat;
      readonly who: "you" | "opponent" | "any-player";
      readonly atLeast: number;
    }
  /** A creature died this turn (Liliana's Devotee). Reads the turn-scoped
   * `GameState.creaturesDiedThisTurn`. */
  | { readonly kind: "creature-died-this-turn" }
  /** The source's controller created a token this turn (Idol of Oblivion). */
  | { readonly kind: "created-token-this-turn" }
  /** The source's controller cast a spell from a graveyard or activated an
   * ability of a card in a graveyard this turn (Laboratory Drudge). */
  | { readonly kind: "used-graveyard-this-turn" }
  /** The negation of another condition — Titan Hunter's "**if no creatures
   * died this turn**". Cheaper than a `no-` variant of every condition, and
   * it composes. */
  | { readonly kind: "not"; readonly of: StaticCondition }
  /** The source's `chosenOnEnter` label equals `value` — Frontier Siege's
   * "Khans" / "Dragons" halves. */
  | { readonly kind: "chosen-on-enter"; readonly value: string }
  /** An opponent of the source's controller has lost life this turn (Theater
   * of Horrors). Reads the per-player `lifeLostThisTurn` amount as `> 0`. */
  | { readonly kind: "opponent-lost-life-this-turn" }
  /**
   * The object whose event fired the *triggered ability* currently resolving
   * matches `filter` — Akoum Hellkite's "Whenever a land you control enters,
   * … If that land is a Mountain, [it] deals 2 damage instead".
   *
   * Only meaningful inside a `conditional` effect of a triggered ability,
   * where `ResolutionContext.triggerObject` is set; a *static* ability has no
   * triggering object and this is always false there. A triggering
   * permanent that has left the battlefield since is matched as it last
   * existed there (rule 608.2h — "if it was a Saproling").
   */
  | { readonly kind: "trigger-object"; readonly filter: CardFilter }
  /**
   * The object in target slot `index` matches `filter` — Scavenging Ooze's
   * "Exile target card from a graveyard. **If it was a creature card**, put a
   * +1/+1 counter on this creature and you gain 1 life."
   *
   * Like `trigger-object`, only meaningful inside a `conditional` effect,
   * where the resolution context knows the chosen targets; always false on a
   * static ability. A target that was a permanent and has left the
   * battlefield since is matched as it last existed there (rule 608.2h); any
   * other target — a card targeted in a graveyard — as it is now.
   */
  | { readonly kind: "target"; readonly index: number; readonly filter: CardFilter }
  /**
   * The permanent sacrificed to pay the spell's or ability's cost (or by a
   * `sacrifice-source` step before this one) matched `filter` as it last
   * existed on the battlefield — "if the sacrificed creature was a
   * commander", "if it was a Hamster". False when nothing was sacrificed.
   * Like `target`, only meaningful inside a `conditional` effect; always
   * false on a static ability.
   */
  | { readonly kind: "sacrificed"; readonly filter: CardFilter }
  /**
   * "If this is the **Nth time this ability has resolved this turn**" (Omnath,
   * Locus of Creation; Ms. Bumbleflower; Tannuk). `n` counts the resolution
   * in progress, so a first resolution is `1`. The count belongs to one
   * ability of one object: a permanent that leaves and comes back is a new
   * object with a fresh count (rule 400.7), and an ability that's countered
   * or fizzles never resolved. See `Game.recordAbilityResolution`.
   *
   * Like `trigger-object`, only meaningful inside a `conditional` effect of
   * the ability itself; always false on a static ability.
   */
  | { readonly kind: "resolved-this-turn"; readonly n: number }
  /**
   * The ability's own source matches `filter` — "as long as ~ is equipped",
   * "if ~ is attacking", "if ~ is tapped". A triggered ability whose source
   * was a permanent that has since left (its own dies trigger) reads it as it
   * last existed on the battlefield (rule 603.10a); anything else, wherever
   * the source now is.
   */
  | { readonly kind: "source"; readonly filter: CardFilter }
  /**
   * Where the ability's own source is, as an intervening-if (rule 603.4):
   * Eminence's "if ~ is in the command zone or on the battlefield" (Edgar
   * Markov), or "if ~ is still on the battlefield".
   *
   * With `sameObject`, only the object the ability came from counts. A
   * permanent that left and came back, or a commander cast from the command
   * zone since, is a new object (rule 400.7), told apart by the timestamp the
   * ability recorded (`GameObject.sourceTimestamp`). Only a triggered
   * ability's resolution check has one to compare; anywhere else the source
   * is that object by definition.
   */
  | {
      readonly kind: "source-zone";
      readonly zones: readonly ZoneType[];
      readonly sameObject?: boolean;
    }
  /**
   * Was the ability's own source cast with its kicker paid? — Verix
   * Bladewing's "When this enters, **if it was kicked**, …".
   *
   * A *permanent* spell's kicker rider can't live in `CardDefinition.kicker`
   * the way an instant's does: the rider resolves after the permanent is
   * already on the battlefield, so it's an ETB trigger with an intervening-if
   * (rule 603.4) reading the `kicked` flag the cast left on the object.
   */
  | { readonly kind: "self-kicked" }
  /**
   * How many counters the ability's own source has — Undying's "**if it had
   * no +1/+1 counters on it**".
   *
   * Reads last-known information once the source has left the battlefield
   * (rule 603.10), which is the only way this question can be asked at all:
   * a dies-trigger is checked after the permanent is already in a graveyard,
   * and `moveObject` clears counters on every zone change.
   */
  | {
      readonly kind: "self-counters";
      readonly counter?: string;
      readonly compare: NumCompare;
    };

/**
 * A static ability: continuously modifies characteristics (rule 613 layers 6 /
 * 7b / 7d), and/or carries a `replacement` clause (rule 614 — applied by
 * `game.ts`, not by the layer fold).
 */
export interface StaticAbility {
  readonly affects: AffectSpec;
  /**
   * Eminence (rule 702.106) — this static functions while its card is in the
   * **command zone** as well as on the battlefield (The Ur-Dragon: "as long
   * as The Ur-Dragon is in the command zone or on the battlefield, other
   * Dragon spells you cast cost {1} less").
   *
   * Per ability, mirroring `TriggeredAbility.fromCommandZone`: a card's other
   * statics still need it on the battlefield. Only the `costModification`
   * scan honours it so far, which is the shape Eminence actually prints —
   * a command-zone card has no characteristics to hand out, so the layer
   * fold has nothing to do with it.
   */
  readonly fromCommandZone?: boolean;
  /** A condition gating this static (rule 604.3 — "as long as …"). When
   * present and false, the static contributes nothing. Re-evaluated on every
   * characteristics read, so it's live. ROADMAP Phase 11 EG-3. */
  readonly condition?: StaticCondition;
  /** A replacement effect (rule 614) — see `replacements.ts`. Phase 1a: only
   * `enters-battlefield` self-replacements. */
  readonly replacement?: ReplacementSpec;
  /** `[power, toughness]` bonus applied in layer 7d. */
  readonly grantPt?: readonly [number, number];
  /**
   * A layer-7d bonus that *scales* with a live count — Skycat Sovereign's
   * "gets +1/+1 for each **other** creature you control with flying".
   *
   * Distinct from `setBasePtFromCount`, which is a CDA (layer 7b) that
   * replaces the printed P/T; this adds on top, so counters and other
   * anthems stack with it normally. `excludeSelf` is what "other" means.
   */
  readonly grantPtPerCount?: {
    /** What to count: battlefield permanents matching a filter, or the number
     * of times the controller has cast a commander from the command zone this
     * game (Commander's Insignia). */
    readonly filter?: CardFilter;
    readonly commanderCasts?: boolean;
    readonly pt: readonly [number, number];
    readonly excludeSelf?: boolean;
  };
  /** The creature this is attached to "can't attack you or planeswalkers you
   * control" (Vow of Duty), where "you" is *this* permanent's controller.
   * Checked directly in `whyCannotAttack` rather than as a
   * `CombatRestriction`: those are bare strings, and this one has to know
   * whose "you" it means. Only meaningful with `affects: { scope: "attached" }`. */
  readonly cantAttackController?: boolean;
  /** Keywords granted in layer 6. */
  readonly grantKeywords?: readonly Keyword[];
  /** Activated abilities this static grants to every object it `affects`
   * (Chromatic Lantern: "Lands you control have '{T}: Add one mana of any
   * color.'"; Cryptolith Rite does the same for creatures). Rule 613 layer 6 —
   * ability enumeration (`legalActions` / `manaSources` / `activateAbility`)
   * consults these on top of a permanent's printed `activated`, appended after
   * them so printed-ability indices stay stable. */
  readonly grantsActivated?: readonly ActivatedAbility[];
  /**
   * Triggered abilities this static grants to every object it `affects` —
   * Tyrant's Familiar's Lieutenant clause, "… and has 'Whenever this creature
   * attacks, it deals 7 damage to target creature defending player
   * controls.'"
   *
   * The mirror of `grantsActivated` in layer 6: `detectTriggers` consults
   * these on top of a permanent's printed `triggered`, appended after them so
   * a printed ability's index — which `PendingTrigger.abilityIndex` and the
   * stack object both carry — stays stable.
   */
  readonly grantsTriggered?: readonly TriggeredAbility[];
  /**
   * A permission to cast spells from your **graveyard**, for their normal
   * cost — Gisa and Geralf's "Once during each of your turns, you may cast a
   * Zombie creature spell from your graveyard".
   *
   * `filter` is matched against the graveyard card's printed
   * characteristics. `oncePerTurn` limits the permanent to one such cast per
   * turn, and `yourTurnOnly` to casting during your own turn; the Gisa and
   * Geralf wording ("once during each of your turns") needs both. The
   * permission belongs to the permanent, so it ends the moment that leaves.
   *
   * `perType` is Muldrotha's allowance instead of a single use: once per turn
   * **per listed permanent type**, a multi-typed card spending just one of
   * its types, which the player picks (each type is its own `LegalAction`
   * variant, carrying `graveyardGrant.asType`). Listing `"land"` extends the
   * permission from casting to *playing* a land, which still takes the land
   * drop. The allowances are per permanent: a new Muldrotha that turn grants
   * a fresh set (the 2018 ruling), since `moveObject` clears them.
   *
   * `exileAfterwards` is Kess's "if a spell cast this way would be put into
   * your graveyard, exile it instead" — flashback's replacement, riding on
   * the spell. `payLife` is an extra cost paid on top of the spell's own
   * ("by paying 3 life in addition to paying their other costs").
   *
   * When several permissions apply to one card, the card is offered once per
   * permission, so which one is spent is the player's choice.
   */
  readonly castFromGraveyard?: {
    readonly filter: CardFilter;
    readonly oncePerTurn?: boolean;
    readonly yourTurnOnly?: boolean;
    readonly perType?: readonly CardType[];
    readonly exileAfterwards?: boolean;
    readonly payLife?: number;
  };
  /** "You have no maximum hand size" (Thought Vessel, Reliquary Tower). A
   * property of the *controller*, not of anything this ability `affects`, so
   * it's read straight off the battlefield at cleanup rather than through the
   * layer system. */
  readonly noMaxHandSize?: boolean;
  /** Combat restrictions imposed on the affected objects (Pacifism, Juggernaut). */
  readonly restrictions?: readonly CombatRestriction[];
  /** A permission (rule 305.9 / 118.9) — while this permanent is on the
   * battlefield its controller may *play* cards matching `filter` from their
   * graveyard (Ramunap Excavator: `{ type: "land" }`). `affects` is ignored;
   * this grants the controller a play permission, not a characteristic. Still
   * costs the land drop / sorcery timing. */
  readonly playFromGraveyard?: CardFilter;
  /** A permission (rule 118.9-adjacent) — while this permanent is on the
   * battlefield its controller may *play* the top card of their library if it
   * matches `filter` (Oracle of Mul Daya: `{ type: "land" }`). `affects` is
   * ignored; this grants the controller a play permission, not a
   * characteristic. Still costs the land drop / sorcery timing. Distinct from
   * `revealsOwnLibraryTop` (the "play with the top card revealed" half). */
  readonly playFromLibraryTop?: CardFilter;
  /** Protection (rule 702.16) — the affected object can't be targeted,
   * blocked, enchanted/equipped, or damaged by a source whose colour or type
   * matches (White Knight: `{ colors: ["B"] }`).
   *
   * The three clauses are **ORed**, because each is a separate quality:
   * "protection from black and from green" is two protections, not one
   * compound one. `filter` covers the qualities a colour or a card type
   * can't name — a subtype (Yawgmoth: `{ filter: { subtype: "Human" } }`),
   * multicoloured (Stonecoil Serpent), colourless — and, since a `CardFilter`
   * with no clauses matches everything, `{ filter: {} }` is "protection from
   * everything" (rule 702.16e).
   *
   * A `filter` is only evaluated when the engine knows *which object* the
   * source is. That is always true of a permanent and of a spell on the
   * stack; where it isn't, the colour and type clauses still apply and the
   * filter conservatively doesn't block. See `protectionBlocks`. */
  readonly protection?: {
    readonly colors?: readonly Color[];
    readonly types?: readonly CardType[];
    readonly filter?: CardFilter;
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
    /** "**Other** Dragon spells you cast cost {1} less" (The Ur-Dragon) —
     * the source's own card doesn't get its own discount. Matters most for
     * an Eminence cost-reduction, which is live while the card is in the
     * command zone and so would otherwise discount casting itself. */
    readonly otherOnly?: boolean;
    /** A fixed amount, or a live count of battlefield permanents matching a
     * filter, evaluated with this static's controller as "you" (Temur
     * Battlecrier: "{1} less for each creature you control with power 4 or
     * greater" — needed-cards P16). */
    readonly reduceGeneric?: CostReductionAmount;
    readonly increaseGeneric?: number;
    /** Also require the spell's subtype to match this permanent's own
     * `chosenCreatureType` (Urza's Incubator: "creature spells of the chosen
     * type" — needed-cards P14). No effect (matches nothing) before the
     * ETB choice is made. */
    readonly matchesChosenCreatureType?: boolean;
    /** Who has to be casting the spell, relative to this static's
     * controller: `"you"` ("spells you cast") or `"opponent"` ("spells your
     * opponents cast" — Hinata, Dawn-Crowned). Judged against the actual
     * caster, not the card's controller, so a card cast from someone else's
     * graveyard or exile counts as the caster's spell. Omitted = anyone. */
    readonly caster?: "you" | "opponent";
    /** "…cost {1} less to cast **for each target**" (Hinata, Dawn-Crowned):
     * `reduceGeneric` / `increaseGeneric` are multiplied by the number of
     * distinct players and objects the spell targets as it's cast (Hinata's
     * ruling: two "target creature"s aimed at one creature count once). The
     * cost is locked in after targets are chosen (rule 601.2c before
     * 601.2f), so `legalActions` offers such a spell with the `targetCount`
     * range it is affordable at. */
    readonly perTarget?: boolean;
    /** Only the caster's first spell each turn that matches `applies` ("the
     * first creature spell you cast each turn costs {1} less") — earlier
     * spells are asked the same question, so a matching spell cast earlier
     * this turn uses the discount up even if it was cast before this
     * permanent arrived. */
    readonly firstEachTurn?: boolean;
    /** Coloured pips removed from the cost ("Cleric spells you cast cost
     * {W}{B} less" — Edgewalker), as a mana string of coloured symbols.
     * Each symbol takes a matching coloured pip, else a hybrid pip that
     * includes that colour (rule 118.7e — paid as that colour), else, per
     * rule 118.7b/c, one generic — unless `coloredOnly`. */
    readonly reduceColored?: string;
    /** "This effect reduces only the amount of colored mana you pay"
     * (Edgewalker, Morophon): a coloured reduction with nothing coloured
     * left to take is lost rather than taken off the generic part. */
    readonly coloredOnly?: boolean;
  };
  /** Layer 7b: set base power and toughness to a dynamic count (+ the given
   * offsets). Only meaningful with `affects.scope === "self"` (a CDA). */
  readonly setBasePtFromCount?: {
    readonly countOf: CountSpec;
    readonly plusPower: number;
    readonly plusToughness: number;
  };
  /** Additional land drops per turn for this permanent's controller (rule
   * 305.2c-adjacent — needed-cards P16, Azusa, Lost but Seeking / Icetill Explorer).
   * `affects` is ignored — folded into the controller's land-drop budget. */
  readonly extraLandsPerTurn?: number;
  /** Panharmonicon-style doubling (needed-cards P15 — Starfield Vocalist:
   * "If a permanent entering the battlefield causes a triggered ability of a
   * permanent you control to trigger, that ability triggers an additional
   * time"). `filter`, when present, narrows which *entering* permanent counts
   * (Panharmonicon: artifact or creature); omitted = any permanent.
   * `affects` is ignored — this only ever doubles its own controller's
   * `enters-battlefield` triggers. */
  readonly doubleEntryTriggers?: { readonly filter?: CardFilter };
  /**
   * "If [something happening] causes a triggered ability of a permanent you
   * control to trigger, that ability triggers an additional time" — any
   * trigger that event causes, not just one kind. `cause` names the event:
   *
   * - `"enters"`: a permanent entering (Yarok, the Desecrated; Elesh Norn,
   *   Mother of Machines). `filter` narrows the entering permanent.
   * - `"attacks"`: a creature attacking (Isshin, Two Heavens as One). Covers
   *   per-attacker triggers and "whenever you attack" ones alike. Leave
   *   `filter` off for Isshin: a whole-declaration event has no one attacker
   *   to test.
   * - `"combat-damage-to-player"`: a creature dealing combat damage to a
   *   player (Felix Five-Boots). `filter` narrows the damage source.
   *
   * Only its controller's triggers. Stacks with `doubleEntryTriggers` and with
   * itself (two sources, three times).
   */
  readonly doubleTriggers?: {
    readonly cause: "enters" | "attacks" | "combat-damage-to-player";
    readonly filter?: CardFilter;
  };
  /**
   * "Permanents entering don't cause abilities of permanents your opponents
   * control to trigger" (Elesh Norn, Mother of Machines; Torpor Orb is the
   * `"everyone"` version). Suppresses every trigger an entering permanent
   * would cause for the named permanents' controllers.
   */
  readonly suppressEntryTriggers?: "opponents" | "everyone";
  readonly text: string;
}

/** Printed characteristics of a card. Immutable reference data. */
export interface CardDefinition {
  readonly name: string;
  /**
   * A Scryfall link pinning this card's art to a specific printing, or `null`
   * to fall back to the by-name art lookup. Accepts any of:
   *   - a card page URL — `https://scryfall.com/card/dmu/120/...`
   *   - an API URL — `https://api.scryfall.com/cards/dmu/120`
   *   - a direct image URL — `https://cards.scryfall.io/art_crop/...`
   *   - a bare Scryfall card UUID
   * The client (`client/src/ui/art.ts`) resolves it to an image URL; no lookup
   * happens engine-side. Useful for made-up cards and tokens with no real
   * printing, or to lock in a preferred illustration.
   */
  readonly art: string | null;
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
  /**
   * An **additional cost** to cast this spell (rule 601.2f/h) — paid as it's
   * cast, so it happens even if the spell is later countered, and the spell
   * can't be cast at all if it can't be paid. `null` for none. needed-cards P8.
   *
   * `sacrifice`: "As an additional cost to cast this spell, sacrifice a land"
   * (Harrow, Crop Rotation). The caster picks which matching permanent, as a
   * `sacrifice` on the `cast-spell` action — the same shape an activated
   * ability's `AbilityCost.sacrifice: { filter }` uses.
   *
   * `discard`: "…, discard a card" (Thrill of Possibility, Cathartic Reunion).
   * Paid as the spell is cast, so — unlike a `discard` *effect* — it happens
   * even if the spell is countered, and a hand too small to pay makes the
   * spell uncastable. Which cards go is the caster's choice, raised as the
   * ordinary `discard` decision once the spell is on the stack.
   *
   * `payLife`: "…, pay 3 life" (Bitter Triumph's second half). A player may
   * always pay life they have, down to 0 — paying below it is what's illegal
   * (rule 118.4), so this gates castability on `life >= payLife`.
   *
   * `payLifeX`: "…, pay **X** life" (Toxic Deluge), where X is the caster's
   * own choice. It makes the spell an `{X}` spell without an `{X}` in its
   * mana cost: `xCost.maxX` becomes the caster's life total rather than what
   * their lands can pay, `ctx.x` reads the chosen value as usual, and the
   * life is paid as the spell is cast.
   *
   * More than one may be set, and all of them are paid.
   */
  readonly additionalCost: {
    readonly sacrifice?: CardFilter;
    readonly discard?: number;
    readonly payLife?: number;
    readonly payLifeX?: boolean;
    /**
     * A **choice** between whole costs, of which the caster pays exactly one
     * (Bitter Triumph: "discard a card **or** pay 3 life").
     *
     * Distinct from a cost whose *filter* happens to span two types — Deadly
     * Dispute's "sacrifice an artifact or creature" is one cost with a
     * `typesAnyOf` filter and was expressible all along. The difference is
     * whether the two halves are the same *kind* of payment.
     *
     * Each option is enumerated as its own castable variant, the way kicker
     * and overload are, so the choice is made by picking which `cast-spell`
     * to send rather than by a decision raised mid-cast. The fields beside
     * this one are paid as well, on top of whichever option is chosen.
     */
    readonly options?: readonly AdditionalCostOption[];
  } | null;
  /**
   * Kicker (rule 702.33 — needed-cards P8): an **optional** additional cost
   * announced as the spell is cast (601.2b), before targets are chosen, that
   * changes what the spell does. `null` for none.
   *
   * `cost` is folded onto the printed mana cost when kicked. `targets` /
   * `effect` replace the unkicked ones when kicked — Tear Asunder exiles an
   * artifact or enchantment normally, "instead exile target permanent" when
   * kicked, so the *target spec itself* differs and must be known before
   * targeting. Omit either to leave it unchanged.
   */
  readonly kicker: {
    readonly cost: string;
    readonly targets?: readonly TargetSpec[];
    readonly effect?: EffectSpec;
  } | null;
  /**
   * Overload (rule 702.126 — Cyclonic Rift): an alternative cost that
   * *replaces* the mana cost entirely (unlike kicker, which adds to it) and
   * targets nothing at all — "change all instances of the word 'target' in
   * its text to 'each' and you can't choose targets for it." `effect` is
   * therefore always the whole-battlefield ("each ...") version of the
   * card's effect (typically a `-all` `EffectSpec` variant), applied with no
   * targets chosen. `null` for no overload cost.
   */
  readonly overload: {
    readonly cost: string;
    readonly effect: EffectSpec;
  } | null;
  /**
   * A conditional free-cast permission printed on the spell itself (the CMM
   * commander-precon cycle: "If you control a commander, you may cast this
   * spell without paying its mana cost."). Unlike `overload` this doesn't
   * change the spell's targets or effect at all — same targets, same
   * resolution — only the cost (checked live, from the card's own
   * controller's perspective, same as `selfCostReduction`). It's *in
   * addition to* the normal cast, not instead of it: a player who doesn't
   * meet the condition (or simply prefers to) can still pay the printed mana
   * cost. `null` for no such permission.
   */
  readonly freeCastIf: { readonly condition: StaticCondition } | null;
  /**
   * An alternative cost that replaces the mana cost and also taps permanents
   * (rule 601.2b) — Sephara, Sky's Blade's "You may pay {W} and tap four
   * untapped creatures you control with flying rather than pay this spell's
   * mana cost."
   *
   * Offered as a second `cast-spell` variant (`altCost: true`), the same
   * "one entry per playable variant" shape `kicked` / `overload` / `free`
   * use, whose `tapCost` offers the creatures to tap; the caster picks them
   * (`tap` on the action).
   */
  readonly alternativeCost: {
    readonly mana: string;
    readonly tapCreatures: { readonly count: number; readonly filter: CardFilter };
  } | null;
  /**
   * Convoke (rule 702.51 — Chord of Calling): "Your creatures can help cast
   * this spell. Each creature you tap while casting this spell pays for
   * {1} or one mana of that creature's color." A pure payment-method
   * choice made as the spell is cast (`Action.convoke`) — it doesn't change
   * the printed cost, targets, or effect at all, unlike `overload`/`kicker`.
   */
  readonly convoke: boolean;
  /**
   * A cost reduction printed on the spell itself, gated on a board-state
   * condition (rule 601.2f — Ferocious: "if you control a creature with
   * power 4 or greater, this spell costs {2} less to cast"). Unlike
   * {@link StaticAbility.costModification} (a *permanent*'s ability reducing
   * *other* spells) this is evaluated for the card being cast itself, from
   * whatever zone it's cast from — so it applies before the card could ever
   * reach the battlefield to grant anything. `null` for none. needed-cards P10.
   * `reduceGeneric` accepts a live count (`{ countOf: CardFilter }`, evaluated
   * against the *whole* battlefield — Blasphemous Act: "costs {1} less to
   * cast for each creature on the battlefield", no `controlledBy` clause so
   * every player's creatures count) mirroring {@link StaticAbility.costModification}'s
   * `reduceGeneric`. needed-cards P19.
   */
  readonly selfCostReduction: {
    readonly condition: StaticCondition;
    readonly reduceGeneric: CostReductionAmount;
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
  /** "As this enters, choose a creature type" (Urza's Incubator — needed-cards
   * P14). The permanent's `chosenCreatureType` is set once its controller
   * answers; a `costModification.matchesChosenCreatureType` reads it back. */
  readonly chooseCreatureTypeOnEnter: boolean;
  /**
   * "As this permanent enters, choose …" (rule 614.1c) — Heraldic Banner
   * ("choose a color"), Frontier Siege ("choose Khans or Dragons"). The
   * answer lands on `GameObject.chosenOnEnter`, which the card's own statics,
   * mana abilities and trigger conditions then read.
   */
  readonly chooseOnEnter: readonly string[] | null;
  /** Starting loyalty for a planeswalker (rule 306.5b — it enters with this
   * many loyalty counters). `null` for a non-planeswalker. `defineCard`
   * synthesizes the enters-with-counters replacement from this. */
  readonly loyalty: number | null;
  /** Flashback (rule 702.34) — this instant/sorcery may be cast from its
   * owner's graveyard for `cost` instead of its mana cost; a spell so cast is
   * exiled instead of going anywhere else from the stack. `null` for a card
   * without flashback. */
  readonly flashback: {
    readonly cost: string;
    /** Life paid alongside the mana — Deep Analysis's "Flashback—{1}{U}, Pay
     * 3 life". Part of the cost, so it's paid as the spell is cast and stands
     * even if the spell is countered. */
    readonly payLife?: number;
  } | null;
  /** Foretell (rule 702.144 — ROADMAP Phase 6b) — during your turn you may pay
   * `{2}` to exile this card from your hand face-down; on a later turn you may
   * cast it from exile for `cost`. `null` for a card without foretell. */
  readonly foretell: { readonly cost: string } | null;
  /** Escape (rule 702.139 — ROADMAP Phase 6b) — cast from your graveyard for
   * `cost` plus exiling `exileCount` other cards from your graveyard as an
   * additional cost. Unlike flashback the spell resolves normally (it can be
   * escaped again). `null` for a card without escape.
   *
   * `counters` is the "this creature escapes with N +1/+1 counters on it"
   * rider (Underworld Rage-Hound, Uro): put on only when the permanent
   * actually arrives via escape, so a copy cast from hand gets nothing. */
  readonly escape: {
    readonly cost: string;
    readonly exileCount: number;
    readonly counters?: { readonly kind: string; readonly amount: number };
  } | null;
  /** Suspend (rule 702.62 — ROADMAP Phase 6b) — instead of casting this from
   * your hand you may pay `cost` to exile it with `n` time counters; one comes
   * off at each of your upkeeps, and at zero it's cast for free (with haste if
   * it's a creature). `null` for a card without suspend. */
  readonly suspend: { readonly n: number; readonly cost: string } | null;
  /** Cycling (rule 702.29) — `cost`, Discard this card: Draw a card. Any time
   * you could cast an instant. Modeled as an immediate special action (pay,
   * discard, draw), not a stack-using ability — no "respond to cycling"
   * window, no "when you cycle" triggers. `null` for a card without cycling. */
  readonly cycling: {
    readonly cost: string;
    /**
     * **Landcycling / typecycling** (rule 702.29f — Migratory Route's "Basic
     * landcycling {2}"): instead of drawing, search your library for a card
     * matching this filter and put it into your hand.
     *
     * Same special action as ordinary cycling — pay, discard, then this
     * instead of the draw.
     */
    readonly search?: CardFilter;
  } | null;
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
  /** The commander tax is paid in life instead of mana (Liesa, Shroud of
   * Dusk: "Rather than pay {2} for each previous time you've cast this spell
   * from the command zone this game, pay 2 life that many times."). Only a
   * cast from the command zone owes any tax at all, so casting the card from
   * anywhere else costs neither. Life can be paid down to exactly 0 (rule
   * 119.4). `false` for normal cards. */
  readonly commanderTaxAsLife: boolean;
  /** "Exile ~" as a printed clause of a non-permanent spell's own resolution
   * text (Genesis Ultimatum) — it goes to exile instead of the graveyard
   * after resolving, unconditionally. Distinct from flashback/disturb/
   * adventure, which redirect to exile only for a spell cast *that way*; this
   * applies no matter how the spell was cast. `false` for normal cards.
   * needed-cards P19. */
  readonly exileOnResolve: boolean;
  /** "Shuffle ~ into its owner's library" as the last part of the spell's own
   * resolution (White Sun's Zenith). Only on resolving: a *countered* one goes
   * to the graveyard like any other spell, because the shuffle is an
   * instruction the spell never got to carry out. */
  readonly shuffleIntoLibraryOnResolve: boolean;
  /** "Counters remain on ~ as it moves to any zone other than a player's
   * hand or library" (Skullbriar, the Walking Grave). A static ability that
   * functions in every zone, so `moveObject` keeps `counters` across any move
   * except one to a hand or library, including graveyard -> battlefield and
   * command zone -> stack -> battlefield. Everything else rule 400.7 resets
   * still resets. A permanent that has lost its abilities as it leaves the
   * battlefield loses its counters as usual. `false` for normal cards. */
  readonly countersPersistAcrossZones: boolean;
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
  /** The partner-family ability that lets this card be one of *two*
   * commanders (rule 702.124), or `null` for a card that can only command
   * alone. A deckbuilding rule, read by `deck-validation.ts`'s
   * `canPairCommanders` and nothing in play. See {@link CommanderPairing}. */
  readonly pairing: CommanderPairing | null;
}

/**
 * A partner-family ability (rule 702.124). Each kind pairs only with its own
 * kind — "different partner abilities are distinct from one another" — so a
 * plain Partner commander can't team up with a "Partner with" one, nor a
 * Friends forever one with a Survivors one:
 *
 * - `partner` — plain "Partner": pairs with any other card that has it.
 * - `partner-with` — "Partner with [name]": pairs only with the card it names,
 *   and only if that card's own Partner with names this one back. The
 *   ability's enters trigger (a tutor for the partner) is a separate
 *   `triggered` entry — `partnerWithTrigger` in `cards/helpers.ts`.
 * - `partner-group` — "Partner—[text]" and its forerunners Friends forever
 *   and Character select: pairs only with a card carrying the *same*
 *   `group` text ("Father & son", "Survivors", "Friends forever",
 *   "Character select").
 * - `choose-a-background` — pairs with a legendary Background enchantment,
 *   which then counts as a commander itself even though it isn't a creature.
 *   The Background needs no `pairing` of its own: its type line is enough.
 * - `doctors-companion` — pairs with a legendary Time Lord Doctor creature
 *   that has no other creature types; the Doctor needs no `pairing` either.
 */
export type CommanderPairing =
  | { readonly kind: "partner" }
  | { readonly kind: "partner-with"; readonly name: string }
  | { readonly kind: "partner-group"; readonly group: string }
  | { readonly kind: "choose-a-background" }
  | { readonly kind: "doctors-companion" };

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
  /** A Scryfall link (page / API / image URL, or a bare card UUID) pinning
   * this card's art to a specific printing. See {@link CardDefinition.art}. */
  art?: string;
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
  additionalCost?: {
    readonly sacrifice?: CardFilter;
    readonly discard?: number;
    readonly payLife?: number;
    readonly payLifeX?: boolean;
    readonly options?: readonly AdditionalCostOption[];
  };
  kicker?: {
    readonly cost: string;
    readonly targets?: readonly TargetSpec[];
    readonly effect?: EffectSpec;
  };
  overload?: {
    readonly cost: string;
    readonly effect: EffectSpec;
  };
  freeCastIf?: { readonly condition: StaticCondition };
  alternativeCost?: {
    readonly mana: string;
    readonly tapCreatures: { readonly count: number; readonly filter: CardFilter };
  };
  convoke?: boolean;
  selfCostReduction?: {
    readonly condition: StaticCondition;
    readonly reduceGeneric: CostReductionAmount;
  };
  effect?: EffectSpec;
  resolve?: SpellResolver;
  activated?: readonly ActivatedAbility[];
  triggered?: readonly TriggeredAbility[];
  static?: readonly StaticAbility[];
  revealsOwnLibraryTop?: boolean;
  controlEnchanted?: boolean;
  copyOnEnter?: { readonly filter: "creature" };
  chooseCreatureTypeOnEnter?: boolean;
  chooseOnEnter?: readonly string[];
  loyalty?: number;
  flashback?: { readonly cost: string; readonly payLife?: number };
  foretell?: { readonly cost: string };
  suspend?: { readonly n: number; readonly cost: string };
  cycling?: { readonly cost: string; readonly search?: CardFilter };
  escape?: {
    readonly cost: string;
    readonly exileCount: number;
    readonly counters?: { readonly kind: string; readonly amount: number };
  };
  chapters?: readonly SagaChapter[];
  faces?: readonly string[];
  cantBeCountered?: boolean;
  commanderTaxAsLife?: boolean;
  exileOnResolve?: boolean;
  shuffleIntoLibraryOnResolve?: boolean;
  countersPersistAcrossZones?: boolean;
  transform?: boolean;
  disturb?: { readonly cost: string };
  adventure?: boolean;
  pairing?: CommanderPairing;
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
    art: draft.art ?? null,
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
    additionalCost: draft.additionalCost ?? null,
    kicker: draft.kicker ?? null,
    overload: draft.overload ?? null,
    freeCastIf: draft.freeCastIf ?? null,
    alternativeCost: draft.alternativeCost ?? null,
    convoke: draft.convoke ?? false,
    selfCostReduction: draft.selfCostReduction ?? null,
    effect: draft.effect ?? null,
    resolve: draft.resolve ?? null,
    activated: draft.activated ?? [],
    triggered: draft.triggered ?? [],
    static: [...(draft.static ?? []), ...loyaltyStatic],
    revealsOwnLibraryTop: draft.revealsOwnLibraryTop ?? false,
    controlEnchanted: draft.controlEnchanted ?? false,
    copyOnEnter: draft.copyOnEnter ?? null,
    chooseCreatureTypeOnEnter: draft.chooseCreatureTypeOnEnter ?? false,
    chooseOnEnter: draft.chooseOnEnter ?? null,
    loyalty,
    flashback: draft.flashback ?? null,
    foretell: draft.foretell ?? null,
    suspend: draft.suspend ?? null,
    cycling: draft.cycling ?? null,
    escape: draft.escape ?? null,
    chapters: draft.chapters ?? null,
    faces: draft.faces ?? null,
    cantBeCountered: draft.cantBeCountered ?? false,
    commanderTaxAsLife: draft.commanderTaxAsLife ?? false,
    exileOnResolve: draft.exileOnResolve ?? false,
    shuffleIntoLibraryOnResolve: draft.shuffleIntoLibraryOnResolve ?? false,
    countersPersistAcrossZones: draft.countersPersistAcrossZones ?? false,
    transform: draft.transform ?? false,
    disturb: draft.disturb ?? null,
    adventure: draft.adventure ?? false,
    pairing: draft.pairing ?? null,
  };
}

export function hasKeyword(def: CardDefinition, keyword: Keyword): boolean {
  return def.keywords.includes(keyword);
}
