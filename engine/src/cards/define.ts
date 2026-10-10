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
import type {
  CopyExceptions,
  EffectSpec,
  ModeOption,
  PlayerScope,
  SpellResolver,
  ThisWayKind,
} from "../effects.js";
import type { AggregateOf, AggregateSpec, CardFilter, NumCompare } from "../filter.js";
import type { Color, ManaType, SpendAs } from "../mana.js";
import type { ReplacementSpec } from "../replacements.js";
import type { PlayerCounterKind, TurnHistoryKind, ZoneType } from "../state.js";
import type { TargetSpec } from "../target.js";
import type { Step } from "../turn.js";

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
 * "You may have this [permanent] enter as a copy of …" (rule 707.9) — Clone
 * and its kin, asked before it moves however it enters (rule 614.12a —
 * `Game.askEnterChoice`). Declining, or having nothing to copy, it enters as
 * itself.
 */
export interface CopyOnEnter {
  /**
   * What it may copy: a permanent already on the battlefield matching this,
   * read from the side of the player it's entering under — Clone's "any
   * creature" is `{ type: "creature" }`, Sakashima's "another creature you
   * control" adds `controlledBy: "you"`, Phyrexian Metamorph's "any artifact
   * or creature" is a `typesAnyOf`, Vesuva's "any land" `{ type: "land" }`.
   * Never itself, and never one entering at the same time (the rulings). An
   * `{ amount }` operand is read for the entering permanent: Mockingbird's
   * "mana value less than or equal to the amount of mana spent to cast this
   * creature" is `manaValue: { op: "lte", n: { amount: { manaSpentOf:
   * "source" } } }`.
   */
  readonly filter: CardFilter;
  /** The copy effect's exceptions (rule 707.9a–b) — part of its copiable
   * values, so anything that copies it later copies them too. */
  readonly except?: CopyExceptions;
  /** "Enter **tapped** as a copy" (Vesuva): an additional effect of copying
   * (rule 707.9e), so it enters tapped only if it copies something. */
  readonly tapped?: true;
  /**
   * "…except it enters with an additional +1/+1 counter on it if it's a
   * creature" (Spark Double), "with X additional +1/+1 counters" (Altered
   * Ego, `amount: "x"` — the X it was cast with). An additional effect of
   * copying (rule 707.9e), not a copiable value: it happens only as this
   * permanent enters as a copy, and a later copy of it doesn't get them.
   * `ifType` is judged by what it is as it enters, copy and all (rule
   * 707.9f). Counters it enters with, so a counter doubler doubles them.
   */
  readonly counters?: readonly {
    readonly kind: string;
    readonly amount: number | "x";
    readonly ifType?: CardType;
  }[];
  /** "…become a copy of any creature on the battlefield **until end of
   * turn**" (Cursed Mirror): the copy effect, exceptions and all, ends in the
   * cleanup step (rule 514.2) and it's itself again. Its duration isn't a
   * copiable value: something that copies it meanwhile stays a copy (its
   * ruling). */
  readonly untilEndOfTurn?: true;
}

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
  /** Skulk (rule 702.118) — can't be blocked by creatures with greater power,
   * compared as blockers are declared (Behind the Scenes). */
  | "skulk"
  /** Shadow (rule 702.28) — can be blocked only by creatures with shadow,
   * and can block only creatures with shadow (Dauthi Voidwalker). */
  | "shadow"
  /** Flanking (rule 702.25) — a triggered ability: the keyword is what a
   * "creature without flanking" asks about, and the `flanking()` card helper
   * is the trigger itself, so a card lists both (Sidar Kondo of Jamuraa). */
  | "flanking"
  /** Riot (rule 702.136a) — "you may have this permanent enter with an
   * additional +1/+1 counter on it; if you don't, it gains haste". Asked as
   * it's about to enter (`Game.askEnterChoice`) when it's printed or copied;
   * a static granting it to others (Rhythm of the Wild) isn't read as they
   * enter (AUTHORING §15). */
  | "riot"
  /** Infect (rule 702.90): damage this deals to a player gives them that
   * many poison counters instead of costing life (120.3b), and damage it
   * deals to a creature is that many -1/-1 counters instead of marked damage
   * (120.3d) — any damage, not only combat damage, and still damage in every
   * other respect (lifelink, deathtouch, "is dealt damage", prevention). A
   * planeswalker loses loyalty as usual. Read off the source as it is, or as
   * it last existed (702.90d). `Game.dealDamage`. */
  | "infect"
  /** Wither (rule 702.80): infect's creature half alone — damage this deals
   * to a creature is that many -1/-1 counters instead of marked damage
   * (120.3d); damage to a player is life loss as usual. */
  | "wither"
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
  | "nightbound"
  /**
   * Changeling (rule 702.73a): a characteristic-defining ability, "this object
   * is every creature type", in every zone (rule 604.3). Layer 4 reads it off
   * the card's copiable values (a copy of a changeling is one too) and adds
   * `EVERY_CREATURE_TYPE` to its subtypes before any other type-changing
   * effect (rule 613.3), which every subtype question then honours
   * (`subtypes.ts`'s `hasSubtype`). A creature that loses all its abilities
   * stays every creature type — layer 4 comes before the layer-6 loss (the
   * changeling rulings) — while one an effect later makes "a Frog" is just a
   * Frog. Only a printed (or copied) changeling is modeled: granting the
   * keyword to something else wouldn't change its types.
   */
  | "changeling";

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
       * (Predates the `"filter"` scope, which says the same with
       * `counters`.)
       */
      readonly withCounter?: { readonly kind?: string };
      /** Only *token* creatures — "Zombie tokens you control have flying"
       * (Eternal Skylord). */
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
   * clauses as `creatures-you-control`.
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
  | { readonly scope: "attached" }
  /**
   * Every battlefield permanent matching `filter`, evaluated from the
   * source's controller's perspective — the general scope the fixed ones
   * above are special cases of: "artifacts you control" (`{ type: "artifact",
   * controlledBy: "you" }`), "creatures you don't control", "commander
   * creatures you own" (`{ type: "creature", isCommander: true, ownedBy:
   * "you" }`), "each creature you control but don't own" (`controlledBy:
   * "you", ownedBy: "opponent"`), "non-Equipment artifact and non-Aura
   * enchantment" (`anyOf`). `excludeSelf` is "other".
   *
   * The filter's type and subtype clauses read the target's *current* types
   * (rule 613.1d puts type-changing effects before every layer a static
   * works in); inside layer 4 itself, a type-granting static sees only the
   * types granted before it in timestamp order (see `layerFour`). A
   * `keyword` / `notKeyword` clause waits for layer 6 the way `withKeyword`
   * does. `power` / `toughness` clauses (and an `{ own }` operand) can't be
   * answered from inside the fold that computes them and fail closed.
   */
  | {
      readonly scope: "filter";
      readonly filter: CardFilter;
      readonly excludeSelf?: boolean;
    };

/** A combat restriction a static ability imposes on the objects it `affects`
 * (Pacifism: can't attack / can't block; Juggernaut: must attack if able;
 * Lure: all creatures able to block this one must do so — rule 509.1c), or
 * a `restrict` effect imposes until end of turn. */
export type CombatRestriction =
  | "cant-attack"
  | "cant-block"
  | "must-attack"
  /** Lure: **every** creature able to block it must do so. */
  | "must-be-blocked"
  /** "Must be blocked if able" (Anzrag, the Quake-Mole): the defending
   * player has to block it with at least one creature (two, with menace)
   * when they can — a requirement (rule 509.1c), weighed against the rest
   * as the declaration is checked. */
  | "must-be-blocked-if-able"
  /** "Can't attack its owner" — the player only: a planeswalker its owner
   * controls may still be attacked (Alexios, Deimos of Kosmos's ruling;
   * rule 508.1b — a creature attacks a player *or* a planeswalker).
   * Xantcha's "can't attack its owner or planeswalkers its owner controls"
   * would be a restriction of its own. */
  | "cant-attack-owner";

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
  | { readonly countInGraveyard: CardFilter }
  /** How many counters of a kind its controller has — "power and toughness
   * are each equal to the number of experience counters you have" (Daxos the
   * Returned's Spirit). Its owner's off the battlefield. */
  | { readonly playerCounters: PlayerCounterKind }
  /** How many card types there are among cards in graveyards matching a
   * filter — Tarmogoyf's "power is equal to the number of card types among
   * cards in all graveyards" is `{ cardTypesInGraveyard: {} }` with
   * `plusToughness: 1`. See the `EffectAmount` of the same name. */
  | { readonly cardTypesInGraveyard: CardFilter }
  /** The greatest mana value among battlefield permanents matching a
   * filter, 0 with none — Karn, Legacy Reforged's "power and toughness are
   * each equal to the greatest mana value among artifacts you control" is
   * `{ greatestManaValueOf: { type: "artifact", controlledBy: "you" } }`
   * (itself among them, when it matches). `{X}` is 0 on the battlefield
   * (rule 202.3e). A mana value isn't a characteristic the layer fold
   * computes, so a CDA can read other permanents' without the dependency
   * problem a greatest *power* would have (AUTHORING §15). */
  | { readonly greatestManaValueOf: CardFilter };

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
 * large mechanical change for no behaviour. `"spells-cast"` is the one
 * exception, and only as a *read* of `PlayerState.spellsCastThisTurn`, for
 * an amount ("1 life for each spell you've cast this turn").
 */
/** `"spells-cast"` counts every spell the player cast this turn, countered or
 * not and whatever they controlled at the time (Aetherflux Reservoir). */
export type TurnStat =
  | "life-lost"
  | "life-gained"
  | "cards-drawn"
  | "spells-cast"
  /** Damage dealt to the player this turn, and the combat part of it —
   * "the number of opponents that were dealt combat damage this turn" (Tymna
   * the Weaver) is `{ playersWithTurnStat: "combat-damage-taken", who:
   * "each-opponent" }`. Damage, not life lost: prevented damage isn't dealt. */
  | "damage-taken"
  | "combat-damage-taken"
  /** 1 once the player has declared an attacker this turn (raid). */
  | "attacked"
  /** How many different creatures the player has declared as attackers
   * this turn — Windbrisk Heights' "if you attacked with three or more
   * creatures this turn" (its ruling): one declared in two attack phases
   * counts once, one put onto the battlefield attacking never (rule 508.4 —
   * it was never declared). */
  | "attackers"
  /** Cards put into the player's graveyard from their hand or library this
   * turn — Welcome the Dead's X (discarded, milled, surveilled or cycled
   * away, whatever put them there). */
  | "cards-to-graveyard-from-hand-or-library"
  /** Cards that left the player's graveyard this turn, for anywhere — cast
   * or played from it, returned, exiled (Essence Anchor's "if a card left
   * your graveyard this turn"). */
  | "cards-left-graveyard";

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
      /** Leave out the object whose event fired the triggered ability asking
       * — Valakut, the Molten Pinnacle's "whenever a Mountain you control
       * enters, if you control at least five **other** Mountains": the one
       * entering doesn't count, and once it has left, the rest still do.
       * Only meaningful as a triggered ability's intervening-if. */
      readonly excludeTriggerObject?: boolean;
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
  /**
   * You control **the** permanent matching `filter` with the greatest power
   * / toughness / mana value, **or one tied for it** — Thickest in the
   * Thicket's "if you control the creature with the greatest power or tied
   * for the greatest power": among every matching permanent on the
   * battlefield, whoever controls it, one of yours has a value no other
   * beats. False when you control none. `filter` is asked from your side
   * (`controlledBy` in it would narrow both halves — leave it out).
   */
  | {
      readonly kind: "controls-greatest";
      readonly of: AggregateOf;
      readonly filter: CardFilter;
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
  /** *Some one* opponent controls **more** permanents matching `filter` than
   * you do — Land Tax and Knight of the White Orchid's "if an opponent
   * controls more lands than you". Each opponent is compared on their own,
   * with that opponent as the filter's "you". Your side counts every matching
   * permanent you control, this one included. */
  | {
      readonly kind: "opponent-controls-more";
      readonly filter: CardFilter;
      /** Only the player whose turn it is, when that's an opponent — Keeper
       * of the Accord's "at the beginning of each opponent's end step, if
       * **that player** controls more creatures than you". */
      readonly activePlayerOnly?: boolean;
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
  /**
   * A player has at least `atLeast` counters of a kind (rule 122.1) — you,
   * or *some one* opponent counted on their own: corrupted's "as long as an
   * opponent has three or more poison counters". See `PlayerState.counters`.
   * `"that-player"` is the player a resolving effect is about (the
   * `"that-player"` scope): impulse-exile's `whoseIf` — Ixhel, Scion of
   * Atraxa's "each opponent **who has three or more poison counters**". Only
   * a resolution knows that player; anywhere else it's false.
   */
  | {
      readonly kind: "player-counters";
      readonly counter: PlayerCounterKind;
      readonly who: "you" | "opponent" | "that-player";
      readonly atLeast: number;
    }
  /** Who is the monarch (rule 720): you, or any opponent (Queen Marchesa's
   * "if an opponent is the monarch"). False while nobody is. */
  | { readonly kind: "monarch"; readonly who: "you" | "opponent" }
  /** How many cards are in your hand, inclusive bounds (Flubs, the Fool: "if
   * you have no cards in hand" is `atMost: 0`; hellbent the same). */
  | {
      readonly kind: "hand-size";
      readonly atMost?: number;
      readonly atLeast?: number;
      /** `"each-player"`: every player still in the game has a hand in
       * bounds — Howltooth Hollow's "if each player has no cards in hand".
       * Your own hand when absent. */
      readonly who?: "you" | "each-player";
    }
  /** How many cards are in a library, inclusive bounds: yours, or — with
   * `"any-player"` — some one player's still in the game, yours included
   * (Shelldock Isle: "if **a library** has twenty or fewer cards in it").
   * `compare` is a bound read as it applies, in a `conditional` effect:
   * Thassa's Oracle's "if X is greater than or equal to the number of cards
   * in your library" is `{ op: "lte", n: { amount: { devotionTo: "U" } } }`
   * (an `{ amount }` operand is bound by the resolution, and fails closed
   * anywhere else). */
  | {
      readonly kind: "library-size";
      readonly who: "you" | "any-player";
      readonly atMost?: number;
      readonly atLeast?: number;
      readonly compare?: NumCompare;
    }
  /**
   * A life total, inclusive bounds: Bilbo, Birthday Celebrant's "activate
   * only if you have 111 or more life" is `atLeast: 111`; "if you have at
   * most half your starting life total" is `atMost: "half-starting"`
   * (rounded down). `who` is `"you"` (default), `"opponent"` (some opponent
   * does) or `"each-opponent"` (every opponent does).
   */
  | {
      readonly kind: "life-total";
      readonly who?: "you" | "opponent" | "each-opponent";
      readonly atLeast?: number;
      readonly atMost?: number | "half-starting";
    }
  /** At least `atLeast` cards in exile, every player's (face-down ones
   * included; tokens aren't cards) — Ketramose, the New Dawn's "unless there
   * are seven or more cards in exile". `filter` narrows them, from this
   * permanent's controller's side ("cards your opponents own in exile"). */
  | { readonly kind: "cards-in-exile"; readonly atLeast: number; readonly filter?: CardFilter }
  /** Threshold (rule 702.27) — seven or more cards in your graveyard. */
  | { readonly kind: "threshold" }
  /** At least `atLeast` cards in your graveyard matching `filter` — Oversold
   * Cemetery's "if you have four or more creature cards in your graveyard".
   * Threshold is this with seven and no filter. */
  | { readonly kind: "cards-in-graveyard"; readonly atLeast: number; readonly filter?: CardFilter }
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
  /**
   * Where the turn is — "activate only during combat" (`duringCombat`),
   * "during your end step" (`steps: ["end"]` with a `your-turn` elsewhere),
   * "if it's the **first combat phase** of the turn" (Karlach, Fury of
   * Avernus: `combatPhase: 1`), "your **second main phase**" (`mainPhase:
   * 2`). Every clause given has to hold. The phase counts include the one
   * under way, extra combat and main phases counted in turn order.
   */
  | {
      readonly kind: "turn-structure";
      readonly steps?: readonly Step[];
      readonly duringCombat?: boolean;
      readonly combatPhase?: number;
      readonly mainPhase?: number;
    }
  /**
   * Something of a {@link TurnHistory} list happened this turn at least
   * `atLeast` times (default 1): "if another Human entered the battlefield
   * under your control this turn" (Éowyn, Shieldmaiden: `{ what: "entered",
   * filter: { subtype: "Human" }, excludeSelf: true }`), "if a creature died
   * under your control this turn", "if you descended this turn". `who` is
   * whose (default `"you"`); `filter` narrows the objects — one that has left
   * the battlefield as it last existed there, a card put into a graveyard as
   * it is now; `excludeSelf` leaves this permanent out ("another").
   */
  /**
   * Sources a player controlled dealt at least `atLeast` damage this turn —
   * Ojer Axonil's Temple of Power: "activate only if **red sources you
   * controlled dealt 4 or more noncombat damage** this turn" (`{ colors:
   * ["R"], combat: false, atLeast: 4 }`). `who` is the controller (default
   * `"you"`), `combat` narrows the kind of damage, and `colors` the sources
   * — ones that were at least one of these colours as they dealt it.
   */
  | {
      readonly kind: "damage-dealt-this-turn";
      readonly who?: "you" | "opponent" | "any-player";
      readonly combat?: boolean;
      readonly colors?: readonly Color[];
      readonly atLeast: number;
    }
  | {
      readonly kind: "turn-history";
      readonly what: TurnHistoryKind;
      readonly who?: "you" | "opponent" | "any-player";
      readonly filter?: CardFilter;
      readonly atLeast?: number;
      readonly excludeSelf?: boolean;
    }
  /** The source's controller created a token this turn (Idol of Oblivion). */
  | { readonly kind: "created-token-this-turn" }
  /** The source's controller attacked with a commander this turn — declared
   * one an attacker, any player's (Neriv, Crackling Vanguard's "during any
   * turn you attacked with a commander, you may play those cards"). */
  | { readonly kind: "attacked-with-commander-this-turn" }
  /** The source's controller cast a spell from a graveyard or activated an
   * ability of a card in a graveyard this turn (Laboratory Drudge). */
  | { readonly kind: "used-graveyard-this-turn" }
  /** At least `atLeast` cards have been exiled with the source (an `exile {
   * linked }` — rule 607.2a) in the battlefield stint it's in, ever, though
   * they've left exile since — Colfenor's Urn's "if three or more cards have
   * been exiled with this artifact" (its ruling: "over the course of the
   * entire game"). False for a source not on the battlefield. See
   * `GameObject.exiledWithCount`. */
  | { readonly kind: "exiled-with-source"; readonly atLeast: number }
  /** The negation of another condition — Titan Hunter's "**if no creatures
   * died this turn**". Cheaper than a `no-` variant of every condition, and
   * it composes. */
  | { readonly kind: "not"; readonly of: StaticCondition }
  /** Every one of these holds — "at the beginning of your second main phase,
   * if you attacked this turn" (Michelangelo, the Heart) is a `turn-structure`
   * and a `turn-stat` together. */
  | { readonly kind: "all"; readonly of: readonly StaticCondition[] }
  /**
   * "If you've cast a creature spell this turn": how many of the spells a
   * player — `"you"` by default, or each opponent's, or anyone's — has cast
   * this turn match `filter`, each read as it was cast
   * (`PlayerState.spellsCastThisTurnAs`). At least `atLeast` (default 1),
   * at most `atMost` if given. Eshki Dragonclaw's "both a creature spell and
   * a noncreature spell" is two of these under `all`.
   */
  | {
      readonly kind: "cast-this-turn";
      readonly who?: "you" | "opponent" | "any";
      readonly filter?: CardFilter;
      readonly atLeast?: number;
      readonly atMost?: number;
    }
  /**
   * The spell whose casting fired this triggered ability is its caster's
   * **first** spell this turn matching one of `anyOf` — Alania, Divergent
   * Storm's "if it's the first instant spell, the first sorcery spell, or
   * the first Otter spell other than Alania you've cast this turn". Each
   * spell is read as it was cast (`PlayerState.spellsCastThisTurnAs`), so a
   * later spell cast in response doesn't change the answer on resolution.
   * `otherThanSource` leaves the ability's own card out of the count of
   * earlier ones ("other than Alania"). Only a cast trigger's intervening-if
   * can answer it; anywhere else it's false.
   */
  | {
      readonly kind: "trigger-spell-first";
      readonly anyOf: readonly { readonly filter: CardFilter; readonly otherThanSource?: boolean }[];
    }
  /**
   * You've cast at least `atLeast` spells named `named` this game
   * (`PlayerState.spellNamesCastThisGame` — a copy isn't cast). Approach of
   * the Second Sun's "you've cast **another** spell named Approach of the
   * Second Sun this game", asked as it resolves alongside "if this spell was
   * cast", is `atLeast: 2`: the spell resolving was one of them.
   */
  | { readonly kind: "spells-cast-this-game"; readonly named: string; readonly atLeast: number }
  /** The source's `chosenOnEnter` label equals `value` — Frontier Siege's
   * "Khans" / "Dragons" halves. Which abilities the permanent has, not an
   * "if" of the ability's: on a triggered ability it gates the triggering,
   * and holds as the ability resolves once the source has left (rule 113.7a
   * — Mirrodin Besieged destroyed in response still makes them lose). */
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
   * A target was chosen for slot `index` of the resolving spell or ability —
   * still true once that target has become illegal (rule 608.2b), false only
   * for an optional slot left empty. The Earth Crystal's "distribute two
   * +1/+1 counters among one or two target creatures you control": with two
   * chosen, each gets one however they fare by resolution, and one found
   * illegal loses its counter rather than passing it on (the ruling). Only
   * meaningful inside a `conditional` effect.
   */
  | { readonly kind: "target-chosen"; readonly index: number }
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
   * "If X is 10 or more" (Finale of Devastation): the X the resolving spell
   * or ability was cast or activated with. Only a resolution can answer it;
   * anywhere else it is false.
   */
  | { readonly kind: "x"; readonly compare: NumCompare }
  /**
   * "If a land card is discarded **this way**" (Lord Windgrace), "if you
   * **didn't** draw cards this way" (Mr. Foxglove) — a question about what the
   * resolving spell or ability has done so far, over the same cards the
   * `thisWay` amount counts. Met when there are at least `atLeast` and at
   * most `atMost` of them — `atLeast` defaults to 1, or to 0 when `atMost` is
   * given, so `{ atMost: 0 }` is "didn't". Only a resolution can answer it;
   * anywhere else it is false. `other` leaves the ability's own source out:
   * Arid Archway's "return a land you control to its owner's hand. If
   * **another** Desert was returned this way, surveil 1" — it returning
   * itself doesn't count.
   */
  | {
      readonly kind: "this-way";
      readonly what: ThisWayKind;
      readonly who?: PlayerScope;
      readonly filter?: CardFilter;
      readonly atLeast?: number;
      readonly atMost?: number;
      readonly other?: boolean;
    }
  /**
   * "If ~ is still on the battlefield" (Shirei, Shizo's Caretaker's delayed
   * return): the resolving ability's source is on the battlefield as the
   * same object it was (rule 400.7). Only a resolution can answer it.
   */
  | { readonly kind: "source-on-battlefield" }
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
    }
  /**
   * "If the Ring has tempted you N or more times this game" (rule 701.54c —
   * Frodo, Adventurous Hobbit) — and how the Ring emblem's own later
   * abilities are gated: "as long as the Ring has tempted that player two or
   * more times, it has …". The source's controller's count.
   */
  | { readonly kind: "ring-tempted"; readonly atLeast: number };

/**
 * A static ability: continuously modifies characteristics (rule 613 layers 6 /
 * 7b / 7d), and/or carries a `replacement` clause (rule 614 — applied by
 * `game.ts`, not by the layer fold).
 */
export interface StaticAbility {
  readonly affects: AffectSpec;
  /**
   * Eminence (an ability word, rule 207.2c: no rules of its own; the text
   * says where it functions, rule 113.6b) — this static functions while its
   * card is in the **command zone** as well as on the battlefield (The
   * Ur-Dragon: "as long
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
  /**
   * "As long as this card is in your graveyard, …" (Wonder, Anger, Brawn,
   * Valor, Filth): the static functions only while its card is in its
   * owner's graveyard (rule 113.6b), never on the battlefield, "you" being
   * its owner. Only a grant to permanents reaches that far yet — a keyword,
   * a P/T bonus, a restriction (`contributingStaticSources`).
   */
  readonly fromGraveyard?: true;
  /** A replacement effect (rule 614) — see `replacements.ts`. `affects` is
   * irrelevant to one: each `ReplacementSpec` names what it reaches itself
   * (`scope: "self"` is the convention). */
  readonly replacement?: ReplacementSpec;
  /** `[power, toughness]` bonus applied in layer 7d. */
  readonly grantPt?: readonly [number, number];
  /**
   * Layer 4 — card types the affected permanents have "in addition to their
   * other types" (Bello's "is a … creature"). Applied in timestamp order with
   * the permanent's own type-changing modifiers, after any addition its scope
   * depends on (see `layerFour`); everything that reads a
   * permanent's types (`effectiveTypes`, so `matchesFilter`, targeting and
   * every other static's scope) sees them.
   *
   * A static with a layer-4 part keeps the set of permanents that part
   * reached for its later layers too (rule 613.6): its keywords, granted
   * abilities and P/T apply to exactly the permanents it gave the type to.
   */
  readonly addTypes?: readonly CardType[];
  /** Layer 4 — subtypes added the same way ("are Bears in addition to their
   * other types", "Artifacts you control are Foods"). */
  readonly addSubtypes?: readonly string[];
  /**
   * Layer 4 — subtypes that **replace** the affected permanents' existing
   * subtypes of the same kind (rule 205.1a): Goddric, Cloaked Reveler's
   * "is a Dragon … (He loses all other creature types.)" is
   * `setSubtypes: ["Dragon"]` — every creature type goes, its other
   * subtypes stay. The static counterpart of an `animate` effect's
   * `setSubtypes`, applied in timestamp order with the rest of layer 4.
   */
  readonly setSubtypes?: readonly string[];
  /**
   * Layer 7b — sets the affected permanents' base power and/or toughness
   * (Kudo: "have base power and toughness 2/2"; a lone `toughness` is "have
   * base toughness 1"). After characteristic-defining abilities, in
   * timestamp order with "becomes an N/N" effects (`PtModifier.setPt`), and
   * before counters (7c) and bonuses (7d).
   */
  readonly setBasePt?: { readonly power?: number; readonly toughness?: number };
  /**
   * A layer-7d bonus that *scales* with a live count — Skycat Sovereign's
   * "gets +1/+1 for each **other** creature you control with flying".
   *
   * Distinct from `setBasePtFromCount`, which is a CDA (layer 7b) that
   * replaces the printed P/T; this adds on top, so counters and other
   * anthems stack with it normally. `excludeSelf` is what "other" means.
   */
  readonly grantPtPerCount?: {
    /** What to count: battlefield permanents matching a filter, the number
     * of times the controller has cast a commander from the command zone this
     * game (Commander's Insignia), or the counters of a kind the controller
     * has ("gets +1/+1 for each experience counter you have" — Kalemne,
     * Disciple of Iroas). */
    readonly filter?: CardFilter;
    readonly commanderCasts?: boolean;
    readonly playerCounters?: PlayerCounterKind;
    /** Counters of a kind on **the affected permanent itself** — Toxrill,
     * the Corrosive's "creatures your opponents control get -1/-1 for each
     * slime counter on them": each creature by its own count. */
    readonly countersOnAffected?: string;
    /** Counters of a kind on **this permanent** — Door of Destinies'
     * "creatures you control of the chosen type get +1/+1 for each charge
     * counter on this artifact". */
    readonly countersOnSource?: string;
    /** Cards in exile matching a filter — Umbris, Fear Manifest's "+1/+1 for
     * each card your opponents own in exile" is `{ ownedBy: "opponent" }`.
     * Face-down cards count; they're still cards. */
    readonly exiled?: CardFilter;
    /** Cards in graveyards matching a filter, from this permanent's
     * controller's side — Wight of the Reliquary's "+1/+1 for each creature
     * card in your graveyard" is `{ type: "creature", ownedBy: "you" }`. */
    readonly inGraveyard?: CardFilter;
    /** Colours among battlefield permanents matching a filter, each once —
     * Sisay, Weatherlight Captain's "+1/+1 for each color among other
     * legendary permanents you control" (with `excludeSelf`). */
    readonly colorsAmong?: CardFilter;
    /**
     * The greatest mana value among this permanent's controller's
     * commanders, wherever they are — Tangleweave Armor's "+X/+X, where X is
     * the greatest mana value among your commanders" (its ruling: in the
     * command zone, a library or on the battlefield alike, read as it is
     * now, so a commander that's become a copy of something counts as that;
     * on the stack its {X} counts, rule 202.3e). 0 with none. A mana value
     * is no layer-7 characteristic, so reading it inside the layer fold
     * depends on nothing the fold computes.
     */
    readonly commanderManaValue?: "greatest";
    readonly pt: readonly [number, number];
    readonly excludeSelf?: boolean;
  };
  /** The affected creatures "can't attack you or planeswalkers you control",
   * where "you" is *this* permanent's controller: the creature an Aura
   * enchants (Vow of Duty, `affects: { scope: "attached" }`), or every
   * creature a scope reaches (Eriette of the Charmed Apple's "each creature
   * that's enchanted by an Aura you control" — a `filter` scope with
   * `enchantedBy: "you"`). Checked directly in `whyCannotAttack` rather than
   * as a `CombatRestriction`: those are bare strings, and this one has to
   * know whose "you" it means. */
  readonly cantAttackController?: boolean;
  /**
   * The affected creatures **are goaded** (rule 701.15b) for as long as this
   * static applies — Baeloth Barrityl, Entertainer's "creatures your
   * opponents control with power less than Baeloth Barrityl's power are
   * goaded", an Aura's "enchanted creature … is goaded" (`affects: { scope:
   * "attached" }`). This permanent's controller is the goader: they "attack
   * a player other than you if able". Not "until your next turn" (the
   * Baeloth ruling) — it stops the moment this permanent leaves, loses the
   * ability, or its scope stops reaching the creature, so it is read live
   * (`goadersOf` in `goad.ts`) rather than marked on anything.
   *
   * A `filter` scope's `{ amount }` operand is answered here, unlike in any
   * other static, but only for this permanent's own characteristics:
   * `{ powerOf: "source" }`, `{ toughnessOf: "source" }`, `{ manaValueOf:
   * "source" }`, read as it is now. Any other amount fails closed.
   */
  readonly goads?: boolean;
  /** The affected creatures "can't be blocked by [filter]" — Delney,
   * Streetwise Lookout's "creatures you control with power 2 or less can't
   * be blocked by creatures with power 3 or greater" (`{ power: { op:
   * "gte", n: 3 } }`). The blocker is matched from this permanent's
   * controller's side. */
  readonly cantBeBlockedBy?: CardFilter;
  /** The affected creatures "can block only [filter]" — "can block only
   * creatures with flying" (`{ keyword: "flying" }`). The attacker is
   * matched from this permanent's controller's side. */
  readonly canBlockOnly?: CardFilter;
  /** The affected creatures "can't be blocked by more than one creature"
   * (Challenger Troll — a blocking restriction, rule 509.1b): a declaration
   * may put at most one creature on each. Checked as a block is declared,
   * like `cantBeBlockedBy`, so a scope reading power ("with power 4 or
   * greater") sees the creature as it is. */
  readonly blockedByAtMostOne?: boolean;
  /**
   * A prohibition on casting and activating ("can't" beats "can" — rule
   * 101.2): `who` — `"opponents"`, `"you"` or `"each-player"`, from this
   * permanent's controller's side — can't cast `spells` (every spell, or
   * ones matching a filter: Codie, Vociferous Codex's "you can't cast
   * permanent spells"), and can't activate abilities of permanents matching
   * `abilitiesOf` — Myrel, Shield of Argive's "artifacts, creatures,
   * enchantments, or planeswalkers", mana abilities included, so those
   * can't pay for anything either. Time it with `condition`: Myrel's
   * "during your turn" is `your-turn`, Marisi, Breaker of the Coil's "during
   * combat" a `turn-structure` condition with `duringCombat`. `affects` is
   * irrelevant.
   */
  readonly prohibits?: {
    readonly who: "opponents" | "you" | "each-player";
    readonly spells?: true | CardFilter;
    readonly abilitiesOf?: CardFilter;
  };
  /** "You may cast spells as though they had flash" (Heliod, the Warped
   * Eclipse) — every spell (`true`) or ones matching a filter ("creature
   * spells"), for this permanent's controller. */
  readonly castAsThoughFlash?: true | CardFilter;
  /** "Each player may attack only the nearest opponent in the last chosen
   * direction and planeswalkers controlled by that player" (Pramikon, Sky
   * Rampart, with `chooseOnEnter: ["left", "right"]`). A rule for every
   * player, whatever `affects` says. The direction is this permanent's
   * `chosenOnEnter` — left is the next player in turn order, right the one
   * before, skipping anyone who has left the game — and with several such
   * permanents the latest one's choice is the one in force. */
  readonly attackOnlyNearestOpponent?: boolean;
  /**
   * The affected creatures assign combat damage equal to their **toughness**
   * rather than their power — the exception to rule 510.1a that Doran, the
   * Siege Tower prints ("each creature assigns …"), Felothar the Steadfast
   * ("each creature you control …") and Arcades, the Strategist ("each
   * creature you control with defender …", an `affects.withKeyword`).
   *
   * - `"always"` — toughness, even where that's less than its power.
   * - `"if-toughness-greater"` — only while the creature's toughness is
   *   greater than its power (Ancient Lumberknot's "each creature you control
   *   **with toughness greater than its power**"; Bark of Doran's "as long as
   *   equipped creature's toughness is greater than its power"). Judged on
   *   its computed P/T, at the moment damage is sized. `"always"` from any
   *   source wins over it.
   *
   * Nothing's power changes (the rulings on all of them): anything else that
   * reads power — a fight, "damage equal to its power", a power-4-or-greater
   * trigger — reads the real value. Only combat damage is resized, wherever
   * the engine sizes it: an unblocked attacker's damage, a blocker's, the
   * split across blockers and what tramples over (`combatDamageOf` in
   * `characteristics.ts`), and the bots' combat arithmetic. Read live, like
   * any static: once the source is gone, a creature already attacking still
   * attacks and assigns damage equal to its power again (Arcades' ruling).
   */
  readonly combatDamageByToughness?: "always" | "if-toughness-greater";
  /**
   * The affected creatures "can attack as though they didn't have defender"
   * (Arcades, the Strategist; Felothar the Steadfast; High Alert). A
   * permission rather than a restriction, so it lifts only defender's "can't
   * attack" (rule 702.3b): summoning sickness, tapped creatures and every
   * `"cant-attack"` restriction still apply, and the creature still *has*
   * defender for anything that asks. Only consulted when a creature is
   * declared as an attacker — once attacking, it stays attacking if the
   * permission ends mid-combat (Arcades' ruling).
   *
   * `"players-who-attacked-you"` lifts it against some defenders only:
   * Weathered Sentinels' "can attack **players who attacked you during
   * their last turn** as though it didn't have defender" — a player (never a
   * planeswalker) who declared a creature attacking the creature's
   * controller during their own most recent turn
   * (`attackedYouDuringTheirLastTurn`).
   */
  readonly canAttackAsThoughNoDefender?: boolean | "players-who-attacked-you";
  /**
   * The affected permanents can't be sacrificed — Alexios, Deimos of
   * Kosmos's "~ can't be sacrificed" (`"self"`), Zurgo, Thunder's Decree's
   * "during your end step, Warrior tokens you control have 'This token can't
   * be sacrificed'" (a `filter` scope with a `turn-structure` condition).
   * Rule 701.21a: sacrificing is a move its controller makes, and one that
   * can't be sacrificed isn't moved — "sacrifice it" does nothing to it
   * (`sacrifice-source`'s "if you do" then fails), an edict or a "sacrifice
   * a creature" cost never offers it (another must be chosen, if there is
   * one), and a cost that names it ("Sacrifice ~", a Treasure's) can't be
   * paid, so that ability can't be activated. A completed Saga that can't be
   * sacrificed stays (rule 714.4). An ability like any other (layer 6): lost
   * with the rest when the permanent loses its abilities.
   */
  readonly cantBeSacrificed?: boolean;
  /**
   * "The 'legend rule' doesn't apply to [the affected permanents]" (rule
   * 704.5j): Sakashima of a Thousand Faces' "to permanents you control" is
   * `affects: { scope: "filter", filter: { controlledBy: "you" } }`, The
   * Master, Multiplied's "to creature tokens you control" adds `type` and
   * `token`, Mirror Gallery's "doesn't apply" an empty filter. A permanent it
   * reaches isn't one of the legendary permanents the rule counts, so it
   * neither goes nor makes another go. A rule change, not a characteristic:
   * nothing becomes nonlegendary, and it stops the moment this permanent
   * leaves or loses its abilities — when the rule applies again at once (the
   * Sakashima ruling). Read by `exemptFromLegendRule`.
   */
  readonly legendRuleOff?: true;
  /**
   * "[This] isn't legendary if it's a token" (Aeve, Progenitor Ooze): a
   * type-changing effect on itself (layer 4), so while this permanent is a
   * token on the battlefield it has no legendary supertype — not for the
   * legend rule, not for "legendary" filters. A storm copy is a token once
   * it resolves (rule 707.10f); the spell copy on the stack isn't one yet.
   * Applied before a layer-6 loss of abilities could take it away. Read
   * through `supertypesOf`; `affects` is irrelevant.
   */
  readonly notLegendaryIfToken?: true;
  /** "Spells you cast have delve" (Teval, Arbiter of Virtue): every spell
   * this permanent's controller casts, from anywhere, has delve (rule
   * 702.66) as it's cast, as if printed (`CardDefinition.delve`). */
  readonly spellsHaveDelve?: boolean;
  /** Keywords granted in layer 6. */
  readonly grantKeywords?: readonly Keyword[];
  /**
   * Toxic N granted in layer 6 (rule 702.164) — Karumonix, the Rat King's
   * "Other Rats you control have toxic 1". One more instance of toxic on each
   * affected creature, adding N to its total toxic value (702.164b) beside a
   * printed one (`CardDefinition.toxic`) and any other grant.
   */
  readonly grantToxic?: number;
  /** Activated abilities this static grants to every object it `affects`
   * (Chromatic Lantern: "Lands you control have '{T}: Add one mana of any
   * color.'"; Cryptolith Rite does the same for creatures). Rule 613 layer 6 —
   * ability enumeration (`legalActions` / `manaSources` / `activateAbility`)
   * consults these on top of a permanent's printed `activated`, appended after
   * them so printed-ability indices stay stable. */
  readonly grantsActivated?: readonly ActivatedAbility[];
  /**
   * The activated abilities of every card exiled **with this permanent**
   * (an `exile { linked }` — rule 607.2a), granted to every object it
   * `affects` like `grantsActivated` — Steward of the Harvest's "creatures
   * you control have all activated abilities of all land cards exiled with
   * this creature". Read live: a card that leaves exile takes its abilities
   * with it. Only abilities that work on the battlefield (none with a
   * `zone`); a typed land's printed mana ability is its intrinsic one (rule
   * 305.6), so a Forest card gives "{T}: Add {G}". An ability naming its card
   * means the permanent that has it (the ruling) — `sacrifice: "self"`
   * sacrifices the creature.
   */
  readonly grantsActivatedOfLinkedExile?: true;
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
    /** An additional sacrifice for a cast this way — Exploration
     * Broodship's "by sacrificing a land in addition to paying its other
     * costs". Offered and paid like a spell's own `additionalCost.sacrifice`
     * (the offer's `sacrifice.choices`, the action's `sacrifice`), after the
     * mana, so the land may tap for the spell first (rule 601.2g–h). Not
     * offered for a card with a sacrifice cost of its own. */
    readonly sacrifice?: CardFilter;
    /** An additional cost of exiling this many *other* cards from the
     * graveyard — Kotis, Sibsig Champion's "by exiling three other cards
     * from your graveyard in addition to paying its other costs". Picked by
     * the caster as escape's are (the offer's `escapeExile`, the action's
     * `escapeExile`) and paid as the spell is cast; not offered with too few.
     * The spell isn't escaped (`castVia` stays `"graveyard-permission"`). */
    readonly exileOthers?: number;
  };
  /**
   * Keywords this permanent gives cards in its controller's **graveyard**
   * (rule 604.1 — a static ability reaches another zone when its text says
   * so): "each instant and sorcery card in your graveyard has flashback. The
   * flashback cost is equal to its mana cost" (Iroh, Grand Lotus, whose
   * "during your turn" is a `your-turn` `condition`), "each enchantment card
   * in your graveyard has escape. The escape cost is equal to the card's
   * mana cost plus exile three other cards from your graveyard" (The Master
   * of Keys). A `cost` of `"mana-cost"` is the card's own mana cost, so a
   * card with none gets nothing; a card with a printed flashback or escape
   * keeps its own. The grant ends the moment this permanent leaves, but a
   * spell already cast with it is still exiled as it leaves the stack.
   */
  readonly grantsToGraveyard?: {
    readonly filter: CardFilter;
    readonly flashback?: { readonly cost: string | "mana-cost" };
    readonly escape?: { readonly cost: string | "mana-cost"; readonly exileCount: number };
  };
  /**
   * An alternative cost (rule 118.9) for the spells this permanent's
   * controller casts — Jodah, Archmage Eternal's "you may pay
   * {W}{U}{B}{R}{G} rather than pay the mana cost for spells you cast",
   * narrowed by `filter` when given. Offered as the `altCost` cast variant
   * of any spell cast for its mana cost (not one already cast for another
   * alternative cost — flashback, escape, foretell, a free cast); a card
   * with an alternative cost of its own (Sephara) offers that one instead.
   */
  readonly alternativeCostForSpells?: { readonly mana: string; readonly filter?: CardFilter };
  /**
   * Cards matching `filter` in this permanent's controller's hand have warp
   * for `cost` (rule 702.185) — Tannuk, Steadfast Second's "artifact cards
   * and red creature cards in your hand have warp {2}{R}". Offered exactly as
   * a printed warp is (`via: "warp"`), and a permanent cast that way is
   * exiled at the next end step and may be cast from exile later like any
   * warped one; a card with warp of its own uses its own.
   */
  readonly grantsWarpInHand?: { readonly cost: string; readonly filter: CardFilter };
  /**
   * The creature spells this permanent's controller casts that match
   * `filter` have blitz, its cost equal to their mana cost (rule 702.152a —
   * Henzie "Toolbox" Torre's "each creature spell you cast with mana value 4
   * or greater has blitz"): offered as the `via: "blitz"` cast a printed
   * blitz is, from the hand. */
  readonly grantsBlitzInHand?: { readonly filter: CardFilter };
  /** "Blitz costs you pay cost {1} less for each time you've cast your
   * commander from the command zone this game" (Henzie): every blitz cost
   * this permanent's controller pays, printed or granted, less that much
   * generic mana. */
  readonly blitzCostReductionPerCommanderCast?: boolean;
  /**
   * The spells this permanent's controller casts that match `filter` gain
   * offspring for `cost` as they're cast (rule 702.175) — Zinnia, Valley's
   * Voice's "creature spells you cast gain offspring {2} as you cast them":
   * an optional additional cost of its own, beside any kicker or printed
   * offspring (702.175b), offered as the cast's `offspring` variant, and the
   * permanent that spell becomes enters with offspring's trigger.
   */
  readonly grantsOffspringToSpells?: { readonly cost: string; readonly filter?: CardFilter };
  /**
   * The spells this permanent's controller casts that match `filter` gain
   * evoke for `cost` as they're cast (rule 702.74) — Ashling, the Limitless's
   * "Elemental permanent spells you cast from your hand gain evoke {4} as you
   * cast them": offered as the cast's `evoke` variant, exactly as a printed
   * evoke is. `fromHand` limits it to spells cast from the hand. The
   * permanent such a spell becomes keeps evoke's trigger even if this
   * permanent has left by then (the ruling).
   */
  readonly grantsEvokeToSpells?: { readonly cost: string; readonly filter?: CardFilter; readonly fromHand?: boolean };
  /**
   * Keywords and abilities the spells this permanent's controller casts have
   * while they're on the stack (rule 113.6 — a spell's abilities work there):
   * Abaddon the Despoiler's "during your turn, spells you cast from your hand
   * with mana value X or less have cascade" (a `your-turn` `condition`,
   * `castFrom: ["hand"]`, a `manaValue` compare on an `{ amount }` operand,
   * and a `this-cast` cascade trigger in `triggered`), The First Sliver's
   * "Sliver spells you cast have cascade", "spells you cast have lifelink".
   * `filter` is matched against the spell, from this permanent's
   * controller's side. A granted `this-cast` trigger fires as the spell is
   * cast; granted keywords are the spell's own (lifelink and deathtouch on
   * the damage it deals).
   */
  readonly grantsToSpells?: {
    readonly filter?: CardFilter;
    readonly castFrom?: readonly ZoneType[];
    readonly keywords?: readonly Keyword[];
    readonly triggered?: readonly TriggeredAbility[];
    /** The spells have split second (rule 702.61) while they're on the stack
     * — Shadow the Hedgehog's "each spell you cast has split second if mana
     * from an artifact was spent to cast it" (`filter: { manaFrom: { type:
     * "artifact" } }`). Read wherever a printed split second is. */
    readonly splitSecond?: boolean;
    /** The spells **can't be countered** (rule 701.5f): Prowling
     * Serpopard's "creature spells you control can't be countered"
     * (`filter: { type: "creature" }`), Hexing Squelcher's "spells you
     * control" (no filter). Read where a printed "this spell can't be
     * countered" is, as the counter would happen — a spell that stops
     * matching, or whose granting permanent leaves, can be countered again.
     * Every spell its controller controls counts, a copy too, and not only
     * ones cast from the hand. */
    readonly cantBeCountered?: boolean;
    /** Every player's spells, not just this permanent's controller's —
     * Lier, Disciple of the Drowned's "**Spells** can't be countered". */
    readonly allSpells?: boolean;
    /** The spells have casualty N (rule 702.153) — Silverquill, the
     * Disputant's "each instant and sorcery spell you cast has casualty 1":
     * as one is cast its caster may sacrifice a creature with power N or
     * greater, and if they do, it's copied. One more instance beside a
     * printed one (`CardDefinition.casualty`) or another grant, each paid
     * and copying separately (702.153b). Read as the spell is cast. */
    readonly casualty?: number;
    /** Only the first spell matching `filter` its controller casts each turn
     * — Anhelo, the Painter's "**the first** instant or sorcery spell you
     * cast each turn has casualty 2". Spells cast earlier this turn count,
     * even ones cast before this permanent arrived (`PlayerState
     * .spellsCastThisTurnAs`, each read as it was cast). */
    readonly firstEachTurn?: boolean;
  };
  /** "You have no maximum hand size" (Thought Vessel, Reliquary Tower). A
   * property of the *controller*, not of anything this ability `affects`, so
   * it's read straight off the battlefield at cleanup rather than through the
   * layer system. */
  readonly noMaxHandSize?: boolean;
  /** "You don't lose unspent red mana as steps and phases end" (Leyline
   * Tyrant): mana of these types in the controller's pool isn't emptied as
   * each step and phase ends (rule 500.4) — cleanup included, so it lasts
   * into later turns while this is on the battlefield (the ruling). Gone, the
   * mana is lost as the step or phase it left in ends. Like `noMaxHandSize`,
   * a property of the player, read off the battlefield. */
  readonly keepsUnspentMana?: readonly ManaType[];
  /** "**You** have hexproof" (rule 702.11d — Shalai, Voice of Plenty): this
   * permanent's controller can't be the target of spells or abilities their
   * opponents control. Like `noMaxHandSize`, a property of the player, read
   * off the battlefield as a target is checked (`playerHasHexproof`);
   * `affects` is ignored. */
  readonly playerHexproof?: boolean;
  /**
   * "**You can't lose the game**" (Platinum Angel, Herald of Eternal Dawn):
   * no state-based action and no effect that says so makes this permanent's
   * controller lose — 0 life, ten poison counters, a draw from an empty
   * library, 21 commander damage, "you lose the game" — for as long as they
   * control it; a loss it held off happens at the next check once it's gone,
   * if the cause is still there. Conceding still loses (rule 104.3a, the
   * ruling). Like `playerHexproof`, a property of the player, read off the
   * battlefield (`playerCantLoseGame`); `affects` is ignored.
   */
  readonly cantLoseGame?: boolean;
  /**
   * "**Your opponents can't win the game**" (Platinum Angel): an effect that
   * says one of this permanent's controller's opponents wins does nothing
   * (`playerCantWinGame`). Being the last player left still wins (rule
   * 104.2a). `affects` is ignored.
   */
  readonly opponentsCantWinGame?: boolean;
  /**
   * "Creatures can't attack you unless their controller pays {N} for each
   * creature they control that's attacking you" (Ghostly Prison,
   * Propaganda): a cost to attack this permanent's controller (rule
   * 508.1h), `generic` mana per attacking creature. Only the player — a
   * creature attacking their planeswalker pays nothing (the ruling). `affects`
   * is ignored.
   */
  readonly attackTax?: { readonly generic: number };
  /**
   * A maximum hand size, read at cleanup like `noMaxHandSize`: `who`'s
   * becomes `set` less the live count `minus` (a `CountSpec`, from this
   * permanent's controller's side), and `adjust` changes it by that much.
   * "Your maximum hand size is eleven" is `{ who: "you", set: 11 }`; Winter,
   * Misanthropic Guide's "each opponent's maximum hand size is equal to seven
   * minus the number of those card types" is `{ who: "opponents", set: 7,
   * minus: { cardTypesInGraveyard: { ownedBy: "you" } } }` behind its
   * delirium `condition`. These and every `noMaxHandSize` apply in timestamp
   * order (rule 613.11): a "twenty" newer than a "no maximum" wins, and the
   * other way round (Twenty-Toed Toad). Never below 0.
   */
  readonly maxHandSize?: {
    readonly who: "you" | "opponents";
    readonly set?: number;
    readonly minus?: CountSpec;
    readonly adjust?: number;
  };
  /** "This artifact doesn't untap during your untap step" (Mana Vault, Basalt
   * Monolith). Only its controller's own untap step: something that untaps
   * it during another player's (Seedborn Muse) still does. `affects` is
   * ignored — it is always the permanent carrying it. */
  readonly doesntUntap?: boolean;
  /**
   * "You may exert this creature as it attacks" (rule 701.43d — Glorybringer):
   * an optional cost to attack (508.1g), asked of its controller once its
   * attack has been declared, before anything triggers on it, as a
   * `choose-modes` of one mode (exerting it) or none. The linked "when you
   * do" is an `exerted` trigger with `asItAttacks`. `unlessExertedThisTurn`
   * is Combat Celebrant's "if this creature hasn't been exerted this turn".
   * `affects` is ignored — it is always the permanent carrying it.
   */
  readonly exertAsItAttacks?: { readonly unlessExertedThisTurn?: true };
  /**
   * "Spells your opponents cast that target this creature cost an additional
   * 3 life to cast" (Terror of the Peaks): an additional cost of the spell,
   * part of its total cost as it's cast (rule 601.2f) — once per spell
   * however many of its targets name this, never for an ability or a copy,
   * and not payable with less life than it asks (119.4), so an opponent that
   * low can't target it with a spell at all. `affects` is ignored: it is
   * always the permanent carrying it.
   */
  readonly targetedBySpellsCost?: { readonly payLife: number };
  /**
   * Untap during each **other** player's untap step, as well as your own:
   * `"self"` is Bender's Waterskin ("untap this artifact"), a `CardFilter` is
   * every permanent you control matching it — Seedborn Muse's `{}` ("all
   * permanents you control"), Unwinding Clock's `{ type: "artifact" }`. The
   * filter's "you" is this permanent's controller. `affects` is ignored.
   */
  readonly untapsDuringOthersUntap?: "self" | CardFilter;
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
  /**
   * A permission (rule 601.3) — while this permanent is on the battlefield
   * its controller may *cast* the top card of their library if it's a spell
   * matching `filter`, judged as the spell it would be (rule 601.3e): the
   * face cast, and with `{X}` counted at the X announced for it (202.3e) —
   * Glarb, Calamity's Augur's "spells with mana value 4 or greater" reaches
   * an X spell only at an X that gets it there (its ruling). Cast as
   * `via: "library-top"`, paying every cost and keeping every timing rule.
   * Lands are `playFromLibraryTop`'s; "look at the top card of your library
   * any time" is the card's `looksAtOwnLibraryTop`. `gainsHaste` is
   * "if you cast a creature spell this way, it gains haste until end of
   * turn" (Thundermane Dragon). `affects` is ignored.
   */
  readonly castFromLibraryTop?: { readonly filter: CardFilter; readonly gainsHaste?: boolean };
  /**
   * A permission (rule 601.3) — while this permanent is on the battlefield
   * its controller may play lands and cast spells from among the cards in
   * exile matching `filter`, from their side (the counter on them, who owns
   * them): Grolnok, the Omnivore's "cards you own in exile with croak
   * counters on them" is `{ ownedBy: "you", counters: { kind: "croak", … } }`.
   * Cast as `via: "impulse"`, paying every cost and keeping every timing
   * rule (a land still takes the land drop); it lapses the moment this
   * permanent leaves (Haldan's ruling) — unlike an impulse permission riding
   * on the card.
   * - `exiledByYou` — "cards **you exiled**" (Haldan, Avid Arcanist): only
   *   those an effect of this player's put there (`GameObject.exiledByPlayer`).
   * - `spells` — which spells it lets you cast, matched as the face cast
   *   (Haldan's "cast **noncreature** spells" reaches an adventurer's
   *   Adventure); lands are still played.
   * - `castOnly` — "cast spells from among" them, no lands.
   * - `yourTurnOnly` — "during your turn" (Tinybones, Bauble Burglar).
   * - `spendAs` — "and you may spend mana as though it were mana of any
   *   color" / "mana of any type can be spent to cast those spells" (rule
   *   118.14 — only to cast them this way).
   * `affects` is ignored.
   */
  readonly playFromExile?: {
    readonly filter: CardFilter;
    readonly exiledByYou?: boolean;
    readonly spells?: CardFilter;
    readonly castOnly?: boolean;
    readonly yourTurnOnly?: boolean;
    readonly spendAs?: SpendAs;
  };
  /**
   * "You may spend mana as though it were mana of any color" (Chromatic
   * Orrery, `as: "any-color"`) / "you can spend mana of any type to cast
   * creature spells" (Vizier of the Menagerie, `as: "any-type"` with `spell:
   * { type: "creature" }`): how this permanent's controller may pay (rules
   * 118.14, 609.4b) — every mana cost they pay, or with `spell` only to cast
   * a spell matching it. Changes how a cost may be paid, never the cost or
   * what mana was spent. `affects` is ignored.
   */
  readonly spendManaAs?: { readonly as: SpendAs; readonly spell?: CardFilter };
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
    /** `reduceColored` that many times — "{U} (or {1}) less to cast **for
     * each** land you control with a flood counter on it" (Eluge, the
     * Shoreless Sea): every {U} of the spell's cost first, then generic
     * (its ruling). Read as the cost is worked out. */
    readonly reduceColoredTimes?: CostReductionAmount;
    /** "This effect reduces only the amount of colored mana you pay"
     * (Edgewalker, Morophon): a coloured reduction with nothing coloured
     * left to take is lost rather than taken off the generic part. */
    readonly coloredOnly?: boolean;
  };
  /**
   * Changes what activated abilities cost to activate (rule 602.2b, which
   * applies rule 601.2f's cost modifications to activation costs):
   * "Activated abilities of Foods you control cost {1} less to activate"
   * (Sam, Loyal Attendant) is `{ applies: { subtype: "Food", controlledBy:
   * "you" }, reduceGeneric: 1 }`. `applies` is matched against the ability's
   * source, with this static's controller as "you", and only while that
   * source is a permanent: "activated abilities of artifacts you control"
   * never reaches a card's ability in a hand or graveyard (Forensic
   * Gadgeteer's ruling — cycling isn't reduced). Generic mana only, added
   * before anything is taken off, and never below {0}; an increase puts a
   * cost on an ability that had no mana in it. Mana abilities are modified
   * too (a Signet's `{1}`), both when activated by hand and as the payment
   * planner prices a converter, unless `exceptManaAbilities` says "…unless
   * they're mana abilities" (Suppression Field). `affects` is ignored.
   */
  readonly abilityCostModification?: {
    readonly applies: CardFilter;
    readonly reduceGeneric?: number;
    readonly increaseGeneric?: number;
    /**
     * "This effect can't reduce the mana in that cost to less than one mana"
     * (Training Grounds, Forensic Gadgeteer): `reduceGeneric` stops where
     * the cost — generic, coloured, colourless and hybrid symbols together —
     * is down to one mana, and takes nothing off a cost that had none. So
     * `{3}` less 2 is `{1}`, `{1}{G}` is `{G}`, and `{1}` stays `{1}`. These
     * reductions go before any unlimited one, the order that leaves the
     * least to pay (rule 601.2f lets the payer apply reductions in any order).
     */
    readonly leavesOneMana?: boolean;
    readonly exceptManaAbilities?: boolean;
    /** Only ninjutsu abilities this static's controller activates (Silver-Fur
     * Master: "Ninjutsu abilities you activate cost {1} less to activate"),
     * from the hand or the command zone — the one kind that reaches a card
     * that isn't a permanent. `applies` still filters the card. */
    readonly ninjutsu?: true;
    /** Not an ability's cost but a Room's unlock costs (rule 709.5e) this
     * static's controller pays — Inquisitive Glimmer's "Unlock costs you pay
     * cost {1} less". `applies` filters the Room. */
    readonly unlock?: true;
  };
  /** Layer 7b: set base power and toughness to a dynamic count (+ the given
   * offsets). Only meaningful with `affects.scope === "self"` (a CDA). */
  readonly setBasePtFromCount?: {
    readonly countOf: CountSpec;
    readonly plusPower: number;
    readonly plusToughness: number;
    /** A CDA that defines only its power (Eluge, the Shoreless Sea: a star
     * over a printed 5 — "power is equal to the number of Islands you
     * control") or only its toughness; the other stays as printed. */
    readonly only?: "power" | "toughness";
  };
  /** Additional land drops per turn for this permanent's controller (rule
   * 305.2c-adjacent — needed-cards P16, Azusa, Lost but Seeking / Icetill Explorer).
   * `affects` is ignored — folded into the controller's land-drop budget,
   * or with `extraLandsForEachPlayer` into every player's: Rites of
   * Flourishing's "each player may play an additional land on each of their
   * turns". */
  readonly extraLandsPerTurn?: number;
  readonly extraLandsForEachPlayer?: boolean;
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
   * - `"cast-or-copy"`: a spell being cast or copied (Veyran, Voice of
   *   Duality: "you casting or copying an instant or sorcery spell" is
   *   `filter: { typesAnyOf: ["instant", "sorcery"], controlledBy: "you" }`).
   *   `filter` narrows the spell, or the copy.
   * - `"dealt-damage"`: a permanent being dealt damage ("a creature you
   *   control being dealt damage" — `filter` narrows the permanent). Any
   *   trigger that damage causes, from either end of it.
   * - `"dies"`: a permanent dying (Teysa Karlov: "a creature dying"),
   *   `filter` matched as it last existed on the battlefield. Its dies and
   *   leaves-the-battlefield triggers alike.
   *
   * Only its controller's triggers. Stacks with `doubleEntryTriggers`,
   * `doubleTriggersOf` and itself (two sources, three times).
   */
  readonly doubleTriggers?: {
    readonly cause:
      | "enters"
      | "attacks"
      | "combat-damage-to-player"
      | "cast-or-copy"
      | "dealt-damage"
      | "dies";
    readonly filter?: CardFilter;
  };
  /**
   * "If a triggered ability of [a permanent] triggers, that ability triggers
   * an additional time" — keyed on **whose** ability it is rather than on
   * what caused it: Katara, the Fearless's "an Ally you control" (`filter`),
   * Delney, Streetwise Lookout's "a creature you control with power 2 or
   * less", Cloud, Midgar Mercenary's "Cloud or an Equipment attached to it"
   * (`selfAndEquipment`, with a `condition` for "as long as Cloud is
   * equipped"). The permanent is matched from this static's controller's
   * side, as it is as the ability triggers — or, for its own
   * leaves-the-battlefield ability, as it last existed there. Only abilities
   * of permanents: a spell's "when you cast this" isn't one, and nor is a
   * command-zone card's. Only its controller's triggers; stacks with the
   * cause-keyed doublers.
   */
  readonly doubleTriggersOf?: {
    readonly filter?: CardFilter;
    readonly selfAndEquipment?: boolean;
  };
  /**
   * "Permanents entering don't cause abilities of permanents your opponents
   * control to trigger" (Elesh Norn, Mother of Machines; `"everyone"` for
   * every controller). Suppresses every trigger an entering permanent would
   * cause for the named permanents' controllers. The object form narrows
   * what is entering — Torpor Orb's "**creatures** entering don't cause
   * abilities to trigger" is `{ who: "everyone", entering: { type:
   * "creature" } }`, matched against the permanent as it entered.
   */
  readonly suppressEntryTriggers?:
    | "opponents"
    | "everyone"
    | { readonly who: "opponents" | "everyone"; readonly entering: CardFilter };
  readonly text: string;
}

/** A targeted modal spell's modes — see {@link CardDefinition.castModal}. */
export interface CastModalSpec {
  readonly minModes: number;
  readonly maxModes: number;
  /** A higher `maxModes` while a condition holds as the spell is cast (rule
   * 601.2b, where the modes are chosen) — Will of the Sultai's "If you
   * control a commander as you cast this spell, you may choose both
   * instead." Asked of the card being cast, so `controls` reads its caster. */
  readonly maxModesIf?: { readonly condition: StaticCondition; readonly maxModes: number };
  /**
   * Escalate (rule 702.120a): "For each mode you choose beyond the first as
   * you cast this spell, you pay an additional [cost]." This mana, once per
   * mode chosen beyond the first — an additional cost, so it's paid on top of
   * an alternative cost or a free cast too (rule 118.9d; Collective
   * Resistance's ruling). The offer's `castModal.maxModes` is capped at the
   * most modes the caster can pay for. Mana only: escalate costs that discard
   * (Collective Brutality) or tap (Collective Effort) aren't modelled.
   */
  readonly costPerExtraMode?: string;
  /** Spree (rule 702.172a) is each mode's `ModeOption.spreeCost`: "choose
   * one or more modes; as an additional cost to cast this spell, pay the
   * costs associated with those modes". */
  readonly modes: readonly ModeOption[];
}

/** Printed characteristics of a card. Immutable reference data. */
export interface CardDefinition {
  readonly name: string;
  /**
   * A token's name in the game, where it isn't `name`: the registry is keyed
   * by name, so a token named after a real card (Murmuration's "named Storm
   * Crow") is defined under a " Token" key and gets its real name from this
   * as it's created — a copiable value of the token (rule 111.3), read by
   * every "named …" and "same name" check (`nameOf`).
   */
  readonly tokenName?: string;
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
  /** `null` is no mana cost — an unpayable one (rule 118.6), so the card is
   * cast only for an alternative cost or without paying it (118.6a):
   * Ancestral Vision is only ever suspended. */
  readonly manaCost: string | null;
  readonly colors: readonly Color[];
  readonly supertypes: readonly Supertype[];
  readonly types: readonly CardType[];
  readonly subtypes: readonly string[];
  readonly power: number | null;
  readonly toughness: number | null;
  readonly keywords: readonly Keyword[];
  /**
   * Toxic N (rule 702.164 — Karumonix, the Rat King's "Toxic 1"): the N its
   * printed toxic ability has, 0 for none. Not a {@link Keyword}, because
   * toxic is parameterised and cumulative (702.164b): a creature's "total
   * toxic value" is the sum of every instance it has, this one and any a
   * static grants (`StaticAbility.grantToxic`), folded in layer 6 as
   * `Characteristics.toxic`. Combat damage it deals a player gives that
   * player that many poison counters (120.3g, 702.164c).
   */
  readonly toxic: number;
  /**
   * Dredge N (rule 702.52 — Life from the Loam's "Dredge 3"): while this
   * card is in its owner's graveyard, each time they would draw a card
   * they may mill N cards instead and return this card to their hand — not
   * with fewer than N cards in their library (702.52b). Asked before each
   * draw, one at a time (`Game.drawCard`). 0 for none.
   */
  readonly dredge: number;
  readonly text: string;
  /** Target slots, in order. Chosen when the spell is cast. Empty for a
   * `castModal` spell (its targets come from the chosen modes). */
  readonly targets: readonly TargetSpec[];
  /** A *targeted* modal spell (rule 700.2 — ROADMAP Phase 11 EG-2): the
   * caster picks `minModes..maxModes` modes *as it's cast* (601.2b), then
   * targets for those modes (601.2c). Each mode's `effect` applies with its
   * own target slice. `null` for a non-modal card; a non-targeted modal spell
   * uses the resolution-time `modal` {@link EffectSpec} instead. */
  readonly castModal: CastModalSpec | null;
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
   * `sacrificeCount`: the `sacrifice` takes several permanents — "sacrifice
   * **X** creatures" (Eliminate the Competition) is `"x"`, which makes it an
   * `{X}` spell the way `payLifeX` does, X capped by what there is to
   * sacrifice once the mana is paid. Which ones is chosen as the cost is paid
   * (rule 601.2h), with the ordinary `sacrifice` decision once the spell is on
   * the stack — not on the action — exactly as an ability's sacrifice of
   * several (`AbilityCost.sacrifice`'s `count`).
   *
   * More than one may be set, and all of them are paid.
   */
  readonly additionalCost: {
    readonly sacrifice?: CardFilter;
    readonly sacrificeCount?: number | "x";
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
    /**
     * Another keyword that is the same optional additional cost under its
     * own name — Offspring (rule 702.175a: "You may pay an additional [cost]
     * as you cast this spell"). Paying it is what `self-kicked` asks about
     * (the `offspringTrigger()` helper's "if its offspring cost was paid"),
     * and the offer says `kickerKeyword` so it's labelled for what it is. A
     * spell cast this way is not a *kicked* spell to anything else.
     *
     * `"gift"` (rule 702.174a) is "as an additional cost to cast this
     * spell, you may choose an opponent": `cost` is `""`, promising it is
     * the kicked variant (702.174k), `targets` / `effect` are what the
     * spell does "if the gift was promised" (702.174m — its targets are
     * chosen only then), `effect` opening with the `gift` effect
     * (702.174j); `self-kicked` is "if the gift was promised" on a
     * permanent, whose gift is the `giftTrigger` helper. The opponent is
     * chosen as the cost is paid — see `GiftAsk`.
     */
    readonly keyword?: "offspring" | "gift";
    /**
     * Multikicker (rule 702.33c): "you may pay an additional [cost] any
     * number of times as you cast this spell". The spell is offered once per
     * affordable number of times (`LegalAction.kickCount`), and a spell
     * kicked at least once is kicked (702.33d); how many times is
     * `GameObject.timesKicked`, read by an `enters-battlefield` replacement's
     * `counters.amount: "times-kicked"` (Everflowing Chalice).
     */
    readonly multi?: boolean;
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
   * Delve (rule 702.66 — Treasure Cruise): "For each generic mana in this
   * spell's total cost, you may exile a card from your graveyard rather than
   * pay that mana." Like convoke, a payment choice made as the spell is cast
   * (`Action.delve`), applied once the total cost is determined (702.66b).
   */
  readonly delve: boolean;
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
  /**
   * "This spell costs {1} more to cast for each target beyond the first"
   * (Fireball; Strive — Twinflame's {2}{R}): this cost, once per distinct
   * target after the first. A cost increase (rule 601.2f), so it's added to
   * whatever cost is paid, an alternative one included, before any
   * reduction; the spell is offered at every target count its caster can
   * afford (`LegalAction.targetCount`). `null` for none.
   */
  readonly costPerExtraTarget: string | null;
  /**
   * Casualty N (rule 702.153a — Cut Your Losses' "Casualty 2"): "As an
   * additional cost to cast this spell, you may sacrifice a creature with
   * power N or greater" and "When you cast this spell, if a casualty cost
   * was paid for it, copy it. If the spell has any targets, you may choose
   * new targets for the copy." The caster is asked once the spell is on the
   * stack, as a `choose-permanents` of up to one such creature (the optional
   * cost is paid with the rest of the costs, rule 601.2h); paying it queues
   * the copy, which resolves first. A static grants more with
   * `grantsToSpells.casualty` (Silverquill, the Disputant). `null` for none.
   */
  readonly casualty: number | null;
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
  /** While this permanent is on the battlefield, its controller "may look at
   * the top card of [their] library any time" (Glarb, Calamity's Augur;
   * rule 401.5): the card is shown to them alone — `viewFor` hands it to its
   * owner's view only, where `revealsOwnLibraryTop` shows it to every
   * player. Not while the permanent has lost its abilities. */
  readonly looksAtOwnLibraryTop: boolean;
  /** An Aura whose controller controls the enchanted permanent for as long as
   * it stays attached (Mind Control — rule 613.1b, layer 2). */
  readonly controlEnchanted: boolean;
  /** "You can't cast this spell unless …" — checked from whatever zone it's
   * cast, the command zone included, from the caster's side: Rakdos, Lord of
   * Riots' "unless an opponent lost life this turn" is `{ kind: "turn-stat",
   * stat: "life-lost", who: "opponent", atLeast: 1 }`. `null` for none. */
  readonly castOnlyIf: StaticCondition | null;
  /** Split second (rule 702.61): as long as this spell is on the stack,
   * players can't cast other spells or activate abilities that aren't mana
   * abilities. Triggered abilities still trigger. */
  readonly splitSecond: boolean;
  /** This permanent may enter as a copy of another permanent its controller
   * chooses (Clone — rule 707.9) — see {@link CopyOnEnter}. `null` for a
   * normal card. */
  readonly copyOnEnter: CopyOnEnter | null;
  /** "As this enters, you may exchange its text box and another creature's"
   * (Deadpool, Trading Card — rule 612.5, a layer-3 text-changing effect):
   * what it may exchange with, a permanent already on the battlefield
   * matching this from its controller's side, never itself. Each then has
   * the other's rules text as it was — every ability, keyword and static —
   * for as long as it stays on the battlefield (`GameObject.textFrom`).
   * `null` for a normal card. */
  readonly exchangeTextOnEnter: CardFilter | null;
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
    /** Permanents sacrificed as (or with) the flashback cost — Dread
     * Return's "Flashback—Sacrifice three creatures", whose `cost` is `""`.
     * Chosen as the cost is paid, as `additionalCost.sacrificeCount`'s are. */
    readonly sacrifice?: { readonly filter: CardFilter; readonly count: number };
  } | null;
  /** Harmonize (rule 702.180a) — this card may be cast from its owner's
   * graveyard for `cost`, tapping up to one untapped creature they control,
   * whose power comes off the total cost's generic mana; a spell so cast is
   * exiled instead of going anywhere else from the stack. Each creature it
   * could tap is its own cast variant (`harmonizeTap`), chosen as the cost is
   * (702.180b). `null` for a card without harmonize. */
  readonly harmonize: { readonly cost: string } | null;
  /**
   * "You may cast this card from your graveyard as long as [condition]"
   * (Gravecrawler: "as long as you control a Zombie") — an ability that
   * modifies where the card may be cast from, so it functions there (rule
   * 113.6f): while the condition holds
   * for its owner, the card may be cast from their graveyard for its normal
   * costs, under the usual timing (its ruling). Checked as it's cast, never
   * again (the other ruling: losing the Zombie afterwards changes nothing).
   * Offered like any graveyard permission (`via: "graveyard-permission"`,
   * the card itself the grant's source), and it spends nothing.
   */
  readonly castFromGraveyardIf?: StaticCondition;
  /** Foretell (rule 702.144 — ROADMAP Phase 6b) — during your turn you may pay
   * `{2}` to exile this card from your hand face-down; on a later turn you may
   * cast it from exile for `cost`. `null` for a card without foretell. */
  readonly foretell: { readonly cost: string } | null;
  /**
   * Warp (rule 702.185 — Starfield Vocalist): "You may cast this card from
   * your hand for its warp cost. Exile this [permanent] at the beginning of
   * the next end step, then you may cast it from exile on a later turn." An
   * alternative cost, offered as its own `cast-spell` (`via: "warp"`); the
   * exile is a delayed triggered ability made as the permanent enters, and
   * the exiled card's owner may cast it for its mana cost after that turn
   * has ended, for as long as it stays exiled. `null` for none.
   */
  readonly warp: { readonly cost: string } | null;
  /**
   * Blitz (rule 702.152a — Star Athlete): "You may cast this card by paying
   * [cost] rather than its mana cost"; a permanent cast that way has haste
   * and "When this permanent is put into a graveyard from the battlefield,
   * draw a card", and is sacrificed at the beginning of the next end step (a
   * delayed trigger). An alternative cost from the hand, offered as its own
   * `cast-spell` (`via: "blitz"`). A copy of it gets none of that (the
   * rulings). `null` for none.
   */
  readonly blitz: { readonly cost: string } | null;
  /**
   * Evoke (rule 702.74 — Mulldrifter): "You may cast this spell by paying
   * [cost] rather than paying its mana cost" and "When this permanent
   * enters, if its evoke cost was paid, its controller sacrifices it." An
   * alternative cost, offered as the cast's `evoke` variant wherever the
   * card may be cast for its mana cost; the sacrifice trigger is given to
   * the permanent as it enters. `null` for none.
   */
  readonly evoke: { readonly cost: string } | null;
  /**
   * Prototype (rule 718 — Combat Thresher: "Prototype {2}{W} — 1/1"): it may
   * be cast with this mana cost and power/toughness instead, and the colors
   * of that cost. Not an alternative cost — offered as its own `cast-spell`
   * variant (`prototype: true`), combinable with one. The spell and the
   * permanent it becomes have those characteristics as copiable values; on
   * any other move it's back to normal. `null` for none.
   */
  readonly prototype: {
    readonly cost: string;
    readonly power: number;
    readonly toughness: number;
  } | null;
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
  /** Cycling (rule 702.29a) — "`cost`, Discard this card: Draw a card", an
   * activated ability from the hand, any time you could cast an instant: the
   * cost paid and the card discarded as it's activated (a real discard, seen
   * by every `discards` trigger — Archfiend of Ifnir's "whenever you cycle or
   * discard another card"), the draw on the stack (`cyclingAbility`), where a
   * "when you cycle this card" trigger (`this-cycled` — Dismantling Wave)
   * goes on above it and resolves first (the rulings). `null` for a card
   * without cycling. */
  readonly cycling: {
    readonly cost: string;
    /**
     * **Landcycling / typecycling** (rules 702.29e–f — Migratory Route's "Basic
     * landcycling {2}"): instead of drawing, search your library for a card
     * matching this filter, reveal it and put it into your hand.
     *
     * Same ability as ordinary cycling — pay, discard, then this instead of
     * the draw as it resolves.
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
  /** An omen card (rule 720): a creature card with an instant or sorcery
   * Omen as its second `faces` entry, cast as either (720.3). An Omen spell
   * resolving is shuffled into its owner's library instead of going to the
   * graveyard (720.3d) — a copy of one ceases to exist, its owner still
   * shuffling (the ruling); countered, or fizzling, it goes to the graveyard
   * as any spell does. `true` on both faces. */
  readonly omen: boolean;
  /**
   * A split card (rule 709): `faces` is `[the card, left half, right half]`.
   * Face 0 is the whole card — what it is in every zone but the stack, both
   * halves' characteristics combined (709.4: both names, the combined mana
   * cost, both colours and types) — and is never cast; casting picks a half,
   * face 1 or 2, and only that half exists on the stack (709.3). `true` on
   * all three definitions. Fuse isn't modelled.
   */
  readonly split: boolean;
  /**
   * "N damage divided as you choose among" the targets of the "any number
   * of" group at target slot `slot` (rule 601.2d — Magma Opus): the caster
   * announces the division as they choose targets, at least 1 to each, all
   * `total` of it. Carried on the spell (`GameObject.division`, a copy keeps
   * it) and dealt by a `damage-divided` effect. `null` for every other card.
   */
  readonly divided: { readonly total: number; readonly slot: number } | null;
  /** The partner-family ability that lets this card be one of *two*
   * commanders (rule 702.124), or `null` for a card that can only command
   * alone. A deckbuilding rule, read by `deck-validation.ts`'s
   * `canPairCommanders` and nothing in play. See {@link CommanderPairing}. */
  readonly pairing: CommanderPairing | null;
  /** "[This card] can be your commander." (rule 903.3a) — what lets a
   * legendary card that is neither a creature, a Vehicle nor a Spacecraft
   * with power/toughness (a planeswalker, say) command a deck. A
   * deckbuilding rule, read by `deck-validation.ts`'s `canCommandAlone`. */
  readonly canBeCommander: boolean;
}

/**
 * Which parts of a card are abilities (rule 113) — what "a creature with **no
 * abilities**" (Jasmine Boreal of the Seven) asks about the card itself. A
 * mapped type over every `CardDefinition` field, so one added there fails the
 * build until it's classified here.
 *
 * `false`: a characteristic or bookkeeping — name, cost, colours, types, P/T,
 * starting loyalty, `text` (what the client prints; the structured fields are
 * what the card does), and the layout flags. A double-faced card's other face
 * and an adventurer card's Adventure aren't this face's abilities (rules
 * 712.8a, 715.4).
 *
 * A function: that part is an ability whenever it's set — a keyword (rule
 * 702), an activated, triggered or static ability (113.3), a spell's own
 * instructions (a spell ability, 113.3a), an Aura's targets (its enchant
 * ability, 702.5), a Saga's chapter abilities (714.2b), something printed that
 * works on the stack or from another zone ("As an additional cost …", "you may
 * pay … rather than …", "can't be countered" — rule 604.5, and flashback,
 * cycling and their kin), an "as this enters, choose …" replacement (614.12),
 * or a partner-family ability (702.124).
 */
const PRINTED_ABILITY: {
  readonly [K in keyof CardDefinition]-?: false | ((def: CardDefinition) => boolean);
} = {
  name: false,
  tokenName: false,
  art: false,
  manaCost: false,
  colors: false,
  supertypes: false,
  types: false,
  subtypes: false,
  power: false,
  toughness: false,
  keywords: (def) => def.keywords.length > 0,
  toxic: (def) => def.toxic > 0,
  dredge: (def) => def.dredge > 0,
  text: false,
  targets: (def) => def.targets.length > 0,
  castModal: (def) => def.castModal !== null,
  additionalCost: (def) => def.additionalCost !== null,
  kicker: (def) => def.kicker !== null,
  overload: (def) => def.overload !== null,
  freeCastIf: (def) => def.freeCastIf !== null,
  alternativeCost: (def) => def.alternativeCost !== null,
  convoke: (def) => def.convoke,
  delve: (def) => def.delve,
  selfCostReduction: (def) => def.selfCostReduction !== null,
  costPerExtraTarget: (def) => def.costPerExtraTarget !== null,
  casualty: (def) => def.casualty !== null,
  effect: (def) => def.effect !== null,
  resolve: (def) => def.resolve !== null,
  activated: (def) => def.activated.length > 0,
  triggered: (def) => def.triggered.length > 0,
  static: (def) => def.static.length > 0,
  revealsOwnLibraryTop: (def) => def.revealsOwnLibraryTop,
  looksAtOwnLibraryTop: (def) => def.looksAtOwnLibraryTop,
  controlEnchanted: (def) => def.controlEnchanted,
  castOnlyIf: (def) => def.castOnlyIf !== null,
  splitSecond: (def) => def.splitSecond,
  copyOnEnter: (def) => def.copyOnEnter !== null,
  exchangeTextOnEnter: (def) => def.exchangeTextOnEnter !== null,
  chooseCreatureTypeOnEnter: (def) => def.chooseCreatureTypeOnEnter,
  chooseOnEnter: (def) => def.chooseOnEnter !== null,
  loyalty: false,
  flashback: (def) => def.flashback !== null,
  harmonize: (def) => def.harmonize !== null,
  foretell: (def) => def.foretell !== null,
  warp: (def) => def.warp !== null,
  blitz: (def) => def.blitz !== null,
  evoke: (def) => def.evoke !== null,
  prototype: (def) => def.prototype !== null,
  escape: (def) => def.escape !== null,
  suspend: (def) => def.suspend !== null,
  cycling: (def) => def.cycling !== null,
  castFromGraveyardIf: (def) => def.castFromGraveyardIf !== undefined,
  chapters: (def) => def.chapters !== null && def.chapters.length > 0,
  faces: false,
  cantBeCountered: (def) => def.cantBeCountered,
  commanderTaxAsLife: (def) => def.commanderTaxAsLife,
  exileOnResolve: (def) => def.exileOnResolve,
  shuffleIntoLibraryOnResolve: (def) => def.shuffleIntoLibraryOnResolve,
  countersPersistAcrossZones: (def) => def.countersPersistAcrossZones,
  transform: false,
  disturb: (def) => def.disturb !== null,
  adventure: false,
  omen: false,
  split: false,
  divided: false,
  pairing: (def) => def.pairing !== null,
  canBeCommander: (def) => def.canBeCommander,
};

const PRINTED_ABILITY_TESTS: readonly ((def: CardDefinition) => boolean)[] = Object.values(
  PRINTED_ABILITY,
).filter((test): test is (def: CardDefinition) => boolean => test !== false);

/** Whether a card has any ability of its own, as printed — see
 * {@link PRINTED_ABILITY}. What it has been granted, or lost, is
 * `characteristics.ts`'s `hasAnyAbility`. */
export function printedHasAbility(def: CardDefinition): boolean {
  return PRINTED_ABILITY_TESTS.some((test) => test(def));
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
  /** See {@link CardDefinition.tokenName}. */
  tokenName?: string;
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
  /** See {@link CardDefinition.toxic}. */
  toxic?: number;
  /** See {@link CardDefinition.dredge}. */
  dredge?: number;
  text?: string;
  targets?: readonly TargetSpec[];
  castModal?: CastModalSpec;
  additionalCost?: {
    readonly sacrifice?: CardFilter;
    readonly sacrificeCount?: number | "x";
    readonly discard?: number;
    readonly payLife?: number;
    readonly payLifeX?: boolean;
    readonly options?: readonly AdditionalCostOption[];
  };
  kicker?: {
    readonly cost: string;
    readonly targets?: readonly TargetSpec[];
    readonly effect?: EffectSpec;
    readonly keyword?: "offspring" | "gift";
    readonly multi?: boolean;
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
  delve?: boolean;
  selfCostReduction?: {
    readonly condition: StaticCondition;
    readonly reduceGeneric: CostReductionAmount;
  };
  costPerExtraTarget?: string;
  /** See {@link CardDefinition.casualty}. */
  casualty?: number;
  effect?: EffectSpec;
  resolve?: SpellResolver;
  activated?: readonly ActivatedAbility[];
  triggered?: readonly TriggeredAbility[];
  static?: readonly StaticAbility[];
  revealsOwnLibraryTop?: boolean;
  looksAtOwnLibraryTop?: boolean;
  controlEnchanted?: boolean;
  castOnlyIf?: StaticCondition;
  splitSecond?: boolean;
  copyOnEnter?: CopyOnEnter;
  exchangeTextOnEnter?: CardFilter;
  chooseCreatureTypeOnEnter?: boolean;
  chooseOnEnter?: readonly string[];
  loyalty?: number;
  flashback?: {
    readonly cost: string;
    readonly payLife?: number;
    readonly sacrifice?: { readonly filter: CardFilter; readonly count: number };
  };
  castFromGraveyardIf?: StaticCondition;
  harmonize?: { readonly cost: string };
  foretell?: { readonly cost: string };
  warp?: { readonly cost: string };
  blitz?: { readonly cost: string };
  evoke?: { readonly cost: string };
  prototype?: { readonly cost: string; readonly power: number; readonly toughness: number };
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
  split?: boolean;
  divided?: { readonly total: number; readonly slot: number };
  disturb?: { readonly cost: string };
  adventure?: boolean;
  omen?: boolean;
  pairing?: CommanderPairing;
  canBeCommander?: boolean;
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
    ...(draft.tokenName !== undefined ? { tokenName: draft.tokenName } : {}),
    art: draft.art ?? null,
    manaCost: draft.manaCost ?? null,
    colors: draft.colors ?? [],
    supertypes: draft.supertypes ?? [],
    types: draft.types,
    subtypes: draft.subtypes ?? [],
    power: draft.power ?? null,
    toughness: draft.toughness ?? null,
    keywords: draft.keywords ?? [],
    toxic: draft.toxic ?? 0,
    dredge: draft.dredge ?? 0,
    text: draft.text ?? "",
    targets: draft.targets ?? [],
    castModal: draft.castModal ?? null,
    additionalCost: draft.additionalCost ?? null,
    kicker: draft.kicker ?? null,
    overload: draft.overload ?? null,
    freeCastIf: draft.freeCastIf ?? null,
    alternativeCost: draft.alternativeCost ?? null,
    convoke: draft.convoke ?? false,
    delve: draft.delve ?? false,
    selfCostReduction: draft.selfCostReduction ?? null,
    costPerExtraTarget: draft.costPerExtraTarget ?? null,
    casualty: draft.casualty ?? null,
    effect: draft.effect ?? null,
    resolve: draft.resolve ?? null,
    activated: draft.activated ?? [],
    triggered: draft.triggered ?? [],
    static: [...(draft.static ?? []), ...loyaltyStatic],
    revealsOwnLibraryTop: draft.revealsOwnLibraryTop ?? false,
    looksAtOwnLibraryTop: draft.looksAtOwnLibraryTop ?? false,
    controlEnchanted: draft.controlEnchanted ?? false,
    castOnlyIf: draft.castOnlyIf ?? null,
    splitSecond: draft.splitSecond ?? false,
    copyOnEnter: draft.copyOnEnter ?? null,
    exchangeTextOnEnter: draft.exchangeTextOnEnter ?? null,
    chooseCreatureTypeOnEnter: draft.chooseCreatureTypeOnEnter ?? false,
    chooseOnEnter: draft.chooseOnEnter ?? null,
    loyalty,
    flashback: draft.flashback ?? null,
    harmonize: draft.harmonize ?? null,
    foretell: draft.foretell ?? null,
    warp: draft.warp ?? null,
    blitz: draft.blitz ?? null,
    evoke: draft.evoke ?? null,
    prototype: draft.prototype ?? null,
    suspend: draft.suspend ?? null,
    cycling: draft.cycling ?? null,
    ...(draft.castFromGraveyardIf !== undefined ? { castFromGraveyardIf: draft.castFromGraveyardIf } : {}),
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
    omen: draft.omen ?? false,
    split: draft.split ?? false,
    divided: draft.divided ?? null,
    pairing: draft.pairing ?? null,
    canBeCommander: draft.canBeCommander ?? false,
  };
}
