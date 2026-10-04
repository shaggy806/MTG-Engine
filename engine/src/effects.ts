/**
 * The effect layer: a small declarative vocabulary that the engine interprets,
 * plus the `ResolutionContext` API that both declarative effects and imperative
 * `resolve` scripts (the escape hatch) call into.
 *
 * The engine ({@link Game}) supplies the concrete {@link EffectApi} implementation
 * — these functions just describe *what* to do. A `target` field is an index
 * into the spell's or ability's chosen targets, or the literal `"source"`.
 */

import type { ActivatedAbility, TriggeredAbility } from "./abilities.js";
import type {
  AffectSpec,
  CardType,
  CombatRestriction,
  Keyword,
  StaticAbility,
  StaticCondition,
  Supertype,
  TurnStat,
} from "./cards.js";
import type { AggregateSpec, CardFilter } from "./filter.js";
import type { Color, ManaType, SpendAs } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import { EVERY_CREATURE_TYPE, isCreatureType } from "./subtypes.js";
import type { ThisWayEntry } from "./this-way.js";
import type {
  DelayedTriggerTiming,
  LeaveDestination,
  PlayerCounterKind,
  PlayerEffect,
  SpellSnapshot,
  TurnHistoryKind,
} from "./state.js";
import type { ResolvedTargets, TargetRef, TargetSpec } from "./target.js";

/** `"trigger-object"` reads `ResolutionContext.triggerObject` (needed-cards
 * P15 — Exalted's "that creature gets +1/+1", the lone attacker rather than
 * a target or the ability's own source). */
export type EffectTargetRef = number | "source" | "trigger-object";
/** What a `search-library` searches — see its `zones`. */
export type SearchZones = "library" | "graveyard" | "library-and-graveyard";
/**
 * What a `search-library`'s finds must be *together* — see its `together`.
 *
 * - `{ share: "land-type" }`: "…that **share a land type**" (Myriad
 *   Landscape): every find has a land type (rule 205.3i) in common with every
 *   other.
 * - `{ oneEach }`: "a Forest card **and** a Plains card" (Krosan Verge): one
 *   find per slot, each matching its slot's filter. The effect's own `filter`
 *   should admit exactly the cards some slot does, and its `max` be the
 *   number of slots.
 */
export type SearchTogether =
  | { readonly share: "land-type" }
  | {
      readonly oneEach: readonly {
        /** How the client names the slot: "a Forest card". */
        readonly label: string;
        readonly filter: CardFilter;
      }[];
    };
/**
 * What an amount that reads an object (`powerOf`, `toughnessOf`,
 * `manaValueOf`, `manaSpentOf`) may point at: anything an
 * {@link EffectTargetRef} can, plus `"sacrificed"` — the permanent sacrificed
 * to pay the spell's or ability's cost, or by a `sacrifice-source` step
 * before this one ("where X is the sacrificed creature's power" — Dina, Soul
 * Steeper) — and `"tapped"`, the one permanent tapped to pay the ability's
 * cost ("equal to the tapped creature's power" — station). Nothing
 * sacrificed or tapped reads 0.
 *
 * An object that was a permanent when the spell or ability referred to it
 * and has left the battlefield since is read as it last existed there (rule
 * 608.2h — see `LastKnownRefs`): "When Juri dies, it deals damage equal to
 * its power" counts the counters Juri died with.
 */
export type AmountRef = EffectTargetRef | "sacrificed" | "tapped";
/** Where a `return-to-hand` effect takes its object from. */
export type ReturnToHandZone = "battlefield" | "graveyard" | "exile" | "stack";
/**
 * How long an effect on a permanent lasts (rule 611.2a): until end of turn;
 * for as long as the permanent stays on the battlefield (`"permanent"`);
 * "until your next turn" — the effect's controller's, ending as that turn
 * begins, or as it would have begun once they've left the game (rule
 * 800.4m); or "for as long as it has a [kind] counter on it" (Ultima,
 * Origin of Oblivion's blight — rule 611.2b), which does nothing if it has
 * none as the effect would begin, ends as the last one is removed, and
 * isn't brought back by a new one.
 */
export type PtDuration =
  | "end-of-turn"
  | "permanent"
  | "until-your-next-turn"
  | { readonly whileCounter: string }
  /** "For as long as [this] remains on the battlefield" — the effect's own
   * source, in the stint the resolving ability refers to (Opportunistic
   * Dragon): it ends as that leaves, and does nothing if it already has
   * (rule 611.2b). */
  | "while-source";

/**
 * A "spend this mana only to …" clause on a mana ability (rule 106.6b).
 *
 * `spell` is the ordinary case: only spells matching this filter. `abilityOf`
 * adds "…or activate abilities of [X]" (Eldrazi Temple, Castle Garenbrig).
 * `chosenType` means the filter's subtype comes from the source's own
 * `chosenCreatureType`, named as it entered rather than printed (Cavern of
 * Souls, Unclaimed Territory, Secluded Courtyard) — it is resolved at
 * activation time and folded into `spell`.
 */
export interface ManaSpendOnly {
  readonly spell?: CardFilter;
  /** "This mana can't be spent to cast [these] spells" — Karn, Legacy
   * Reforged's `{ notTypes: ["artifact"] }`: anything else may use it,
   * abilities and ward costs included. Set alone. See `ManaRestriction`. */
  readonly notSpell?: CardFilter;
  /** "…or activate abilities of [X]": abilities of permanents on the
   * battlefield matching this — "abilities of creatures" means creature
   * permanents (rule 109.2; Castle Garenbrig's ruling). */
  readonly abilityOf?: CardFilter;
  /** `abilityOf` covers a card's abilities in any zone too — "an ability of
   * a creature **source**" (Secluded Courtyard), which names a source rather
   * than a permanent (rule 109.2a). */
  readonly abilityOfAnyZone?: true;
  readonly chosenType?: boolean;
  /** "…and that spell can't be countered" (Cavern of Souls, Delighted
   * Halfling). A property of the spell this mana pays for, not of the land. */
  readonly uncounterable?: boolean;
  /** "Spend this mana only to cast a spell from your graveyard" (Lord of the
   * Forsaken). Set alone. See `ManaRestriction.fromYourGraveyard`. */
  readonly fromYourGraveyard?: true;
  /** The card's own wording, for the log and the mana display. */
  readonly text: string;
}

/**
 * Counters a blinked permanent gets as it comes back — Essence Flux's "If
 * it's a Spirit, put a +1/+1 counter on it". `onlyIf` is checked against the
 * *returned* permanent, which is a new object (rule 400.7) wearing its
 * printed characteristics with none of the type or ability changes the old
 * one was carrying.
 */
export interface FlickerCounters {
  readonly kind: string;
  readonly amount: number;
  readonly onlyIf?: CardFilter;
  /** The permanent comes back **with** them — Planar Incision's "return it
   * to the battlefield … with a +1/+1 counter on it": on it as it enters
   * (rule 122.6), so its enters triggers see them. Without it they're put
   * on after it has returned, as Essence Flux's are. */
  readonly entering?: boolean;
}

/**
 * A `delayed-trigger` keyed to one permanent leaving the battlefield rather
 * than to a step: "when **that creature** dies this turn" (Kelsien, the
 * Plague), earthbend's "when **it** dies or is exiled". `leaves` is a target
 * slot, `"source"` or `"trigger-object"`, and must name a permanent on the
 * battlefield as the effect applies (otherwise there is nothing to watch, and
 * no trigger is made). When it fires, that permanent — now wherever it went —
 * is the ability's trigger object, so "return it to the battlefield" is
 * `put-onto-battlefield` with `target: "trigger-object"`; the creating
 * effect's targets still ride along by slot. See `DelayedLeaveWatch`.
 */
export interface DelayedLeaves {
  readonly leaves: EffectTargetRef;
  /** `["graveyard"]` is "dies", `["graveyard", "exile"]` "dies or is
   * exiled". */
  readonly to: readonly LeaveDestination[];
  /** "…this turn". */
  readonly thisTurn?: boolean;
}

/** "When you next cast a [filter] spell this turn" (Yuna, Grand Summoner;
 * Codie, Vociferous Codex) — a delayed trigger keyed to its controller's next
 * spell matching `nextSpell` (`{}` for any), once, and this turn only. That
 * spell is its trigger object. */
export interface DelayedNextSpell {
  readonly nextSpell: CardFilter;
}

/** "Whenever **that creature** deals combat damage to a player this turn"
 * (Captain Howler, Sea Scourge) — a delayed trigger keyed to the permanent in
 * `dealsCombatDamage`'s slot, for this stint of it on the battlefield. A
 * "whenever": it fires each time (double strike twice), and lapses as the
 * turn ends. That permanent is its trigger object. */
export interface DelayedCombatDamage {
  readonly dealsCombatDamage: EffectTargetRef;
}

/** How a `flicker` returns what it exiled — the non-target half of its
 * {@link EffectSpec}. */
export interface FlickerOptions {
  readonly thenCounters?: FlickerCounters;
  readonly underYourControl?: boolean;
  /** It returns transformed (Clive, Ifrit's Dominant). */
  readonly transformed?: boolean;
  /** It returns tapped (Nezahal, Primal Tide). */
  readonly tapped?: boolean;
  readonly returnAt?: DelayedTriggerTiming;
  readonly returnText?: string;
  /** The effect named its own source (`target: "source"`). */
  readonly fromSource?: boolean;
}
/** A numeric amount in an effect: a literal, `"x"` for the value chosen for
 * `{X}` when the spell/ability was put on the stack (`ResolutionContext.x`),
 * or a live count of battlefield permanents matching a filter, evaluated from
 * the effect's controller's perspective (Scourge of Valkas: `{ countOf:
 * { subtype: "Dragon", controlledBy: "you" } }`; Craterhoof Behemoth:
 * `{ countOf: { type: "creature", controlledBy: "you" } }`). */
export type EffectAmount =
  | number
  | "x"
  | {
      readonly countOf: CardFilter;
      /** Multiply the count (Shamanic Revelation: "you gain **4 life for
       * each** creature you control with power 4 or greater"). Defaults to 1,
       * which is the plain "one per" every other user of `countOf` wants. */
      readonly times?: number;
      /** Leave the effect's own source out — "for each **other** creature
       * you control". One permanent, not one object: a source that is a
       * member of a token stack leaves the rest of the stack counted. */
      readonly excludeSelf?: boolean;
      /** Leave out whatever target slot `excludeTarget` names — "for each
       * creature you control **other than that creature**". */
      readonly excludeTarget?: number;
      /** Read the filter from the side of the player in this target slot
       * rather than the effect's controller's — "the number of creatures
       * **target player** controls" (Will of the Mardu) is `{ countOf: {
       * type: "creature", controlledBy: "you" }, forTarget: 0 }`. 0 when the
       * slot holds no player, or one gone illegal. */
      readonly forTarget?: number;
    }
  /** A sum or maximum over matching battlefield permanents — "X is the
   * **total power** of creatures you control", "the **greatest mana value**
   * among permanents you control". A token stack counts once per token in a
   * sum. Clamped at 0 (rule 107.1b), so a board of negative-power creatures
   * deals no damage rather than a negative amount. See {@link AggregateSpec}. */
  | AggregateSpec
  /** A numeric quantity the triggering event supplies (ROADMAP P4b): the power
   * of the entering creature (Terror of the Peaks) or, for a "deals combat
   * damage to a player" trigger, the damage dealt (Old Gnawbone — "create that
   * many Treasure tokens"). Snapshotted when the trigger is detected; `0`
   * outside a triggered-ability resolution. */
  | { readonly triggerValue: true }
  /** The number chosen as the source entered — Talion, the Kindly Lord's "the
   * chosen number" (a `chooseOnEnter` of "1"…"10"). `NaN` while none was
   * chosen, so a comparison with it never holds: like Pramikon's direction,
   * a choice that was never made has no effect. */
  | { readonly chosenNumber: true }
  /**
   * The mana value of whatever a target slot (or `"source"` /
   * `"trigger-object"` / `"sacrificed"`) points at — Feed the Swarm's "you
   * lose life equal to that permanent's mana value", Hoard-Smelter Dragon,
   * Aura Mutation.
   *
   * A permanent that has left the battlefield since is read as it last
   * existed there (rule 608.2h — last known information, see
   * {@link AmountRef}). That matters because every card printed this way
   * destroys the permanent *first* and then reads its mana value. `0` for a
   * player target or an object that no longer exists at all.
   */
  | { readonly manaValueOf: AmountRef }
  /**
   * How much mana was actually spent to cast the object (Prossh, Skyraider of
   * Kher: "where X is the amount of mana spent to cast it"). Commander tax,
   * {X} and additional mana costs count; a free cast is 0, and so is mana a
   * creature paid for by convoke, which isn't mana (rule 702.51a). `0` for
   * anything that wasn't cast.
   */
  | { readonly manaSpentOf: AmountRef }
  /**
   * How many **colours** of mana were spent to cast the object — converge
   * (an ability word, rule 207.2c: Painful Truths' "where X is the number of
   * colors of mana spent to cast this spell"). Colourless isn't a colour, so
   * at most 5; mana spent on additional costs and cost increases counts. A
   * copy of a spell wasn't cast and reads 0, as does a free cast (the
   * converge rulings). Kept by the permanent a spell becomes, like
   * `manaSpentOf`; `0` for anything that wasn't cast.
   */
  | { readonly colorsSpentOf: AmountRef }
  /**
   * How many times the commander behind an {@link AmountRef} has been cast
   * from the command zone this game (rule 903.8's count — the same one the
   * commander tax reads), by its owner. Study Hall's "scry X, where X is the
   * number of times it's been cast from the command zone this game", in a
   * `whenSpent` rider whose slot 0 is the spell: that cast already counts. `0`
   * for anything that isn't a card.
   */
  | { readonly commanderCastsOf: AmountRef }
  /**
   * How many times the effect's controller has cast **their commanders** from
   * the command zone this game, all of them together (rule 903.8's counts,
   * added up) — Thunderclap Drake's "for each time you've cast your commander
   * from the command zone this game", whose ruling adds both of a pair's
   * casts. 0 for a player with no commander.
   */
  | { readonly commanderCasts: "you" }
  /** A current life total: the effect controller's (`"you"` — Ajani, Caller
   * of the Pride's ultimate: "create X 2/2 white Cat creature tokens, where X
   * is your life total"), or `"each"`, the life of **each player the effect
   * is applied to** — "each opponent loses half **their** life" is a
   * scoped `lose-life` whose amount is read once per player. Outside a
   * scoped effect `"each"` reads the controller's. */
  | { readonly lifeTotal: "you" | "each" }
  /** Half of an amount, rounded up or down (rule 107.1a says which the card
   * must say) — "half their life, rounded up". */
  | { readonly half: EffectAmount; readonly round: "up" | "down" }
  /** How many cards in **graveyards** match a filter — Undergrowth's "for
   * each creature card in your graveyard" (Lotleth Giant). Distinct from
   * `countOf`, which only ever counts battlefield permanents. The filter's
   * `ownedBy: "you"` is what restricts it to your own graveyard. */
  | { readonly countInGraveyard: CardFilter }
  /** The current power of whatever an {@link AmountRef} points at — Unleash
   * Fury's "double the power of target creature" is a `modify-pt` that adds
   * this; "it deals damage equal to its power" from a dies trigger reads the
   * power it died with, and `{ powerOf: "sacrificed" }` is the Fling family's
   * "the sacrificed creature's power". `doubling` marks a "double its power"
   * P/T change, the one place a power below 0 is used as it is (see
   * {@link ptChangeValue}). */
  | { readonly powerOf: AmountRef; readonly doubling?: true }
  /** The current toughness of whatever an {@link AmountRef} points at —
   * Condemn's "its controller gains life equal to its toughness", read as
   * the creature last existed on the battlefield. `doubling` as for
   * `powerOf`. */
  | { readonly toughnessOf: AmountRef; readonly doubling?: true }
  /** How many counters of one kind are on whatever an {@link AmountRef}
   * points at — Black Market's "{B} for each charge counter on this
   * enchantment", Chasm Skulker's "X is the number of +1/+1 counters on this
   * creature" from its own dies trigger, which reads the counters it died
   * with (last-known information, rule 608.2h). `0` for a player. */
  | {
      readonly countersOn: AmountRef;
      /** One kind; omitted, every counter of every kind — "the number of
       * counters on it". */
      readonly counter?: string;
    }
  /** Your **devotion** to a colour (rule 700.5): every mana symbol of that
   * colour in the mana costs of permanents you control, hybrid pips included.
   * Gray Merchant of Asphodel's "each opponent loses X life, where X is your
   * devotion to black".
   *
   * `"that-color"` is the colour an `add-mana` of `"any-color"` is making —
   * Nykthos, Shrine to Nyx's "Choose a color. Add an amount of mana of that
   * color equal to your devotion to that color": the colour is chosen first,
   * then the amount read for it. 0 anywhere else. */
  | { readonly devotionTo: Color | "that-color" }
  /** The greatest mana value among the effect's controller's commanders,
   * wherever each one is, as it is now (Cactus Preserve's "an X/X … where X
   * is the greatest mana value among your commanders" — its ruling); 0 with
   * none. `characteristics.ts`'s `greatestCommanderManaValue`. */
  | { readonly greatestCommanderManaValue: true }
  /** How many creatures died under the effect controller's control this turn
   * — Liliana's Standard Bearer. Reads `PlayerState.creaturesDiedThisTurn`.
   * `anyController`: every creature that died this turn, whoever controlled
   * it (Spymaster's Vault). */
  | { readonly creaturesDiedThisTurn: true; readonly anyController?: true }
  /** The product of several amounts — Gray Merchant of Asphodel gains "life
   * equal to the life lost this way", which is its devotion to black times
   * the number of opponents who lost that much. Composes, so it stays out of
   * the individual amount shapes. */
  | { readonly product: readonly EffectAmount[] }
  /** How many opponents control *fewer* permanents matching `filter` than the
   * effect's controller does — Voice of Many's "draw a card for each opponent
   * who controls fewer creatures than you". A comparison per player, which no
   * single `CardFilter` can express. */
  | { readonly opponentsControllingFewer: CardFilter }
  /** How many players a `PlayerScope` covers — Inspired Sphinx's "draw cards
   * equal to **the number of opponents you have**". Counts living players, so
   * it shrinks as a multiplayer game does. */
  | { readonly countPlayers: PlayerScope }
  /** How much life the players `who` names (default everyone) have lost so
   * far in the resolution under way — "each opponent loses 1 life and you
   * gain **that much** life" (extort), "you gain life equal to the life lost
   * this way" (Gray Merchant of Asphodel). The life actually lost, read off
   * the resolution's own life changes, so an opponent whose loss is changed
   * or who can't lose life counts for what they lost. */
  | { readonly lifeLostThisWay: true; readonly who?: PlayerScope }
  /**
   * A per-player running total for this turn ({@link TurnStat}), summed over
   * the players `who` names (default `"you"`) — Kydele's "{C} for each card
   * you've drawn this turn", or "the total life your opponents lost this
   * turn" as `who: "each-opponent"`. A player who has left the game is no
   * longer in any scope, so their total drops out. `target` reads the player
   * in that target slot instead — Astarion, the Decadent's "target opponent
   * loses life equal to the amount of life **they** lost this turn".
   */
  | { readonly turnStat: TurnStat; readonly who?: PlayerScope; readonly target?: number }
  /** The spells `who` (you by default) cast this turn that match the
   * filter, each read as it was cast (`PlayerState.spellsCastThisTurnAs`):
   * how many, or with `greatest: "mana-value"` the greatest mana value
   * among them, its {X} counted (Rootha, Mastering the Moment's "the greatest
   * mana value among instant and sorcery spells you've cast this turn"). 0
   * with none. */
  | {
      readonly castThisTurn: CardFilter;
      readonly who?: PlayerScope;
      readonly greatest?: "mana-value";
    }
  /**
   * How many of the players `who` names have a nonzero {@link TurnStat} this
   * turn — "for each opponent who lost life this turn". Counts players, not
   * the amount: an opponent who lost 10 counts once.
   */
  | { readonly playersWithTurnStat: TurnStat; readonly who: PlayerScope }
  /**
   * How many counters of one kind the players `who` names have, summed —
   * "where X is the number of **experience counters you have**" (Ezuri, Claw
   * of Progress). `who` defaults to `"you"`. See `PlayerState.counters`.
   */
  | { readonly playerCounters: PlayerCounterKind; readonly who?: PlayerScope }
  /** The sum of several amounts — "N plus an amount": a mana value "1
   * greater than the sacrificed creature's" is `{ sum: [{ manaValueOf:
   * "sacrificed" }, 1] }`, in a filter's `{ amount }` operand as much as in
   * an effect. */
  | { readonly sum: readonly EffectAmount[] }
  /**
   * The first amount minus the second, never below 0 (rule 107.1b) — Mr.
   * Foxglove's "the number of cards in defending player's hand minus the
   * number of cards in your hand". `absolute` makes it the larger minus the
   * smaller: Doran, Besieged by Time's "the difference between its power and
   * toughness".
   */
  | { readonly difference: readonly [EffectAmount, EffectAmount]; readonly absolute?: boolean }
  /** How many cards are in the hands of the players a scope names, summed —
   * "the number of cards in **defending player's** hand" is `{ cardsInHand:
   * "trigger-player" }` in an attack trigger. `"each"` is the hand of the
   * player a per-player effect is acting on: Stormbreath Dragon's "deals
   * damage to each opponent equal to the number of cards in **that player's**
   * hand" is a `damage` to `who: "each-opponent"` of `{ cardsInHand: "each"
   * }`. */
  | { readonly cardsInHand: PlayerScope | "each" }
  /** How many cards are in a library or graveyard — yours, or with
   * `"each"` the player a per-player effect is acting on: "any number of
   * target players each mill half **their** library" (Singularity Rupture)
   * is a `mill` of `{ half: { librarySize: "each" }, round: "down" }`,
   * "…cards equal to the number of cards in **their** graveyard" (Riverchurn
   * Monument) `{ graveyardSize: "each" }`. */
  | { readonly librarySize: "you" | "each" }
  | { readonly graveyardSize: "you" | "each" }
  /** How many colours what an {@link AmountRef} points at has — Ramos,
   * Dragon Engine's "a +1/+1 counter on Ramos for each of **that spell's
   * colors**" (`"trigger-object"` in a cast trigger). A permanent that has
   * left is read as it last existed there; colourless is 0. */
  | { readonly colorsOf: AmountRef }
  /** How many colours there are **among** battlefield permanents matching a
   * filter, each counted once however many permanents have it — "for each
   * color among other legendary permanents you control" (Sisay, Weatherlight
   * Captain). `excludeSelf` leaves the effect's own source out ("other"). */
  | { readonly colorsAmong: CardFilter; readonly excludeSelf?: boolean }
  /** How many **differently named** tokens among the battlefield permanents
   * matching a filter — Neriv, Crackling Vanguard's "the number of
   * differently named tokens you control" (`{ token: true, controlledBy:
   * "you" }`): each name once. A token's name is the one the effect that
   * made it gave it, or its subtypes plus "Token" (rule 111.4) — "Elf
   * Token" — whatever its registry key; a copy's is what it copies. */
  | { readonly distinctTokenNames: CardFilter }
  /** How many votes the option at this index got in this resolution — a
   * vote is an `each-player-may` with `choices` and `startingWithYou` (rule
   * 701.38): Selvala's Stampede's "a creature card for each wild vote". */
  | { readonly votesFor: number }
  /** How many card types there are among cards in graveyards matching a
   * filter — each type once, however many cards have it, and a card with two
   * types gives both (Tarmogoyf's "card types among cards in all graveyards"
   * is `{}`; delirium's "in your graveyard" is `{ ownedBy: "you" }`). A
   * multi-face card has its front face's types there (rule 712.8a). */
  | { readonly cardTypesInGraveyard: CardFilter }
  /**
   * How many cards the resolving spell or ability has made players
   * **discard, draw or mill**, or permanents **sacrifice**, so far — "draw a
   * card for each card discarded this way", "that many cards plus one". Every
   * step before this one counts, including one that waited on a player's
   * choice. `who` narrows whose (default: everyone's); `filter` narrows the
   * cards, as they are now (a discarded card in the graveyard it went to), a
   * sacrificed permanent as it last existed; `cardTypes` counts the card
   * types among them instead, each once (Kefka, Court Mage's "a card for each
   * card type among cards discarded this way").
   */
  /**
   * How many things of one of a player's this-turn lists there are — "for
   * each creature that died under your control this turn" (`"died"`), "the
   * number of times you descended this turn" (`"descended"`), permanents that
   * entered under your control (`"entered"`), permanents you sacrificed.
   * `who` is whose (default `"you"`); `filter` narrows them as the
   * `turn-history` condition does. See `TurnHistory`.
   */
  | { readonly turnHistory: TurnHistoryKind; readonly who?: PlayerScope; readonly filter?: CardFilter }
  /** How many opponents the controller is attacking with creatures this
   * combat — melee's "+1/+1 for each opponent you attacked with a creature
   * this combat" (rule 702.121). A planeswalker attacked isn't its
   * controller. */
  | { readonly opponentsAttacked: true }
  /** How many creatures are attacking the player a per-player effect is
   * acting on — that player, not a planeswalker of theirs (rule 506.3):
   * Within Range's "each opponent loses life equal to the number of
   * creatures attacking **them**" is a `lose-life` to `"each-opponent"` of
   * this. Read as it resolves; a token stack counts as every token in it. */
  | { readonly attackingPlayer: "each" }
  /** How much damage sources the scope's players controlled dealt this turn
   * — see the `damage-dealt-this-turn` condition. */
  | {
      readonly damageDealtThisTurn: true;
      readonly who?: PlayerScope;
      readonly combat?: boolean;
      readonly colors?: readonly Color[];
    }
  | {
      readonly thisWay: ThisWayKind;
      /** Whose (see `ThisWayEntry.player`): a scope, or `"each"` — the
       * player a scoped effect is applied to, read once for each ("its
       * controller creates a token for each creature destroyed this way" is a
       * `create-token` with `who: "each-player"` and this). */
      readonly who?: PlayerScope | "each";
      readonly filter?: CardFilter;
      readonly cardTypes?: boolean;
      /** The **greatest** of the players' own counts rather than their sum
       * — Windfall's "draws cards equal to the greatest number of cards **a
       * player** discarded this way" (each player's entries summed, then the
       * largest; 0 with none). */
      readonly perPlayer?: "greatest";
      /** Add up this characteristic of the objects instead of counting them
       * — Reign of the Pit's "X is the **total power** of the creatures
       * sacrificed this way", Tip the Scales' "the sacrificed creature's
       * **toughness**". A permanent that left doing it is read as it last
       * existed on the battlefield (its ruling: a negative power counts as
       * negative), and a token stack that went whole counts once per
       * token. `"mana-value"` is Combustible Gearhulk's "the **total mana
       * value** of those cards" (milled): a card read where it went, if
       * that's a public zone (rule 701.17c), {X} counting 0 (rule 202.3e). */
      readonly sumOf?: "power" | "toughness" | "mana-value";
    }
  /**
   * One amount or another, by a condition read as the amount is — Urza's
   * Tower's "{T}: Add {C}. If you control an Urza's Mine and an Urza's
   * Power-Plant, add {C}{C}{C} instead" is `{ ifCondition: <both>, then: 3,
   * else: 1 }`. Asked from the effect's controller's side, as a
   * `conditional` effect's condition is (the source counts itself), so it
   * suits a mana ability, which can't be a `conditional`: the auto-payer and
   * a hand activation size it against the board as it stands.
   */
  | {
      readonly ifCondition: StaticCondition;
      readonly then: EffectAmount;
      readonly else: EffectAmount;
    };

/**
 * A ward cost (rule 702.21a) — "Ward {2}", "Ward—Pay 2 life.", "Ward—{2},
 * Pay 2 life.", "Ward—Sacrifice a Food.", "Ward—Discard a card.". **One**
 * compound cost: every part that is set is paid together, and the targeting
 * player either pays all of it or none (unlike an `"unless"` clause's
 * options, which are alternatives). See the `"ward"` {@link EffectSpec}.
 */
export interface WardCost {
  readonly mana?: string;
  readonly payLife?: number;
  /** "Sacrifice a legendary artifact or legendary creature" (Sauron),
   * "Sacrifice a Food" (Ygra). The payer picks which. `text` is the clause
   * as printed, without a trailing period ("Sacrifice a Food"). */
  readonly sacrifice?: {
    readonly filter: CardFilter;
    readonly count?: number;
    readonly text: string;
  };
  /** "Discard a card" (Arna Kenneruud): how many; the payer picks which. */
  readonly discard?: number;
  /** "Ward—Blight 2" (Auntie Ool: put two -1/-1 counters on a creature you
   * control). Reserved for the unbuilt blight keyword: a cost naming it is
   * treated as unpayable, and the `ward` card helper refuses to build one,
   * so no card can be authored with it until blight lands. */
  readonly blight?: number;
}

/** A ward cost as printed after "Ward" — "{2}" or "—{2}, Pay 2 life." — so a
 * card's ability text and the payment prompt read the same. */
export function wardCostText(cost: WardCost): string {
  const parts: string[] = [];
  if (cost.mana !== undefined) parts.push(cost.mana);
  if (cost.payLife !== undefined) parts.push(`Pay ${cost.payLife} life`);
  if (cost.sacrifice !== undefined) parts.push(cost.sacrifice.text);
  if (cost.discard !== undefined) {
    parts.push(cost.discard === 1 ? "Discard a card" : `Discard ${cost.discard} cards`);
  }
  if (cost.blight !== undefined) parts.push(`Blight ${cost.blight}`);
  const onlyMana = cost.mana !== undefined && parts.length === 1;
  return onlyMana ? ` ${cost.mana}` : `—${parts.join(", ")}.`;
}

/** One way out of an `"unless"` clause, or one thing an `"each-player-may"`
 * player may do. Exactly one field is set. Each is offered only to a player
 * who can do all of it (rule 118.3): mana they can pay, at least that much
 * life, a permanent to sacrifice, enough cards in hand, a matching card in
 * hand. */
export type UnlessOption =
  | { readonly pay: string; readonly text: string }
  /** "…unless that player pays {X}, where X is this creature's power"
   * (Esper Sentinel): that much generic mana, read as the effect applies —
   * `{X}` in `text` shows the amount. A mana option like `pay`. */
  | { readonly payGeneric: EffectAmount; readonly text: string }
  | { readonly payLife: number; readonly text: string }
  /** `exceptSource`: "sacrifice **another** creature" (Ziatora, the
   * Incinerator) — never the effect's own source. */
  | { readonly sacrifice: CardFilter; readonly exceptSource?: boolean; readonly text: string }
  /** "…or discard a card" (Tergrid's Lantern, Torment of Hailfire). */
  | { readonly discard: number; readonly text: string }
  /** "Put a land card from your hand onto the battlefield" (Kynaios and
   * Tiro of Meletis). */
  | { readonly putFromHand: CardFilter; readonly text: string };

/** An {@link UnlessOption} with any generic amount fixed — what the engine
 * offers. `"each-player-may"`'s options are these already. */
export type BoundUnlessOption = Exclude<UnlessOption, { readonly payGeneric: EffectAmount }>;

/**
 * How far an `"each-player-may"` has got — set by the engine on the copy it
 * parks between one player's answer and the next question. Never authored.
 */
export interface EachPlayerMayProgress {
  /** The `eventSeq` it began at: a player's answer is the first
   * `modes-chosen` event by them for this source since. */
  readonly since: number;
  /** Asked so far, in the order asked. */
  readonly asked: readonly PlayerId[];
  /** Still to ask. */
  readonly toAsk: readonly PlayerId[];
  /** Once everyone has answered: the follow-ups still to apply. */
  readonly results?: readonly { readonly player: PlayerId; readonly did: boolean }[];
}

/** @deprecated Use {@link CardFilter} directly — kept as an alias so existing
 * `look-and-choose` / `matchesZoneChoiceFilter` call sites still type-check. */
export type ZoneChoiceFilter = CardFilter;

/**
 * The placeholder a `choose-creature-type` effect's `then` uses for the type
 * that ends up chosen — e.g. `{ notSubtypes: [CHOSEN_CREATURE_TYPE] }` for
 * Crippling Fear's "creatures that aren't of the chosen type". Substituted
 * into `then` by value (see `substituteChosenCreatureType`) before it applies.
 */
export const CHOSEN_CREATURE_TYPE = "$chosen";

/**
 * A copy of `spec` with every string exactly equal to `CHOSEN_CREATURE_TYPE`
 * replaced by `creatureType`. `EffectSpec` is plain data, so a structural walk
 * reaches every filter, subtype list and nested effect without the individual
 * effects needing to know a choice is involved.
 */
export function substituteChosenCreatureType(spec: EffectSpec, creatureType: string): EffectSpec {
  const walk = (value: unknown): unknown => {
    if (value === CHOSEN_CREATURE_TYPE) return creatureType;
    if (Array.isArray(value)) return value.map(walk);
    if (value !== null && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walk(v)]));
    }
    return value;
  };
  return walk(spec) as EffectSpec;
}

/** A `reveal-until` waiting on a decision — see its `progress`. */
export interface RevealUntilProgress {
  readonly owner: PlayerId;
  readonly revealed: readonly ObjectId[];
  /** The card found, or `null` for none. */
  readonly hit: ObjectId | null;
  /** Whether the card found has been put where `put` says, and `then`
   * applied: the decision waited on is `then`'s, rather than the "as this
   * enters" choice of the card being put onto the battlefield. */
  readonly placed: boolean;
}

/**
 * What a gift gives (rules 702.174d–i): "Gift a Food" — the chosen player
 * creates a Food token; "a card" — they draw a card; "a tapped Fish" — they
 * create a tapped 1/1 blue Fish creature token; "an extra turn" — they take
 * an extra turn after this one; "a Treasure"; "an Octopus" — an 8/8 blue
 * Octopus creature token.
 */
export type GiftKind = "food" | "card" | "tapped-fish" | "extra-turn" | "treasure" | "octopus";

/** Which players an "each" / mass effect reaches. */
/**
 * What a spell or ability did "this way" — the cards it made players
 * discard, draw or mill, the permanents it made them sacrifice, and what it
 * destroyed (a destroy effect, not a creature dying of damage), exiled
 * (permanents and cards alike), returned to a hand, put into a graveyard
 * (cards — tokens aren't) or put onto the battlefield from a zone (not a
 * token created) — read off the events of the resolution so far (see
 * `GameState.resolutionSince` and `this-way.ts`). The `thisWay`
 * {@link EffectAmount} counts them, the `this-way` condition asks about them
 * and the `thisWay` filter clause picks among them.
 */
/**
 * What deals an effect's damage when it isn't the effect's own source:
 * `"trigger-object"`, the object that fired the trigger, or `{ target }`, a
 * target slot's permanent — Chandra's Ignition's "**target creature you
 * control** deals damage equal to its power to each other creature and each
 * opponent" (that creature is the source, not the spell: its colours count
 * for protection, its lifelink and deathtouch apply — the rulings). Read as
 * it last existed on the battlefield if it has left (rule 608.2h); a blank
 * slot (an illegal target, rule 608.2b) deals nothing.
 */
export type DamageFrom = "trigger-object" | { readonly target: number };

export type ThisWayKind =
  | "discarded"
  | "drawn"
  | "milled"
  | "sacrificed"
  | "destroyed"
  /** Destroyed and put into a graveyard: "if that creature dies this way". */
  | "died"
  | "exiled"
  | "returned-to-hand"
  | "put-into-graveyard"
  | "put-onto-battlefield"
  /** Tokens it created (a compacted stack as each of its tokens). */
  | "created"
  /** Cards it had a player put from their hand on the bottom of their
   * library — Valakut Awakening's "then draw **that many** cards plus one",
   * Teferi's Puzzle Box's "then draws that many cards". Counted by the
   * player whose hand they left. */
  | "put-on-bottom"
  /** Permanents it tapped — Myr Battlesphere's "you may tap X untapped Myr
   * you control. If you do, this creature gets +X/+0": a `choose-permanents`
   * tapping them, then this. One already tapped isn't tapped again, and so
   * isn't counted. */
  | "tapped";

export type PlayerScope =
  | "each-player"
  | "each-opponent"
  | "you"
  /** Whoever's turn it is — "that player" in a trigger that fires on someone
   * else's step (Archfiend of Depravity). */
  | "active-player"
  /** The controller of the object behind the trigger — "that player" when
   * the event is about something they did: the player who drew the card
   * (Nekusar, the Mindrazer), the player who cast the spell. Not a target,
   * so a hexproof player is still reached. */
  | "trigger-controller"
  /** The player the triggering event names — "that player" / "defending
   * player": the player dealt damage (or the controller of the permanent
   * dealt damage), the defending player of an attack. See
   * `LastKnownRefs.player`. Nobody outside such a trigger. Not a target. */
  | "trigger-player"
  /** Each opponent of the effect's controller **other than** the
   * `"trigger-player"` — Kediss, Emberclaw Familiar's "it deals that much
   * damage to each other opponent". Every opponent when the trigger names
   * nobody. */
  | "each-other-opponent"
  /** "That player" in an `"each-player-may"`'s `ifDid` / `ifDidnt`: the
   * player the follow-up is about. Elsewhere, the same as
   * `"trigger-player"`. Not a target. */
  | "that-player";

/**
 * One player an effect names as the one who does something — who gains
 * control (`gain-control`), under whose control a card is put onto the
 * battlefield (`put-onto-battlefield`), who puts the counters (`add-counter`)
 * or untaps it (`untap`):
 * the effect's controller (`"you"`), a player target slot (`{ target: n }`),
 * or one of the single-player {@link PlayerScope}s the event names. Naming
 * nobody — an empty or illegal slot (rule 608.2b), a player who has left the
 * game — the effect does nothing.
 */
export type EffectPlayerRef =
  | "you"
  | "active-player"
  | "trigger-controller"
  | "trigger-player"
  | "that-player"
  | { readonly target: number };

/**
 * What a creature put onto the battlefield attacking attacks (rule 508.4).
 * `"choose"`: its controller chooses a defending player or a planeswalker one
 * controls, for each creature — asked only when there's more than one
 * (`enter-attacking` decision). `{ player }`: the effect names the player
 * ("tapped and attacking that player" — Ainok Strike Leader), and with
 * `orTheirPlaneswalker` their planeswalkers are options too ("…that player or
 * a planeswalker they control" — Adeline, myriad).
 *
 * Only a creature controlled by the attacking player, during combat, ever
 * ends up attacking (rule 506.3a-c): anything else just enters. It was never
 * declared, so it never "attacked" (508.3a) and no attack requirement or
 * restriction applies to it (508.4c). Entering after blockers are declared,
 * it's unblocked (508.4d).
 */
export type EnterAttacking =
  | "choose"
  | { readonly player: EffectPlayerRef; readonly orTheirPlaneswalker?: boolean };

/** {@link EnterAttacking} with its player resolved, as `Game` takes it. */
export type ResolvedEnterAttacking =
  | "choose"
  | { readonly player: PlayerId | undefined; readonly orTheirPlaneswalker: boolean };

/** A declarative effect. Grows as milestones add vocabulary. */
/** What cascade found: the card it may cast, its name, and everything it
 * exiled on the way (the card included). */
export interface CascadeFound {
  readonly hit: ObjectId;
  readonly name: string;
  readonly exiled: readonly ObjectId[];
}

/** The answer to cascade's "you may cast it" — see `EffectSpec` `cascade`. */
export interface CascadeFinish {
  readonly hit: ObjectId;
  readonly exiled: readonly ObjectId[];
  readonly cast: boolean;
}

/** How a `cast-now` offers its cards — see that {@link EffectSpec}. */
export interface CastNowOptions {
  readonly free: boolean;
  readonly exileAfter: boolean;
  readonly spell?: CardFilter;
  /** The library cards the player looks at to choose among, shown to them
   * castable or not. */
  readonly looked?: readonly ObjectId[];
  /** "You may **play**": a land card on offer may be played, too — see the
   * `cast-now` effect's `play`. */
  readonly play?: boolean;
}

/** A `cast-now` parked across its decision: the event it asked at and the
 * cards it offered — "if you do" is whether one of them was cast since
 * (`ResolutionContext.castSince`) — and the library cards it looked at, for
 * `rest`. `followed` once `then` or `else` is done and only `rest` is left. */
export interface CastNowProgress {
  readonly since: number;
  readonly cards: readonly ObjectId[];
  readonly looked: readonly ObjectId[];
  readonly followed?: boolean;
}

/**
 * The `add-mana` lists read off the board rather than printed — what they
 * name shrinks and grows with the board, and an empty one makes no mana at
 * all (rule 106.5). The engine resolves one wherever the spec is read: the
 * payment planner, the hand-activation menu and the mana being added
 * (`EffectApi.manaTypesOf`).
 */
export type BoardManaList =
  /**
   * "…of any color that a land an opponent controls could produce" (Exotic
   * Orchard, Fellwar Stone): a `oneOf` over those colours.
   *
   * `"your-lands"` is "…that a land **you** control could produce"
   * (Reflecting Pool), `filter` narrows which lands (Gond Gate's "a Gate you
   * control"), and `anyType` is "any **type**" rather than "any color" —
   * colorless included (rule 106.1b). What a land could produce is rule
   * 106.7's: every type one of its mana abilities would make if it resolved
   * now, its costs ignored (a tapped land counts), read through other "could
   * produce" lands without looping (two Reflecting Pools don't help each
   * other — the ruling).
   */
  | {
      readonly producedBy: "opponents-lands" | "your-lands";
      readonly filter?: CardFilter;
      readonly anyType?: true;
      /** `amount` mana all of **one** of the types — Incubation Druid's "add
       * three mana of that type instead" — as `oneOf`'s `same`. */
      readonly same?: true;
    }
  /**
   * "One mana of any color among legendary creatures and planeswalkers you
   * control" (Mox Amber): a `oneOf` over the colours of the objects matching
   * `colorAmong`, read as the mana is made — battlefield permanents, from
   * the controller's side (put `controlledBy: "you"` in the filter for "you
   * control"); with `zone: "graveyard"` the cards in the controller's
   * graveyard (The Grey Havens' "legendary creature cards in your
   * graveyard"); with `"exiled-with-source"` the cards linked to this
   * permanent (rule 607.2a — Chrome Mox's "the exiled card's colors").
   * Colourless isn't a colour, so none of them coloured makes no mana (the
   * Mox Amber ruling).
   */
  | {
      readonly colorAmong: CardFilter;
      readonly zone?: "graveyard" | "exiled-with-source";
      readonly same?: true;
    }
  /**
   * "For each color among permanents you control, add one mana of that
   * color" (Bloom Tender, Faeburrow Elder): an `all` over the colours among
   * the battlefield permanents matching the filter, each colour once however
   * many have it (the rulings) — `amount` times over.
   */
  | { readonly eachColorAmong: CardFilter };

export type EffectSpec =
  | {
      /** Apply several effects in order, sharing the same targets and X.
       * (e.g. Blightning: 3 damage to target player *and* that player
       * discards two cards.) */
      readonly kind: "sequence";
      readonly effects: readonly EffectSpec[];
      /**
       * The steps are **one instruction** acting on several objects, written
       * as one step per target slot — Victimize's "return the chosen cards to
       * the battlefield tapped" — so what they move, moves at the same time
       * (rule 608.2c reads instructions one at a time, but one instruction is
       * one event). Cards they take out of graveyards leave together, which
       * a "whenever one or more cards leave your graveyard" trigger sees as
       * one move; permanents they take off the battlefield leave together too
       * (rule 603.10a), permanents they put onto the battlefield enter
       * together, each seeing the others enter (rule 603.6a — the Elas il-Kor
       * ruling), and the damage they deal is one damage event, a lifelink
       * source's one life gain (rule 702.15e — Chandra's Ignition). Leave it
       * off a sequence of separate sentences
       * ("Destroy target creature. Return target card from your graveyard to
       * your hand."), which really are separate events.
       */
      readonly simultaneous?: boolean;
    }
  | {
      /**
       * `effect` once for each member of an "any number of target …" group
       * (the `any-number` `TargetSpec`) — the targets in slot `from` on,
       * in the order they were chosen, each bound in turn to slot `from` of
       * `effect`, which is written as for one target there. Mindbreak
       * Trap's "exile any number of target spells" is `{ kind:
       * "for-each-target", from: 0, effect: { kind: "exile", target: 0 } }`.
       * A member found illegal as it resolved is left out (rule 608.2b).
       * `simultaneous` makes the members one instruction, as a `sequence`'s
       * does: "any number of target players each mill two cards" mills them
       * at once.
       */
      readonly kind: "for-each-target";
      readonly from: number;
      readonly effect: EffectSpec;
      readonly simultaneous?: boolean;
    }
  | {
      /**
       * Choose permanents as this resolves, with no targeting — "untap up to
       * two lands" is `{ kind: "choose-permanents", filter: { type: "land" },
       * upTo: 2, then: { kind: "untap", target: 0 }, prompt: "Untap up to two
       * lands" }` (Snap). The effect's controller picks from `min` (default
       * 0) to `upTo` of the battlefield permanents matching `filter` from
       * their side, and `then` applies to each one picked as target 0. Not a
       * target: a hexproof land can be chosen, and nothing chosen makes the
       * spell fizzle. Nothing is asked when nothing matches. `then` shouldn't
       * itself stop to ask anything.
       */
      readonly kind: "choose-permanents";
      readonly filter: CardFilter;
      readonly upTo: EffectAmount;
      readonly min?: number;
      readonly then: EffectSpec;
      readonly prompt: string;
      /** "Any number of **other** nonland permanents you control" (Abdel
       * Adrian, Gorion's Ward): never the effect's own source. */
      readonly exceptSource?: boolean;
    }
  | {
      /** One member's turn of a `for-each-target`: target `index` bound to
       * slot `from`. Built by the engine as it applies one — never
       * authored. */
      readonly kind: "for-target";
      readonly from: number;
      readonly index: number;
      readonly effect: EffectSpec;
    }
  | {
      /**
       * `effect` once for each creature that convoked the resolving spell
       * (rule 702.51c) — a copy's are the original's (rule 707.10) — each
       * bound to target slot 0: Lethal Scheme's "each creature that
       * convoked this spell connives" is `{ kind: "for-each-convoker",
       * effect: { kind: "connive", target: 0 } }`. As a `sequence`'s steps,
       * so one that stops to ask (a connive's discard) is answered before
       * the next. A creature that has left the battlefield since — or come
       * back as a new object (rule 400.7) — is read as it last existed and
       * not acted on: it still connives, its last controller drawing and
       * discarding, but gets no counter (rule 701.50b). They go one at a
       * time in the order the spell's controller chooses (rule 701.50c,
       * Lethal Scheme's ruling): with more than one left, a `choose-modes`
       * asks which is next.
       */
      readonly kind: "for-each-convoker";
      readonly effect: EffectSpec;
      /** Set only by the engine: the convokers (by index) still to go. */
      readonly remaining?: readonly number[];
    }
  | {
      /** One convoker's turn of a `for-each-convoker`. Built by the engine
       * as it applies one — never authored. */
      readonly kind: "for-convoker";
      readonly index: number;
      readonly effect: EffectSpec;
    }
  | {
      /**
       * "**You choose an opponent**" as this resolves — Tasigur, the Golden
       * Fang's "…a nonland card of an opponent's choice", where you choose
       * the opponent and then they choose the card (the ruling): `then`,
       * with the `"that-player"` scope naming the one chosen. Not a target.
       * Among the opponents still in the game; with one, nobody is asked,
       * and with none nothing happens. Asked as a `choose-modes`.
       */
      readonly kind: "choose-opponent";
      readonly then: EffectSpec;
    }
  | {
      /** `effect` with `"that-player"` naming `player` — the mode a
       * `choose-opponent` answer applies. Built by the engine — never
       * authored. Nothing, once `player` has left the game. */
      readonly kind: "about-player";
      readonly player: PlayerId;
      readonly effect: EffectSpec;
    }
  | {
      /**
       * "Deals X damage **divided evenly, rounded down**, among any number of
       * targets" (Fireball): the targets from slot `from` on — an
       * `any-number` group — each dealt `amount` divided by how many of them
       * are still legal as it resolves (the ruling), all at once. More legal
       * targets than damage deals none to any.
       */
      readonly kind: "damage-divided-evenly";
      readonly amount: EffectAmount;
      readonly from: number;
    }
  | {
      readonly kind: "damage";
      readonly amount: EffectAmount;
      /** A target slot index — omit when `who` is set instead. */
      readonly target?: number;
      /** Untargeted damage to a whole scope of players (Sabotender / Tannuk:
       * "deals 1 damage to each opponent" — needed-cards P16), instead of a
       * chosen target. A per-player `amount` (`lifeTotal: "each"`) is read
       * for each of them. */
      readonly who?: PlayerScope;
      /** Untargeted damage to whatever the triggering event was aimed at —
       * "deals 2 damage to **that permanent or player**" (Ghyrson Starn), or
       * "the player or planeswalker **it's attacking**" (Mage Slayer).
       * See `LastKnownRefs.recipient`: a permanent that has left the
       * battlefield since is not dealt anything. */
      readonly toTriggerRecipient?: true;
      /** Who deals it, when that isn't the effect's own source: `"trigger-
       * object"` is the object that fired the trigger — "**it** deals damage
       * equal to its power to any target" (Be'lakor, the Dark Master: the
       * entering Demon), "**it** deals that much damage to each other
       * opponent" (Kediss: the commander that dealt combat damage). Its
       * lifelink, deathtouch and colours (for protection) apply, as it last
       * existed on the battlefield if it has left (rule 608.2h). See
       * {@link DamageFrom} for a target slot. */
      readonly from?: DamageFrom;
      /**
       * Damage aimed at the *controller* of whatever a target slot points at
       * — Unlicensed Disintegration's "deals 3 damage to **that creature's**
       * controller", where the targeted thing is the creature, not a player.
       * Mirrors `create-token`'s `who: "target-controller"`.
       *
       * Rule 111.11 / 608.2h: read as last-known information, so a creature
       * destroyed by the same spell still names whoever controlled it — which
       * is exactly the order every card printed this way resolves in.
       */
      readonly toControllerOfTarget?: number;
    }
  | {
      /** `mana: "any-color"` — one mana of any of the five colours, the
       * player's choice (Arcane Signet, Command Tower, Treasure). With an
       * `amount` above 1 it is that much mana of any **one** colour (Gilded
       * Lotus: "three mana of any one color"), never a mix. During
       * cost payment the planner picks the colour it needs; a mana ability
       * activated on its own makes the colour the player picked (the
       * action's `manaColors`). Anywhere else — a spell or a triggered
       * ability resolving — nothing is asked and it makes white, so a card
       * that adds "one mana of any color" as it resolves spells the choice
       * out as a `modal` over the five (Lotus Cobra, Manamorphose).
       * `mana: { oneOf: [...] }` — `amount` mana in any combination of the
       * listed colours, each unit independently chosen (Orcish Lumberjack:
       * "three mana in any combination of {R} and/or {G}" —
       * `{ oneOf: ["R", "G"] }`, `amount: 3`). During cost payment the planner
       * enumerates every achievable combination as a separate option and
       * picks whichever pays the cost; activated on its own, each unit is
       * the player's pick, and elsewhere `oneOf[0]`, as "any-color" is
       * white. needed-cards P20. With `same: true` every unit is the
       * same one of the listed types — Brigid, Doun's Mind's "Add X {G} or X
       * {W}" — never a mix, as `any-color` is over all five. */
      readonly kind: "add-mana";
      /** `"chosen"` is the colour this permanent's controller named as it
       * entered (Heraldic Banner's "{T}: Add one mana of the chosen color") —
       * see `GameObject.chosenOnEnter`. */
      readonly mana:
        | ManaType
        | "any-color"
        | "chosen"
        /** "One mana of any color in your commander's color identity" (Command
         * Tower, Arcane Signet): one of `PlayerState.commanderIdentity`'s
         * colours, the payer's choice — nothing at all for a player with no
         * commander or a colourless one (the rulings). */
        | "commander-identity"
        /** "One mana of any type that [permanent] produced" — only in a
         * `tapped-for-mana` triggered mana ability, where it's what the
         * permanent tapped for mana made (Roxanne, Starfall Savant; Mana
         * Flare). Anywhere else it makes nothing. */
        | "produced"
        | { readonly oneOf: readonly ManaType[]; readonly same?: true }
        /**
         * One of each listed type, all together, `amount` times over:
         * "Add {W}{U}" (a Signet, a Karoo land) is `{ all: ["W", "U"] }` with
         * `amount: 1`. Not a `oneOf` × 2, which could make {W}{W}.
         */
        | { readonly all: readonly ManaType[] }
        | BoardManaList;
      /** An `EffectAmount` so a ritual can scale off the board — Mana Geyser's
       * "{R} for each tapped land your opponents control" — and a mana
       * ability can make a live amount (Marwyn's power, Kydele's cards drawn
       * this turn). `manaSources()` sizes a live amount against the board as
       * it stands, where `"x"` and `triggerValue` read 0. */
      readonly amount: EffectAmount;
      /** Damage this mana ability deals to its controller when it's used (a
       * painland's coloured tap — Karplusan Forest: "{T}: Add {R} or {G}.
       * Karplusan Forest deals 1 damage to you."). The auto-payer prefers a
       * painless option and only reaches for this when it must. */
      readonly painToController?: number;
      /**
       * "Spend this mana only to cast a creature spell of the chosen type"
       * (Cavern of Souls, Unclaimed Territory) and its relatives — rule
       * 106.6b. The restriction rides on each unit produced, so it survives
       * the mana sitting in the pool, and the payment planner also refuses to
       * tap this source for a purpose the restriction forbids.
       *
       * `"chosen-creature-type"` reads `GameObject.chosenCreatureType` off
       * the source at activation time, since that is named as the permanent
       * enters rather than printed.
       */
      readonly spendOnly?: ManaSpendOnly;
      /** "When that mana is spent to cast …, [effect]" — Path of Ancestry's
       * scry. Rides on each unit produced and fires as it is spent. */
      readonly whenSpent?: {
        readonly spell?: CardFilter | "shares-type-with-commander";
        readonly effect: EffectSpec;
        readonly text: string;
      };
      /** "You don't lose this mana as steps and phases end" (Savage
       * Ventmaw). Still emptied at cleanup. */
      readonly persists?: boolean;
      /** "This mana lasts until end of combat" — firebending's (the
       * `firebending` helper). */
      readonly untilEndOfCombat?: boolean;
      /** What else the mana ability does, as part of it — Kibo, Uktabi
       * Prince's Banana: "{T}, Sacrifice this artifact: Add {R} or {G}. **You
       * gain 2 life.**" Applied right after the mana is added, and still
       * without using the stack; the auto-payer applies it too when it uses
       * the ability to pay a cost. */
      readonly also?: EffectSpec;
      /** Who adds it, when that isn't the effect's controller — "each
       * player adds {B}{R}{G}" (Yurlok of Scorch Thrash). For mana with no
       * choice in it only (a choice is its controller's to make). A mana
       * ability's own part for its controller stays unscoped — that is what
       * the auto-payer counts — and the rest rides on `also` with
       * `who: "each-opponent"`. */
      readonly who?: PlayerScope;
    }
  | {
      readonly kind: "draw";
      readonly amount: EffectAmount;
      /**
       * Who draws. Defaults to the effect's controller. `who` is a scope
       * (Stormfist Crusader: "each player draws a card"); `target` is a
       * target-slot index holding a player (Deep Analysis: "target player
       * draws two cards"). Mutually exclusive — `target` wins if both are set.
       */
      readonly who?: PlayerScope;
      readonly target?: number;
    }
  | {
      /**
       * "Each player discards their hand" (Dragon Mage, Runehorn Hellkite) —
       * a whole hand at once, with no choice to make, so it's distinct from
       * `discard`'s "choose N cards" and never raises a decision.
       */
      readonly kind: "discard-hand";
      readonly who: PlayerScope;
    }
  | {
      readonly kind: "gain-life";
      /** An `EffectAmount` so it can scale off the board — Shamanic
       * Revelation's "4 life for each creature you control with power 4 or
       * greater" is a `{ countOf, times: 4 }`. */
      readonly amount: EffectAmount;
      /** Who gains — the effect's controller (default), or a scope. */
      readonly who?: PlayerScope;
      /** The *controller* of whatever a target slot points at — Swords to
       * Plowshares' "**its controller** gains life equal to its power". Same
       * shape as `damage`'s field of the same name; see that one for the
       * last-known-information caveat. */
      readonly toControllerOfTarget?: number;
    }
  | {
      /** Life loss (Zulaport Cutthroat: "each opponent loses 1 life"). An
       * `EffectAmount` so it can scale — Feed the Swarm loses life equal to
       * the destroyed permanent's mana value. */
      readonly kind: "lose-life";
      readonly amount: EffectAmount;
      readonly who?: PlayerScope;
      /** A single *targeted* player instead of a scope (Ob Nixilis, the
       * Fallen: "target player loses 3 life") — a target-slot index holding
       * a player. Mutually exclusive with `who`. needed-cards P19. */
      readonly target?: number;
      /** The *controller* of whatever a target slot points at — Undermine's
       * "**its controller** loses 3 life", where the target is the countered
       * spell. Same shape as `damage`/`gain-life`'s field of the same name. */
      readonly toControllerOfTarget?: number;
    }
  | {
      /** Tap `target` — a slot, or `"source"` for the effect's own
       * permanent with no target at all (Territorial Hellkite's "tap this
       * creature"), only while it's still that object (rule 400.7). */
      readonly kind: "tap";
      readonly target: EffectTargetRef;
      /** "**It doesn't untap during its controller's next untap step**"
       * (Junk Winder) — whoever controls it then; tapped by this or already
       * (`GameObject.skipsNextUntap`). */
      readonly doesntUntapNext?: boolean;
    }
  | {
      /** `target` accepts `"trigger-object"` for an untargeted "untap it"
       * off a trigger (Amulet of Vigor: untap the permanent that just
       * entered tapped). needed-cards P17. */
      readonly kind: "untap";
      readonly target: EffectTargetRef;
      /** Who untaps it, when the card says a player does — "that player …
       * untaps it" (Alexios, Deimos of Kosmos: `"active-player"`). Naming
       * nobody — a player who has left the game — nothing is untapped. */
      readonly by?: EffectPlayerRef;
    }
  | {
      readonly kind: "destroy";
      /** A target slot, or a reference to the object the ability is about —
       * "destroy it" of a trigger (Mikaeus, the Unhallowed: the Human that
       * dealt you damage, `"trigger-object"`). */
      readonly target: EffectTargetRef;
      /** "It can't be regenerated" (rule 701.15c — Terminate): a
       * regeneration shield doesn't replace this destruction. */
      readonly cantBeRegenerated?: boolean;
    }
  | {
      /**
       * Regenerate a permanent (rule 701.15a — "{B}: Regenerate this
       * creature", "Regenerate target creature"): it gets a shield that
       * replaces the next time it would be destroyed this turn with removing
       * all damage from it, tapping it and removing it from combat. The shield
       * lasts until used or the turn ends; each regeneration is one more.
       */
      readonly kind: "regenerate";
      readonly target: EffectTargetRef;
    }
  | {
      /** Regenerate every battlefield permanent matching `filter` (Wrap in
       * Vigor: "Regenerate each creature you control"). */
      readonly kind: "regenerate-all";
      readonly filter: CardFilter;
    }
  | {
      /** Put a permanent on the bottom of its **owner's** library (Condemn).
       * Not a shuffle and not a bounce: the card is buried, which is why this
       * is its own effect rather than a `return-to-hand` variant. */
      readonly kind: "put-on-bottom-of-library";
      readonly target: number;
    }
  | {
      /** Destroy every battlefield permanent matching `filter` (Wrath of God:
       * `{ type: "creature" }`). Indestructible / 903.9a handled per-permanent
       * downstream. */
      readonly kind: "destroy-all";
      readonly filter: CardFilter;
      /** Narrow to permanents whose *controller* was dealt combat damage by
       * this effect's source this turn — Steel Hellkite. Not a `CardFilter`
       * clause because it's a fact about the source, not about the permanent
       * being matched. */
      readonly onlyControllersDamagedBySource?: boolean;
      /** "They can't be regenerated" (rule 701.15c — Wrath of God). */
      readonly cantBeRegenerated?: boolean;
    }
  | {
      /** Deal `amount` damage to every battlefield permanent matching `filter`
       * (Pyroclasm: 2 to each creature). The source of the damage is the
       * resolving spell/ability. */
      readonly kind: "damage-all";
      readonly filter: CardFilter;
      readonly amount: EffectAmount;
      /** Only permanents these players control — Balefire Dragon's "it deals
       * that much damage to each creature **that player** controls" is
       * `"trigger-player"`, the player it dealt combat damage to. */
      readonly whose?: PlayerScope;
      /** Spare the effect's own source — "each **other** creature with
       * flying" (Harbinger of the Hunt). A `CardFilter` can't say this: it
       * describes the permanent being matched, not its relationship to the
       * thing dealing the damage. With `from`, it spares what deals it
       * instead (Chandra's Ignition's "each **other** creature"). */
      readonly exceptSource?: boolean;
      /** Who deals it, when that isn't the effect's own source — see
       * {@link DamageFrom}. */
      readonly from?: DamageFrom;
    }
  | {
      /** Every permanent matching `filter` deals `amount` damage to its own
       * controller (Rakdos Charm: "each creature deals 1 damage to its
       * controller") — the reverse direction from `damage-all` (which deals
       * damage FROM the effect's source TO matching permanents; here each
       * matching permanent is its own damage source, and the target is
       * always its controller, never the effect's caster). needed-cards P20. */
      readonly kind: "creatures-damage-controllers";
      readonly filter: CardFilter;
      readonly amount: EffectAmount;
    }
  | {
      /** Each affected player sacrifices `count` permanents matching `filter`
       * that they control (Diabolic Edict — `who: "target"`; Fleshbag
       * Marauder — `who: "each-player"`). Raises a `sacrifice` decision per
       * player who has a real choice; auto-resolves otherwise. */
      readonly kind: "sacrifice";
      readonly who: PlayerScope | "target";
      readonly filter: CardFilter;
      readonly count: number;
      /** Exclude the effect's own source ("sacrifice **another** permanent" —
       * Korvold). needed-cards P6. */
      readonly exceptSource?: boolean;
    }
  | {
      /**
       * Sacrifice one named permanent — "**sacrifice the creature** at the
       * beginning of the next end step" (Sneak Attack). Unlike `sacrifice`,
       * which is an edict its victim's controller answers, this one already
       * knows which permanent, so there is no decision at all.
       */
      readonly kind: "sacrifice-target";
      readonly target: EffectTargetRef;
    }
  | {
      /** Sacrifice the permanent this effect's own source is (Defense of the
       * Heart: "sacrifice ~. If you do, …"). No choice and no decision — rule
       * 701.17. `then` is the "if you do" tail: applied only when the
       * sacrifice actually happened, so a source that already left the
       * battlefield in response does nothing at all. needed-cards P7. */
      readonly kind: "sacrifice-source";
      readonly then?: EffectSpec;
    }
  | {
      /** `targets[a]` and `targets[b]` each deal damage equal to their power
       * to the other (rule 701.12). With `oneSided`, only `a` deals to `b`
       * (Rabid Bite) — and `b` may be any permanent that can be dealt damage,
       * a planeswalker too (Stump Stomp's "to target creature or
       * planeswalker"). */
      readonly kind: "fight";
      /** `EffectTargetRef`s, so `"trigger-object"` works — Frontier Siege's
       * "you may have **it** fight target creature", where "it" is the
       * creature that just entered rather than a chosen target. */
      readonly a: EffectTargetRef;
      readonly b: EffectTargetRef;
      readonly oneSided?: boolean;
    }
  | {
      /** Return a target permanent to its owner's hand (rule 614-style
       * bounce). `target: "source"` bounces the effect's own permanent, with
       * no target at all (Encroaching Dragonstorm — needed-cards P16). */
      readonly kind: "return-to-hand";
      readonly target: EffectTargetRef;
      /**
       * The zone the object is returned **from** — `"battlefield"` (a bounce)
       * when omitted. The object has to be in that zone as the effect
       * applies, or nothing happens: "return target creature card from your
       * graveyard to your hand" does nothing to a card that has since been
       * exiled, and a bounce does nothing to a permanent that already left.
       *
       * - `"graveyard"` / `"exile"` — a card (Golbez, Crystal Collector;
       *   Regrowth), or with `"source"` / `"trigger-object"` the card behind
       *   the ability ("return it to its owner's hand" off a dies trigger, now
       *   or inside a `delayed-trigger`).
       * - `"stack"` — a **spell** to its owner's hand (Unsubstantiate,
       *   Venser, Shaper Savant — not Remand, which counters the spell and
       *   is the `counter` effect's `into: "hand"`). Not a counter
       *   (rule 701.5): "can't be countered" doesn't stop it, and nothing
       *   that watches for a spell being countered sees it. A copy of a spell
       *   ceases to exist instead (rule 707.10c); an ability on the stack
       *   isn't a card and is left alone, and so is the spell that is itself
       *   resolving.
       *
       * A commander returned to hand from any of these may go to the command
       * zone instead (rule 903.9b), exactly like a bounced one.
       */
      readonly from?: ReturnToHandZone;
    }
  | {
      /** Return every battlefield permanent matching `filter` to its owner's
       * hand (Cyclonic Rift, overloaded: "Return each nonland permanent you
       * don't control to its owner's hand"). Mirrors `destroy-all`. */
      readonly kind: "return-to-hand-all";
      readonly filter: CardFilter;
    }
  | {
      /** Exile every battlefield permanent matching `filter`, as one event
       * (rule 603.10a — each one's leaves-the-battlefield ability sees the
       * rest go too). Farewell's "Exile all artifacts". A token stack goes
       * whole. The mass form of `exile`, as `destroy-all` is of `destroy`. */
      readonly kind: "exile-all";
      readonly filter: CardFilter;
    }
  | {
      /** Put a target permanent into exile — or, with `"trigger-object"`,
       * the card a dies trigger is about, only while it's still that object
       * in the graveyard it went to (rule 400.7 — "you may exile it", Myrkul,
       * Lord of Bones). A `this-way` `"exiled"` condition is "if you do". */
      readonly kind: "exile";
      readonly target: EffectTargetRef;
      /** "Exile it **with a croak counter on it**": counters the card gets
       * as it's exiled, there. */
      readonly withCounters?: { readonly kind: string; readonly amount: number };
      /**
       * Exile **until this source leaves the battlefield** — an "O-Ring"
       * (Banishing Light, Conclave Tribunal). Rule 720.2: one ability that
       * exiles and sets up a linked delayed trigger, so the card carries a
       * second `leaves-battlefield` ability running `return-exiled-by-source`.
       *
       * Marks `GameObject.exiledBy` with the source's id, which is what links
       * the two halves. If the source has left before the exile happens (or
       * is back as a new object), nothing is exiled at all (rule 610.3c); if
       * the exiled card moves on to somewhere else, nothing comes back.
       */
      readonly untilSourceLeaves?: boolean;
      /**
       * "You may cast that card for as long as it remains exiled, and mana of
       * any type can be spent to cast that spell" (Hostage Taker): the
       * effect's controller gets an impulse permission to *cast* the card
       * this put into exile (a land stays put) — `"while-exiled"`, or
       * `"end-of-turn"` for "this turn" — with `spendAs` for that cast
       * alone (rule 118.14). A token exiled ceases to exist (rule 111.7),
       * so there's nothing to cast.
       */
      readonly mayCast?: { readonly duration: "end-of-turn" | "while-exiled"; readonly spendAs?: SpendAs };
      /**
       * Exile it **with this source** (rule 607.2a): the card is linked to the
       * source's battlefield stint (`GameObject.exiledWith`), so a later
       * ability of that object reaches "the cards exiled with" it — Colfenor's
       * Urn's "return those cards" (`return-exiled-by-source`'s `linked`) —
       * and the source counts it for good (`exiled-with-source`), even once it
       * has left exile again. Nothing is linked when the source isn't a
       * permanent.
       */
      readonly linked?: boolean;
    }
  | {
      /**
       * "Choose a creature type", then do `then` with it — as a spell or
       * ability *resolves* (Crippling Fear, Distant Melody), as opposed to
       * `CardDefinition.chooseCreatureTypeOnEnter`, which asks as a permanent
       * enters.
       *
       * Raises a `choose-creature-type` decision over every creature type
       * (rule 205.3m); resolution resumes from the decision once it's
       * answered, with `CHOSEN_CREATURE_TYPE` substituted into `then`. The
       * enclosing ability's targets and X carry across.
       */
      readonly kind: "choose-creature-type";
      readonly then: EffectSpec;
    }
  | {
      /** Return everything this effect's source exiled with
       * `exile { untilSourceLeaves }`, to the battlefield under its owner's
       * control. The other half of an O-Ring. */
      readonly kind: "return-exiled-by-source";
      /** `"hand"`: instead, put the cards linked to this source (rule
       * 607.2a — hideaway's, `GameObject.exiledWith`) into their owners'
       * hands — Watcher for Tomorrow's "When this creature leaves the
       * battlefield, put the exiled card into its owner's hand", which
       * reaches the cards exiled by the stint that left. `"battlefield"`: put
       * those linked cards onto the battlefield under their owners' control,
       * together — Colfenor's Urn's "return those cards to the battlefield",
       * the cards its `exile { linked }` put there, found though the Urn has
       * just been sacrificed. */
      readonly linked?: "hand" | "battlefield";
    }
  | {
      /**
       * Put a targeted card onto the battlefield — reanimation that names a
       * specific card, as opposed to `return-from-graveyard`'s filter over
       * your own graveyard. With `underYourControl` the card enters under the
       * *resolving* player's control even though its owner is someone else
       * (Gravespawn Sovereign: "put target creature card from a graveyard
       * onto the battlefield under your control").
       */
      readonly kind: "put-onto-battlefield";
      /** An `EffectTargetRef` so it can also name the object that fired the
       * trigger — Undying returns *itself*, which is never a chosen target. */
      readonly target: EffectTargetRef;
      readonly underYourControl?: boolean;
      /** Under someone else's control — "target opponent … puts target
       * creature card from your graveyard onto the battlefield under their
       * control" (The Beamtown Bullies: `{ target: 0 }`). Their default
       * control, like `underYourControl`'s (rule 110.2 — the permanent is
       * exiled if they leave the game, rule 800.4a). Naming nobody (an
       * illegal or empty slot, a player who has left) puts nothing anywhere
       * (rules 608.2b, 800.4b). */
      readonly under?: EffectPlayerRef;
      readonly enterTapped?: boolean;
      /** Counters it enters with (Undying: "with a +1/+1 counter on it";
       * Admiral Brass, Unsinkable: "with a finality counter on it" — a
       * finality counter needs nothing more, since `moveObject` reads it). */
      readonly withCounters?: { readonly kind: string; readonly amount: number };
      /** "If it would leave the battlefield, exile it instead of putting it
       * anywhere else" (Whip of Erebos) — sets
       * `GameObject.exileIfItWouldLeave` on the permanent it becomes. */
      readonly exileIfItWouldLeave?: boolean;
      /** "…onto the battlefield **transformed**" (Ojer Axonil's "return it
       * to the battlefield tapped and transformed") — a transforming
       * double-faced card enters with its back face up. */
      readonly transformed?: boolean;
      /** The card types it has, replacing its own, for as long as it stays
       * on the battlefield — the Enduring cycle's "return it to the
       * battlefield under its owner's control. It's an enchantment. (It's
       * not a creature.)" is `setTypes: ["enchantment"]`. In place as it
       * enters (rule 614.12), so it enters as an enchantment: a "whenever a
       * creature enters" doesn't see it and an enchantment's enters trigger
       * does. The subtypes that went only with the lost types go too (rule
       * 205.1a — no Sheep, no Glimmer); supertypes stay. */
      readonly setTypes?: readonly CardType[];
      /** Subtypes it has **in addition to its other types**, for as long as
       * it stays on the battlefield — Portal to Phyrexia's "put target
       * creature card from a graveyard onto the battlefield under your
       * control. It's a Phyrexian in addition to its other types." In place
       * as it enters, as `setTypes` is: "whenever a Phyrexian enters" sees
       * it arrive as one. */
      readonly addSubtypes?: readonly string[];
    }
  | {
      /** Exile every card in a target *player's* graveyard (rule 406 — Bojuka
       * Bog). `target` is a target-slot index holding a player, `"you"` for
       * the effect's own controller with no slot, or `"each-player"` for every
       * graveyard at once (Rest in Peace). needed-cards P8. */
      readonly kind: "exile-graveyard";
      /** `"each-opponent"`: Soul-Guide Lantern's "exile each opponent's
       * graveyard", one move like `"each-player"`. */
      readonly target: number | "you" | "each-player" | "each-opponent";
      /** Only the cards matching this — Living Death's "each player exiles
       * all **creature cards** from their graveyard". */
      readonly filter?: CardFilter;
    }
  | {
      /** Each player in `who` sacrifices every permanent matching `filter`
       * they control — Living Death's "then sacrifices all creatures they
       * control": nobody chooses anything, and they all go at once (one
       * event, rule 603.10a). One that can't be sacrificed stays. */
      readonly kind: "sacrifice-all";
      readonly who: PlayerScope;
      readonly filter: CardFilter;
    }
  | {
      /** Reveal cards from the top of the controller's library until
       * `count` cards matching `filter` are revealed — all of it if there
       * aren't that many — put those onto the battlefield together under
       * their owner's control, and the rest where `rest` says: Selvala's
       * Stampede's "reveal cards from the top of your library until you
       * reveal a creature card for each wild vote. Put those creature cards
       * onto the battlefield, then shuffle the rest into your library".
       * Nothing is revealed for a count of 0. Each card's "as this enters"
       * choices are asked first (rule 614.12). */
      readonly kind: "reveal-until-count";
      readonly filter: CardFilter;
      readonly count: EffectAmount;
      readonly rest: "shuffle" | "bottom-random";
      /** Set only on the copy parked across an "as this enters" choice. */
      readonly progress?: { readonly revealed: readonly ObjectId[]; readonly found: readonly ObjectId[] };
    }
  | {
      /** Put `count` of the cards a batched `put-into-graveyard` trigger
       * fired on onto the battlefield under the effect's controller's
       * control — Colossal Grave-Reaver's "whenever one or more creature
       * cards are put into your graveyard from your library, **put one of
       * them onto the battlefield**". Only those still in that graveyard as
       * the same objects (rule 400.7); the controller chooses which when
       * more are left than it takes, and must take that many. */
      readonly kind: "put-arrived-onto-battlefield";
      readonly count: number;
    }
  | {
      /** Put every card this resolution has exiled so far — from anywhere
       * but the battlefield — onto the battlefield under its owner's
       * control, all at once (Living Death's "then puts all cards they
       * exiled this way onto the battlefield"). A permanent exiled from the
       * battlefield, by a replacement say (Leyline of the Void's), isn't
       * among them (the ruling), nor a card that has left exile since. Each
       * one's "as this enters" choices are asked first (rule 614.12). */
      readonly kind: "put-exiled-this-way-onto-battlefield";
    }
  | {
      /** Exile a target permanent, then immediately return it to the
       * battlefield under its owner's control (rule 400.7 — a "blink": the
       * returning permanent is a brand-new object with no memory of the old
       * one, so counters, Auras/Equipment, tapped status, and effects like
       * stolen control all fall off). A token exiled this way ceases to exist
       * and never returns (rule 111.7 / 704.5d). needed-cards P9 — Essence Flux. */
      readonly kind: "flicker";
      /**
       * What is exiled: a target slot, `"source"` (the ability's own
       * permanent — Norin the Wary's "exile Norin"), `"trigger-object"`, or
       * several target slots at once (Ghostly Flicker's "two target …"),
       * which are exiled together and return together — every one is on the
       * battlefield before any of their enters triggers is looked at. `{
       * from }` is every slot from that one on: an "any number of target …"
       * group's members, all at once (Eerie Interlude).
       *
       * `"source"` names the permanent the ability came from *as it was when
       * the ability was put on the stack*: one that has since left and come
       * back is a new object (rule 400.7), and is left alone.
       */
      readonly target: EffectTargetRef | readonly number[] | { readonly from: number };
      /** See {@link FlickerCounters} — Essence Flux's Spirit clause. */
      readonly thenCounters?: FlickerCounters;
      /** Return under the effect's controller's control rather than the
       * owner's (Ghostly Flicker's "under your control"). */
      readonly underYourControl?: boolean;
      /**
       * Return later rather than at once: a delayed triggered ability (rule
       * 603.7) at this step — Norin's "at the beginning of the next end
       * step". The return is *linked* to this exile (rule 610.3): a card that
       * leaves exile in the meantime, even to come straight back, is a new
       * object and stays where it is, and nothing is set up at all when
       * nothing was exiled.
       */
      readonly returnAt?: DelayedTriggerTiming;
      /** "…return it to the battlefield **transformed**" (Clive, Ifrit's
       * Dominant) — a transforming double-faced card comes back with its
       * back face up (rule 712.14); anything else returns as usual. */
      readonly transformed?: boolean;
      /** "Return it to the battlefield **tapped**" (Nezahal, Primal Tide):
       * it enters tapped, as it enters (rule 614.1c). */
      readonly tapped?: boolean;
      /** The delayed return's text, for the log and the stack. */
      readonly returnText?: string;
    }
  | {
      /**
       * The delayed half of a `flicker` with `returnAt` — never authored on a
       * card: the flicker builds it as it resolves, since `link` only exists
       * once something has been exiled. Returns every card still in exile
       * carrying `GameObject.flickerLink === link`.
       */
      readonly kind: "return-flickered";
      readonly link: string;
      readonly thenCounters?: FlickerCounters;
      readonly underYourControl?: boolean;
      readonly transformed?: boolean;
      readonly tapped?: boolean;
    }
  | {
      /** Counter a target spell on the stack — it moves to its owner's
       * graveyard without resolving (rule 701.5). A spell that can't be
       * countered stays on the stack and resolves, and a copy of a spell
       * ceases to exist rather than going anywhere (rule 707.10c). */
      readonly kind: "counter";
      /** A target slot, or `"trigger-object"` — the spell whose casting
       * fired this trigger, untargeted: Vexing Bauble's "whenever a player
       * casts a spell, if no mana was spent to cast it, counter that spell". */
      readonly target: EffectTargetRef;
      /**
       * `"hand"`: if the spell is countered this way, put it into its
       * owner's hand instead of into their graveyard (Remand). Still a
       * counter — it does nothing to a spell that can't be countered — unlike
       * `return-to-hand` with `from: "stack"`, which isn't one. `"exile"`:
       * "exile it instead of putting it into its owner's graveyard"
       * (Transcendent Dragon, whose `cast-now` of the same slot then finds it
       * there — a spell that wasn't countered is still on the stack, where
       * nothing is cast from).
       */
      readonly into?: "hand" | "exile";
    }
  | {
      /** A player gains control of a permanent (rule 613.1b, layer 2): a
       * control effect timestamped as it resolves, recorded on
       * `GameObject.controlEffects`; the latest one on the permanent wins
       * (rule 613.7). `untilEndOfTurn` ends it in the cleanup step (Act of
       * Treason); otherwise it lasts until the permanent changes zones, or
       * until the player it gives control to leaves the game (rule 800.4a),
       * when the latest effect still standing applies again.
       *
       * `who` gains control: the effect's controller by default ("gain
       * control of target …"); a player slot — "target opponent gains control
       * of target permanent you control" (Zedruu the Greathearted's
       * `{ target: 0 }`); or a player the event names — "that player gains
       * control of ~" at the beginning of each player's upkeep (Alexios,
       * Deimos of Kosmos's `"active-player"`, with `target: "source"`). A
       * target found illegal as the spell or ability began to resolve —
       * the permanent's slot or the player's — makes it do nothing (rule
       * 608.2b; `ResolutionContext.illegalTargets`). */
      readonly kind: "gain-control";
      readonly target: EffectTargetRef;
      readonly untilEndOfTurn: boolean;
      readonly who?: EffectPlayerRef;
      /** "**For as long as this creature remains on the battlefield**, gain
       * control of that permanent" (Opportunistic Dragon): the control
       * effect ends as the effect's source leaves — nothing at all if it
       * already has (rule 611.2b). Not with `untilEndOfTurn`. */
      readonly whileSource?: boolean;
    }
  | {
      /** Every battlefield permanent matching `filter` (read from the
       * effect's controller's side) changes control at once — one effect, so
       * one timestamp (rule 613.7b): "gain control of all nonland permanents
       * until end of turn" (Dihada, Binder of Wills), "gain control of all
       * commanders" (Tevesh Szat, Doom of Fools). `who` is `gain-control`'s,
       * plus `"owner"` — "each player gains control of all creatures they
       * own" (Homeward Path). A token stack changes hands whole.
       * `exceptSource` spares the effect's own source. `controlledBy:
       * "trigger-player"` keeps only the permanents the player the trigger
       * names controls — Hellkite Tyrant's "gain control of all artifacts
       * **that player** controls" — and does nothing once they've left the
       * game. (A `CardFilter`'s own `controlledBy` can't name one seat at a
       * 3-4 player table.) */
      readonly kind: "gain-control-all";
      readonly filter: CardFilter;
      readonly untilEndOfTurn: boolean;
      readonly who?: EffectPlayerRef | "owner";
      readonly exceptSource?: boolean;
      readonly controlledBy?: "trigger-player";
    }
  | {
      /** "Each player gains control of all [`filter`] controlled by the next
       * player in the chosen direction" (Aminatou, the Fateshifter's −6).
       * `"left"` is the next player in turn order (rule 101.4: turn order
       * passes to the left) and `"right"` the one before, skipping anyone
       * who has left the game. What each player gets is fixed first, then
       * every change happens at once, as one lasting effect with one
       * timestamp (rule 613.7b) — in a two-player game the boards simply
       * swap, whichever way was chosen. `exceptSource` spares the effect's
       * own source ("other than Aminatou"). "Choose left or right" as it
       * resolves is a `modal` with one of these per mode. */
      readonly kind: "rotate-control";
      readonly direction: "left" | "right";
      readonly filter: CardFilter;
      readonly exceptSource?: boolean;
    }
  | {
      /** `target` gains "This creature can't be sacrificed" (Jon Irenicus,
       * Shattered One) — until end of turn, or (`"permanent"`) for as long
       * as it stays on the battlefield. A modifier, like a keyword grant;
       * the static form is `StaticAbility.cantBeSacrificed`, which says what
       * it stops (rule 701.21a). */
      readonly kind: "cant-be-sacrificed";
      readonly target: EffectTargetRef;
      readonly duration: PtDuration;
    }
  | {
      /** Target player puts the top `amount` cards of their library into
       * their graveyard. `target: "you"` = the effect's controller, with no
       * target slot (Aftermath Analyst's "mill three cards"). */
      readonly kind: "mill";
      /** A target slot holding a player, or a scope — `"you"` (Aftermath
       * Analyst) or `"each-opponent"` (Hope Estheim: "each opponent mills X
       * cards"), a per-player amount read for each. */
      readonly target: number | PlayerScope;
      readonly amount: EffectAmount;
    }
  | {
      /** Exile cards from the top of a library, face up, with no permission
       * to play them (`impulse-exile` is that): "exile the top three cards
       * of target player's library" (`amount`), or all but the bottom few —
       * Nicol Bolas, the Arisen's "exile all but the bottom card of target
       * player's library" (`allBut: 1`, in place of `amount`). `whose` is a
       * target slot holding a player, or a scope (`"you"`, the default). */
      readonly kind: "exile-from-library";
      readonly whose?: number | PlayerScope;
      readonly amount?: EffectAmount;
      readonly allBut?: number;
      /** "…and put a fetch counter on each of them" (Pako, Arcane
       * Retriever): counters each card gets in exile. */
      readonly withCounters?: { readonly kind: string; readonly amount: number };
    }
  | {
      /** Return every card matching `filter` from the effect's controller's
       * graveyard to `destination` (Splendid Reclamation: all land cards to
       * the battlefield tapped — rule 608). `count: "all"` moves every match
       * with no decision; a number raises a `choose-from-zone` decision when
       * there are more matches than that, the rest staying in the graveyard. */
      readonly kind: "return-from-graveyard";
      readonly filter: CardFilter;
      readonly destination: "battlefield" | "hand";
      readonly count: number | "all";
      /** Battlefield-bound cards enter tapped (Splendid Reclamation). */
      readonly enterTapped?: boolean;
      /** …"with a finality counter on it" (Shilgengar, Sire of Famine) —
       * counters each battlefield-bound card enters with. */
      readonly withCounters?: { readonly kind: string; readonly amount: number };
      /** Every player's graveyard, not only the controller's — Grimoire of
       * the Dead's "put all creature cards from **all graveyards** onto the
       * battlefield under your control": a card someone else owns enters
       * under the effect's controller's control, kept there by a control
       * effect (rule 110.2; it's exiled if they leave the game, 800.4a).
       * With `count: "all"` and `destination: "battlefield"` only. */
      readonly from?: "all-graveyards";
      /** …with these types and colours in addition to their own, in place
       * as they enter (rule 614.12) — Grimoire of the Dead's "They're black
       * Zombies in addition to their other colors and types". */
      readonly enterAs?: EnterTypes;
    }
  | {
      /**
       * Set up a delayed triggered ability (rule 603.7) — "at the beginning of
       * the next end step, <do this>". Whip of Erebos's "exile it at the
       * beginning of the next end step", Arcane Denial's upkeep draws.
       *
       * `effect` is applied when it fires, against the targets the *creating*
       * effect had (rule 603.7d — a delayed ability chooses no new targets),
       * so it refers to them by slot index like any other effect and
       * `"source"` still means the card that set it up.
       */
      readonly kind: "delayed-trigger";
      /** A step ("at the beginning of the next end step"), a permanent
       * leaving the battlefield ("when it dies" — see {@link DelayedLeaves}),
       * or the controller's next spell this turn ({@link DelayedNextSpell}).
       * Whatever the creating ability's trigger object was ("return **that
       * card** to the battlefield at the beginning of the next end step" —
       * Shirei, Shizo's Caretaker) is the delayed ability's too, unless the
       * spell it waits for is. */
      readonly at: DelayedTriggerTiming | DelayedLeaves | DelayedNextSpell | DelayedCombatDamage;
      readonly effect: EffectSpec;
      /** Text for the log and the stack. */
      readonly text: string;
      /** Who controls it when it fires — the effect's own controller by
       * default, or the controller of a target slot (Arcane Denial hands its
       * "may draw two cards" to the player whose spell was countered). */
      readonly controller?: { readonly controllerOfTarget: number };
      /** "At the beginning of the next end step, sacrifice **that token**"
       * (Satya, Aetherflux Genius): the delayed ability's targets are what
       * this resolution did this to so far — the token it just created —
       * in place of the creating ability's own. With nothing done, no delayed
       * ability is set up. */
      readonly about?: ThisWayKind;
    }
  | {
      /** "That creature enters with two additional +1/+1 counters on it"
       * (Yuna, Grand Summoner): a spell on the stack — usually the trigger
       * object of a `nextSpell` delayed trigger — enters the battlefield with
       * these counters as it resolves (rule 614.1c: an ETB trigger sees
       * them). Nothing for anything else. */
      readonly kind: "enters-with-counters";
      readonly target: EffectTargetRef;
      readonly counter: string;
      readonly amount: EffectAmount;
    }
  | {
      /**
       * "You may cast [a card]" while this resolves (rule 608.2g): the
       * effect's controller casts one card now, from wherever it is, by the
       * ordinary casting rules — modes, X, kicker, targets, costs — with
       * timing ignored, or declines. Raised as a `cast-now` decision; a
       * `sequence` step after it waits for the answer. Nothing is asked when
       * nothing can be cast (no legal targets, no way to pay), which is a
       * "don't" for `else`.
       *
       * The card is `target` — "you may cast target instant or sorcery card
       * with mana value 3 or less from your graveyard" (Chandra, Acolyte of
       * Flame's −2), the card a `reveal-until` found (Breaching Dragonstorm),
       * the spell a `counter` just exiled (Transcendent Dragon) — or, with
       * `from`, whichever card the player picks from a zone of theirs: "you
       * may cast a spell with mana value 4 or less from your hand" (Baral's
       * Expertise).
       */
      readonly kind: "cast-now";
      /** The card, when it's one card; absent with `from`. */
      readonly target?: EffectTargetRef;
      /**
       * Where the player picks the card from, when it's any of several:
       * their hand, their graveyard ("an instant or sorcery spell from your
       * graveyard" — Diviner of Mist), or "from among" the top `libraryTop`
       * cards of their library, which they look at (Velomachus Lorehold's top
       * seven — see `rest`).
       *
       * `"exiled-with-source"` is "the exiled card" of a linked ability
       * (rule 607.2a): the cards in exile this effect's source exiled, in
       * the battlefield stint the resolving ability refers to — hideaway's
       * (rule 702.75, `GameObject.exiledWith`). The source needn't still be
       * on the battlefield (the ability exists independently of it, rule
       * 113.7a), but a source that has left and come back is a new object
       * whose abilities never reach them (rule 400.7).
       *
       * `"targets"` is the resolving spell's or ability's own target cards
       * still legal — with `repeat`, Diluvian Primordial's "for each
       * opponent, you may cast up to one target instant or sorcery card from
       * that player's graveyard": one at a time, in the order the player
       * chooses, each a "may" of its own (its rulings).
       */
      readonly from?:
        | "hand"
        | "graveyard"
        | "exiled-with-source"
        | "exiled-this-way"
        | "targets"
        | { readonly libraryTop: number };
      /**
       * "You may play lands and cast spells **from among** cards exiled this
       * way" — any number of them, one after another while this resolves
       * (Gix, Yawgmoth Praetor: "you must play the cards as you resolve the
       * last ability", its ruling): after each one cast or played, the rest
       * of the cards first offered are offered again, until the player
       * declines or none is left. With `from: "exiled-this-way"` — the cards
       * this resolution exiled before the first offer, still in exile (not
       * one exiled later, as a cost of casting one was paid) — or
       * `"targets"`. Not with `then`, `else` or `rest`.
       */
      readonly repeat?: boolean;
      /**
       * "You may **play** the card", not only cast it: a land card on offer
       * may be played as part of the resolution — only during its player's
       * own turn and with a land play left, which it uses up (rules 305.2a,
       * 305.2b, 305.3); it ignores timing otherwise. A land is never cast
       * (rule 305.9). Without `play` a land card is never offered.
       */
      readonly play?: boolean;
      /**
       * What the spell cast must be — "an instant or sorcery spell with mana
       * value 4 or less", "if that spell's mana value is 8 or less" —
       * matched against the card as the spell it would be (rule 601.3e): the
       * face being cast (a modal double-faced card's back, an adventure), or
       * its prototype. An `{ amount }` compare is bound as this applies
       * ("mana value X or less" — Electrodominance). The card is judged at
       * X = 0, which is a free cast's X (rule 107.3b), so a mana-value clause
       * goes with `free`.
       */
      readonly spell?: CardFilter;
      /**
       * "…without paying its mana cost" — the only way the card is offered.
       * An alternative cost (rule 118.9), so no other one goes with it
       * (118.9a) and X is 0 (107.3b); additional costs such as kicker may
       * still be paid, and cost increases apply (118.9d).
       */
      readonly free?: boolean;
      /** "If that spell would be put into your graveyard, exile it instead." */
      readonly exileAfter?: boolean;
      /** "If you do, …" — a spell was cast this way (Conduit of Worlds: "you
       * can't cast additional spells this turn"). */
      readonly then?: EffectSpec;
      /** "If you don't, …" — nothing was cast, declined or not castable:
       * Breaching Dragonstorm's "put that card into your hand", Baral and
       * Kari Zev's First Mate Ragavan. */
      readonly else?: EffectSpec;
      /** With `libraryTop`: "put the rest on the bottom of your library in a
       * random order" — every card looked at and not cast, once `then` or
       * `else` is done. Without it they stay where they are. */
      readonly rest?: "bottom-random";
      /** Set only on the copy parked across the decision. */
      readonly progress?: CastNowProgress;
    }
  | {
      /** "**Choose an exiled card** an opponent owns with a void counter on
       * it. **You may play it this turn** without paying its mana cost"
       * (Dauthi Voidwalker): the effect's controller picks one face-up card
       * in exile matching `filter` (from their side) — nothing is targeted —
       * and may play it this turn: a land as their land play, a spell at its
       * normal timing (the rulings), with `free` only without paying its
       * mana cost. Nothing happens with none to choose. */
      readonly kind: "choose-exiled-to-play";
      readonly filter: CardFilter;
      readonly free?: boolean;
    }
  | {
      /** "Until end of turn, you may cast that card" — a card in exile
       * (Codie, Vociferous Codex's, found by a `reveal-until`): cast only,
       * this turn, by the effect's controller; with `free`, only "without
       * paying its mana cost". The permission rides on the card as an impulse
       * one (`GameObject.impulse`). */
      readonly kind: "allow-cast-from-exile";
      readonly target: EffectTargetRef;
      readonly free?: boolean;
      /** Warp's "its owner may cast this card **after the current turn has
       * ended** for as long as it remains exiled" (rule 702.185a): the card's
       * owner, not the effect's controller; from the next turn on; with no
       * end but its leaving exile. */
      readonly laterTurns?: boolean;
    }
  | {
      /**
       * Earthbend N, a keyword action: "Target land you control becomes a 0/0
       * creature with haste that's still a land. Put N +1/+1 counters on it.
       * When it dies or is exiled, return it to the battlefield tapped." —
       * Toph, the First Metalbender's "at the beginning of your end step,
       * earthbend 2". `target` is the land — a slot whose spec is a land you
       * control, `"source"` or `"trigger-object"`. Permanent, not until end of
       * turn: it stays a creature for as long as it stays on the battlefield.
       * The return is a delayed triggered ability (rule 603.7), so it
       * survives the land losing its abilities; it returns the card under its
       * owner's control, and only from the graveyard or exile it went to.
       */
      readonly kind: "earthbend";
      readonly target: EffectTargetRef;
      readonly amount: EffectAmount;
    }
  | {
      /**
       * "**When you do**, [effect]" — a reflexive triggered ability (rule
       * 603.12): Terra, Herald of Hope's "you may pay {2}. When you do,
       * return target creature card with power 3 or less from your graveyard
       * to the battlefield tapped" is a `may` with `cost: "{2}"` whose
       * `effect` is this. Applying it doesn't do `effect`: it triggers an
       * ability that goes on the stack the next time a player would receive
       * priority, once the spell or ability that made it has finished
       * resolving, and chooses `targets` then — so, unlike a `may`'s `then`,
       * it can target, and players can respond to it. `effect` refers to
       * those targets by slot as any ability does; `"source"`, X and the
       * triggering event are the creating spell's or ability's. Put it where
       * the action has certainly happened: a `may`'s effect (after its cost is
       * paid), a `sacrifice-source`'s `then`.
       */
      readonly kind: "reflexive-trigger";
      readonly targets: readonly TargetSpec[];
      readonly effect: EffectSpec;
      readonly text: string;
      /**
       * A number the creating resolution knows and the reflexive ability
       * needs — read as it triggers, and `{ triggerValue: true }` in
       * `effect`. Tip the Scales: "Sacrifice a creature. When you do, all
       * creatures get -X/-X until end of turn, where X is the sacrificed
       * creature's toughness" — the sacrifice is the spell's, not the
       * ability's, so only the spell's resolution can say what it was
       * (`{ thisWay: "sacrificed", sumOf: "toughness" }`), and players
       * respond to the ability knowing X (its ruling). Without it the
       * reflexive ability carries the creating one's own trigger value.
       */
      readonly value?: EffectAmount;
    }
  | {
      /**
       * Put a targeted card on top of (or on the bottom of) its owner's
       * library — Academy Ruins, Mortuary Mire, Hall of Heliod's Generosity,
       * all of which recur a graveyard card by putting it back on the deck
       * rather than into a hand.
       *
       * Distinct from `return-from-graveyard`, which is filter-driven and
       * only reaches the effect's own controller's graveyard: this takes a
       * chosen target, so the card and its owner are whatever was targeted.
       */
      readonly kind: "put-on-library";
      /** A target slot, or `"trigger-object"` — Murderous Rider's "when this
       * creature dies, put it on the bottom of its owner's library", found in
       * the graveyard it went to and only there (rule 400.7) — or
       * `"source"`, a spell putting itself there as it resolves (Approach of
       * the Second Sun); a copy of a spell can't go, and ceases to exist as
       * it leaves the stack (rule 707.10a). */
      readonly target: EffectTargetRef;
      /** `{ fromTop: 7 }` is "seventh from the top": under the top six, or
       * on the bottom of a library with fewer than six (the Approach of the
       * Second Sun ruling). */
      readonly position: "top" | "bottom" | { readonly fromTop: number };
    }
  | {
      /** Target player discards `amount` cards (their choice, unless it's the
       * effect's own controller). Discards their whole hand if it's smaller.
       * `target: "you"` = the effect's controller, with no target slot
       * (Faithless Looting's "then discard two cards"). */
      readonly kind: "discard";
      /** A target slot holding a player, or a scope ("each opponent discards
       * a card"). Each player with a real choice is asked in turn — see
       * `GameState.pendingDiscards`. */
      readonly target: number | PlayerScope;
      readonly amount: EffectAmount;
      /** "Discards a card at random" (Hypnotic Specter): nobody chooses —
       * the game picks, with its seeded shuffle. */
      readonly random?: boolean;
      /** "…unless they discard a [land] card" (Compulsive Research): one card
       * matching this is a whole answer by itself, instead of `amount`. */
      readonly unlessOne?: CardFilter;
    }
  | {
      readonly kind: "modify-pt";
      readonly target: EffectTargetRef;
      readonly power: EffectAmount;
      readonly toughness: EffectAmount;
      readonly duration: PtDuration;
    }
  | {
      /** Every battlefield permanent matching `filter` gets +power/+toughness
       * (Garruk Wildspeaker's ult / Overrun: `{ type: "creature",
       * controlledBy: "you" }`, `+3/+3`, `end-of-turn`; Craterhoof Behemoth:
       * `power`/`toughness` `{ countOf: … }` — a live count). */
      readonly kind: "modify-pt-all";
      readonly filter: CardFilter;
      readonly power: EffectAmount;
      readonly toughness: EffectAmount;
      readonly duration: PtDuration;
      /** Spare the effect's own source — "**other** attacking creatures you
       * control with flying" (Steel-Plume Marshal), which is itself an
       * attacking creature with flying. Same clause `damage-all` carries, and
       * for the same reason: a `CardFilter` describes the permanent matched,
       * not its relationship to the source. */
      readonly exceptSource?: boolean;
      /** Scope the filter to a *targeted* player's permanents — Great Oak
       * Guardian's "creatures **target player** controls get +2/+2". A
       * `CardFilter`'s `controlledBy` only knows "you" and "opponent", which
       * can't name one seat at a 3-4 player table. */
      readonly controlledByTarget?: number;
    }
  | {
      /** Double each matching permanent's *current* power and toughness
       * (Unnatural Growth: "double the power and toughness of each creature
       * you control until end of turn"). Reads each one's own computed P/T
       * individually and adds that much again, unlike `modify-pt-all`'s
       * single shared amount — a 2/2 and a 5/5 both matching become a 4/4
       * and a 10/10, not identical stat lines. */
      readonly kind: "double-pt-all";
      readonly filter: CardFilter;
      readonly duration: PtDuration;
    }
  | {
      /** Double the number of a specific counter kind on each matching
       * permanent (Kalonian Hydra / Bristly Bill: "double the number of
       * +1/+1 counters on each creature you control") — adds a counter count
       * equal to what's already there. Routes through the same `addCounter`
       * a targeted `add-counter` effect uses, so Doubling Season's
       * replacement still folds in on top (rule ruling: doubling an existing
       * count via an effect and Doubling Season compose to 3x, not 4x). A
       * permanent with none of `counterKind` is untouched. */
      readonly kind: "double-counters-all";
      readonly filter: CardFilter;
      readonly counterKind: string;
    }
  | {
      /** "Double the number of each kind of counter on" one permanent
       * (Deepglow Skate): another counter of each kind for each one already
       * there, put on the way a targeted `add-counter` puts them, so a
       * Doubling Season applies. A permanent with no counters is untouched.
       * `counter` doubles just that kind — Voracious Hydra's "double the
       * number of +1/+1 counters on this creature". */
      readonly kind: "double-counters";
      readonly target: EffectTargetRef;
      readonly counter?: string;
    }
  | {
      /** Every battlefield permanent matching `filter` gains `keyword` (Overrun:
       * trample until end of turn). */
      readonly kind: "grant-keyword-all";
      readonly filter: CardFilter;
      readonly keyword: Keyword;
      readonly duration: PtDuration;
      /** Spare the effect's own source — "**other** Spiders you control
       * gain flying" (Cosmic Spider-Man). Same clause as `modify-pt-all`. */
      readonly exceptSource?: boolean;
    }
  | {
      /**
       * Connive (rule 701.50): the permanent's controller draws `amount`
       * cards (1 by default — "connives X" is an amount), then discards that
       * many, then puts a +1/+1 counter on it for each nonland card
       * discarded. A permanent that has left is still connived with — its
       * last controller draws and discards — but gets no counter (701.50b).
       */
      readonly kind: "connive";
      readonly target: EffectTargetRef;
      readonly amount?: EffectAmount;
      /** Set by the engine on the part it parks while the discard is being
       * chosen: the event the connive's draw began at. Never authored. */
      readonly discardsSince?: number;
    }
  | {
      readonly kind: "add-counter";
      readonly target: EffectTargetRef;
      readonly counter: string;
      /** A fixed amount, `"x"`, or a live count (Will of the Sultai: "X
       * +1/+1 counters, where X is the number of lands you control" —
       * needed-cards P16). */
      readonly amount: EffectAmount;
      /** Who puts them, when the card says someone else does — "that player
       * … puts a +1/+1 counter on it" (Alexios, Deimos of Kosmos:
       * `"active-player"`). What a "whenever you put … counters" trigger
       * asks (`counter-added`'s `by`). The effect's controller by default. */
      readonly by?: EffectPlayerRef;
    }
  | {
      /**
       * Remove `amount` counters of kind `counter` from a permanent — the
       * reverse of `add-counter`: Unbreathing Horde's "prevent that damage
       * and remove a +1/+1 counter from it". Removes as many as there are,
       * up to `amount` (none at all from one with none — its ruling), and
       * announces what it removed (`counter-removed`). Only a permanent
       * still on the battlefield as the same object (rule 400.7) loses any:
       * counters on a card that has left simply ceased to exist (rule 122.2).
       */
      readonly kind: "remove-counter";
      readonly target: EffectTargetRef;
      readonly counter: string;
      readonly amount: EffectAmount;
    }
  | {
      /**
       * Put counters on **every** battlefield permanent matching `filter`
       * (Loyal Guardian: "put a +1/+1 counter on each creature you control").
       * The untargeted, mass form of `add-counter`; routes through the same
       * per-permanent path, so a `would-add-counter` replacement (Doubling
       * Season) still composes.
       */
      readonly kind: "add-counter-all";
      readonly filter: CardFilter;
      readonly counter: string;
      /** `"own-toughness"`: each permanent gets as many as its own
       * toughness — Canopy Gargantuan's "a number of +1/+1 counters on each
       * other creature you control equal to **that creature's** toughness".
       * Every permanent's toughness is read before any counter goes on, so
       * none is sized by another's new counters. */
      readonly amount: EffectAmount | "own-toughness";
      /** Spare the effect's own source — "put a +1/+1 counter on each
       * **other** creature you control" (Finneas, Ace Archer). */
      readonly exceptSource?: boolean;
      /** As on `modify-pt-all`: the filter is read from the side of the
       * player in this target slot — Requisition Raid's "each creature
       * **target player** controls" is `{ type: "creature", controlledBy:
       * "you" }` with slot 0. That player gone (an illegal target), it puts
       * none (rule 608.2b). */
      readonly controlledByTarget?: number;
    }
  | {
      /** "You gain hexproof until end of turn" (Lazotep Plating). A *player*
       * can't be targeted by opponents' spells or abilities; permanents
       * gaining hexproof is `grant-keyword-all` instead. */
      readonly kind: "grant-player-hexproof";
      readonly who?: PlayerScope;
    }
  | {
      /**
       * Populate (rule 701.36a) — choose a creature token you control and
       * create a token that's a copy of it (Rootborn Defenses). With two or
       * more to choose from, the controller picks one on the board (a
       * `choose-permanents`); with one, it's copied without asking.
       */
      readonly kind: "populate";
    }
  | {
      /**
       * Amass N (rule 701.47a) — "Amass Zombies 2": put N +1/+1 counters on
       * an Army you control; it's also a `creatureType`. If you control no
       * Army, create a 0/0 black Army creature token first. With two or more
       * Army creatures (a changeling is one too, rule 702.73a), the controller
       * chooses which (a `choose-permanents`).
       *
       * One effect rather than a `conditional` + `create-token` +
       * `add-counter` sequence, because "an Army you control" has to be the
       * *same* Army across the create and the counters — the whole point of
       * the mechanic is that repeated amassing grows one creature.
       */
      readonly kind: "amass";
      readonly amount: EffectAmount;
      /** The creature type amass names; the Army gains it (701.47a). */
      readonly creatureType: string;
      /** Set only by the engine: the Army chosen, as the target slot a
       * `choose-permanents` binds it to — never authored. */
      readonly onto?: number;
    }
  | {
      /**
       * Monstrosity N (rule 701.37a): "If this permanent isn't monstrous, put
       * N +1/+1 counters on it and it becomes monstrous." Always about the
       * ability's own source ("this permanent"), and only while it's the same
       * object on the battlefield (rule 400.7): one that has left, or that is
       * monstrous already, has nothing happen to it, and fires no
       * `becomes-monstrous` trigger (the rulings). `amount` may be `"x"` for
       * "Monstrosity X" (701.37c).
       */
      readonly kind: "monstrosity";
      readonly amount: EffectAmount;
    }
  | {
      /**
       * Proliferate (rule 701.27): choose any number of permanents and/or
       * players with counters on them, then give each another counter of each
       * kind already there. Raises a `proliferate` decision — the choice is
       * the card, and choosing nothing is legal.
       */
      readonly kind: "proliferate";
      /** Applied once the choice is answered — Contentious Plan's
       * "Proliferate. Draw a card." Predates a `sequence` waiting for a
       * decision one of its steps raises, which now does the same. */
      readonly then?: EffectSpec;
    }
  | {
      readonly kind: "grant-keyword";
      readonly target: EffectTargetRef;
      readonly keyword: Keyword;
      readonly duration: PtDuration;
    }
  | {
      /**
       * A continuous effect for the controller, for a while — an emblem that
       * expires, at this turn's cleanup (`"end-of-turn"`) or as their next
       * turn begins (`"until-your-next-turn"`). `reduceSpells` is "spells you
       * cast this turn that are black and/or red cost {X} less to cast, where
       * X is the amount of life you lost this turn" (Rowan, Scion of War —
       * `applies` a filter, `reduceGeneric` an amount read as this resolves
       * and fixed from then on, rule 611.2b); `castFromHandFree` is "you may
       * cast spells from your hand this turn without paying their mana costs"
       * (Yusri, Fortune's Flame), `filter` narrowing which. `damageTo` is
       * "until your next turn, if a source would deal damage to that player
       * or a permanent that player controls, it deals double that damage
       * instead" (`who: "trigger-player"`, `multiplier: 2`, `permanentsToo`)
       * — the players fixed as it resolves; the effect is still the
       * controller's, and ends with it.
       *
       * The game-outcome locks, each over the players a scope names as it
       * resolves: `cantLoseGame` ("you can't lose the game this turn"),
       * `cantWinGame` ("your opponents can't win the game this turn" —
       * `"each-opponent"`), `cantLoseLife` ("players can't lose life this
       * turn", rule 119.8), and `damageLifeFloor` ("until end of turn, damage
       * that would reduce your life total to less than 1 reduces it to 1
       * instead" — `floor: 1`). Angel's Grace, Everybody Lives!.
       */
      readonly kind: "player-effect";
      readonly duration: "end-of-turn" | "until-your-next-turn";
      readonly reduceSpells?: { readonly applies: CardFilter; readonly reduceGeneric: EffectAmount };
      readonly castFromHandFree?: { readonly filter?: CardFilter };
      readonly damageTo?: {
        readonly who: PlayerScope;
        readonly multiplier: number;
        readonly permanentsToo?: boolean;
      };
      readonly cantLoseGame?: PlayerScope;
      readonly cantWinGame?: PlayerScope;
      readonly cantLoseLife?: PlayerScope;
      readonly damageLifeFloor?: { readonly who: PlayerScope; readonly floor: number };
      /** "Until end of turn, if one or more tokens would be created under
       * your control, twice that many of those tokens are created instead"
       * (Kaya, Geist Hunter's −2) — `2`. Compounds with a Doubling Season. */
      readonly tokenMultiplier?: number;
    }
  | {
      /**
       * "You win the game" (rule 104.2b): the effect's controller wins, and
       * the game ends at once (104.1) — unless they can't win
       * (`playerCantWinGame`: Platinum Angel's "your opponents can't win the
       * game"), when nothing happens. Wrap it in a `conditional` for the
       * card's "if …" (Thassa's Oracle, Jace's −8), or put that on the
       * trigger as an intervening-if (Felidar Sovereign's upkeep). The
       * draw-from-an-empty-library form (Laboratory Maniac) is a `would-draw`
       * replacement, not this.
       */
      readonly kind: "win-game";
    }
  | {
      /**
       * "You lose the game" / "that player loses the game" (rule 104.3e):
       * each player `who` names (default `"you"`) loses and leaves the game
       * at once (104.5, 800.4a) — unless they can't lose
       * (`playerCantLoseGame`). Players a scope names lose at the same time;
       * if that leaves one player, they win (104.2a), and if it leaves none,
       * the game is a draw (104.4a). `target` is the player in that slot
       * instead — Mirrodin Besieged's "target opponent loses the game" —
       * and nobody, once that target has become illegal.
       */
      readonly kind: "lose-game";
      readonly who?: PlayerScope;
      readonly target?: number;
    }
  | {
      /**
       * "Flip a coin. If you win the flip, [won]. If you lose the flip,
       * [lost]." (rule 705) — the effect's controller flips, on the game's
       * seeded random stream, and `won` / `lost` are their effect after it.
       * `untilLose` is "flip a coin until you lose a flip" (Okaun, Eye of
       * Chaos; Zndrsplt, Eye of Wisdom): every flip won is its own
       * `coin-flipped` event, which a `wins-coin-flip` trigger fires on, and
       * `won` applies once per win.
       */
      readonly kind: "flip-coin";
      readonly won?: EffectSpec;
      readonly lost?: EffectSpec;
      readonly untilLose?: boolean;
    }
  | {
      /**
       * Prohibitions until end of turn: "this turn, that player can't cast
       * spells or activate abilities" (Sen Triplets — `who`, a target slot
       * holding a player or a scope, default you, with `spells` and/or
       * `abilities`), "its activated abilities can't be activated this turn"
       * (Koma, Cosmos Serpent — `target`, a permanent, this stint of it).
       * Mana abilities are activated abilities too. `spells` may name only
       * some spells: Ranger-Captain of Eos's "your opponents can't cast
       * **noncreature** spells this turn" is `{ filter: { notTypes:
       * ["creature"] }, label: "noncreature spells" }` — the filter matched
       * against the card as it would be cast, from this effect's controller's
       * side; `label` is how the log names them.
       */
      readonly kind: "prohibit";
      readonly who?: number | PlayerScope;
      readonly target?: EffectTargetRef;
      readonly spells?: boolean | { readonly filter: CardFilter; readonly label: string };
      readonly abilities?: boolean;
    }
  | {
      /**
       * Combat restrictions until end of turn — "target creature can't block
       * this turn", "~ must be blocked each combat this turn if able"
       * (Anzrag, the Quake-Mole: `target: "source"`, `restrictions:
       * ["must-be-blocked-if-able"]`): on `target`, as a modifier the way a
       * keyword grant is. With `filter` instead, a rule for the rest of the
       * turn over every permanent matching it from the controller's side —
       * "creatures your opponents control can't block this turn" binds a
       * creature that enters later too (rule 611.2c).
       */
      readonly kind: "restrict";
      readonly target?: EffectTargetRef;
      readonly filter?: CardFilter;
      readonly restrictions: readonly CombatRestriction[];
      /** How long a `target`'s restrictions last — this turn when omitted;
       * `"while-source"` is Opportunistic Dragon's "for as long as this
       * creature remains on the battlefield, … it can't attack or block". */
      readonly duration?: PtDuration;
    }
  | {
      /**
       * "Can attack this turn as though it didn't have defender" (rule
       * 702.3b): `target` until end of turn, as a modifier (Assault
       * Formation); or with `filter`, a rule for the rest of the turn over
       * every permanent matching it from the controller's side, one that
       * comes under their control later too (Wakestone Gargoyle's ruling).
       * Not an ability the creature gains, so losing its abilities doesn't
       * end it. The static form is `StaticAbility.canAttackAsThoughNoDefender`.
       */
      readonly kind: "attack-despite-defender";
      readonly target?: EffectTargetRef;
      readonly filter?: CardFilter;
    }
  | {
      /**
       * Territorial Hellkite's "choose an opponent at random **that this
       * creature didn't attack during your last combat**. This creature
       * attacks that player this combat if able. If you can't choose an
       * opponent this way, tap this creature": the game picks among the
       * effect's controller's opponents still in the game — with
       * `notAttackedLastCombat`, not the one `target` attacked in its
       * controller's combat before this one (any, if it didn't attack then)
       * — and `target` must attack that player this combat if able (rule
       * 508.1d; not a planeswalker of theirs, and no cost need be paid). A
       * player who can't be attacked may still be picked (the rulings).
       * With nobody to pick, `else` happens instead.
       */
      readonly kind: "attack-random-opponent";
      readonly target: EffectTargetRef;
      readonly notAttackedLastCombat?: boolean;
      readonly else?: EffectSpec;
    }
  | {
      /** `target` assigns combat damage equal to its toughness rather than
       * its power until end of turn (rule 510.1a — Walking Bulwark). Its
       * power is unchanged for everything else. The static form is
       * `StaticAbility.combatDamageByToughness`. */
      readonly kind: "damage-by-toughness";
      readonly target: EffectTargetRef;
    }
  | {
      /**
       * "Return it to the command zone" (Hellkite Courser's delayed
       * trigger): a commander still on the battlefield as the same object
       * (rule 400.7 — its ruling: "only if it's still on the battlefield")
       * goes to the command zone, leaving the battlefield as any permanent
       * does. Anything that isn't a commander stays put.
       */
      readonly kind: "put-in-command-zone";
      readonly target: EffectTargetRef;
    }
  | {
      /**
       * "Exchange your life total with this creature's toughness" (Tree of
       * Redemption — rule 701.12g): the permanent's toughness becomes the
       * effect controller's life total, a layer-7b effect with no end
       * (`PtModifier.setToughness` — counters and bonuses still apply on top,
       * the ruling), and the player gains or loses the life it takes to
       * reach the toughness it had, so a life-gain replacement or a "whenever
       * you gain life" trigger sees it (701.12c). If either half can't
       * happen — the permanent isn't there as the same object any more (the
       * ruling), or the player can't gain, or can't lose, the life it would
       * take (rules 119.7–8) — none of it does (701.12a).
       */
      readonly kind: "exchange-life-toughness";
      readonly target: EffectTargetRef;
      /** Whose life total — the effect's controller's by default; Tree of
       * Perdition's "exchange **target opponent's** life total" is `{ target:
       * 0 }`. Naming nobody (an illegal or empty slot), nothing happens. */
      readonly player?: EffectPlayerRef;
    }
  | {
      /** `target` (an instant/sorcery card in a graveyard, via the
       * `"instant-or-sorcery-in-your-graveyard"` target spec) gains flashback
       * until end of turn for a cost equal to its mana cost — Snapcaster Mage
       * (ROADMAP Phase 6b). */
      readonly kind: "grant-flashback";
      readonly target: number;
    }
  | {
      /** The mass form of `grant-flashback`: each card in your graveyard
       * matching `filter` gains flashback until end of turn, at a cost equal
       * to its mana cost — Past in Flames' "each instant and sorcery card in
       * your graveyard". The cards are fixed as it resolves (rule 611.2c):
       * one put there later this turn doesn't gain it. */
      readonly kind: "grant-flashback-all";
      readonly filter: CardFilter;
    }
  | {
      /** "Choose target artifact card in your graveyard. You may cast that
       * card this turn" (Silas Renn, Emry) — `target` (a card in a graveyard,
       * via a `card-in-graveyard` spec) gets a one-shot permission for the
       * ability's controller to cast it, for its ordinary cost, until end of
       * turn. The permission lives on the card (`GameObject
       * .graveyardCastPermission`) and ends if the card leaves the graveyard.
       * Casts only: a land can't be cast. */
      readonly kind: "grant-graveyard-cast";
      readonly target: number;
    }
  | {
      /**
       * Give a permanent a triggered ability — "gains 'Whenever this creature
       * deals combat damage to a player, draw that many cards'" (Hunter's
       * Prowess, Hunter's Insight).
       *
       * The one-shot counterpart of `StaticAbility.grantsTriggered`: it rides
       * on the target's own modifiers, so an `"end-of-turn"` grant expires
       * with every other until-end-of-turn modifier.
       */
      readonly kind: "grant-triggered";
      readonly target: EffectTargetRef;
      readonly ability: TriggeredAbility;
      readonly duration: PtDuration;
    }
  | {
      /**
       * `target` loses all its abilities (layer 6) — with `loseLandTypes`,
       * its land types too (layer 4; its other types and supertypes stay) —
       * and has `activated` besides, granted by the same effect so they
       * aren't lost with the rest (rule 613.7): Ultima, Origin of Oblivion's
       * "it loses all land types and abilities and has '{T}: Add {C}.'"
       */
      readonly kind: "lose-abilities";
      readonly target: EffectTargetRef;
      readonly loseLandTypes?: boolean;
      readonly activated?: readonly ActivatedAbility[];
      readonly duration: PtDuration;
    }
  | {
      /**
       * Every battlefield permanent matching `filter` loses all its
       * abilities (layer 6) — Final Showdown's "all creatures lose all
       * abilities until end of turn". The mass form of `lose-abilities`:
       * the permanents are the ones that match as it applies (rule 611.2c),
       * under one effect with one timestamp, so an ability an effect grants
       * one of them afterwards isn't lost (rule 613.7 — the ruling), and a
       * creature that arrives later keeps its own.
       */
      readonly kind: "lose-abilities-all";
      readonly filter: CardFilter;
      readonly duration: PtDuration;
    }
  | {
      /**
       * Give a permanent an activated ability — the one-shot counterpart of
       * `StaticAbility.grantsActivated`, riding on the target's own modifiers
       * like `grant-triggered`. A mana ability is seen by the mana payer, or
       * activated by hand where the payer can't use it (see `manaSources`).
       */
      readonly kind: "grant-activated";
      readonly target: EffectTargetRef;
      readonly ability: ActivatedAbility;
      readonly duration: PtDuration;
    }
  | {
      /** The mass form of `grant-activated`: Rain of Filth's "until end of
       * turn, lands you control gain 'Sacrifice this land: Add {B}.'" Matches
       * are fixed as it resolves (rule 611.2c), and a token stack gains it
       * whole. */
      readonly kind: "grant-activated-all";
      readonly filter: CardFilter;
      readonly ability: ActivatedAbility;
      readonly duration: PtDuration;
    }
  | {
      /** The mass form of `grant-triggered`: every battlefield permanent
       * matching `filter` (from the effect's controller's side) gains the
       * ability — Azlask, the Swelling Scourge's "Scions and Spawns you
       * control gain … annihilator 1 until end of turn". Matches are fixed as
       * it resolves (rule 611.2c), and a token stack gains it whole. */
      readonly kind: "grant-triggered-all";
      readonly filter: CardFilter;
      readonly ability: TriggeredAbility;
      readonly duration: PtDuration;
    }
  | {
      /** The effect's controller takes an extra turn after this one (rule
       * 500.7 — ROADMAP Phase 7), or with `target` the player in that slot
       * (Time Warp: "target player takes an extra turn after this one"). */
      readonly kind: "take-extra-turn";
      readonly target?: number;
    }
  | {
      /**
       * Gift (rule 702.174): the gift given to the opponent it was promised
       * to — the spell's, or for a permanent, its spell's as it entered
       * (`GameObject.giftTo` / `enteredGiftTo`, read as it last existed if
       * it has left). Nothing when no gift was promised, or that player has
       * left the game. An instant or sorcery gives it before its other
       * effects (702.174j): the first step of its kicker `effect` (a gift
       * is the kicker machinery under the keyword `gift`); a permanent, in
       * "when this permanent enters, if its gift cost was paid" (702.174b —
       * the `giftTrigger` helper).
       */
      readonly kind: "gift";
      readonly gift: GiftKind;
    }
  | {
      /** Storm (rule 702.40 — ROADMAP Phase 8): put a copy of the spell this
       * ability is on onto the stack for each other spell its controller cast
       * before it this turn. Copies keep the original's targets. With
       * `of: "trigger-object"`, the spell is the trigger's instead: a
       * delayed "the next instant or sorcery spell you cast this turn has
       * storm" (Storm, Force of Nature), which triggers on that spell's cast
       * as its own storm would. */
      readonly kind: "storm";
      readonly of?: "trigger-object";
    }
  | {
      /** Cascade (rule 702.85 — ROADMAP Phase 8): exile cards off the top of
       * the controller's library until a nonland card with lesser mana value
       * is exiled; its controller may cast that card for free (702.85a), and
       * the rest go to the bottom. */
      readonly kind: "cascade";
      /** The second half, once the player has said whether to cast what was
       * found: the two answers to the "you may cast it" choice. Only the engine
       * builds this; a card is authored as a bare `{ kind: "cascade" }`. */
      readonly finish?: CascadeFinish;
    }
  | {
      /**
       * Reveal cards from the top of a library until one matches `filter` —
       * a generalised cascade (rule 701.16): The Prismatic Bridge's "reveal
       * cards from the top of your library until you reveal a creature or
       * planeswalker card. Put that card onto the battlefield and the rest on
       * the bottom of your library in a random order", Umbris's "target
       * opponent exiles cards from the top of their library until they exile
       * a land card". With nothing matching, every card is revealed and all
       * of them are "the rest".
       */
      readonly kind: "reveal-until";
      /** Whose library: the effect's controller's (default), the player in
       * this target slot, or `"that-player"` — each one a `for-each-player`
       * names (Consuming Aberration's "each opponent reveals cards from the
       * top of their library until they reveal a land card"). */
      readonly whose?: number | "that-player";
      /** What stops it, matched against each card as it's revealed — an `{
       * amount }` compare is bound as the effect applies ("a nonland card
       * with lesser mana value"). */
      readonly filter: CardFilter;
      /** Exile each card, face up, as it goes, rather than reveal it. */
      readonly exile?: boolean;
      /** Where the card found goes. Omitted, it stays with the rest — unless
       * `then` moves it. */
      readonly put?: "battlefield" | "hand" | "graveyard";
      /** A card put onto the battlefield enters tapped. */
      readonly tapped?: boolean;
      /** …and attacking (rule 508.4) — Raph & Mikey, Troublemakers' "put
       * that card onto the battlefield tapped and attacking". See
       * {@link EnterAttacking}. */
      readonly attacking?: EnterAttacking;
      /** Applied once the card found is placed, with it as target 0 — "you
       * may put that card onto the battlefield" is a `may` of a
       * `put-onto-battlefield` of 0. Skipped when nothing matched. */
      readonly then?: EffectSpec;
      /**
       * What happens to every revealed card still where it was revealed —
       * the rest, and the card found if nothing moved it: `"bottom-random"`
       * (the bottom of the library in a random order), `"graveyard"`,
       * `"shuffle"` (into the library, which is shuffled — "then shuffle")
       * or `"stay"` (exiled cards stay exiled; revealed ones stay on top).
       */
      readonly rest: "bottom-random" | "graveyard" | "shuffle" | "stay";
      /** The card found isn't one of the rest, whatever became of it — Codie,
       * Vociferous Codex's "put each **other** card exiled this way on the
       * bottom", which leaves it in exile to be cast. */
      readonly keepFound?: boolean;
      /** Set only on the copy parked across a decision — the "as this
       * enters" choice of the card found, or one `then` raised: what was
       * revealed and found, so it isn't revealed again. */
      readonly progress?: RevealUntilProgress;
    }
  | {
      /**
       * Copy a spell (rule 707.10): the one in target slot `target` (Twincast)
       * or, with `"trigger-spell"`, the spell whose casting fired this
       * triggered ability — as it last was on the stack if it has left since
       * (Shiko and Narset, Unified's copy happens even after the spell was
       * countered in response). The copy has the original's modes, targets,
       * {X} and the costs paid for it; a copy of a permanent spell becomes a
       * token as it resolves.
       */
      readonly kind: "copy-spell";
      /** A target slot, `"trigger-spell"`, or `"source"`: this spell, while
       * it resolves — Sevinne's Reclamation's "you may copy this spell and
       * may choose a new target for the copy". The copy goes on the stack
       * above it; one that is itself a copy was never cast. */
      readonly target: number | "trigger-spell" | "source";
      /** "You may choose new targets for the copy" (rule 707.10c). */
      readonly newTargets?: true;
      /** "Copy that spell if it targets a permanent or player" — any of its
       * targets was, when chosen. Otherwise it isn't copied. */
      readonly ifTargets?: "permanent-or-player";
      /** "If you don't copy a spell this way, [this]" (Shiko and Narset's
       * "draw a card"). */
      readonly otherwise?: EffectSpec;
      /**
       * "The copy targets Ivy" (rule 707.10e — Ivy, Gleeful Spellthief): each
       * of the copy's targets is this one instead of the original's —
       * `"source"`, the effect's own permanent, or the object in this target
       * slot of the effect. A slot the spell's own rules filled isn't a
       * target, and keeps what it had. If that one isn't a legal target for
       * each of them, as the copy's controller would choose it, the copy
       * isn't created (and `otherwise` applies). With `"trigger-spell"` only.
       */
      readonly retargetTo?: "source" | number;
      /**
       * "Copy that spell for each other creature you control that the spell
       * could target. Each copy targets a different one of those creatures"
       * (rule 707.10d — Zada, Hedron Grinder): one copy per battlefield
       * permanent matching `filter` from the effect's side (`other` leaves
       * the effect's own permanent out) that is a legal target for each of
       * the spell's targets, every target of a copy being that one. A token
       * stack is that many permanents, each its own copy. With two or more,
       * their controller puts them on the stack in the order they choose — a
       * `choose-permanents` decision naming them all, in order. With
       * `"trigger-spell"` only.
       */
      readonly forEachItCouldTarget?: { readonly filter: CardFilter; readonly other?: true };
      /**
       * "Copy it **for each** …": how many copies, read as the effect
       * applies — Thousand-Year Storm's "for each other instant and sorcery
       * spell you've cast before it this turn" (`{ triggerValue: true }`
       * off a cast trigger's `countCastBefore`), Thunderclap Drake's "for
       * each time you've cast your commander from the command zone this
       * game" (`{ commanderCasts: "you" }`). One copy when omitted; none at
       * 0. With `newTargets`, each copy is asked about in turn, as storm's
       * are. Not with `forEachItCouldTarget`.
       */
      readonly count?: EffectAmount;
      /** The spell to copy, captured: only the engine sets this, on the copy
       * that a `forEachItCouldTarget` hands its `choose-permanents` decision
       * (which applies it once per permanent chosen, with that one as target
       * 0, outside the triggered ability that knew the spell). */
      readonly spell?: { readonly snapshot: SpellSnapshot; readonly original: ObjectId };
    }
  | {
      /**
       * Copy an activated or triggered ability on the stack (rule 707.10):
       * the one in target slot `target` (Lithoform Engine, Vantress Visions,
       * Weaver of Harmony — an `{ kind: "ability" }` target), or with
       * `"trigger-ability"` the one whose activation fired this triggered
       * ability (Illusionist's Bracers' "copy that ability", an
       * `activates-ability` trigger) — as it last was on the stack if it
       * has gone since. The copy has the original's source (707.10b), modes,
       * targets, X and what was paid for it (the creature sacrificed, the
       * permanent tapped), counts as the same ability for "the Nth time this
       * ability has resolved", and is controlled by this effect's controller;
       * choices made as it resolves are made again (707.10). It isn't
       * activated, so nothing watching activations sees it.
       */
      readonly kind: "copy-ability";
      readonly target: number | "trigger-ability";
      /** "You may choose new targets for the copy" (rule 707.10c). */
      readonly newTargets?: true;
    }
  | {
      /**
       * "Exile that card instead of putting it into your graveyard as it
       * resolves. If you do, return it to your hand at the beginning of the
       * next end step" (Feather, the Redeemed). Marks the spell whose casting
       * fired this triggered ability, as long as it's still that spell on
       * the stack (`GameObject.exileAsItResolves`). The replacement waits on
       * the spell: only resolving puts it to use (a spell countered or
       * fizzling goes to the graveyard as usual), only a card its owner — this
       * effect's controller — would put into their own graveyard (a spell
       * you don't own, a copy, and one whose own text moves it never do), and
       * it applies even if this effect's source has left by then (the
       * rulings). Another replacement that would exile it instead (flashback,
       * Rest in Peace, an Adventure) leaves its owner the choice of which
       * applies first (rule 616.1); only Feather's brings it back.
       */
      readonly kind: "exile-spell-as-it-resolves";
      /** "Return it to your hand at the beginning of the next end step." */
      readonly returnAtNextEndStep?: true;
      /** Only the engine sets this: the answer to that rule 616.1 choice,
       * applied to the spell `spell` that has just resolved — `true` to
       * apply this replacement first, `false` to let the other. */
      readonly applyFirst?: { readonly spell: ObjectId; readonly feather: boolean };
    }
  | {
      /** After this (post-combat) main phase there is an additional combat
       * phase then an additional main phase (Aggravated Assault — rule 500.8 /
       * ROADMAP Phase 7). With `afterThisPhase`, the additional combat phase
       * comes **straight after the combat phase under way** instead
       * (Karlach, Fury of Avernus; Anzrag: "after this phase, there is an
       * additional combat phase"), and `withMain` adds "followed by an
       * additional main phase" (Najeela, the Blade-Blossom) — one more main
       * phase before the rest of the turn. */
      readonly kind: "additional-combat";
      readonly afterThisPhase?: boolean;
      readonly withMain?: boolean;
    }
  | {
      /** "You get that many additional upkeep steps after this phase" (Obeka,
       * Splitter of Seconds, whose `amount` is `{ triggerValue: true }`, the
       * combat damage it dealt): an upkeep step belongs to a beginning phase,
       * so this adds `amount` beginning phases, each holding only an upkeep
       * step — their untap and draw steps are skipped (rules 500.10, 500.11)
       * — straight after the combat phase under way, ahead of any phase added
       * after it earlier (500.8). "At the beginning of your upkeep" triggers
       * in each. Only on its controller's own turn ("you get" — 500.10a), and
       * only from a combat phase, which is where its one card resolves it. */
      readonly kind: "additional-upkeep-steps";
      readonly amount: EffectAmount;
    }
  | {
      /** "N damage divided as you choose among any number of targets"
       * (Magma Opus): each target of the group starting at slot `from` is
       * dealt its share of the spell's `division`. A target that has become
       * illegal is dealt nothing, and its share goes nowhere (rule 608.2b). */
      readonly kind: "damage-divided";
      readonly from: number;
    }
  | {
      /** "Shuffle your library" on its own (Ponder's "You may shuffle", inside
       * a `may`): the effect's controller shuffles (rule 701.24). */
      readonly kind: "shuffle-library";
    }
  | {
      /** "You may play an additional land this turn" (Explore) — `amount`
       * more land drops for the effect's controller, this turn only. */
      readonly kind: "additional-land-drop";
      readonly amount: number;
    }
  | {
      /** Untap every battlefield permanent matching `filter` (Aggravated
       * Assault: `{ type: "creature", controlledBy: "you" }`). */
      readonly kind: "untap-all";
      readonly filter: CardFilter;
      /** As on `modify-pt-all` — "untap them" after pumping a targeted
       * player's creatures (Great Oak Guardian). */
      readonly controlledByTarget?: number;
      /** "Untap all **other** creatures you control" (Combat Celebrant):
       * the effect's own source stays as it is. */
      readonly exceptSource?: boolean;
    }
  | {
      /**
       * Exert a permanent (rule 701.43a): it won't untap during its exerter's
       * next untap step — this effect's controller's. It can be exerted
       * tapped or untapped, or exerted again (701.43b), but only on the
       * battlefield (701.43c). Emits `permanent-exerted`, which an `exerted`
       * trigger watches. `asItAttacks` marks the exert a creature's own "you
       * may exert this creature as it attacks" made — set by the engine as
       * it asks, and what that ability's linked "when you do" reads (rule
       * 607.2h).
       */
      readonly kind: "exert";
      readonly target: EffectTargetRef;
      readonly asItAttacks?: true;
    }
  | {
      /** Tap every battlefield permanent matching `filter` — Thundermaw
       * Hellkite's "Tap those creatures", which follows a `damage-all` over
       * the same filter. The mirror of `untap-all`; `tap` only ever takes a
       * single chosen target. */
      readonly kind: "tap-all";
      readonly filter: CardFilter;
    }
  | {
      /** `target` becomes a creature (rule 613 layer 4 for the added/set
       * types + subtypes, layer 5 for `setColors`, layer 6 for `keywords` /
       * `loseAbilities`, layer 7b for the set P/T). Printed types are kept —
       * a man-land is "still a land". `"source"` is the usual target
       * (man-lands animate themselves); Turn to Frog targets a creature. */
      readonly kind: "animate";
      readonly target: EffectTargetRef;
      /** Its base P/T. A live amount is read once, as the effect applies
       * (rule 608.2h — Zur, Eternal Schemer's "base power and base
       * toughness each equal to its mana value"), and stays that. */
      readonly power: EffectAmount;
      readonly toughness: EffectAmount;
      readonly addTypes: readonly CardType[];
      readonly addSubtypes: readonly string[];
      /** Replace its subtypes of the same kind (Turn to Frog: "a … Frog" —
       * its creature types; rule 205.1a). */
      readonly setSubtypes?: readonly string[];
      /** Set the colours (Turn to Frog: "blue"). */
      readonly setColors?: readonly Color[];
      /** The permanent loses all of its own abilities (Turn to Frog). */
      readonly loseAbilities?: boolean;
      readonly keywords?: readonly Keyword[];
      readonly duration: PtDuration;
    }
  | {
      /**
       * "[It] becomes a Demon **in addition to its other types**" (Clavileño,
       * First of the Blessed; Jenova, Ancient Calamity's "that creature
       * becomes a Mutant"): types and/or subtypes added in layer 4, and
       * nothing else — its P/T, colours and abilities are left alone, unlike
       * `animate`. `"end-of-turn"` or `"permanent"` (for as long as it's on
       * the battlefield). `target` is a slot, `"source"` or
       * `"trigger-object"`; a card returned to the battlefield earlier in the
       * same resolution keeps its id, so its slot still reaches it there.
       */
      readonly kind: "add-types";
      readonly target: EffectTargetRef;
      readonly addTypes?: readonly CardType[];
      readonly addSubtypes?: readonly string[];
      readonly duration: PtDuration;
    }
  | {
      /**
       * Every battlefield permanent matching `filter` (from the effect's
       * controller's perspective) becomes an N/N at once — Vihaan's "have
       * Treasures you control become 3/3 Construct Assassin artifact creatures
       * in addition to their other types until end of turn". The mass form of
       * `animate`, with the same layers: types and subtypes added in layer 4,
       * keywords in 6, base P/T set in 7b. With no `addTypes` it only sets
       * base P/T ("creatures your opponents control have base power and
       * toughness 1/1 until end of turn").
       *
       * The matches are fixed as the effect begins, and a token stack is
       * animated whole rather than split. The P/T may be a live amount, read
       * once as the effect applies and fixed from then on (rule 608.2h) —
       * Mirror Entity's "{X}: … creatures you control have base power and
       * toughness X/X" is `"x"`.
       */
      readonly kind: "animate-all";
      readonly filter: CardFilter;
      readonly power: EffectAmount;
      readonly toughness: EffectAmount;
      readonly addTypes?: readonly CardType[];
      readonly addSubtypes?: readonly string[];
      readonly keywords?: readonly Keyword[];
      readonly duration: PtDuration;
    }
  | {
      /** `target`'s text changes: one creature-type word is replaced by
       * another its controller chooses (Artificial Evolution — rule 612 /
       * layer 3). Resolving this raises a `choose-text` decision. */
      readonly kind: "change-text";
      readonly target: number;
    }
  | {
      readonly kind: "create-token";
      /** Name of a token definition in the {@link CardRegistry}. */
      readonly token: string;
      readonly count: EffectAmount;
      /** Who the tokens are created under the control of — the effect's
       * controller (default), or the controller of `targets[0]` (Beast Within:
       * "its controller creates a 3/3 Beast"; An Offer You Can't Refuse: the
       * countered spell's controller). Rule 111.11 — for a destroyed /
       * countered target this is its last-known controller. A
       * {@link PlayerScope} has each of those players create `count` tokens
       * ("each opponent creates a Treasure token"). */
      readonly who?: "target-controller" | PlayerScope;
      /** The tokens enter **tapped** (Army of the Damned, Necrotic Hex,
       * Overseer of the Damned). These are never folded into a token stack —
       * see `mintTokenBatch`. */
      readonly tapped?: boolean;
      /** "Sacrifice them at the beginning of the next end step" (Chandra,
       * Acolyte of Flame). Sacrificed rather than exiled, so dies-triggers
       * see them go — the same per-object flag Encore uses. */
      readonly sacrificeAtEndStep?: boolean;
      /** "Exile that token at the beginning of the next end step" (Manaform
       * Hellkite): exiled, not sacrificed, so nothing sees it die — the
       * per-object flag a token copy's `exileAtEndStep` sets. */
      readonly exileAtEndStep?: boolean;
      /** "**They gain haste until end of turn**" (Ovika, Enigma Goliath): the
       * tokens this creates get these keywords until the turn ends — the
       * tokens just made and no others, since the grant is part of making
       * them (they fold into a token stack only with ones made the same way). */
      readonly gainUntilEndOfTurn?: readonly Keyword[];
      /** "**The tokens are goaded for the rest of the game**" (Rendmaw,
       * Creaking Nest; Nettling Nuisance) — by this effect's controller,
       * whoever creates them: a token of their own must attack each combat
       * too (rule 701.15b). Part of making them, like `gainUntilEndOfTurn`. */
      readonly goadedForGame?: boolean;
      /** "…**then put N counters on it**" (Zaxara, the Exemplary's "create a
       * 0/0 green Hydra creature token, then put X +1/+1 counters on it"):
       * the effect's controller puts them on each token this made, once it
       * has entered. It entered without them, and state-based actions don't
       * look at a 0/0 until the effect is done. Such tokens are always made
       * as separate objects, never folded into a token stack as they're made. */
      readonly thenCounters?: { readonly kind: string; readonly amount: EffectAmount };
      /** "Create an **X/X** … token": its base power and toughness, set as
       * it's made — part of what the token is, so every other P/T effect
       * applies over them (Rootha, Mastering the Moment's Elemental, the
       * token's printed P/T being 0/0). Read once, as the effect resolves. */
      readonly basePt?: { readonly power: EffectAmount; readonly toughness: EffectAmount };
      /** The tokens enter **attacking** (rule 508.4) — "create two 1/1 white
       * Soldier creature tokens that are tapped and attacking" (Hero of
       * Bladehold) is this with `tapped`. See {@link EnterAttacking}. */
      readonly attacking?: EnterAttacking;
      /** Each token made its own object, never folded into a token stack —
       * for an effect that goes on to tell the tokens it made from older
       * ones: Martial Coup's "create X 1/1 white Soldier creature tokens …
       * destroy all **other** creatures" (`notThisWay: "created"`), where a
       * stack of Soldiers the new ones joined would be spared with them. */
      readonly separate?: boolean;
      /** "That token gains haste until end of turn and **attacks this combat
       * if able**" (Legion Warboss): a requirement on the tokens made (rule
       * 508.1d) that ends with this combat (rule 500.5a), not the turn — a
       * later combat phase doesn't bind them. With `gainUntilEndOfTurn:
       * ["haste"]` for the haste. */
      readonly attacksThisCombat?: boolean;
    }
  | {
      /**
       * Do `effect` once for each player in `who`, in turn order, as this
       * effect's controller, with the `"that-player"` scope naming that
       * player: Adeline, Resplendent Cathar's "for each opponent, create a
       * 1/1 white Human creature token that's tapped and attacking that
       * player or a planeswalker they control". Unlike `each-player-may`,
       * nobody is asked anything; and unlike a `create-token`'s `who`, it's
       * this effect's controller doing it, about each of them.
       */
      readonly kind: "for-each-player";
      readonly who: PlayerScope;
      readonly effect: EffectSpec;
      /** Set by the engine on the copy it parks when one player's `effect`
       * stops to ask something (myriad's "you may"): the players still to
       * go, fixed when it began. */
      readonly remaining?: readonly PlayerId[];
    }
  | {
      /** Create `count` token(s) that are copies of a permanent (rule 707.10 —
       * needed-cards P5b). `of` names what to copy: `"source"` (Scute Swarm —
       * the ability's own permanent), `"trigger-object"` (Miirym — the
       * permanent whose entering fired the trigger), or a target-slot index.
       * The tokens enter under the copied permanent's controller (rule 111.11 /
       * "its controller creates" — for a destroyed target its last-known
       * controller). */
      readonly kind: "create-token-copy";
      /** `"entered-together"` is "for each of them": a copy (`count`) of
       * each permanent of the entry a batched `enters-battlefield` trigger
       * fired on — Kambal, Profiteering Mayor. `{ each }` is a copy of each
       * permanent matching the filter as this resolves, a token stack once
       * per token in it — Redoubled Stormsinger's "for each creature token
       * you control that entered this turn, create … a copy of that token". */
      readonly of: "source" | "trigger-object" | "entered-together" | number | { readonly each: CardFilter };
      readonly count: number;
      /** The token copies have haste — a copy exception ("except it has
       * haste" — Kiki-Jiki), which lasts as long as they do. */
      readonly gainsHaste?: boolean;
      /** "**It gains haste until end of turn**" (Mishra, Eminent One): the
       * keywords last only this turn, unlike `gainsHaste`. */
      readonly gainUntilEndOfTurn?: readonly Keyword[];
      /** Exile the token copies at the beginning of the next end step (Miirym). */
      readonly exileAtEndStep?: boolean;
      /** "Exile the tokens at end of combat" (myriad, rule 702.116a; Delina,
       * Wild Mage): a delayed triggered ability over the copies made, at the
       * beginning of the end of combat step — on the stack, like any. */
      readonly exileAtEndOfCombat?: boolean;
      /** The copies enter **tapped** — with `attacking`, "a token copy that's
       * tapped and attacking" (myriad). */
      readonly tapped?: boolean;
      /** …and **attacking** (rule 508.4) — see {@link EnterAttacking}. */
      readonly attacking?: EnterAttacking;
      /** *Sacrifice* them at the beginning of the next end step instead
       * (Kiki-Jiki, Mirror Breaker) — the difference is whether dies-triggers
       * see them go. */
      readonly sacrificeAtEndStep?: boolean;
      /** The copies are not legendary (Miirym — "except it's not legendary"). */
      readonly notLegendary?: boolean;
      /** Who the token enters under. Default is the *copied* permanent's own
       * controller (Miirym copying your own Dragons); `"you"` puts it under
       * the effect's controller instead, which is what a card that copies
       * something an opponent controls means (Hate Mirage). */
      readonly who?: "you";
      /** Override the copies' base power/toughness, as part of their copiable
       * values (rule 707.9b), so counters and anthems still apply: "except
       * it's 1/1", or Saw in Half's "except their power is half that
       * creature's power …" — `{ half: { powerOf: 0 }, round: "up" }`, read
       * as the destroyed creature last existed (its ruling). Read signed: a
       * value that *sets* power or toughness may be negative (rule 107.1b). */
      readonly basePt?: readonly [EffectAmount, EffectAmount];
      /** The rest of a copy's exceptions — see {@link CopyExceptions}. */
      readonly exceptions?: CopyExceptions;
      /** A copy of **the card as it is now**, where the default copies a
       * permanent that has left as it last existed on the battlefield
       * (rule 608.2h): Myrkul, Lord of Bones's "a copy of that card", the
       * one it just exiled — "not of the creature as it last existed on the
       * battlefield" (its ruling). */
      readonly asCard?: boolean;
    }
  | {
      /** Attach an Aura or Equipment to a target permanent: the source (an
       * Equip ability), or with `attachment` another one — Hammer of
       * Nazahn's and Sigarda's Aid's "you may attach **that Equipment** to
       * target creature you control" is `attachment: "trigger-object"`, the
       * Equipment whose entering fired the trigger. Only the same object
       * that did (rule 400.7), and only onto something it could legally be
       * attached to (rule 301.5c); otherwise nothing moves.
       *
       * `target: "created"` is the token an earlier step of this resolution
       * created, rather than a target — living weapon's "create a 0/0 black
       * Phyrexian Germ creature token, then attach this to it" (rule
       * 702.92a), with `attachment: "source"`. With several made (Doubling
       * Season), it goes onto one of them (the rulings). */
      readonly kind: "attach";
      readonly target: number | "created";
      readonly attachment?: EffectTargetRef;
    }
  | {
      /** Transform `target` — turn a transforming double-faced permanent over
       * to its other face (rule 701.28 / 712.10 — ROADMAP Phase 10b). No-op
       * for a permanent that isn't a transforming DFC. `"source"` transforms
       * the ability's own permanent (a werewolf, "sacrifice …: transform ~"). */
      readonly kind: "transform";
      readonly target: EffectTargetRef;
    }
  | {
      /**
       * `target` becomes a copy of `of` until end of turn (rules 707.2,
       * 611.2a), with `exceptions` — Sarkhan, Soul Aflame's "you may have
       * Sarkhan become a copy of it until end of turn, except its name is
       * Sarkhan, Soul Aflame and it's legendary in addition to its other
       * types". It copies `of`'s copiable values as they are now — what
       * that is copying, if anything — or as it last existed if it has left
       * the battlefield (rule 608.2h); not its counters, tapped state or
       * other effects on it. `target` keeps its own status and counters
       * (rule 707.2). In the cleanup step (rule 514.2) it is what it was
       * before again — a copy of whatever it copied, if it was one.
       */
      readonly kind: "become-copy";
      readonly target: EffectTargetRef;
      readonly of: EffectTargetRef;
      readonly until: "end-of-turn";
      readonly exceptions?: CopyExceptions;
    }
  | {
      /** The game becomes day or night (rule 726 — ROADMAP Phase 10b). All
       * daybound/nightbound permanents transform to match. */
      readonly kind: "day-night";
      readonly value: "day" | "night";
    }
  | {
      /** A player becomes the monarch (rule 720 — ROADMAP Phase 10). `who`
       * defaults to the effect's controller. */
      readonly kind: "become-monarch";
      readonly who?: PlayerScope;
    }
  | {
      /**
       * A player gets `amount` counters of a kind (rule 122.1) — "you get an
       * experience counter" (Ezuri, Claw of Progress), "that player gets two
       * poison counters" (Fynn, the Fangbearer: `who: "trigger-player"`). To
       * the effect's controller by default, a `PlayerScope`, or the player in
       * target slot `target`. Ten poison counters lose the game (rule
       * 704.5c). Energy has its own `get-energy`.
       */
      readonly kind: "add-player-counters";
      readonly counter: PlayerCounterKind;
      readonly amount: EffectAmount;
      readonly who?: PlayerScope;
      readonly target?: number;
    }
  | {
      /** A player gets `amount` energy counters ({E} — rule 122 / ROADMAP
       * Phase 10). `who` defaults to the effect's controller. */
      readonly kind: "get-energy";
      readonly amount: number;
      readonly who?: PlayerScope;
    }
  | {
      /** The effect's controller gets an emblem (rule 114 — ROADMAP Phase 10).
       * `static` is a `"creatures-you-control"` anthem, folded in by the layer
       * system (the common planeswalker-ultimate emblem). */
      readonly kind: "create-emblem";
      readonly text: string;
      readonly static?: StaticAbility;
    }
  | {
      /** Prevent all combat damage that would be dealt this turn (Fog). A
       * rule-614 replacement, tracked as a turn-scoped `GameState` flag. */
      readonly kind: "prevent-all-combat-damage";
      /** Only the combat damage sources matching this would deal —
       * Arachnogenesis's "prevent all combat damage that would be dealt this
       * turn **by non-Spider creatures**" (`{ type: "creature", notSubtypes:
       * ["Spider"] }`). Asked of each source as its damage would be dealt —
       * prevention isn't locked in ahead of time (rule 615.1), so a creature
       * that becomes a Spider later in the turn isn't stopped — from the
       * effect's controller's side. A rule for the turn
       * (`GameState.combatDamagePreventedBy`). */
      readonly by?: CardFilter;
    }
  | {
      /** "Prevent the next `amount` damage that would be dealt to `target`
       * this turn" (Healing Salve — rule 614.9 / ROADMAP Phase 11 EG-6). A
       * one-shot prevention *shield* on `GameState.preventionShields`, consumed
       * in `dealDamage`. `combatOnly` narrows it to combat damage. */
      readonly kind: "prevent-damage";
      readonly target: number;
      readonly amount: EffectAmount;
      readonly combatOnly?: boolean;
    }
  | {
      /** A modal spell/ability (rule 700.2): as it resolves, its controller
       * chooses between `minModes` and `maxModes` of `modes` (usually 1 and 1
       * — "choose one"; 1 and 2 for "choose one or both") and the chosen
       * modes' effects apply in listed order. Raised as a `choose-modes`
       * decision. **Modes must be non-targeted** for now (targeted modal
       * spells need cast-time mode selection — see ROADMAP Phase 1c / 6).
       * A `sequence` step after it waits for the choice. */
      readonly kind: "modal";
      /**
       * A modal **ability** — a triggered ability printed "Choose one —" with
       * bullets (rule 700.2): its modes are chosen as it's put on the stack
       * (rules 603.3c, 700.2b), before its targets, not as it resolves; with
       * none chosen it's removed from the stack. Only as a triggered
       * ability's whole effect. Left off, the choice is made as the effect
       * applies, which is right for a choice the text makes on resolution
       * ("create a Food token or a Treasure token", fabricate, "tap or
       * untap").
       */
      readonly announced?: true;
      readonly minModes: number;
      /** At most this many; a live amount is read as the modes are chosen
       * (Riku of Many Paths' "choose up to X, where X is the number of times
       * you chose a mode for that spell" — its trigger value). */
      readonly maxModes: EffectAmount;
      readonly modes: readonly ModeOption[];
      /** "Choose one **that hasn't been chosen this turn**" (Galadriel,
       * Light of Valinor): only the modes this ability of this object hasn't
       * had chosen yet this turn are offered, and nothing happens once every
       * one has been. Counted per ability, like `resolved-this-turn`, so a
       * permanent that leaves and comes back starts again (rule 400.7). */
      readonly notChosenThisTurn?: boolean;
    }
  | {
      /** Apply `then` if `condition` holds at resolution, otherwise `else`
       * (rule 608.2 — an "if … then … otherwise …" clause). `condition` is
       * evaluated from the effect's source's controller's perspective, reusing
       * the static-ability {@link StaticCondition} union. needed-cards P5b —
       * Scute Swarm ("if you control six or more lands"). */
      readonly kind: "conditional";
      readonly condition: StaticCondition;
      readonly then: EffectSpec;
      readonly else?: EffectSpec;
    }
  | {
      /** "You may [effect]" (rule 601.3e / 608.2). Resolves via the same
       * `choose-modes` decision — one optional mode. Same non-targeted
       * restriction as `modal`. */
      readonly kind: "may";
      readonly effect: EffectSpec;
      /** The yes/no prompt, e.g. "Draw a card?". */
      readonly prompt: string;
      /** The question is about `"that-player"` — asked once per player
       * inside a `for-each-player` (myriad: "for each opponent other than
       * defending player, you may …"). The offer names them (`about`), since
       * the same prompt comes up once for each. */
      readonly aboutThatPlayer?: boolean;
      /**
       * An optional *cost* to say yes — "you may pay {B}. If you do, draw a
       * card" (Nihil Spellbomb, Dawn of Hope, Mentor of the Meek).
       *
       * The choice is only offered when the player could actually pay, so
       * declining for lack of mana and declining by choice both land on
       * `else`. Paid as the choice is answered, not when the effect resolves.
       */
      readonly cost?: string;
      /**
       * Life to pay as part of that cost (with `cost`, or on its own) —
       * Zoraline, Cosmos Caller's "you may pay {W}{B} and 2 life", Tymna the
       * Weaver's "you may pay X life". Read as the `may` applies. Payable only
       * with at least that much life (rule 119.4); paying 0 is always
       * possible. Paying it is losing life.
       */
      readonly costLife?: EffectAmount;
      /** Energy to pay as part of that cost — "you may pay {E}{E}". Read as
       * the `may` applies (so "an amount of {E} equal to its mana value" is an
       * amount); payable only with that much energy. */
      readonly costEnergy?: EffectAmount;
      /** "If you do, [effect]" (rule 608.2h) — applied only when `effect` was
       * actually chosen (Ob Nixilis, the Fallen: "you may have target player
       * lose 3 life. If you do, put three +1/+1 counters on Ob Nixilis.").
       * needed-cards P19. */
      readonly then?: EffectSpec;
      /** "If you don't, [effect]" — applied only when `effect` was declined
       * (Springheart Nantuko: "…if you do, create a token copy… If you
       * didn't create a token this way, create a 1/1 Insect instead."; The
       * Gitrog Monster's "sacrifice ~ unless you sacrifice a land" is the
       * same shape with `effect` framed as the *unless* clause). needed-cards
       * P19. */
      readonly else?: EffectSpec;
      /** "You may [effect]. **Do this only once each turn.**" (Pantlaza,
       * Sun-Favored): once this ability of this object has done it this
       * turn, it isn't offered again — `else`, if any, applies instead. A
       * turn when it was declined doesn't count, so a later resolution may
       * still do it. Counted per ability, as `modal`'s `notChosenThisTurn`
       * is: a `may` is a choice of one mode. */
      readonly oncePerTurn?: boolean;
    }
  | {
      /**
       * A "punisher" clause — *someone else* chooses whether to pay, and the
       * effect only happens if they don't. "…deals 5 damage to target
       * opponent **unless that player sacrifices a creature of their
       * choice**" (Demanding Dragon), "…**unless that creature's controller
       * pays {3}**" (Kazuul), "draw a card **unless target opponent
       * sacrifices a creature or pays 3 life**" (Indulgent Tormentor).
       *
       * The decision belongs to `chooser`, not to the effect's controller —
       * which is what makes this its own shape rather than a `may`. Options
       * the chooser can't take aren't offered, so "couldn't" and "wouldn't"
       * both land on `otherwise`.
       */
      readonly kind: "unless";
      /** Who decides: a target-slot index holding a player — or an object,
       * whose controller decides (Spell Pierce's "counter target noncreature
       * spell unless **its controller** pays {2}") — the controller
       * of the permanent whose event fired this trigger (Kazuul's attacker),
       * the player the triggering event names, the effect's own controller
       * (The Gitrog Monster's "sacrifice ~ unless **you** sacrifice a land"),
       * or the player whose turn it is. */
      readonly chooser: number | "trigger-controller" | "trigger-player" | "you" | "active-player";
      /** What they may do to avoid `otherwise`. At most one mana option, since
       * the mana cost rides on the decision itself. */
      readonly options: readonly UnlessOption[];
      /** What happens if they take none of the options. */
      readonly otherwise: EffectSpec;
    }
  | {
      /**
       * "Each player may …", "each opponent may …", "its controller may …",
       * "the player whose turn it is may …" — a choice that belongs to
       * players other than the effect's controller, or to several of them.
       * Each player in `who` is asked in turn, from the active player (rule
       * 101.4), with a `choose-modes` decision of their own — each question
       * waits for the answer before it, and what one player does is done
       * before the next is asked. What they may do is `effect` (asked with
       * `prompt`: Kwain, Itinerant Meddler's "each player may draw a card",
       * Wernog's "each opponent may investigate") or one of `options`, each
       * offered only to a player who can take it (Kynaios and Tiro's "put a
       * land card from their hand onto the battlefield"; "sacrifice a
       * nonland permanent or discard a card"). Either way it is **that
       * player's** effect: "you" in it is them.
       *
       * Once everyone has answered, `ifDid` / `ifDidnt` apply once for each
       * player who did / didn't, in turn order, as the **effect's
       * controller's** effect, with the `"that-player"` scope naming the
       * player it's about: Kwain's "each player who drew a card this way
       * gains 1 life" (`ifDid: { kind: "gain-life", amount: 1, who:
       * "that-player" }`), Wernog's "each opponent who doesn't loses 1 life.
       * You investigate for each opponent who investigated this way"
       * (`ifDidnt` a `lose-life` of `"that-player"`, `ifDid` an investigate),
       * a punisher asked of each opponent ("each opponent loses 3 life
       * unless that player sacrifices a nonland permanent or discards a
       * card" — `options`, and the life in `ifDidnt`). `resultsFor` narrows
       * the follow-ups to players in a scope: Kynaios and Tiro's "then each
       * **opponent** who didn't draws a card" is `who: "each-player"`,
       * `resultsFor: "each-opponent"`. A player never asked (nothing they
       * could take) didn't.
       */
      readonly kind: "each-player-may";
      /** A scope, or `{ controllerOfTarget }` — "**that permanent's
       * controller** may sacrifice a land" (Chain of Vapor): whoever
       * controls what the target slot points at, as it last existed if it
       * has left (rule 608.2h). */
      readonly who: PlayerScope | { readonly controllerOfTarget: number };
      readonly prompt?: string;
      readonly effect?: EffectSpec;
      readonly options?: readonly BoundUnlessOption[];
      /**
       * Instead of a "may": a choice each of them **must** make between
       * these — "each opponent faces a villainous choice — [one], or
       * [other]" (rule 701.56). Unlike `effect` and `options`, the chosen one
       * is the **effect's controller's** effect, with `"that-player"` naming
       * the player who chose ("you draw a card" is the villain's; "that
       * player discards a card" the chooser's). `ifDid` / `ifDidnt` don't
       * apply — everyone chooses.
       */
      readonly choices?: readonly ModeOption[];
      /** Ask them in turn order **starting with the effect's controller**
       * rather than the active player — a vote's "starting with you, each
       * player votes for wild or free" (rule 701.38a; Selvala's Stampede),
       * a `choices` each of them must make, read back with the `{ votesFor }`
       * amount. */
      readonly startingWithYou?: boolean;
      readonly ifDid?: EffectSpec;
      readonly ifDidnt?: EffectSpec;
      readonly resultsFor?: PlayerScope;
      /** Set by the engine on the copy it parks between questions. */
      readonly progress?: EachPlayerMayProgress;
    }
  | {
      /**
       * Ward's own effect (rule 702.21a): "counter that spell or ability
       * unless that player pays [cost]". Only meaningful as the effect of a
       * `becomes-target` trigger (the `ward` card helper builds the whole
       * ability), which records the spell or ability that did the targeting
       * and who controls it (`GameObject.targetedBy`). That player chooses
       * whether to pay, as a `choose-modes` decision; declining, or being
       * unable to pay, counters it. A spell that can't be countered resolves
       * anyway. Does nothing once that spell or ability has left the stack.
       */
      readonly kind: "ward";
      readonly cost: WardCost;
    }
  | {
      /**
       * "That player chooses up to `keep` creatures they control, then
       * sacrifices the rest" (Archfiend of Depravity) — the inverse of
       * `sacrifice`, which names how many to *give up* rather than how many
       * to keep.
       *
       * The choice belongs to each affected player, and is raised only when
       * they control more than `keep` matching permanents.
       */
      readonly kind: "sacrifice-all-but";
      readonly who: PlayerScope;
      readonly keep: number;
      readonly filter: CardFilter;
    }
  | {
      /**
       * Encore (rule 702.141) — "For each opponent, create a token copy of
       * this card that attacks that opponent this turn if able. They gain
       * haste. Sacrifice them at the beginning of the next end step."
       *
       * One effect because the per-opponent loop, the attack requirement
       * aimed at *that* opponent, and the end-step sacrifice are one
       * instruction — and the copies are of a card in exile (the Encore cost
       * exiled it), which nothing else does.
       */
      readonly kind: "encore";
    }
  | {
      /**
       * Goad (rule 701.15): until the goader's — this effect's controller's —
       * next turn, each creature goaded "attacks each combat if able and
       * attacks a player other than [the goader] if able". Which creatures,
       * exactly one of:
       * - `target` — a slot holding a **creature** ("goad target creature",
       *   Killian, Decisive Mentor's "tap up to one target creature and goad
       *   it"), or a **player**, whose every creature is goaded ("goad each
       *   creature target player controls" — Geode Rager). An empty optional
       *   slot goads nothing.
       * - `who` — every creature each player in a scope controls (Marisi,
       *   Breaker of the Coil's `"trigger-player"`).
       * - `filter` — every creature matching it, from the controller's side,
       *   whoever controls it (Nelly Borca's "goad all suspected creatures";
       *   "goad all creatures your opponents control" is `controlledBy:
       *   "opponent"`).
       *
       * `forGame` is "**it's goaded for the rest of the game**" (Jon Irenicus):
       * a goad that never lapses. Goading a creature it has already goaded
       * adds nothing (701.15d), though a goad for the rest of the game still
       * outlasts one that was until their next turn.
       */
      readonly kind: "goad";
      readonly target?: number;
      readonly who?: PlayerScope;
      readonly filter?: CardFilter;
      readonly forGame?: boolean;
    }
  | {
      /**
       * Suspect a creature (rule 701.60): it becomes **suspected**, and has
       * menace and "This creature can't block" for as long as it is (701.60c)
       * — until it leaves the battlefield or is no longer suspected. One
       * already suspected can't become suspected again, so nothing changes
       * (701.60d). `target` is a slot ("suspect target creature" — Nelly
       * Borca, Impulsive Accuser), `"source"` ("suspect it" on an enters
       * trigger) or `"trigger-object"`.
       */
      readonly kind: "suspect";
      readonly target: EffectTargetRef;
    }
  | {
      /**
       * A permanent is **no longer suspected** (rule 701.60a — Airtight
       * Alibi's "if it's suspected, it's no longer suspected"): `target` (a
       * slot, `"source"` or `"trigger-object"`), or every permanent matching
       * `filter` from the controller's side (Absolving Lammasu's "all
       * suspected creatures are no longer suspected"). Exactly one of the two.
       */
      readonly kind: "unsuspect";
      readonly target?: EffectTargetRef;
      readonly filter?: CardFilter;
    }
  | {
      /**
       * "Until your next turn, creatures your opponents control attack each
       * combat if able **and attack a player other than you if able**"
       * (Kardur, Doomscourge): goad's requirements imposed as a rule of the
       * game rather than goading anything. So it binds every creature
       * matching `filter` (from the controller's side) until the controller's
       * next turn — including one that comes under an opponent's control
       * after this resolved (rule 611.2c) — and none of them is *goaded*: a
       * `goaded` filter doesn't see them. `otherThanYou: false` is the bare
       * "attack each combat if able". See `AttackRequirementRule`.
       */
      readonly kind: "attack-requirement";
      readonly filter: CardFilter;
      readonly otherThanYou: boolean;
    }
  | {
      /**
       * "Impulse draw" — exile the top `amount` cards of your library face-up
       * and let yourself play them (Dream Pillager, Tectonic Giant, Theater
       * of Horrors).
       *
       * `duration: "end-of-turn"` is the common shape; `"while-source"` keeps
       * the permission for as long as the permanent that exiled them is on
       * the battlefield. `castOnly` is "you may **cast spells** from among
       * them" (no lands) rather than "you may **play** them".
       */
      readonly kind: "impulse-exile";
      readonly amount: EffectAmount;
      /** `"while-exiled"` is "for as long as it remains exiled";
       * `"your-next-end-step"` is "until your next end step" (Rocco, Street
       * Chef), ending as the controller's next end step begins. */
      readonly duration: "end-of-turn" | "your-next-turn" | "your-next-end-step" | "while-source" | "while-exiled";
      /** Whose libraries: the controller's (the default), or each player's in
       * a scope, the top `amount` of each exiled at once — "each player
       * exiles the top card of their library" (Rocco) — or a target slot
       * holding a player (Maralen, Fae Ascendant's "target opponent's
       * library"). The permission is the controller's unless `playedBy`
       * says otherwise, whoever owns the cards: a spell cast from them is
       * its caster's, and so is the permanent it becomes (rule 601.2a,
       * 608.3a). */
      readonly whose?: number | PlayerScope;
      /** Only those of `whose`'s players this holds for, each asked about
       * as `"that-player"` as the effect applies — Ixhel, Scion of Atraxa's
       * "each opponent **who has three or more poison counters** exiles the
       * top card of their library face down" (`{ kind: "player-counters",
       * counter: "poison", who: "that-player", atLeast: 3 }`). The rest
       * exile nothing; those it holds for still exile at once. */
      readonly whoseIf?: StaticCondition;
      /** "Each player may play the card they exiled this way": the
       * permission goes to each card's owner, not to the controller. */
      readonly playedBy?: "owner";
      readonly castOnly?: boolean;
      /** Which of the exiled cards may be played — Narset, Enlightened
       * Master's "noncreature, nonland cards exiled with Narset". */
      readonly filter?: CardFilter;
      /** "…without paying their mana costs": for every card the permission
       * covers, or those matching `filter` (Nahiri, Forged in Fury's
       * Equipment spells); `only` when paying isn't allowed at all (Narset's
       * "you may cast … without paying their mana costs"). */
      readonly free?: { readonly filter?: CardFilter; readonly only?: boolean };
      /** Grant the permission to only this many of the exiled cards, chosen
       * by the controller — Tectonic Giant's "exile the top two cards of your
       * library. **Choose one of them.**" The rest stay exiled with no
       * permission. Omit to grant it to all of them. */
      readonly choose?: number;
      /** Gates on *using* the permission (Theater of Horrors), as opposed to
       * `duration`, which is when it lapses for good. */
      readonly yourTurnOnly?: boolean;
      readonly gate?: StaticCondition;
      /** "From among cards exiled with [this permanent]" as a static ability
       * of it: usable only while this source stays on the battlefield as the
       * same object, on top of `duration` (Maralen, Fae Ascendant). With it,
       * a `filter`'s `{ amount }` operand is counted live from the source's
       * side — "mana value less than or equal to the number of Elves and
       * Faeries you control". */
      readonly whileSource?: boolean;
      /** "Once each turn, you may cast a spell … from among" them: one cast
       * a turn across every card this source exiled with the permission. */
      readonly oncePerTurn?: boolean;
      /** "Look at the top card of that player's library, then exile it
       * **face down**" (Edward Kenway): the cards are exiled face down
       * (rule 406.3), and only the controller may look at them. */
      readonly faceDown?: boolean;
      /** "…and mana of any type can be spent to cast that spell" (Gonti,
       * Canny Acquisitor: `"any-type"`) / "…you may spend mana as though it
       * were mana of any color to cast that spell" (Grenzo, Havoc Raiser:
       * `"any-color"`) — only for a spell cast under this permission (rule
       * 118.14). */
      readonly spendAs?: SpendAs;
    }
  | {
      /** Scry `amount` (rule 701.18) — look at the top N, put any number on
       * the bottom, keep the rest on top. `then` (Preordain: draw a card) is
       * applied after. */
      readonly kind: "scry";
      /** How many; a live amount is read as the effect applies (The Scarab
       * God's "you scry X, where X is the number of Zombies you control"). */
      readonly amount: EffectAmount;
      readonly then?: EffectSpec;
    }
  | {
      /**
       * Reveal the top card of your library to every player (rule 701.16),
       * then apply `then` with **that card as target 0** — the same way
       * `look-and-choose`'s `then` sees the cards it chose. Thrasios, Triton
       * Hero: "reveal the top card of your library. If it's a land card, put
       * it onto the battlefield tapped. Otherwise, draw a card" is a
       * `conditional` on `{ kind: "target", index: 0, filter: { type: "land" } }`
       * inside `then`.
       *
       * The card stays where it is; only `then` moves it. With an empty
       * library nothing is revealed and `then` runs with no target, so a
       * target condition reads false and an "otherwise, draw" draws (and
       * fails) as the card says.
       *
       * `of: { ownerOfTarget }` reveals the top of **another** library: that
       * of the owner of the object in a target slot (Chaos Warp's "the owner
       * of target permanent … reveals the top card of their library"). The
       * owner never changes (rules 108.3, 111.2), so it is still known once the
       * object has moved or a token has ceased to exist. That player is the
       * one who reveals, and a `put-onto-battlefield` in `then` puts the
       * card onto the battlefield under its owner's control — them.
       */
      readonly kind: "reveal-top";
      readonly then: EffectSpec;
      readonly of?: { readonly ownerOfTarget: number };
    }
  | {
      /**
       * "The owner of target permanent **shuffles it into their library**"
       * (Chaos Warp): the permanent is put into its owner's library and that
       * library is shuffled (rule 701.24a). A token goes too and ceases to
       * exist there (rule 111.7), and the library is still shuffled (Chaos
       * Warp's ruling); so is it when a replacement sends the permanent
       * somewhere else (a commander to the command zone, rule 903.9b). Does
       * nothing to an object that isn't on the battlefield any more.
       */
      readonly kind: "shuffle-into-library";
      readonly target: EffectTargetRef;
    }
  | {
      /** Surveil `amount` (rule 701.43) — look at the top N, put any number
       * into the graveyard, keep the rest on top. `then` applied after. */
      readonly kind: "surveil";
      /** How many; a live amount is read as the effect applies. */
      readonly amount: EffectAmount;
      readonly then?: EffectSpec;
    }
  | {
      /** Search the controller's library for up to `max` (at least `min`,
       * usually 0 — you may fail to find) cards matching `filter`, move them
       * to `destination`, then shuffle. Raised as a `choose-from-zone`
       * decision listing only the matching cards. */
      readonly kind: "search-library";
      readonly filter: CardFilter;
      /** `"library-top"` is the tutor-to-top family (Vampiric Tutor, Mystical
       * Tutor): the find never leaves the library, it is just moved to the top
       * *after* the shuffle the search itself causes (rule 701.19j — the
       * shuffle comes first, or the card wouldn't stay on top). */
      readonly destination: "hand" | "battlefield" | "library-top" | "graveyard";
      readonly min: number;
      /** An `EffectAmount` so a tutor can find "up to X" where X is a live
       * count — Harvest Season's "up to X basic land cards, where X is the
       * number of tapped creatures you control". */
      readonly max: EffectAmount;
      /** Put battlefield-bound cards in tapped (Rampant Growth). */
      readonly enterTapped?: boolean;
      /** "…, **reveal it**, …" (Enlightened Tutor, Kodama's Reach): show the
       * find to every player (rule 701.16). Off by default — a plain "search
       * your library for a card" (Vampiric Tutor) reveals nothing. */
      readonly reveal?: boolean;
      /** Where chosen cards after the first go, for a tutor that splits its
       * finds (Cultivate: "put one onto the battlefield tapped and the other
       * into your hand"). Omit when every find goes to `destination`. */
      readonly restDestination?: "hand" | "battlefield";
      /**
       * Whose library is searched — the effect's controller by default, or
       * the controller of a target slot (Path to Exile: "**its controller**
       * may search their library for a basic land card"). The search is
       * always optional for someone else, which `min: 0` already expresses.
       */
      readonly who?: { readonly controllerOfTarget: number };
      /**
       * Which zones are searched: the library (the default), the graveyard,
       * or both — "search your library **and/or graveyard**" (Finale of
       * Devastation) is a resolution-time `modal` over the three, so the
       * player says which. Only a search that includes the library shuffles
       * it ("if you search your library this way, shuffle"). A graveyard is
       * public, so a matching card there can't be missed: failing to find is
       * allowed only in a hidden zone (rule 701.19b).
       */
      readonly zones?: SearchZones;
      /** A rule over the finds as a set, which `filter` (one card at a
       * time) can't express — Myriad Landscape's "that share a land type",
       * Krosan Verge's "a Forest card and a Plains card". The search offers
       * every card `filter` admits and accepts only a set that obeys this. */
      readonly together?: SearchTogether;
    }
  | {
      /** Reveal `count` cards from the top of the controller's library (or
       * their whole graveyard — already public, so `count` is ignored) and
       * await a bounded choice of which to move to `destination`. The spell
       * or ability itself still resolves and leaves the stack immediately,
       * same as any other effect — this just leaves the game waiting on the
       * controller's own `choose-from-zone` action before granting anyone
       * priority again. */
      readonly kind: "look-and-choose";
      /** Whose zone, who looks and who chooses: `"that-player"` is the
       * player a `for-each-player` is about — "each player looks at the top
       * five cards of **their** library and may reveal …" (Explore the
       * Vastlands); the cards they take are theirs. Default: the effect's
       * controller. */
      readonly player?: "that-player";
      /** Someone else makes the choice from that zone: `"that-player"` is
       * the opponent a `choose-opponent` chose — Tasigur, the Golden Fang's
       * "return a nonland card **of an opponent's choice** from your
       * graveyard to your hand". A public zone only (a graveyard). */
      readonly chooser?: "that-player";
      /** `"hand"` is the "you may put a land card **from your hand** onto the
       * battlefield" family (Growth Spiral, Ghalta) — nothing is revealed
       * there, the chooser is looking at their own hand, and `leftover` is
       * always `"stay"` because the cards not chosen simply stay in it.
       * `"graveyards"` is every player's graveyard (all public), in turn
       * order: a card from another player's that goes to the battlefield goes
       * under the chooser's control — Necromantic Selection's "return a
       * creature card put into a graveyard this way to the battlefield under
       * your control". `"command"` is the chooser's own commanders in the
       * command zone — Command Beacon's "put your commander into your hand
       * from the command zone" (one of their choice with two — its ruling),
       * Hellkite Courser's "you may put a commander you own from the command
       * zone onto the battlefield".
       *
       * `"targets"` is the resolving spell's or ability's own target cards
       * still legal (a graveyard's, all public): which of them the effect
       * does it to is chosen as it resolves, and they all go at once —
       * Sepulchral Primordial's "for each opponent, you may put up to one
       * target creature card from that player's graveyard onto the
       * battlefield under your control" (they enter simultaneously, its
       * ruling). Ones from another player's graveyard enter under the
       * chooser's control, as `"graveyards"`' do. */
      readonly zone: "library" | "graveyard" | "hand" | "graveyards" | "command" | "targets";
      /** How deep into a library to look. An amount, so it can be read at
       * resolution: Gishath, Sun's Avatar's "reveal **that many** cards" is
       * `{ triggerValue: true }`, the combat damage it dealt. */
      readonly count?: EffectAmount;
      /** The looked-at library cards are **revealed** to every player (rule
       * 701.16), not just seen by the chooser: Gishath's "reveal that many
       * cards". `"chosen"` reveals only the cards taken, as they're taken —
       * "look at the top five cards … You may **reveal** a historic card from
       * among them and put it into your hand" (Monumental Henge, Adaptive
       * Omnitool): the rest are seen by the chooser alone. */
      readonly reveal?: boolean | "chosen";
      /** At least this many; a live amount is read as the effect applies —
       * Teferi's Puzzle Box's "puts **the cards in their hand**" is every
       * one, `{ cardsInHand: "that-player" }`. */
      readonly min: EffectAmount;
      /** At most this many; a live amount is read as the effect applies. */
      readonly max: EffectAmount;
      /** `"library-top"` with `zone: "hand"` is Brainstorm's "put two cards
       * from your hand on top of your library" — the chosen cards go back on
       * the deck rather than anywhere visible. Either way the chosen cards
       * go on top in the order they're picked, the first on top: Ponder's
       * "put them back in any order" is every looked-at card taken.
       *
       * `"library-bottom"` puts the chosen cards on the bottom, in the order
       * picked — the first highest, the last on the very bottom: Valakut
       * Awakening's "put any number of cards from your hand on the bottom of
       * your library" (rule 401.4: the owner arranges cards put into a
       * library together, and doesn't reveal the order). Moved from a hand,
       * they're `"put-on-bottom"` this way.
       *
       * `"exile-face-down"` is hideaway's "exile one of them face down"
       * (rule 702.75a): the chosen cards are exiled face down (rule 406.3),
       * linked to this effect's source as "the exiled card" of its other
       * abilities (rule 607.2a — `GameObject.exiledWith`), and only the
       * chooser — and whoever controls that source — may look at them.
       *
       * `"exile"` is the same link, face up — imprint's "you may exile a
       * nonartifact, nonland card from your hand" (Chrome Mox), whose "the
       * exiled card" is every player's to see. */
      readonly destination: "battlefield" | "hand" | "library-top" | "library-bottom" | "exile-face-down" | "exile";
      /** Chosen cards bound for the battlefield enter **tapped** (Terrain
       * Generator). */
      readonly enterTapped?: boolean;
      /** …and with these types and colours in addition to their own, in
       * place as they enter (as `put-onto-battlefield`'s are — rule 614.12):
       * Necromantic Selection's "It's a black Zombie in addition to its other
       * colors and types". */
      readonly enterAs?: EnterTypes;
      /** …and **attacking** (rule 508.4) — Kaalia of the Vast's "onto the
       * battlefield tapped and attacking that opponent", Winota's. See
       * {@link EnterAttacking}. */
      readonly attacking?: EnterAttacking;
      /** `"hand"` (needed-cards P19 — Genesis Ultimatum: "…and the rest into
       * your hand") puts every non-chosen looked-at card into the chooser's
       * hand, regardless of `filter`; `"graveyard"` ("…put the rest into your
       * graveyard") into their graveyard, in the same move as the chosen
       * ones.
       *
       * `"bottom-any-order"` is "…and the rest on the bottom of your library
       * **in any order**" (Stock Up, Dig Through Time): once the chosen cards
       * have moved, the chooser orders the rest — a second `choose-from-zone`
       * over every one of them, whose picks are the order (see
       * `"library-bottom"` above), asked only when there are two or more
       * cards that aren't all the same card. `"bottom-random"` is "in a
       * random order". */
      readonly leftover: "bottom-random" | "bottom-any-order" | "stay" | "hand" | "graveyard" | "exile-playable";
      /**
       * A leftover destination that depends on how things stand once the
       * chosen cards are where they're going — Nine-Fingers Keene's "you may
       * put a Gate card from among them onto the battlefield. Then if you
       * control nine or more Gates, put the rest into your graveyard.
       * Otherwise, put the rest on the bottom of your library in a random
       * order": when `condition` holds, asked after the chosen cards have
       * moved (a Gate just put onto the battlefield counts), the rest go to
       * `leftover` here; otherwise to the effect's own `leftover`.
       */
      readonly leftoverIf?: LookAndChooseLeftoverIf;
      /**
       * A second choice over the looked-at cards the first left, before
       * `leftover` takes the rest — Choco, Seeker of Paradise's "You may put
       * one of them into your hand. **Then put any number of land cards from
       * among them onto the battlefield tapped** and the rest into your
       * graveyard." The first choice's cards move first; the second's move
       * together with the rest, as one instruction says.
       */
      readonly secondPick?: {
        readonly filter?: ZoneChoiceFilter;
        readonly min: number;
        readonly max: EffectAmount;
        readonly destination: "battlefield" | "hand" | "graveyard" | "library-bottom";
        readonly enterTapped?: boolean;
        /** Only when the first choice took nothing — Planar Genesis's "You
         * may put a land card from among them onto the battlefield tapped.
         * **If you don't**, put a card from among them into your hand." */
        readonly ifNoneChosen?: boolean;
      };
      /** Narrows which revealed candidates can be chosen (e.g. Ureni of the
       * Unwritten: only a Dragon card). Everything is still revealed either
       * way — omit for "any of them". */
      readonly filter?: ZoneChoiceFilter;
      /**
       * Applied once the choice is made, with the **chosen cards** as its
       * targets — `target: 0` is the first one taken. Sneak Attack's "that
       * creature gains haste. Sacrifice it at the beginning of the next end
       * step" is the shape: the card put onto the battlefield isn't a target
       * of the spell, so nothing downstream could otherwise refer to it.
       *
       * Skipped entirely when nothing was chosen.
       */
      readonly then?: EffectSpec;
    };

/** The types a `put-onto-battlefield` says the permanent has, in place as it
 * enters (rule 614.12): its card types instead of its own (`setTypes` — the
 * Enduring cycle), and subtypes in addition to its own (`addSubtypes` —
 * Portal to Phyrexia's Phyrexian). */
export interface EnterTypes {
  readonly setTypes?: readonly CardType[];
  readonly addSubtypes?: readonly string[];
  /** Colours in addition to its own (Necromantic Selection's "It's a black
   * Zombie in addition to its other colors and types" — a colourless card
   * is then simply black, its ruling). */
  readonly addColors?: readonly Color[];
}

/**
 * What a copy effect makes different about its copy — "except it's a 3/3
 * black Zombie creature in addition to its other types" (Anikthea, Hand of
 * Erebos), "except its name is Mishra's Warform" (Mishra, Eminent One).
 * Exceptions are part of the copy's copiable values (rule 707.9b): every
 * other effect applies over them, and anything that copies the copy copies
 * them too. `setColors` replaces its colours ("it's black"); `addColors`,
 * `addTypes` and `addSubtypes` are "in addition to its other …";
 * `keywords` are abilities it has ("and it has flying and haste").
 */
export interface CopyExceptions {
  readonly name?: string;
  /** "It's an enchantment and loses all other card types" (Myrkul). */
  readonly setTypes?: readonly CardType[];
  /** Subtypes it has instead of its own — Shelob, Child of Ungoliant's "a
   * Food artifact … and it loses all other card types" loses every other
   * subtype too (its ruling). */
  readonly setSubtypes?: readonly string[];
  readonly addTypes?: readonly CardType[];
  readonly addSubtypes?: readonly string[];
  readonly setColors?: readonly Color[];
  readonly addColors?: readonly Color[];
  readonly basePt?: readonly [number, number];
  /** "…with no mana cost" (eternalize, embalm): its mana value is 0. */
  readonly noManaCost?: boolean;
  readonly keywords?: readonly Keyword[];
  /** Activated abilities it has — "and it has '{2}, {T}, Sacrifice this
   * token: You gain 3 life.'" (Brenard, Ginger Sculptor). */
  readonly activated?: readonly ActivatedAbility[];
  /** Triggered abilities it has — Phantasmal Image's "and it has 'When this
   * creature becomes the target of a spell or ability, sacrifice it.'" (rule
   * 707.9a: a copiable value, so a copy of the copy has it too). */
  readonly triggered?: readonly TriggeredAbility[];
  /** "…and it isn't legendary" (Spark Double, Auton Soldier) — copiable, so
   * a later copy of it isn't either (Spark Double's ruling). Read through
   * `supertypesOf`. */
  readonly notLegendary?: true;
  /** Supertypes it has in addition to its own — Sakashima the Impostor's
   * "it's legendary in addition to its other types". */
  readonly addSupertypes?: readonly Supertype[];
  /** "The 'legend rule' doesn't apply to [these permanents]" as an ability
   * it has — Sakashima of a Thousand Faces' "except it has Sakashima's other
   * abilities", which are that static and partner (a deck-construction
   * ability that does nothing once the game has begun — rule 702.124a). The
   * scope is read from the copy's own side, as the static's `affects` is
   * (see `StaticAbility.legendRuleOff`). */
  readonly legendRuleOff?: AffectSpec;
}

/** See the `look-and-choose` effect's `leftoverIf`. */
export interface LookAndChooseLeftoverIf {
  readonly condition: StaticCondition;
  readonly leftover: "bottom-random" | "hand" | "graveyard";
}

/** The `look-and-choose` effect's `secondPick`, its `max` read as the
 * effect applies. */
export interface ZoneSecondPick {
  readonly filter?: ZoneChoiceFilter;
  readonly min: number;
  readonly max: number;
  /** `"library-bottom"`: Expressive Iteration's "put one of them on the
   * bottom of your library". */
  readonly destination: "battlefield" | "hand" | "graveyard" | "library-bottom";
  readonly enterTapped?: boolean;
  readonly ifNoneChosen?: boolean;
}

/** One selectable mode of a `modal` effect (rule 700.2) or a `castModal` card
 * (ROADMAP Phase 11 EG-2). */
export interface ModeOption {
  /** Rules text of this mode, shown in the chooser. */
  readonly text: string;
  readonly effect: EffectSpec;
  /** Target specs this mode needs — a `castModal` spell's (ROADMAP Phase 11
   * EG-2), or an `announced` modal triggered ability's, whose chosen modes
   * bring their targets as it goes on the stack (rules 603.3c, 700.2). The
   * mode's `effect` reads them as slots `0..n-1` of the resolution context's
   * targets. Omitted / empty for a non-targeted mode. A resolution-time
   * `modal` / `may` effect (not announced) requires *non*-targeted modes and
   * ignores this. */
  readonly targets?: readonly TargetSpec[];
  /**
   * Spree (rule 702.172a): this mode's own additional cost — "+ {1} —" —
   * paid as the spell is cast if the mode is chosen, on top of whatever else
   * is paid, an alternative cost or a free cast included (rule 118.9d; the
   * rulings). Only on a `castModal` card, whose every mode has one, with
   * `minModes: 1` and `maxModes` all of them. Its mana value is still its
   * mana cost's alone.
   */
  readonly spreeCost?: string;
}

/** Primitive mutations an effect can perform. Implemented by the engine. */
export interface EffectApi {
  /** `from`: the triggering object, or a target, deals it, not the effect's
   * source — see {@link DamageFrom}. */
  dealDamage(target: TargetRef, amount: number, from?: DamageFrom): void;
  /** Deal damage to a whole scope of players, untargeted (Sabotender /
   * Tannuk: "deals 1 damage to each opponent" — needed-cards P16), all at
   * once. `amountFor` is asked per player, for a per-player amount. */
  /** Deal `amount` to each of `targets`, as one event. */
  dealDamageToEach(targets: readonly TargetRef[], amount: number): void;
  dealDamageScoped(
    who: PlayerScope,
    amountFor: (player: PlayerId) => number,
    from?: DamageFrom,
  ): void;
  /** What the triggering event was aimed at, if it still is what it was —
   * see `LastKnownRefs.recipient`. `undefined` outside such a trigger, for a
   * permanent that has left the battlefield since, or a player who has lost. */
  triggerRecipient(): TargetRef | undefined;
  draw(player: PlayerId, count: number): void;
  /** The mana value of the card behind `target`, from its printed cost — see
   * the `{ manaValueOf }` {@link EffectAmount}. `0` for a player target or an
   * object that no longer exists. */
  manaValueOf(target: TargetRef): number;
  /** See the `{ manaSpentOf }` {@link EffectAmount}. */
  manaSpentOf(target: TargetRef): number;
  /** See the `{ colorsSpentOf }` {@link EffectAmount}. */
  colorsSpentOf(target: TargetRef): number;
  /** See the `{ commanderCastsOf }` {@link EffectAmount}. */
  commanderCastsOf(target: TargetRef): number;
  /** See the `{ commanderCasts }` {@link EffectAmount}: `player`'s casts of
   * their commanders from the command zone this game, added up. */
  commanderCastsBy(player: PlayerId): number;
  /** A player's current life total — see the `{ lifeTotal }` {@link EffectAmount}. */
  lifeTotalOf(player: PlayerId): number;
  /** One player's running total for `stat` this turn — see the `turnStat`
   * {@link EffectAmount}. */
  turnStatOf(player: PlayerId, stat: TurnStat): number;
  /** How many of the spells `player` cast this turn match `filter`, as
   * they were cast — or the greatest mana value among them. See the
   * `castThisTurn` {@link EffectAmount}. */
  castThisTurnOf(player: PlayerId, filter: CardFilter, greatest?: "mana-value"): number;
  /** See the `{ countInGraveyard }` {@link EffectAmount}. */
  countInGraveyard(filter: CardFilter): number;
  /** How many cards are in `player`'s hand — see `{ cardsInHand }`. */
  handSizeOf(player: PlayerId): number;
  /** How many cards are in `player`'s library. */
  librarySizeOf(player: PlayerId): number;
  /** How many cards are in `player`'s graveyard — see `{ graveyardSize }`. */
  graveyardSizeOf(player: PlayerId): number;
  /** See the `"double-counters"` {@link EffectSpec}. */
  doubleCounters(target: TargetRef, counter?: string): void;
  /** The colours of what `target` points at, as it last existed on the
   * battlefield if it has left — see `{ colorsOf }`. */
  colorsOf(target: TargetRef): readonly Color[];
  /** See the `{ colorsAmong }` {@link EffectAmount}. */
  colorsAmong(filter: CardFilter, except: readonly ObjectId[]): number;
  /** See the `{ distinctTokenNames }` {@link EffectAmount}. */
  distinctTokenNames(filter: CardFilter): number;
  /** See the `{ votesFor }` {@link EffectAmount}. */
  votesFor(option: number): number;
  /** Reveal from the top of `owner`'s library until `count` cards matching
   * `filter` are revealed — see `"reveal-until-count"`. */
  revealUntilCount(
    owner: PlayerId,
    filter: CardFilter,
    count: number,
  ): { readonly revealed: readonly ObjectId[]; readonly found: readonly ObjectId[] };
  /** Put these cards onto the battlefield together, each under its owner's
   * control. `true` when it stopped first to ask an "as this enters"
   * choice (nothing has moved; do it again once that's answered). */
  putOntoBattlefieldTogether(cards: readonly ObjectId[]): boolean;
  /** The permanents matching `filter` (from the effect's controller's
   * side), each with how many tokens it stands for — a token stack is one
   * object for every token in it. */
  permanentsMatching(filter: CardFilter): readonly { readonly object: ObjectId; readonly count: number }[];
  /** See the `{ cardTypesInGraveyard }` {@link EffectAmount}. */
  cardTypesInGraveyard(filter: CardFilter): number;
  /** What this resolution has done `what` to so far, whose it was among
   * `players` (everyone's when absent) and matching `filter` — see the
   * `thisWay` {@link EffectAmount}. */
  thisWay(
    what: ThisWayKind,
    players?: readonly PlayerId[],
    filter?: CardFilter,
    /** From this event on instead of the resolution's start (a connive's
     * own discards). */
    since?: number,
  ): readonly ThisWayEntry[];
  /** How much life `players` (everyone when absent) have lost so far in
   * this resolution — see the `lifeLostThisWay` {@link EffectAmount}. */
  lifeLostThisWay(players?: readonly PlayerId[]): number;
  /** See the `{ opponentsAttacked }` {@link EffectAmount}. */
  opponentsAttacked(): number;
  /** See the `{ attackingPlayer }` {@link EffectAmount}: creatures
   * attacking `player` (not their planeswalkers), a stack as its tokens. */
  creaturesAttacking(player: PlayerId): number;
  /** See the `{ damageDealtThisTurn }` {@link EffectAmount}. */
  damageDealtThisTurn(players: readonly PlayerId[], combat?: boolean, colors?: readonly Color[]): number;
  /** See the `{ turnHistory }` {@link EffectAmount}. */
  turnHistoryCount(what: TurnHistoryKind, players: readonly PlayerId[], filter?: CardFilter): number;
  /** How many card types there are among `objects`, each once — as they
   * last existed on the battlefield if `departed` (a sacrificed or
   * destroyed permanent), else as they are now. */
  cardTypesAmong(
    objects: readonly { readonly object: ObjectId; readonly departed: boolean }[],
  ): number;
  /** The total power (or `of` toughness, or mana value) of `entries`,
   * signed — each as it last existed on the battlefield if `departed`, else
   * as it is now, a stack that went whole once per token. See the `thisWay`
   * amount's `sumOf`. */
  powerAmong(entries: readonly ThisWayEntry[], of?: "power" | "toughness" | "mana-value"): number;
  /**
   * Who controls what `ref` points at — the player itself for a player ref,
   * else the object's controller.
   *
   * Rule 111.11 / 608.2h — *last-known* information for a permanent that
   * has left the battlefield since the spell or ability referred to it,
   * which is the usual case for the cards that ask (they destroy the
   * permanent first): whoever controlled it as it left, though `moveObject`
   * has handed it back to its owner.
   */
  controllerOf(ref: TargetRef): PlayerId | undefined;
  /** See the `{ devotionTo }` {@link EffectAmount}. */
  devotionTo(color: Color): number;
  /** See the `{ greatestCommanderManaValue }` {@link EffectAmount}. */
  greatestCommanderManaValue(): number;
  /** See the `{ opponentsControllingFewer }` {@link EffectAmount}. */
  opponentsControllingFewer(filter: CardFilter): number;
  /** See the `{ creaturesDiedThisTurn }` {@link EffectAmount}. */
  creaturesDiedThisTurn(anyController?: boolean): number;
  /** See the `{ powerOf }` / `{ toughnessOf }` {@link EffectAmount}s — a
   * permanent that has left the battlefield since the spell or ability
   * referred to it reads as it last existed there. */
  powerOf(target: TargetRef): number;
  toughnessOf(target: TargetRef): number;
  /** See the `{ countersOn }` {@link EffectAmount}. */
  countersOf(target: TargetRef, counter: string | undefined): number;
  /** See the `"put-on-bottom-of-library"` {@link EffectSpec}. */
  putOnBottomOfLibrary(target: TargetRef): void;
  /** Every player a `PlayerScope` names, in APNAP order and skipping anyone
   * who has already lost. The shared scope resolution behind `draw`'s `who`,
   * `discard-hand`, and anything else that acts on a scope one player at a
   * time rather than in one call. */
  playersInScope(who: PlayerScope): readonly PlayerId[];
  /** Discard a player's whole hand at once (rule 701.8) — no choice, so this
   * never raises a `discard` decision the way `discardCards` does. */
  discardHand(player: PlayerId): void;
  gainLife(player: PlayerId, amount: number): void;
  loseLife(player: PlayerId, amount: number): void;
  /** Change life for a whole scope (`gain-life` / `lose-life` with `who`). */
  changeLifeScoped(who: PlayerScope, delta: number): void;
  /** The concrete types a {@link BoardManaList} names right now, read from
   * this effect's source and controller. */
  manaTypesOf(mana: BoardManaList): readonly ManaType[];
  addMana(
    player: PlayerId,
    mana:
      | ManaType
      | "any-color"
      | { readonly oneOf: readonly ManaType[]; readonly same?: true }
      | Exclude<BoardManaList, { readonly eachColorAmong: CardFilter }>,
    amount: number,
    /** The whole `add-mana` spec, so the engine can stamp this mana's
     * provenance (a spend restriction, a spend rider, a "doesn't empty"
     * permission) on the units it makes. Needed here as well as in the
     * payment planner: activating a mana ability *by hand* floats the mana,
     * and that is exactly where an untagged pool loses the restriction. */
    spec?: Extract<EffectSpec, { kind: "add-mana" }>,
  ): void;
  /** `doesntUntapNext`: see the `tap` {@link EffectSpec}. */
  tapPermanent(target: TargetRef, doesntUntapNext?: boolean): void;
  untapPermanent(target: TargetRef): void;
  /** `cantBeRegenerated`: rule 701.15c. */
  destroyPermanent(target: TargetRef, cantBeRegenerated?: boolean): void;
  /** Destroy every battlefield permanent matching `filter`. With
   * `onlyControllersDamagedBySource`, restricted to those whose controller
   * this effect's source dealt combat damage to this turn. */
  destroyAll(
    filter: CardFilter,
    onlyControllersDamagedBySource?: boolean,
    cantBeRegenerated?: boolean,
  ): void;
  /** Give a permanent a regeneration shield (rule 701.15a). */
  regenerate(target: TargetRef): void;
  /** Give every battlefield permanent matching `filter` one. */
  regenerateAll(filter: CardFilter): void;
  /** Return every battlefield permanent matching `filter` to its owner's hand. */
  returnToHandAll(filter: CardFilter): void;
  /** Exile every battlefield permanent matching `filter` — see `exile-all`. */
  exileAll(filter: CardFilter): void;
  /** Deal `amount` damage to every battlefield permanent matching `filter`. */
  damageAll(
    filter: CardFilter,
    amount: number,
    exceptSource?: boolean,
    whose?: readonly PlayerId[],
    from?: DamageFrom,
  ): void;
  /** Every battlefield permanent matching `filter` deals `amount` damage to
   * its own controller — see the `"creatures-damage-controllers"`
   * {@link EffectSpec}. */
  creaturesDamageControllers(filter: CardFilter, amount: number): void;
  /** Each of `who` (a scope, or `{ player }` for a targeted edict) sacrifices
   * `count` permanents matching `filter`. */
  sacrificePermanents(
    who: PlayerScope | { readonly player: PlayerId },
    filter: CardFilter,
    count: number,
    exceptId?: ObjectId,
  ): void;
  /** Sacrifice this effect's own source. Returns whether it actually happened
   * (false if the source has already left the battlefield) — the "if you do"
   * gate on a `sacrifice-source` effect's `then`. */
  sacrificeSource(): boolean;
  /** This context, with `object` — a permanent the effect has just
   * sacrificed — as its `"sacrificed"` ({@link AmountRef}), read as it last
   * existed on the battlefield. */
  withSacrificed(object: ObjectId): ResolutionContext;
  /** This context with target `index` in slot `from` and nothing after it
   * — one member of an "any number of target …" group, bound where its
   * effect expects it (see `for-each-target`). What was known about it —
   * where it was when targeted, whether it was found illegal — moves with
   * it. */
  withTargetAt(from: number, index: number): ResolutionContext;
  /** How many creatures convoked the resolving spell (its `convokedBy`). */
  convokerCount(): number;
  /** Convoker `index`, named for a choice among them: its name as it is
   * now, or as it last existed on the battlefield, and when it tapped. */
  convokerLabel(index: number): string;
  /** This context with convoker `index` of the resolving spell as target 0 —
   * see `for-each-convoker`: acted on only while it's the same object on
   * the battlefield that tapped (rule 400.7), read as it last existed there
   * otherwise. */
  withConvoker(index: number): ResolutionContext;
  /** This context with only targets `offset`…`offset + count - 1`, as
   * slots 0… — one announced mode's own targets (see the `"modal"`
   * {@link EffectSpec}), with what was known about each moving with it. */
  withTargetSlice(offset: number, count: number): ResolutionContext;
  /** See the `"choose-permanents"` {@link EffectSpec}: raise the choice. */
  choosePermanents(
    filter: CardFilter,
    min: number,
    max: number,
    then: EffectSpec,
    prompt: string,
    exceptSource?: boolean,
  ): void;
  /** This context, about `player`: the `"that-player"` scope names them —
   * an `"each-player-may"`'s follow-ups. */
  aboutPlayer(player: PlayerId): ResolutionContext;
  /** The card types of what `target` points at — as it last existed on the
   * battlefield if it has left since the effect referred to it. For binding
   * `CardFilter.sharesCardTypeWith`. */
  cardTypesOf(target: TargetRef): readonly CardType[];
  /** The subtypes of what `target` points at, the same way — a changeling's
   * with its every-creature-type marker. For binding
   * `CardFilter.sharesCreatureTypeWith`. */
  subtypesOf(target: TargetRef): readonly string[];
  /** See the `"return-to-hand"` {@link EffectSpec} — `from` defaults to the
   * battlefield. */
  returnToHand(target: TargetRef, from?: ReturnToHandZone): void;
  /** `withCounters`: counters the card gets there ("exile it with a croak
   * counter on it"). */
  exileObject(
    target: TargetRef,
    untilSourceLeaves?: boolean,
    withCounters?: { readonly kind: string; readonly amount: number },
    mayCast?: { readonly duration: "end-of-turn" | "while-exiled"; readonly spendAs?: SpendAs },
    linked?: boolean,
  ): void;
  /** See the `"return-exiled-by-source"` {@link EffectSpec}.
   * Returns `true` when it stopped to ask an "as this enters" choice first
   * (rule 614.12 — a Clone's copy): nothing has moved, and the step runs
   * again once it's answered. */
  returnExiledBySource(linked?: boolean): boolean;
  /** Sacrifice one named permanent — see the `"sacrifice-target"`
   * {@link EffectSpec}. */
  sacrificeTarget(target: TargetRef): void;
  /** Put `target` on top of / on the bottom of / Nth from the top of its
   * owner's library — see the `"put-on-library"` {@link EffectSpec}. */
  putOnLibrary(target: TargetRef, position: "top" | "bottom" | { readonly fromTop: number }): void;
  /** Set up a delayed triggered ability — see the `"delayed-trigger"`
   * {@link EffectSpec}. `controller` is who will control it when it fires. */
  delayTrigger(
    at:
      | DelayedTriggerTiming
      | {
          readonly leaves: ObjectId;
          readonly to: readonly LeaveDestination[];
          readonly thisTurn?: boolean;
        }
      | DelayedNextSpell
      | { readonly dealsCombatDamage: ObjectId },
    effect: EffectSpec,
    text: string,
    controller: PlayerId,
    /** Its targets, in place of the creating ability's (`about`). */
    targets?: readonly TargetRef[],
  ): void;
  /** See the `"enters-with-counters"` {@link EffectSpec}. */
  entersWithCounters(target: TargetRef, counter: string, amount: number): void;
  /** See the `"allow-cast-from-exile"` {@link EffectSpec}. */
  allowCastFromExile(target: TargetRef, free: boolean, laterTurns?: boolean): void;
  /** See the `"choose-exiled-to-play"` {@link EffectSpec}. */
  chooseExiledToPlay(filter: CardFilter, free: boolean): void;
  /** See the `"cast-now"` {@link EffectSpec}: offer the effect's
   * controller the cast of one of `cards`, as a `cast-now` decision — or
   * nothing, when none of them can be cast. */
  castNow(cards: readonly ObjectId[], options: CastNowOptions): void;
  /** Whether the effect's controller has cast (or played, a land) one of
   * `cards` at a `cast-now`'s offer since event `since`. */
  castSince(cards: readonly ObjectId[], since: number): boolean;
  /** The cards in `player`'s hand or graveyard. */
  cardsIn(player: PlayerId, zone: "hand" | "graveyard"): readonly ObjectId[];
  /** The cards this resolution has exiled so far from a library, a hand or
   * a graveyard, still in exile — a `cast-now`'s `"exiled-this-way"`. */
  cardsExiledThisWay(): readonly ObjectId[];
  /** The cards in exile linked to this effect's source (rule 607.2a — see
   * `GameObject.exiledWith`), in the battlefield stint the resolving spell
   * or ability refers to. */
  cardsExiledWithSource(): readonly ObjectId[];
  /** The top `count` cards of `player`'s library, top first. */
  libraryTop(player: PlayerId, count: number): readonly ObjectId[];
  /** See the `"choose-creature-type"` {@link EffectSpec}. */
  chooseCreatureType(then: EffectSpec): void;
  /** Trigger a reflexive ability — see the `"reflexive-trigger"`
   * {@link EffectSpec}. */
  /** `value`: the reflexive ability's trigger value, when the spec sets one
   * (see its `value`). */
  reflexiveTrigger(targets: readonly TargetSpec[], effect: EffectSpec, text: string, value?: number): void;
  /** Exile every card in `target`'s graveyard (a player — Bojuka Bog), as
   * one move. */
  exileGraveyard(target: TargetRef, filter?: CardFilter): void;
  /** Each of `players` sacrifices every permanent matching `filter` they
   * control, at once — see the `"sacrifice-all"` {@link EffectSpec}. */
  sacrificeAll(players: readonly PlayerId[], filter: CardFilter): void;
  /** See the `"put-exiled-this-way-onto-battlefield"` {@link EffectSpec}.
   * `true` when it stopped first to ask an "as this enters" choice (nothing
   * has moved; apply it again once that's answered). */
  putExiledThisWayOntoBattlefield(): boolean;
  /** See the `"put-arrived-onto-battlefield"` {@link EffectSpec}. `true`
   * when it stopped first to ask an "as this enters" choice. */
  putArrivedOntoBattlefield(count: number): boolean;
  /** Carry out `fn` as one simultaneous event: the cards it takes out of
   * graveyards leave together (one `cards-left-graveyard`), the permanents
   * it takes off the battlefield leave together (rule 603.10a), and the ones
   * it puts onto the battlefield enter together, each seeing the others
   * enter (rule 603.6a). See the `sequence` {@link EffectSpec}'s
   * `simultaneous`. */
  simultaneously(fn: () => void): void;
  /** Whether something the resolution has done so far is still waiting on a
   * player — a decision on `awaiting`, or a queued discard, sacrifice,
   * destruction or 903.9a choice not yet asked. */
  decisionPending(): boolean;
  /** Park `rest` — the steps of a `sequence` after the one that raised a
   * decision — to be applied with this same context once every decision
   * now pending has been answered. See `GameState.suspendedResolutions`.
   * `below` is {@link parkedCount} as the step began: what the step parked
   * of its own (a nested `sequence`'s remainder) is part of it, so it goes
   * on first, and `rest` waits beneath it. */
  resumeAfterDecisions(rest: EffectSpec, below?: number): void;
  /** How many resolutions are parked right now — see
   * {@link resumeAfterDecisions}. */
  parkedCount(): number;
  /** Reveal (or, with `exile`, exile) the top of `owner`'s library until a
   * card matches `filter` — see the `"reveal-until"` {@link EffectSpec}.
   * Returns every card revealed, in order, and the card found (the last of
   * them), or `null`. */
  revealUntil(
    owner: PlayerId,
    spec: Extract<EffectSpec, { kind: "reveal-until" }>,
  ): { readonly revealed: readonly ObjectId[]; readonly hit: ObjectId | null };
  /** Put the card a `reveal-until` found where its `put` says. Returns
   * `true` when it stopped first to ask an "as this enters" choice, having
   * moved nothing — try again once that's answered. */
  placeFound(
    hit: ObjectId,
    put: "battlefield" | "hand" | "graveyard",
    tapped: boolean,
    attacking?: ResolvedEnterAttacking,
  ): boolean;
  /** Place what a `reveal-until` revealed that is still where it was
   * revealed — see its `rest`. */
  placeRevealed(
    owner: PlayerId,
    revealed: readonly ObjectId[],
    rest: Extract<EffectSpec, { kind: "reveal-until" }>["rest"],
    exiled: boolean,
  ): void;
  /** This context with other targets — a step applied to cards the
   * resolution found rather than chose (a `reveal-until`'s `then`). */
  withTargets(targets: readonly TargetRef[]): ResolutionContext;
  /** Exile `targets`, then return them to the battlefield together — at once,
   * or linked to a delayed return — see the `"flicker"` {@link EffectSpec}.
   * `fromSource` marks a target that is the ability's own source, which is
   * skipped if it has become a new object since. Returns the return, as a
   * `return-flickered` step to run once answered, when one coming back has
   * an "as this enters" choice to ask first (rule 614.12); else `null`. */
  flicker(targets: readonly TargetRef[], options: FlickerOptions): EffectSpec | null;
  /** See the `"return-flickered"` {@link EffectSpec}.
   * Returns `true` when it stopped to ask an "as this enters" choice first
   * (rule 614.12 — a Clone's copy): nothing has moved, and the step runs
   * again once it's answered. */
  returnFlickered(
    link: string,
    thenCounters: FlickerCounters | undefined,
    underYourControl: boolean,
    transformed: boolean,
    tapped: boolean,
  ): boolean;
  /** Grant flashback to `target` (an instant/sorcery card in a graveyard) for
   * the rest of the turn, at a flashback cost equal to its mana cost
   * (Snapcaster Mage). */
  grantFlashback(target: TargetRef): void;
  /** See the `"grant-flashback-all"` {@link EffectSpec}. */
  grantFlashbackAll(filter: CardFilter): void;
  /** Let this effect's controller cast `target` (a card in a graveyard)
   * from there this turn — see the `grant-graveyard-cast` effect. */
  grantGraveyardCast(target: TargetRef): void;
  /** `a` and `b` (both creatures) fight; with `oneSided` only `a` deals,
   * to a creature or a planeswalker. */
  fight(a: TargetRef, b: TargetRef, oneSided: boolean): void;
  /** Counter a target spell on the stack — into its owner's hand instead
   * of their graveyard with `into: "hand"`. */
  counterSpell(target: TargetRef, into?: "hand" | "exile"): void;
  /** `player` gains control of `target` — see the `"gain-control"`
   * {@link EffectSpec}. */
  gainControl(target: TargetRef, untilEndOfTurn: boolean, player: PlayerId, whileSource?: boolean): void;
  /** See the `"gain-control-all"` {@link EffectSpec}: `who` a player, or
   * each permanent's own owner; `controlledBy` keeps only what that player
   * controls. */
  gainControlAll(
    filter: CardFilter,
    untilEndOfTurn: boolean,
    who: PlayerId | "owner",
    exceptSource: boolean,
    controlledBy?: PlayerId,
  ): void;
  /** See the `"rotate-control"` {@link EffectSpec}. */
  rotateControl(filter: CardFilter, direction: "left" | "right", exceptSource: boolean): void;
  /** `target` gains "This creature can't be sacrificed" — see the
   * `"cant-be-sacrificed"` {@link EffectSpec}. */
  grantCantBeSacrificed(target: TargetRef, duration: PtDuration): void;
  /** `target` (a player) mills `amount` cards. */
  mill(target: TargetRef, amount: number): void;
  /** See the `"exile-from-library"` {@link EffectSpec}: the top `top` cards
   * of `target`'s library, or all of it but the bottom `allBut`. */
  exileFromLibrary(
    target: TargetRef,
    count: { readonly top: number } | { readonly allBut: number },
    withCounters?: { readonly kind: string; readonly amount: number },
  ): void;
  /** Number of battlefield permanents matching `filter`, evaluated with the
   * effect's controller as "you" (for an `EffectAmount` `{ countOf }`) —
   * or `you`, given one (a `countOf`'s `forTarget`). */
  countMatching(filter: CardFilter, except?: readonly ObjectId[], you?: PlayerId): number;
  /** See the aggregate {@link EffectAmount}: the raw sum or maximum, with
   * `except` left out one permanent apiece. */
  aggregate(spec: AggregateSpec, except: readonly ObjectId[]): number;
  /** See the `"return-from-graveyard"` {@link EffectSpec} — from the effect's
   * controller's graveyard.
   * Returns `true` when it stopped to ask an "as this enters" choice first
   * (rule 614.12 — a Clone's copy): nothing has moved, and the step runs
   * again once it's answered. */
  returnFromGraveyard(
    filter: CardFilter,
    destination: "battlefield" | "hand",
    count: number | "all",
    enterTapped: boolean,
    withCounters?: { readonly kind: string; readonly amount: number },
    /** Every graveyard, and how the cards enter — the spec's `from` and
     * `enterAs`. */
    opts?: { readonly allGraveyards?: boolean; readonly enterAs?: EnterTypes },
  ): boolean;
  /** `target` (a player) discards `amount` cards. */
  discardCards(target: TargetRef, amount: number, random?: boolean, unlessOne?: CardFilter): void;
  modifyPt(
    target: TargetRef,
    power: number,
    toughness: number,
    duration: PtDuration,
  ): void;
  /** +power/+toughness to every battlefield permanent matching `filter`. */
  modifyPtAll(
    filter: CardFilter,
    power: number,
    toughness: number,
    duration: PtDuration,
    exceptSource?: boolean,
    scopeTo?: PlayerId,
  ): void;
  /** Grant `keyword` to every battlefield permanent matching `filter`. */
  grantKeywordAll(
    filter: CardFilter,
    keyword: Keyword,
    duration: PtDuration,
    exceptSource?: boolean,
  ): void;
  /** See the `"double-pt-all"` {@link EffectSpec}. */
  doublePtAll(filter: CardFilter, duration: PtDuration): void;
  /** See the `"grant-player-hexproof"` {@link EffectSpec}. */
  grantPlayerHexproof(who: PlayerScope): void;
  /** See the `"sacrifice-all-but"` {@link EffectSpec}. */
  sacrificeAllBut(player: PlayerId, keep: number, filter: CardFilter): void;
  /** See the `"encore"` {@link EffectSpec}. */
  encore(): void;
  /** The colour this effect's source named as it entered, or `undefined` —
   * see `GameObject.chosenOnEnter` and `add-mana`'s `"chosen"`. */
  chosenColorOfSource(): ManaType | undefined;
  /** The number chosen as the source entered, if one was — see the
   * `chosenNumber` {@link EffectAmount}. */
  chosenNumberOfSource(): number | undefined;
  /** The colours in the effect's controller's commanders' colour identity —
   * see `PlayerState.commanderIdentity`. */
  commanderColors(): readonly ManaType[];
  /** See the `"goad"` {@link EffectSpec}: goad each creature `player`
   * controls. */
  goadCreaturesOf(player: PlayerId, forGame: boolean): void;
  /** See the `"goad"` {@link EffectSpec}: goad one creature — nothing, if
   * `target` isn't a creature on the battlefield. */
  goadCreature(target: TargetRef, forGame: boolean): void;
  /** See the `"goad"` {@link EffectSpec}: goad every creature matching
   * `filter`, from the effect's controller's side. */
  goadMatching(filter: CardFilter, forGame: boolean): void;
  /** See the `"suspect"` {@link EffectSpec}. */
  suspect(target: TargetRef): void;
  /** See the `"unsuspect"` {@link EffectSpec}: `target`, or every permanent
   * matching `filter`. */
  unsuspect(target: TargetRef | { readonly filter: CardFilter }): void;
  /** See the `"attack-requirement"` {@link EffectSpec}. */
  addAttackRequirement(filter: CardFilter, otherThanYou: boolean): void;
  /** See the `"impulse-exile"` {@link EffectSpec}. */
  impulseExile(
    amount: number,
    duration: "end-of-turn" | "your-next-turn" | "your-next-end-step" | "while-source" | "while-exiled",
    castOnly: boolean,
    opts?: {
      /** Whose libraries (the controller's alone when absent). */
      readonly players?: readonly PlayerId[];
      /** Each card's owner may play it, rather than the controller. */
      readonly ownerPlays?: boolean;
      readonly choose?: number;
      readonly yourTurnOnly?: boolean;
      readonly gate?: StaticCondition;
      readonly filter?: CardFilter;
      readonly free?: { readonly filter?: CardFilter; readonly only?: boolean };
      readonly whileSource?: boolean;
      readonly oncePerTurn?: boolean;
      /** Exiled face down, for the controller's eyes only (rule 406.3). */
      readonly faceDown?: boolean;
      readonly spendAs?: SpendAs;
    },
  ): void;
  /** See the `"ward"` {@link EffectSpec}. */
  ward(cost: WardCost): void;
  /** See the `"player-effect"` {@link EffectSpec}. */
  addPlayerEffect(effect: PlayerEffect): void;
  /** Flip a coin for this effect's controller (see the `"flip-coin"`
   * {@link EffectSpec}): `true` if they won the flip. */
  flipCoin(): boolean;
  /** See the `"prohibit"` {@link EffectSpec}: `players` can't cast spells
   * (every one, or those matching a filter) and/or activate abilities this
   * turn, or `object`'s activated abilities can't be activated. */
  prohibit(
    players: readonly PlayerId[],
    object: TargetRef | undefined,
    spells: boolean | { readonly filter: CardFilter; readonly label: string; readonly you: PlayerId },
    abilities: boolean,
  ): void;
  /** See the `"restrict"` {@link EffectSpec}: `target`'s restrictions until
   * end of turn, or with `filter` a turn-wide rule. */
  restrict(
    target: TargetRef | undefined,
    filter: CardFilter | undefined,
    restrictions: readonly CombatRestriction[],
    /** A `target`'s: this turn when omitted. */
    duration?: PtDuration,
  ): void;
  /** See the `"attack-despite-defender"` {@link EffectSpec}. */
  attackDespiteDefender(target: TargetRef | undefined, filter: CardFilter | undefined): void;
  /** See the `"damage-by-toughness"` {@link EffectSpec}. */
  damageByToughness(target: TargetRef): void;
  /** See the `"put-in-command-zone"` {@link EffectSpec}. */
  putInCommandZone(target: TargetRef): void;
  /** See the `"exchange-life-toughness"` {@link EffectSpec}. */
  exchangeLifeToughness(target: TargetRef, player: PlayerId): void;
  /** See the `"unless"` {@link EffectSpec}. */
  unless(
    chooser: Extract<EffectSpec, { kind: "unless" }>["chooser"],
    options: readonly BoundUnlessOption[],
    otherwise: EffectSpec,
  ): void;
  /** Ask `player` an `"each-player-may"`'s question: a `choose-modes`
   * decision of theirs, or nothing at all when there's nothing they could
   * take. */
  askEachPlayerMay(player: PlayerId, spec: Extract<EffectSpec, { kind: "each-player-may" }>): void;
  /** Whether `player` took what an `"each-player-may"` that began at event
   * `since` offered them — their first answer for this source since. */
  tookEachPlayerMay(player: PlayerId, since: number): boolean;
  /** The permanent `player` sacrificed in answer to an `"each-player-may"`
   * begun at event `since` — the first they sacrificed after their answer —
   * or `undefined` when they sacrificed none. */
  sacrificedForEachPlayerMay(player: PlayerId, since: number): ObjectId | undefined;
  /** The sequence number the next event will have. */
  nextEventSeq(): number;
  /** See the `"populate"` {@link EffectSpec}. */
  populate(): void;
  /** See the `"amass"` {@link EffectSpec}. `onto`: the Army already
   * chosen. */
  amass(amount: number, creatureType: string, onto?: ObjectId): void;
  /** See the `"monstrosity"` {@link EffectSpec}. */
  monstrosity(amount: number): void;
  /** See the `"add-counter-all"` {@link EffectSpec}. */
  addCounterAll(
    filter: CardFilter,
    counter: string,
    amount: number | "own-toughness",
    exceptSource?: boolean,
    /** Whose side `filter` is read from — see `controlledByTarget`. */
    scopeTo?: PlayerId,
  ): void;
  /** See the `"double-counters-all"` {@link EffectSpec}. */
  doubleCountersAll(filter: CardFilter, counterKind: string): void;
  /** `by` is who puts them — the effect's controller when absent. */
  addCounter(target: TargetRef, counter: string, amount: number, by?: PlayerId): void;
  /** Proliferate — see the `"proliferate"` {@link EffectSpec}. */
  proliferate(then: EffectSpec | null): void;
  grantKeyword(target: TargetRef, keyword: Keyword, duration: PtDuration): void;
  /** See the `"grant-triggered"` {@link EffectSpec}. */
  grantTriggered(
    target: TargetRef,
    ability: TriggeredAbility,
    duration: PtDuration,
  ): void;
  /** See the `"grant-triggered-all"` {@link EffectSpec}. */
  grantTriggeredAll(filter: CardFilter, ability: TriggeredAbility, duration: PtDuration): void;
  /** See the `"grant-activated"` {@link EffectSpec}. */
  grantActivated(target: TargetRef, ability: ActivatedAbility, duration: PtDuration): void;
  /** See the `"lose-abilities"` {@link EffectSpec}. */
  loseAbilities(
    target: TargetRef,
    opts: {
      readonly loseLandTypes: boolean;
      readonly activated: readonly ActivatedAbility[];
      readonly duration: PtDuration;
    },
  ): void;
  /** See the `"lose-abilities-all"` {@link EffectSpec}. */
  loseAbilitiesAll(filter: CardFilter, duration: PtDuration): void;
  /** See the `"grant-activated-all"` {@link EffectSpec}. */
  grantActivatedAll(filter: CardFilter, ability: ActivatedAbility, duration: PtDuration): void;
  /** `player` takes an extra turn after this one (Time Warp). */
  takeExtraTurn(player: PlayerId): void;
  /** See the `"gift"` {@link EffectSpec}. */
  giveGift(gift: GiftKind): void;
  /** `player` wins the game, unless they can't — see the `"win-game"`
   * {@link EffectSpec}. */
  winGame(player: PlayerId): void;
  /** Each of `players` loses the game, at once, unless they can't — see the
   * `"lose-game"` {@link EffectSpec}. */
  loseGame(players: readonly PlayerId[]): void;
  /** Whether the game has ended — once it has, nothing more of a resolution
   * happens (rule 104.1). */
  gameOver(): boolean;
  /** Storm — copy the spell `sourceId` for each earlier spell its controller
   * cast this turn. */
  storm(sourceId: ObjectId): void;
  /** Cascade off `sourceId` (the cascade spell) for `controller`. */
  /** Exile off the top until a card cascade may cast (rule 702.85a) — `null`,
   * with everything already on the bottom, when there's none it could cast. */
  cascade(controller: PlayerId, sourceId: ObjectId): CascadeFound | null;
  /** Cast what cascade found, or not, and put the rest on the bottom. */
  finishCascade(finish: CascadeFinish): void;
  /** Copy the spell at `TargetRef` on the stack — see the `copy-spell`
   * {@link EffectSpec}. */
  copySpell(target: TargetRef, newTargets: boolean): void;
  /** The spell whose casting fired this triggered ability, as it is on the
   * stack or as it last was there (rule 608.2h); `null` if nothing cast one. */
  triggerSpell(): SpellSnapshot | null;
  /** Put a copy of `spell`, the trigger's spell (or `original`, when the
   * engine captured it — see `copy-spell`'s `spell`), onto the stack —
   * every target of it `retargetTo` if given (rule 707.10e). `false` when
   * nothing was copied: `retargetTo` isn't a legal target for each of its
   * targets. */
  copyTriggerSpell(
    spell: SpellSnapshot,
    opts: { readonly newTargets: boolean; readonly retargetTo?: TargetRef; readonly original?: ObjectId },
  ): boolean;
  /** See the `copy-ability` {@link EffectSpec}: copy the ability object
   * `target` names, or with `"trigger-ability"` the one whose activation
   * fired this trigger. */
  copyAbility(target: TargetRef | "trigger-ability", newTargets: boolean): void;
  /** See `copy-spell`'s `forEachItCouldTarget`: copy `spell` once for each
   * permanent it could target, in the order its controller chooses. */
  copyTriggerSpellForEach(
    spell: SpellSnapshot,
    each: { readonly filter: CardFilter; readonly other?: true },
  ): void;
  /** See the `exile-spell-as-it-resolves` {@link EffectSpec}: mark the
   * trigger's spell. */
  exileTriggerSpellAsItResolves(returnAtNextEndStep: boolean): void;
  /** The answer to its rule 616.1 choice — see `applyFirst` there. */
  finishExiledAsItResolves(spell: ObjectId, feather: boolean): void;
  /** Shuffle the controller's library — see the `shuffle-library`
   * {@link EffectSpec}. */
  shuffleLibrary(): void;
  /** The resolving spell's division of a divided amount — see
   * `GameObject.division`. Empty outside one. */
  readonly division: readonly number[];
  /** Queue an additional combat + main phase after this main phase (Aggravated
   * Assault). */
  additionalCombat(afterThisPhase?: { readonly withMain: boolean }): void;
  /** See the `additional-upkeep-steps` {@link EffectSpec}. */
  additionalUpkeeps(count: number): void;
  /** See the `additional-land-drop` {@link EffectSpec}. */
  additionalLandDrops(amount: number): void;
  /** Untap every battlefield permanent matching `filter`. */
  untapAll(filter: CardFilter, scopeTo?: PlayerId, exceptSource?: boolean): void;
  /** See the `"exert"` {@link EffectSpec}. */
  exert(target: TargetRef, asItAttacks: boolean): void;
  tapAll(filter: CardFilter): void;
  /** `target` becomes a creature — see the `"animate"` {@link EffectSpec}. */
  animate(
    target: TargetRef,
    opts: {
      readonly power: number;
      readonly toughness: number;
      readonly addTypes: readonly CardType[];
      readonly addSubtypes: readonly string[];
      readonly setSubtypes?: readonly string[];
      readonly setColors?: readonly Color[];
      readonly loseAbilities?: boolean;
      readonly keywords: readonly Keyword[];
      readonly duration: PtDuration;
    },
  ): void;
  /** `target` gains types and subtypes — see the `"add-types"`
   * {@link EffectSpec}. */
  addTypes(
    target: TargetRef,
    types: readonly CardType[],
    subtypes: readonly string[],
    duration: PtDuration,
  ): void;
  /** Every permanent matching `filter` becomes a creature (or just has its
   * base P/T set) — see the `"animate-all"` {@link EffectSpec}. */
  animateAll(
    filter: CardFilter,
    opts: {
      readonly power: number;
      readonly toughness: number;
      readonly addTypes: readonly CardType[];
      readonly addSubtypes: readonly string[];
      readonly keywords: readonly Keyword[];
      readonly duration: PtDuration;
    },
  ): void;
  /** Begin a text-changing effect — see the `"change-text"` {@link EffectSpec}. */
  changeText(target: TargetRef): void;
  /** Create `count` copies of the named token, controlled by `ctx.controller`. */
  createToken(
    token: string,
    count: number,
    who?: "target-controller" | PlayerScope,
    tapped?: boolean,
    sacrificeAtEndStep?: boolean,
    /** Keywords the new tokens gain until end of turn. */
    gainUntilEndOfTurn?: readonly Keyword[],
    /** The new tokens are goaded by the effect's controller for the rest of
     * the game. */
    goadedForGame?: boolean,
    /** Counters the effect's controller then puts on each new token. */
    thenCounters?: { readonly kind: string; readonly amount: number },
    /** The new tokens' base power and toughness, for an X/X token. */
    basePt?: readonly [number, number],
    /** The new tokens enter attacking (rule 508.4). */
    attacking?: ResolvedEnterAttacking,
    /** Each new token its own object, never folded into a token stack. */
    separate?: boolean,
    /** Exile them at the beginning of the next end step. */
    exileAtEndStep?: boolean,
    /** They attack this combat if able (until end of combat). */
    attacksThisCombat?: boolean,
  ): void;
  /** Create `count` token(s) that are copies of the permanent `of` — see the
   * `"create-token-copy"` {@link EffectSpec}. */
  createTokenCopy(
    of: ObjectId,
    count: number,
    opts: {
      /** Controller for the new token; defaults to the copied permanent's. */
      readonly under?: PlayerId;
      gainsHaste: boolean;
      exileAtEndStep: boolean;
      /** "Sacrifice it at the beginning of the next end step" (Kiki-Jiki) —
       * sacrificed rather than exiled, so dies-triggers see it go. */
      sacrificeAtEndStep?: boolean;
      notLegendary: boolean;
      basePt?: readonly [number, number];
      /** Keywords the copies gain until end of turn. */
      gainUntilEndOfTurn?: readonly Keyword[];
      exceptions?: CopyExceptions;
      /** Copy the object as it is now, never as it last existed elsewhere. */
      asCard?: boolean;
      tapped?: boolean;
      attacking?: ResolvedEnterAttacking;
      exileAtEndOfCombat?: boolean;
    },
  ): void;
  /** True if `condition` holds from the effect source's controller's
   * perspective — see the `"conditional"` {@link EffectSpec}. */
  conditionMet(condition: StaticCondition): boolean;
  /** Attach `attachment` (an Aura/Equipment) to `target` — `ctx.source`
   * when it's omitted. See the `"attach"` {@link EffectSpec}. */
  attach(target: TargetRef, attachment?: TargetRef): void;
  /** Transform `target` (a transforming DFC permanent) — see the `"transform"`
   * {@link EffectSpec}. */
  transform(target: TargetRef): void;
  /** The permanent `target` becomes a copy of `of` until end of turn — see
   * the `"become-copy"` {@link EffectSpec}. */
  becomeCopy(target: ObjectId, of: ObjectId, exceptions?: CopyExceptions): void;
  /** Pick an opponent at random for creature `target` to attack this combat
   * — see the `"attack-random-opponent"` {@link EffectSpec}. `false` when
   * there was nobody to pick; `true` otherwise, `target` gone included. */
  attackRandomOpponent(target: ObjectId, notAttackedLastCombat: boolean): boolean;
  /** The game becomes day or night (rule 726). */
  setDayNight(value: "day" | "night"): void;
  /** `who` becomes the monarch (rule 720). */
  becomeMonarch(who: PlayerScope | undefined): void;
  /** `who` gets `amount` energy counters (rule 122). */
  getEnergy(amount: number, who: PlayerScope | undefined): void;
  /** `player` gets `amount` counters of `counter` — see the
   * `"add-player-counters"` {@link EffectSpec}. */
  addPlayerCounters(player: PlayerId, counter: PlayerCounterKind, amount: number): void;
  /** How many counters of `counter` `player` has — see the `playerCounters`
   * {@link EffectAmount}. */
  playerCountersOf(player: PlayerId, counter: PlayerCounterKind): number;
  /** The effect's controller gets an emblem (rule 114). */
  createEmblem(text: string, staticAbility: StaticAbility | undefined): void;
  /** Prevent all combat damage this turn (Fog) — or only what sources
   * matching `by` would deal. */
  preventAllCombatDamage(by?: CardFilter): void;
  /** Add a one-shot damage-prevention shield on `target` (a player or object)
   * for `amount` damage this turn — Healing Salve (ROADMAP Phase 11 EG-6). */
  preventDamage(target: TargetRef, amount: number, combatOnly: boolean): void;
  /** Raise a `choose-modes` decision — see the `modal` / `may` {@link EffectSpec}.
   * The chosen modes' effects are applied after the controller answers.
   * `onDecline` (a `may` effect's `else` only) applies when zero modes end up
   * chosen. */
  chooseModes(
    minModes: number,
    maxModes: number,
    modes: readonly ModeOption[],
    onDecline?: EffectSpec,
    /** A mana cost the chooser must pay to pick a mode — see `may.cost`. */
    cost?: string,
    /** Offer only the modes this ability hasn't had chosen this turn — see
     * `modal`'s `notChosenThisTurn` and `may`'s `oncePerTurn`. */
    notChosenThisTurn?: boolean,
    /** The rest of a `may`'s cost: life and energy, as numbers. */
    otherCost?: { readonly life?: number; readonly energy?: number },
    /** The player the question is about — see `may`'s `aboutThatPlayer`. */
    about?: PlayerId,
  ): void;
  /** Scry (`surveil: false`) or surveil (`surveil: true`) `amount` cards;
   * apply `then` afterwards. See the `"scry"` / `"surveil"` {@link EffectSpec}. */
  scry(amount: number, surveil: boolean, then: EffectSpec | undefined): void;
  /** See the `"put-onto-battlefield"` {@link EffectSpec}.
   * Returns `true` when it stopped to ask an "as this enters" choice first
   * (rule 614.12 — a Clone's copy): nothing has moved, and the step runs
   * again once it's answered. */
  putOntoBattlefield(
    target: TargetRef,
    /** Whose control it enters under, when that isn't its owner's — the
     * effect's controller for "under your control", or another player. */
    under: PlayerId | undefined,
    enterTapped: boolean,
    withCounters?: { readonly kind: string; readonly amount: number },
    exileIfItWouldLeave?: boolean,
    transformed?: boolean,
    /** The types it enters with — see the effect's `setTypes` and
     * `addSubtypes`. */
    types?: EnterTypes,
  ): boolean;
  /** See the `"search-library"` {@link EffectSpec}. */
  searchLibrary(
    player: PlayerId | null,
    filter: CardFilter,
    destination: "hand" | "battlefield" | "library-top" | "graveyard",
    min: number,
    max: number,
    enterTapped: boolean,
    restDestination?: "hand" | "battlefield",
    reveal?: boolean,
    zones?: SearchZones,
    together?: SearchTogether,
  ): void;
  /** See the `"reveal-top"` {@link EffectSpec}. `player` is whose library
   * (the effect's controller's when omitted). */
  revealTop(then: EffectSpec, player?: PlayerId): void;
  /** See the `"shuffle-into-library"` {@link EffectSpec}. */
  shuffleIntoLibrary(target: TargetRef): void;
  /** Who owns the object `target` names — as it last existed, if it has
   * ceased to exist — or the player itself. */
  ownerOf(target: TargetRef): PlayerId | undefined;
  /** See the `"remove-counter"` {@link EffectSpec}. */
  removeCounter(target: TargetRef, counter: string, amount: number): void;
  /** See the `"look-and-choose"` {@link EffectSpec}. */
  lookAndChoose(
    /** `{ cards }` — the look-and-choose's `"targets"`, already resolved. */
    zone: "library" | "graveyard" | "hand" | "graveyards" | "command" | { readonly cards: readonly ObjectId[] },
    count: number | undefined,
    min: number,
    max: number,
    destination: "battlefield" | "hand" | "library-top" | "library-bottom" | "graveyard" | "exile-face-down" | "exile",
    leftover: "bottom-random" | "bottom-any-order" | "stay" | "hand" | "graveyard" | "exile-playable",
    filter: ZoneChoiceFilter | undefined,
    enterTapped?: boolean,
    then?: EffectSpec,
    reveal?: boolean | "chosen",
    leftoverIf?: LookAndChooseLeftoverIf,
    secondPick?: ZoneSecondPick,
    attacking?: ResolvedEnterAttacking,
    enterAs?: EnterTypes,
    /** Whose zone and who chooses — see `look-and-choose`'s `player`; the
     * effect's controller when absent. */
    chooser?: PlayerId,
    /** Who chooses instead, the zone still `chooser`'s — see
     * `look-and-choose`'s `chooser`. */
    picker?: PlayerId,
  ): void;
}

export interface ResolutionContext extends EffectApi {
  /** The modes a modal triggered ability announced as it went on the stack
   * (`GameObject.chosenModes` on the ability) — see the `modal` effect's
   * `announced`. */
  readonly announcedModes?: readonly number[];
  readonly controller: PlayerId;
  readonly source: ObjectId;
  /** One entry per declared slot; a hole marks an **optional** slot the
   * player left empty (see `ResolvedTargets`). Reading `ctx.targets[i]` and
   * checking for `undefined` — which effects already do for an out-of-range
   * index — is all a skipped slot needs. */
  readonly targets: ResolvedTargets;
  /** A delayed trigger's targets, every one it carries, for what it reads
   * of them ("that spell's mana value"): `targets` holds only those still
   * the objects they were as it was created, the ones it may act on (rule
   * 400.7). Absent for anything else, whose reads use `targets`. */
  readonly readTargets?: ResolvedTargets;
  /**
   * The slots whose target was found illegal as this spell or ability began
   * to resolve, while another stayed legal so it didn't fizzle (rule
   * 608.2b). Each is already blank in `targets` (`Game.targetLegality`), so
   * no effect acts on it or finds anything out about it; this list is for an
   * effect where an empty slot and an illegal one mean different things —
   * `gain-control`'s `who`, whose absence means "you". Absent when every
   * target was legal.
   */
  readonly illegalTargets?: readonly number[];
  /** The value chosen for `{X}` when this spell/ability was put on the stack,
   * or 0 if its cost had no `{X}`. */
  readonly x: number;
  /** A numeric quantity supplied by the event that fired this triggered
   * ability (the triggering creature's power, or combat damage it dealt), or 0
   * outside a triggered-ability resolution. ROADMAP P4b. */
  readonly triggerValue: number;
  /** The object whose entering / attacking fired this triggered ability, or
   * `undefined` outside such a resolution — for `create-token-copy` with
   * `of: "trigger-object"` (Miirym). needed-cards P5b. */
  readonly triggerObject?: ObjectId;
  /** The trigger object left the battlefield as the ability triggered (a
   * dies trigger's "it") and has changed zones again since: a new object
   * (rule 400.7), so an effect that acts on `"trigger-object"` — "return it
   * to the battlefield" — finds nothing. Reading it ("its power") is
   * last-known information and still works. See `LastKnownRefs
   * .triggerObjectAfterLeaving`. */
  readonly triggerObjectLost?: boolean;
  /** See `LastKnownRefs.enteredTogether`: the permanents a batched entry
   * trigger fired on, and how many tokens each stood for. */
  readonly enteredTogether?: readonly { readonly object: ObjectId; readonly count: number }[];
  /** How many real, independent firings this resolution stands for — see
   * `GameObject.stackMultiplier`. `1` outside a scaled resolution. Only
   * `create-token` / `create-token-copy` read it (the only effect kinds
   * proven safe to multiply). Pure engine resource-safety optimization. */
  readonly stackMultiplier: number;
  /** Which resolution of this ability this turn is in progress — `1` the
   * first time — for `StaticCondition` `resolved-this-turn`. `0` for a spell,
   * which is not an ability. */
  readonly resolutionCount?: number;
  /** Set while a **mana ability** resolves (rule 605.3b — one activated by
   * hand): its colour choices were made as it was activated (the action's
   * `manaColors`), so an `add-mana` with a choice in it makes what was
   * picked rather than asking. Absent for a spell or an ability on the
   * stack, where the choice is asked as the mana is added (rule 608.2d). */
  readonly manaAbility?: true;
  /** The colour an `add-mana` of `"any-color"` is making in this mana
   * ability — what `{ devotionTo: "that-color" }` reads. */
  readonly manaColor?: ManaType;
  /** The ability's source stayed in a non-battlefield zone while it was on
   * the stack (`ActivatedAbility.zone: "command"`, or `staysInZone`) and has
   * changed zones since: it's a new object (rule 400.7), so an effect naming
   * `"source"` finds nothing. Absent otherwise. */
  readonly sourceLost?: boolean;
  /** The permanent sacrificed to pay this spell's or ability's cost, or by a
   * `sacrifice-source` step before this one — what an {@link AmountRef}
   * `"sacrificed"` reads. Absent when nothing was. */
  readonly sacrificed?: ObjectId;
  /** The one permanent tapped to pay this ability's cost — what an
   * {@link AmountRef} `"tapped"` reads. Absent when nothing was. */
  readonly tapped?: ObjectId;
  /** Which ability of which object is resolving, as the per-turn records
   * key it (`resolved-this-turn`, a `may`'s `oncePerTurn`): the source, the
   * timestamp it had when the ability went on the stack, and which of its
   * abilities. Absent for a spell and a delayed trigger. */
  readonly abilityKey?: string;
}

/** Effect kinds safe to fire once with their count/amount multiplied by a
 * stack's size instead of once per real, independent firing — no per-firing
 * choice or target, so N identical simultaneous firings are indistinguishable
 * from one firing scaled by N. Used only to decide whether a `stackCount`
 * object's ability (or a batch-entry event with `count > 1`) can take the
 * cheap path; anything else still fires once per real instance. Pure engine
 * resource-safety optimization (needed-cards P5b/P6 fuzz hardening) — not
 * derived from any rule, and never changes what a card actually does, only
 * how cheaply an exponential/large-batch case is computed. */
export function isCountScalableEffect(effect: EffectSpec): boolean {
  switch (effect.kind) {
    case "create-token":
      return effect.who !== "target-controller"; // that reads targets[0]
    case "create-token-copy":
      // "trigger-object" / a target slot each name a specific instance from
      // *this* firing — not safe to multiply as "N more of the same".
      return effect.of === "source";
    case "sequence":
      return effect.effects.every(isCountScalableEffect);
    case "conditional":
      return (
        isCountScalableEffect(effect.then) &&
        (effect.else === undefined || isCountScalableEffect(effect.else))
      );
    default:
      return false;
  }
}

/** Who an `"each-player-may"` asks: its scope's players, or the one who
 * controls what a target slot points at (nobody, for an empty slot). */
function eachPlayerMayAsks(
  who: Extract<EffectSpec, { kind: "each-player-may" }>["who"],
  ctx: ResolutionContext,
  startingWithYou = false,
): readonly PlayerId[] {
  if (typeof who === "string") {
    const players = ctx.playersInScope(who);
    // "Starting with you, each player votes …" (rule 701.38a): in turn
    // order from the effect's controller, not the active player.
    const at = startingWithYou ? players.indexOf(ctx.controller) : -1;
    return at <= 0 ? players : [...players.slice(at), ...players.slice(0, at)];
  }
  const ref = ctx.targets[who.controllerOfTarget];
  const player = ref === undefined ? undefined : ctx.controllerOf(ref);
  return player === undefined || !ctx.playersInScope("each-player").includes(player) ? [] : [player];
}

/**
 * An `"each-player-may"`: ask each player in turn, then apply the follow-ups
 * player by player. Each question — and each follow-up that stops to ask
 * something — parks the rest as a copy carrying its `progress`, beneath
 * whatever that step parked of its own, so it all happens in order.
 */
function applyEachPlayerMay(
  spec: Extract<EffectSpec, { kind: "each-player-may" }>,
  ctx: ResolutionContext,
): void {
  const since = spec.progress?.since ?? ctx.nextEventSeq();
  let asked = spec.progress?.asked ?? [];
  let toAsk = spec.progress?.toAsk ?? eachPlayerMayAsks(spec.who, ctx, spec.startingWithYou === true);
  const park = (progress: EachPlayerMayProgress, below: number): void =>
    ctx.resumeAfterDecisions({ ...spec, progress }, below);
  // One question at a time, each answered before the next is asked (rule
  // 101.4). What a player chose is done before the next player is asked.
  while (toAsk.length > 0) {
    const player = toAsk[0];
    asked = [...asked, player];
    toAsk = toAsk.slice(1);
    const parked = ctx.parkedCount();
    const pendingBefore = ctx.decisionPending();
    ctx.askEachPlayerMay(player, spec);
    if (!pendingBefore && ctx.decisionPending()) {
      park({ since, asked, toAsk }, parked);
      return;
    }
  }
  if (spec.ifDid === undefined && spec.ifDidnt === undefined) return;
  let results =
    spec.progress?.results ??
    (() => {
      const counted =
        spec.resultsFor === undefined ? undefined : new Set(ctx.playersInScope(spec.resultsFor));
      return asked
        .filter((player) => counted === undefined || counted.has(player))
        .map((player) => ({ player, did: ctx.tookEachPlayerMay(player, since) }));
    })();
  while (results.length > 0) {
    const { player, did } = results[0];
    results = results.slice(1);
    const followUp = did ? spec.ifDid : spec.ifDidnt;
    if (followUp === undefined) continue;
    const parked = ctx.parkedCount();
    const pendingBefore = ctx.decisionPending();
    // What they sacrificed in answer, if anything, is the follow-up's
    // "sacrificed" — "you may sacrifice an artifact, creature, …. If you do,
    // each opponent may sacrifice a permanent that shares a card type with
    // it" (Braids, Arisen Nightmare).
    const about = ctx.aboutPlayer(player);
    const sacrificed = did ? ctx.sacrificedForEachPlayerMay(player, since) : undefined;
    applyEffectSpec(followUp, sacrificed === undefined ? about : about.withSacrificed(sacrificed));
    if (results.length > 0 && !pendingBefore && ctx.decisionPending()) {
      park({ since, asked, toAsk: [], results }, parked);
      return;
    }
  }
}

/**
 * A `"reveal-until"`: reveal, place the card found, apply `then` to it, then
 * place the rest. Placing it onto the battlefield may stop to ask its "as
 * this enters" choice, and `then` may stop to ask something; either way the
 * rest is parked as a copy carrying `progress`.
 */
function applyRevealUntil(
  spec: Extract<EffectSpec, { kind: "reveal-until" }>,
  ctx: ResolutionContext,
): void {
  let progress = spec.progress;
  if (progress === undefined) {
    let owner: PlayerId = ctx.controller;
    if (spec.whose === "that-player") {
      const player = effectPlayer("that-player", ctx);
      if (player === undefined) return;
      owner = player;
    } else if (spec.whose !== undefined) {
      const ref = ctx.targets[spec.whose];
      if (ref === undefined || ref.kind !== "player") return;
      owner = ref.player;
    }
    const found = ctx.revealUntil(owner, spec);
    progress = {
      owner,
      revealed: spec.keepFound === true ? found.revealed.filter((id) => id !== found.hit) : found.revealed,
      hit: found.hit,
      placed: false,
    };
  }
  const hit = progress.hit;
  if (!progress.placed && hit !== null) {
    const parked = ctx.parkedCount();
    if (
      spec.put !== undefined &&
      ctx.placeFound(hit, spec.put, spec.tapped === true, resolveEnterAttacking(spec.attacking, ctx))
    ) {
      ctx.resumeAfterDecisions({ ...spec, progress }, parked);
      return;
    }
    progress = { ...progress, placed: true };
    if (spec.then !== undefined) {
      const pendingBefore = ctx.decisionPending();
      applyEffectSpec(spec.then, ctx.withTargets([{ kind: "object", object: hit }]));
      if (!pendingBefore && ctx.decisionPending()) {
        ctx.resumeAfterDecisions({ ...spec, progress }, parked);
        return;
      }
    }
  }
  ctx.placeRevealed(progress.owner, progress.revealed, spec.rest, spec.exile === true);
}

/**
 * A `"cast-now"`: offer the cast; once it's answered, "if you do" or "if you
 * don't"; then the looked-at cards not cast to the bottom. Waiting on the
 * decision parks the rest as a copy carrying its `progress`, and a follow-up
 * that stops to ask something parks `rest` beneath whatever it parked.
 */
/** Offer a `cast-now`'s `progress.cards`, parking the rest of `spec` across
 * the decision when anything follows it. Whether a decision is now up. */
function offerCastNow(
  spec: Extract<EffectSpec, { kind: "cast-now" }>,
  progress: CastNowProgress,
  ctx: ResolutionContext,
): boolean {
  const { cards, looked } = progress;
  const parked = ctx.parkedCount();
  const pendingBefore = ctx.decisionPending();
  if (cards.length > 0) {
    ctx.castNow(cards, {
      free: spec.free === true,
      exileAfter: spec.exileAfter === true,
      ...(spec.play === true ? { play: true } : {}),
      ...(spec.spell !== undefined ? { spell: spec.spell } : {}),
      ...(looked.length > 0 ? { looked } : {}),
    });
  }
  if (pendingBefore || !ctx.decisionPending()) return false;
  if (spec.then !== undefined || spec.else !== undefined || spec.rest !== undefined || spec.repeat === true) {
    ctx.resumeAfterDecisions({ ...spec, progress }, parked);
  }
  return true;
}

function applyCastNowSpec(spec: Extract<EffectSpec, { kind: "cast-now" }>, ctx: ResolutionContext): void {
  let progress = spec.progress;
  if (progress === undefined) {
    const from = spec.from;
    const looked = typeof from === "object" ? ctx.libraryTop(ctx.controller, from.libraryTop) : [];
    let cards: readonly ObjectId[];
    if (from === undefined) {
      const target = spec.target === undefined ? undefined : resolveEffectTarget(spec.target, ctx);
      cards = target?.kind === "object" ? [target.object] : [];
    } else if (from === "exiled-with-source") {
      cards = ctx.cardsExiledWithSource();
    } else if (from === "exiled-this-way") {
      cards = ctx.cardsExiledThisWay();
    } else if (from === "targets") {
      // An illegal target's slot is blank (rule 608.2b); one already cast
      // is on the stack now, which the offer passes over.
      cards = ctx.targets.flatMap((t) => (t?.kind === "object" ? [t.object] : []));
    } else {
      cards = typeof from === "object" ? looked : ctx.cardsIn(ctx.controller, from);
    }
    progress = { since: ctx.nextEventSeq(), cards, looked };
    if (offerCastNow(spec, progress, ctx)) return;
    if (spec.repeat === true) return;
  }
  // "Any number of them": one cast or played, the rest offered again — the
  // cards first offered, less what's on the stack or the battlefield now
  // (`castNow` passes those over). Not whatever else this resolution has
  // exiled since: a card a replacement exiled as a cost of casting one was
  // paid (Rest in Peace and Thrill of Possibility's discard) wasn't exiled
  // "this way".
  if (spec.repeat === true) {
    if (ctx.castSince(progress.cards, progress.since)) {
      offerCastNow(spec, { since: ctx.nextEventSeq(), cards: progress.cards, looked: progress.looked }, ctx);
    }
    return;
  }
  if (progress.followed !== true) {
    const followUp = ctx.castSince(progress.cards, progress.since) ? spec.then : spec.else;
    if (followUp !== undefined) {
      const parked = ctx.parkedCount();
      const pendingBefore = ctx.decisionPending();
      applyEffectSpec(followUp, ctx);
      if (spec.rest !== undefined && !pendingBefore && ctx.decisionPending()) {
        ctx.resumeAfterDecisions({ ...spec, progress: { ...progress, followed: true } }, parked);
        return;
      }
    }
  }
  if (spec.rest !== undefined && progress.looked.length > 0) {
    ctx.placeRevealed(ctx.controller, progress.looked, spec.rest, false);
  }
}

/** How many flips "flip a coin until you lose a flip" makes at most — a
 * bound the seeded stream practically never reaches, against a loop. */
const MAX_FLIPS = 1000;

/** The most copies one `copy-spell` with a `count` puts on the stack — the
 * same resource bound as `Game.MAX_EFFECT_INSTANCES`, which this module
 * can't import (a real cycle). No real game gets near it. */
const MAX_COPY_COUNT = 1000;

/** Resolve an {@link EffectAmount} against the resolution context. `each`
 * is the player a scoped effect is being applied to right now, for a
 * per-player amount (`lifeTotal: "each"`).
 *
 * Never below 0 (rule 107.1b): a calculation that comes out negative uses 0,
 * so a sacrificed creature's negative power gains no life, adds no counters
 * and draws no cards. The calculation itself is done as written first — the
 * difference between a -1 power and a 3 toughness is 4 — and only its result
 * is clamped. A P/T change reads its amounts through {@link ptChangeValue}
 * instead, which keeps a card's own minus sign. */
export function amountValue(
  amount: EffectAmount,
  ctx: ResolutionContext,
  each?: PlayerId,
): number {
  return Math.max(0, signedAmountValue(amount, ctx, each));
}

/**
 * An amount that *sets* a power or toughness — a token copy's "except its
 * power is half that creature's power". Not clamped: rule 107.1b lets a value
 * that sets power or toughness be negative.
 */
export function ptSetValue(amount: EffectAmount, ctx: ResolutionContext): number {
  return signedAmountValue(amount, ctx);
}

/**
 * The amount a `modify-pt` or `modify-pt-all` adds to power or toughness.
 * Unlike every other amount it may be negative, but only by the card's own
 * sign: "-X/-X" is written `{ product: ["x", -1] }`, and its X is clamped at
 * 0 before the sign applies (rule 107.1b), as is the X of "+X/+X, where X is
 * its power". A doubling (`{ powerOf, doubling: true }`) reads the value as
 * it is: doubling a -2 power makes it -4 (rules 107.1b, 701.10d).
 */
export function ptChangeValue(
  amount: EffectAmount,
  ctx: ResolutionContext,
  each?: PlayerId,
): number {
  if (typeof amount === "number") return amount;
  if (typeof amount === "object" && "product" in amount) {
    const printed = amount.product.filter((a): a is number => typeof a === "number");
    if (printed.some((n) => n < 0)) {
      const rest = amount.product.filter((a) => typeof a !== "number");
      return printed.reduce((n, a) => n * a, 1) * amountValue({ product: rest }, ctx, each);
    }
  }
  if (typeof amount === "object" && ("powerOf" in amount || "toughnessOf" in amount) && amount.doubling === true) {
    return signedAmountValue(amount, ctx, each);
  }
  return amountValue(amount, ctx, each);
}

/** {@link amountValue} before its clamp: the calculation as written. */
function signedAmountValue(
  amount: EffectAmount,
  ctx: ResolutionContext,
  each?: PlayerId,
): number {
  if (amount === "x") return ctx.x;
  if (typeof amount === "number") return amount;
  if ("triggerValue" in amount) return ctx.triggerValue;
  if ("chosenNumber" in amount) return ctx.chosenNumberOfSource() ?? Number.NaN;
  if ("lifeTotal" in amount) {
    return ctx.lifeTotalOf(amount.lifeTotal === "each" ? (each ?? ctx.controller) : ctx.controller);
  }
  if ("half" in amount) {
    // Signed, like the rest of this function: `amountValue` clamps the
    // result, and a value setting power keeps its sign (rule 107.1b).
    const n = signedAmountValue(amount.half, ctx, each) / 2;
    return amount.round === "up" ? Math.ceil(n) : Math.floor(n);
  }
  if ("countInGraveyard" in amount) return ctx.countInGraveyard(amount.countInGraveyard);
  if ("ifCondition" in amount) {
    return signedAmountValue(ctx.conditionMet(amount.ifCondition) ? amount.then : amount.else, ctx, each);
  }
  if ("product" in amount) {
    return amount.product.reduce<number>((n, a) => n * signedAmountValue(a, ctx, each), 1);
  }
  if ("sum" in amount) {
    return amount.sum.reduce<number>((n, a) => n + signedAmountValue(a, ctx, each), 0);
  }
  if ("difference" in amount) {
    const a = signedAmountValue(amount.difference[0], ctx, each);
    const b = signedAmountValue(amount.difference[1], ctx, each);
    return amount.absolute === true ? Math.abs(a - b) : Math.max(0, a - b);
  }
  if ("librarySize" in amount) {
    return ctx.librarySizeOf(amount.librarySize === "each" ? (each ?? ctx.controller) : ctx.controller);
  }
  if ("graveyardSize" in amount) {
    return ctx.graveyardSizeOf(amount.graveyardSize === "each" ? (each ?? ctx.controller) : ctx.controller);
  }
  if ("cardsInHand" in amount) {
    if (amount.cardsInHand === "each") return ctx.handSizeOf(each ?? ctx.controller);
    return ctx.playersInScope(amount.cardsInHand).reduce((n, p) => n + ctx.handSizeOf(p), 0);
  }
  if ("colorsOf" in amount) {
    const ref = resolveAmountRef(amount.colorsOf, ctx);
    return ref === undefined ? 0 : ctx.colorsOf(ref).length;
  }
  if ("colorsAmong" in amount) {
    return ctx.colorsAmong(amount.colorsAmong, amount.excludeSelf === true ? [ctx.source] : []);
  }
  if ("distinctTokenNames" in amount) return ctx.distinctTokenNames(amount.distinctTokenNames);
  if ("votesFor" in amount) return ctx.votesFor(amount.votesFor);
  if ("cardTypesInGraveyard" in amount) return ctx.cardTypesInGraveyard(amount.cardTypesInGraveyard);
  if ("opponentsAttacked" in amount) return ctx.opponentsAttacked();
  if ("attackingPlayer" in amount) return ctx.creaturesAttacking(each ?? ctx.controller);
  if ("damageDealtThisTurn" in amount) {
    return ctx.damageDealtThisTurn(ctx.playersInScope(amount.who ?? "you"), amount.combat, amount.colors);
  }
  if ("turnHistory" in amount) {
    return ctx.turnHistoryCount(amount.turnHistory, ctx.playersInScope(amount.who ?? "you"), amount.filter);
  }
  if ("thisWay" in amount) {
    const players =
      amount.who === undefined
        ? undefined
        : amount.who === "each"
          ? [each ?? ctx.controller]
          : ctx.playersInScope(amount.who);
    const done = ctx.thisWay(amount.thisWay, players, amount.filter);
    if (amount.cardTypes === true) return ctx.cardTypesAmong(done);
    const valueOf = (entry: ThisWayEntry): number =>
      amount.sumOf === undefined ? entry.count : ctx.powerAmong([entry], amount.sumOf);
    if (amount.perPlayer === "greatest") {
      const byPlayer = new Map<PlayerId, number>();
      for (const entry of done) byPlayer.set(entry.player, (byPlayer.get(entry.player) ?? 0) + valueOf(entry));
      return Math.max(0, ...byPlayer.values());
    }
    return done.reduce((n, entry) => n + valueOf(entry), 0);
  }
  if ("countPlayers" in amount) return ctx.playersInScope(amount.countPlayers).length;
  if ("lifeLostThisWay" in amount) {
    return ctx.lifeLostThisWay(amount.who === undefined ? undefined : ctx.playersInScope(amount.who));
  }
  if ("turnStat" in amount) {
    if (amount.target !== undefined) {
      const ref = ctx.targets[amount.target];
      return ref?.kind === "player" ? ctx.turnStatOf(ref.player, amount.turnStat) : 0;
    }
    return ctx
      .playersInScope(amount.who ?? "you")
      .reduce((n, p) => n + ctx.turnStatOf(p, amount.turnStat), 0);
  }
  if ("castThisTurn" in amount) {
    const each = ctx
      .playersInScope(amount.who ?? "you")
      .map((p) => ctx.castThisTurnOf(p, amount.castThisTurn, amount.greatest));
    return amount.greatest === undefined ? each.reduce((n, v) => n + v, 0) : Math.max(0, ...each);
  }
  if ("playerCounters" in amount) {
    return ctx
      .playersInScope(amount.who ?? "you")
      .reduce((n, p) => n + ctx.playerCountersOf(p, amount.playerCounters), 0);
  }
  if ("playersWithTurnStat" in amount) {
    return ctx
      .playersInScope(amount.who)
      .filter((p) => ctx.turnStatOf(p, amount.playersWithTurnStat) > 0).length;
  }
  if ("opponentsControllingFewer" in amount) {
    return ctx.opponentsControllingFewer(amount.opponentsControllingFewer);
  }
  if ("devotionTo" in amount) {
    // "Your devotion to that color" — the colour the `add-mana` reading it
    // is making (Nykthos); with none chosen there's no colour to be devoted to.
    const color = amount.devotionTo === "that-color" ? ctx.manaColor : amount.devotionTo;
    return color === undefined || color === "C" ? 0 : ctx.devotionTo(color);
  }
  if ("greatestCommanderManaValue" in amount) return ctx.greatestCommanderManaValue();
  if ("creaturesDiedThisTurn" in amount) return ctx.creaturesDiedThisTurn(amount.anyController === true);
  if ("powerOf" in amount) {
    const ref = resolveAmountRef(amount.powerOf, ctx);
    return ref === undefined ? 0 : ctx.powerOf(ref);
  }
  if ("toughnessOf" in amount) {
    const ref = resolveAmountRef(amount.toughnessOf, ctx);
    return ref === undefined ? 0 : ctx.toughnessOf(ref);
  }
  if ("countersOn" in amount) {
    const ref = resolveAmountRef(amount.countersOn, ctx);
    return ref === undefined ? 0 : ctx.countersOf(ref, amount.counter);
  }
  if ("manaValueOf" in amount) {
    const ref = resolveAmountRef(amount.manaValueOf, ctx);
    return ref === undefined ? 0 : ctx.manaValueOf(ref);
  }
  if ("manaSpentOf" in amount) {
    const ref = resolveAmountRef(amount.manaSpentOf, ctx);
    return ref === undefined ? 0 : ctx.manaSpentOf(ref);
  }
  if ("colorsSpentOf" in amount) {
    const ref = resolveAmountRef(amount.colorsSpentOf, ctx);
    return ref === undefined ? 0 : ctx.colorsSpentOf(ref);
  }
  if ("commanderCasts" in amount) return ctx.commanderCastsBy(ctx.controller);
  if ("commanderCastsOf" in amount) {
    const ref = resolveAmountRef(amount.commanderCastsOf, ctx);
    return ref === undefined ? 0 : ctx.commanderCastsOf(ref);
  }
  if ("aggregate" in amount) {
    return Math.max(0, ctx.aggregate(amount, amount.excludeSelf === true ? [ctx.source] : []));
  }
  const except: ObjectId[] = [];
  if (amount.excludeSelf === true) except.push(ctx.source);
  if (amount.excludeTarget !== undefined) {
    const ref = ctx.targets[amount.excludeTarget];
    if (ref?.kind === "object") except.push(ref.object);
  }
  if (amount.forTarget !== undefined) {
    const ref = ctx.targets[amount.forTarget];
    if (ref?.kind !== "player" || illegalSlot(amount.forTarget, ctx)) return 0;
    return ctx.countMatching(amount.countOf, except, ref.player) * (amount.times ?? 1);
  }
  return ctx.countMatching(amount.countOf, except) * (amount.times ?? 1);
}

/** The player a `controlledByTarget` slot points at, or `undefined` when the
 * effect isn't scoped to one — in which case the mass effect keeps reading
 * `controlledBy` from the effect's own controller, as it always has. */
function scopedController(
  slot: number | undefined,
  ctx: ResolutionContext,
): PlayerId | undefined {
  if (slot === undefined) return undefined;
  const ref = ctx.targets[slot];
  return ref === undefined ? undefined : ctx.controllerOf(ref);
}

/** The first token this resolution has created that is still on the
 * battlefield — living weapon's "then attach this to it". */
function createdThisWay(ctx: ResolutionContext): TargetRef | undefined {
  const made = ctx.thisWay("created").find((entry) => !entry.departed);
  return made === undefined ? undefined : { kind: "object", object: made.object };
}

/** Imperative escape hatch for a spell or ability the vocab can't express. */
export type SpellResolver = (ctx: ResolutionContext) => void;

function resolveAmountRef(ref: AmountRef, ctx: ResolutionContext): TargetRef | undefined {
  if (ref === "sacrificed") {
    return ctx.sacrificed === undefined ? undefined : { kind: "object", object: ctx.sacrificed };
  }
  if (ref === "tapped") {
    return ctx.tapped === undefined ? undefined : { kind: "object", object: ctx.tapped };
  }
  // A read: a trigger object — or the source — that has moved on since is
  // read as it last existed, which the context's lookups do (rule 608.2h).
  // Only acting on one needs it to be the same object still (`sourceLost`,
  // `triggerObjectLost`): Juri, Master of the Revue reanimated in response
  // still deals the power it died with.
  if (ref === "trigger-object") {
    return ctx.triggerObject === undefined ? undefined : { kind: "object", object: ctx.triggerObject };
  }
  if (ref === "source") return { kind: "object", object: ctx.source };
  // A read, so a delayed trigger's carried target is read even once it has
  // changed zones (by last-known information), though not acted on.
  if (typeof ref === "number" && ctx.readTargets !== undefined) return ctx.readTargets[ref];
  return resolveEffectTarget(ref, ctx);
}

function resolveEffectTarget(
  ref: EffectTargetRef,
  ctx: ResolutionContext,
): TargetRef | undefined {
  if (ref === "source") {
    return ctx.sourceLost === true ? undefined : { kind: "object", object: ctx.source };
  }
  if (ref === "trigger-object") {
    return ctx.triggerObject !== undefined && ctx.triggerObjectLost !== true
      ? { kind: "object", object: ctx.triggerObject }
      : undefined;
  }
  return ctx.targets[ref];
}

/** Whether slot `ref` held a target found illegal as the spell or ability
 * began to resolve — see `ResolutionContext.illegalTargets` (rule 608.2b). */
function illegalSlot(ref: EffectTargetRef, ctx: ResolutionContext): boolean {
  return typeof ref === "number" && ctx.illegalTargets?.includes(ref) === true;
}

/** The one player `ref` names, or `undefined` for nobody — see
 * {@link EffectPlayerRef}. */
function resolveEnterAttacking(
  how: EnterAttacking | undefined,
  ctx: ResolutionContext,
): ResolvedEnterAttacking | undefined {
  if (how === undefined || how === "choose") return how;
  return { player: effectPlayer(how.player, ctx), orTheirPlaneswalker: how.orTheirPlaneswalker === true };
}

function effectPlayer(ref: EffectPlayerRef, ctx: ResolutionContext): PlayerId | undefined {
  if (ref === "you") return ctx.controller;
  if (typeof ref === "object") {
    if (illegalSlot(ref.target, ctx)) return undefined;
    const target = ctx.targets[ref.target];
    return target?.kind === "player" ? target.player : undefined;
  }
  return ctx.playersInScope(ref)[0];
}

/** Keys under which an {@link EffectSpec} nests another one. Those are bound
 * when *they* are applied, in the context they're applied in — a delayed
 * trigger's effect when it fires, a `then` after the step before it. */
const NESTED_EFFECT_KEYS: ReadonlySet<string> = new Set([
  "effect",
  "effects",
  "then",
  "else",
  "otherwise",
  "modes",
  // An `each-player-may`'s follow-ups, which apply once everyone has
  // answered — Braids, Arisen Nightmare's "each opponent may sacrifice a
  // permanent that shares a card type with it" reads the permanent its
  // controller sacrificed in answer, which only exists by then.
  "ifDid",
  "ifDidnt",
]);

/** Is this a `NumCompare` whose `n` is an `{ amount }` operand? Written out
 * rather than imported from `filter.ts`, which `effects.ts` only ever needs
 * types from. */
function isAmountCompare(value: Record<string, unknown>): boolean {
  const n = value["n"];
  return "op" in value && typeof n === "object" && n !== null && "amount" in n;
}

/** Card data is immutable, so whether a spec holds anything to bind is worth
 * remembering: nearly every resolution asks, and nearly none do. */
const dynamicCompareMemo = new WeakMap<object, boolean>();

function containsDynamicCompare(value: unknown): boolean {
  if (value === null || typeof value !== "object") return false;
  const memo = dynamicCompareMemo.get(value);
  if (memo !== undefined) return memo;
  const found = Array.isArray(value)
    ? value.some(containsDynamicCompare)
    : isAmountCompare(value as Record<string, unknown>) ||
      "sharesCardTypeWith" in value ||
      "sharesCreatureTypeWith" in value ||
      Object.entries(value).some(
        ([key, v]) => !NESTED_EFFECT_KEYS.has(key) && containsDynamicCompare(v),
      );
  dynamicCompareMemo.set(value, found);
  return found;
}

/**
 * `spec` with every filter comparison's `{ amount }` operand (see
 * `DynamicOperand`) replaced by its value **now**, in this resolution.
 *
 * This is how "with lesser mana value" reaches every filter an effect hands
 * to the engine — a sweep's, a search's, a count's — without each of those
 * growing a context parameter: by the time the filter leaves this function
 * it is plain numbers again. It runs as each effect applies, not once per
 * resolution, so "sacrifice a creature, then search for one with mana value
 * one greater" reads the sacrifice that has just happened. `{ own }` operands
 * are left alone: they're about each object matched, not about the effect.
 *
 * `CardFilter.sharesCardTypeWith` is bound the same way, to the card types the
 * sacrificed permanent had as it last existed on the battlefield, or the
 * trigger object's (an `anyOf` of one `typesAnyOf`, so an `anyOf` the filter
 * already had still applies).
 */
export function bindDynamicCompares(spec: EffectSpec, ctx: ResolutionContext): EffectSpec {
  if (!containsDynamicCompare(spec)) return spec;
  const walk = (value: unknown): unknown => {
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(walk);
    const record = value as Record<string, unknown>;
    if (isAmountCompare(record)) {
      const operand = record["n"] as { readonly amount: EffectAmount };
      return { ...record, n: amountValue(operand.amount, ctx) };
    }
    // A `whileSource` impulse permission's filter is its source's static
    // ability, read as the card is cast (Maralen's "the number of Elves and
    // Faeries you control"), so it stays unbound — `impulsePlayable` counts it.
    const liveFilter = record["kind"] === "impulse-exile" && record["whileSource"] === true;
    const walked = Object.fromEntries(
      Object.entries(record).map(([key, v]) => [
        key,
        NESTED_EFFECT_KEYS.has(key) || (liveFilter && key === "filter") ? v : walk(v),
      ]),
    );
    if ("sharesCreatureTypeWith" in walked) {
      // "Shares a creature type with it" (Heirloom Blade): the trigger
      // object's creature types as it last existed — the changeling marker
      // included, which `hasSubtype` reads as "any creature type" — ANDed
      // with whatever `anyOf` the filter already had. None: nothing shares.
      const { sharesCreatureTypeWith: _with, anyOf, ...rest } = walked as CardFilter;
      const subtypes =
        ctx.triggerObject === undefined
          ? []
          : ctx
              .subtypesOf({ kind: "object", object: ctx.triggerObject })
              .filter((s) => s === EVERY_CREATURE_TYPE || isCreatureType(s));
      const shares: CardFilter = { subtypes, ...(anyOf !== undefined ? { anyOf } : {}) };
      return bindShares({ ...rest, anyOf: [shares] });
    }
    return bindShares(walked);
  };
  // "Shares a card type with it": the sacrificed permanent's types as it
  // last existed, or the trigger object's — the spell whose casting fired
  // the trigger — ANDed with whatever `anyOf` the filter already had.
  const bindShares = (walked: Record<string, unknown>): unknown => {
    if (!("sharesCardTypeWith" in walked)) return walked;
    const { sharesCardTypeWith: withWhat, anyOf, ...rest } = walked as CardFilter;
    const other = withWhat === "trigger-object" ? ctx.triggerObject : ctx.sacrificed;
    const types = other === undefined ? [] : ctx.cardTypesOf({ kind: "object", object: other });
    const shares: CardFilter = { typesAnyOf: types, ...(anyOf !== undefined ? { anyOf } : {}) };
    return { ...rest, anyOf: [shares] };
  };
  return walk(spec) as EffectSpec;
}

/** Does `amount` read a per-player value (`lifeTotal: "each"`, a `thisWay`
 * of `who: "each"`), so a scoped effect has to read it once for each player? */
function readsEachPlayer(amount: EffectAmount): boolean {
  if (typeof amount !== "object") return false;
  if ("lifeTotal" in amount) return amount.lifeTotal === "each";
  if ("librarySize" in amount) return amount.librarySize === "each";
  if ("graveyardSize" in amount) return amount.graveyardSize === "each";
  if ("cardsInHand" in amount) return amount.cardsInHand === "each";
  if ("attackingPlayer" in amount) return true;
  if ("thisWay" in amount) return amount.who === "each";
  if ("half" in amount) return readsEachPlayer(amount.half);
  if ("product" in amount) return amount.product.some(readsEachPlayer);
  if ("sum" in amount) return amount.sum.some(readsEachPlayer);
  if ("difference" in amount) return amount.difference.some(readsEachPlayer);
  if ("ifCondition" in amount) return readsEachPlayer(amount.then) || readsEachPlayer(amount.else);
  return false;
}

/** A `mill` / `discard` `target`: the player in a target slot, or every
 * player a scope names (`"you"` is a scope of one). */
function scopedOrTargetedPlayers(
  target: number | PlayerScope,
  ctx: ResolutionContext,
): readonly TargetRef[] {
  if (typeof target === "number") {
    const ref = ctx.targets[target];
    return ref === undefined ? [] : [ref];
  }
  if (target === "you") return [{ kind: "player", player: ctx.controller }];
  return ctx.playersInScope(target).map((player) => ({ kind: "player", player }));
}

/**
 * Whether a `may`'s action can be done in full, which is the only way it is
 * offered. A player can't mill more cards than their library holds, and if
 * given the choice can't choose to (rule 701.17b — Daggerfang Duo with one
 * card left can't choose to mill two); "you may discard a card. If you do,
 * draw a card" with an empty hand is the same, or it would draw for nothing
 * (Rydia, Summoner of Mist). Only the action chosen is asked about, a
 * sequence's first step: "draw, then discard" is possible from an empty hand.
 */
function mayBeDone(effect: EffectSpec, ctx: ResolutionContext): boolean {
  const action = effect.kind === "sequence" ? effect.effects[0] : effect;
  if (action === undefined) return true;
  if (action.kind === "mill" || action.kind === "discard") {
    return scopedOrTargetedPlayers(action.target, ctx).every((ref) => {
      if (ref.kind !== "player") return true;
      const has = action.kind === "mill" ? ctx.librarySizeOf(ref.player) : ctx.handSizeOf(ref.player);
      return has >= amountValue(action.amount, ctx, ref.player);
    });
  }
  return true;
}

/** Whether `spell` targets a permanent or a player — one of its targets was
 * a player or on the battlefield when it was chosen. A slot filled
 * automatically isn't a target (rule 115.1). */
function targetsPermanentOrPlayer(spell: SpellSnapshot): boolean {
  const auto = new Set(spell.autoTargetSlots ?? []);
  return (spell.targets ?? []).some(
    (t, i) =>
      t !== undefined &&
      !auto.has(i) &&
      (t.kind === "player" || spell.targetZones?.[i] === "battlefield"),
  );
}

/** The most splits of "N mana in any combination of …" offered as the modes
 * of one choice; past it, each unit's colour is asked in turn. */
const MAX_MANA_SPLIT_MODES = 35;

/**
 * An `add-mana` with a choice in it, as a spell or an ability on the stack
 * adds it (rule 608.2d): the choice as `modal` decisions over concrete
 * `add-mana`s, or `null` when there's nothing to choose — a fixed type, one
 * of each (`all`), or a list that names a single type or none.
 *
 * "One mana of any color" and "N mana of any one color" are one choice of
 * colour, for every unit; "N mana in any combination of …" is one choice of
 * split when there are few enough of them (`MAX_MANA_SPLIT_MODES` — a
 * Culling Ritual's ten units over {B} and {G} are eleven; two of any colour
 * are fifteen), and otherwise each
 * unit's colour in turn. An amount read for "that color" (`{ devotionTo:
 * "that-color" }`) is read for each colour on offer. What the mana carries
 * (a spend restriction, a rider, `persists`) rides on every mode; the rest of
 * the instruction — damage to its controller, `also` — follows once.
 */
function addManaChoice(spec: Extract<EffectSpec, { kind: "add-mana" }>, ctx: ResolutionContext): EffectSpec | null {
  const mana = spec.mana === "chosen" ? (ctx.chosenColorOfSource() ?? "any-color") : spec.mana;
  let colors: readonly ManaType[];
  let same: boolean;
  if (mana === "any-color") {
    colors = MANA_COLORS;
    same = true;
  } else if (mana === "commander-identity") {
    colors = ctx.commanderColors();
    same = false;
  } else if (typeof mana !== "object" || "all" in mana || "eachColorAmong" in mana) {
    return null;
  } else if ("oneOf" in mana) {
    colors = mana.oneOf;
    same = mana.same === true;
  } else {
    colors = ctx.manaTypesOf(mana);
    same = mana.same === true;
  }
  if (colors.length < 2) return null;
  const { kind: _kind, painToController, also, mana: _mana, amount: _amount, ...carried } = spec;
  const symbols = (types: readonly ManaType[]): string =>
    types.length === 0 ? "no mana" : types.map((t) => `{${t}}`).join("");
  const steps: EffectSpec[] = [];
  if (same) {
    const amounts = colors.map((color) => Math.max(0, amountValue(spec.amount, { ...ctx, manaColor: color })));
    // No mana whichever is chosen: nothing to ask.
    if (amounts.every((n) => n === 0)) return null;
    const modes = colors.map((color, i): ModeOption => {
      const n = amounts[i];
      return {
        text: `Add ${n > 8 ? `${n} {${color}}` : symbols(Array<ManaType>(n).fill(color))}.`,
        effect: { kind: "add-mana", ...carried, mana: color, amount: n },
      };
    });
    steps.push({ kind: "modal", minModes: 1, maxModes: 1, modes });
  } else {
    const n = Math.max(0, amountValue(spec.amount, ctx));
    if (n === 0) return null;
    const splits = splitCountAtMost(colors.length, n, MAX_MANA_SPLIT_MODES + 1);
    if (splits <= MAX_MANA_SPLIT_MODES) {
      const modes = manaSplits(colors, n).map(
        (split): ModeOption => ({
          text: `Add ${symbols(split)}.`,
          effect: { kind: "add-mana", ...carried, mana: { all: split }, amount: 1 },
        }),
      );
      steps.push({ kind: "modal", minModes: 1, maxModes: 1, modes });
    } else {
      const modes = colors.map(
        (color): ModeOption => ({
          text: `Add {${color}}.`,
          effect: { kind: "add-mana", ...carried, mana: color, amount: 1 },
        }),
      );
      const units = Math.min(n, MAX_ASKED_MANA_UNITS);
      for (let i = 0; i < units; i += 1) steps.push({ kind: "modal", minModes: 1, maxModes: 1, modes });
    }
  }
  if ((painToController ?? 0) > 0 || also !== undefined) {
    // The rest of the instruction, once: no mana of its own.
    steps.push({
      kind: "add-mana",
      mana: "C",
      amount: 0,
      ...(painToController !== undefined ? { painToController } : {}),
      ...(also !== undefined ? { also } : {}),
    });
  }
  return steps.length === 1 ? steps[0] : { kind: "sequence", effects: steps };
}

/** The most units of "N mana in any combination" asked one at a time —
 * `Game.MAX_EFFECT_INSTANCES`, which caps what any one effect mints. */
const MAX_ASKED_MANA_UNITS = 1000;

const MANA_COLORS: readonly ManaType[] = ["W", "U", "B", "R", "G"];

/** How many multisets of `amount` units over `kinds` types there are,
 * stopping at `cap`. */
function splitCountAtMost(kinds: number, amount: number, cap: number): number {
  let n = 1;
  for (let i = 1; i < kinds; i += 1) {
    n = (n * (amount + i)) / i;
    if (n >= cap) return cap;
  }
  return Math.round(n);
}

/** Every multiset of `amount` units drawn from `types`, the first type's
 * share largest first — "three mana in any combination of {R} and/or {G}":
 * RRR, RRG, RGG, GGG. */
function manaSplits(types: readonly ManaType[], amount: number): ManaType[][] {
  if (amount === 0) return [[]];
  const [first, ...rest] = types;
  if (first === undefined) return [];
  if (rest.length === 0) return [Array<ManaType>(amount).fill(first)];
  const out: ManaType[][] = [];
  for (let take = amount; take >= 0; take -= 1) {
    for (const tail of manaSplits(rest, amount - take)) out.push([...Array<ManaType>(take).fill(first), ...tail]);
  }
  return out;
}

export function applyEffectSpec(unbound: EffectSpec, ctx: ResolutionContext): void {
  // A player won mid-resolution (Laboratory Maniac's draw, Thassa's Oracle):
  // the game is over (rule 104.1), and the rest of the instructions with it.
  // (Optional only for the bare contexts some tests hand in.)
  if (ctx.gameOver?.() === true) return;
  const spec = bindDynamicCompares(unbound, ctx);
  switch (spec.kind) {
    case "sequence": {
      // One instruction over several objects: nothing in it stops to ask.
      if (spec.simultaneous === true) {
        ctx.simultaneously(() => {
          for (const step of spec.effects) applyEffectSpec(step, ctx);
        });
        return;
      }
      // Instructions are followed in order (rule 608.2c), so a step that
      // stops to ask someone something — which cards to discard, what to
      // sacrifice, whether to pay — is answered before the next step happens.
      // The steps after it wait in `GameState.suspendedResolutions`. A
      // decision that was already pending when the sequence began isn't one
      // of its steps', and holds nothing up.
      const pendingBefore = ctx.decisionPending();
      const steps = spec.effects;
      for (let i = 0; i < steps.length; i += 1) {
        const parked = ctx.parkedCount();
        applyEffectSpec(steps[i], ctx);
        if (i + 1 < steps.length && !pendingBefore && ctx.decisionPending()) {
          const rest = steps.slice(i + 1);
          // Beneath whatever the step parked of its own — a nested sequence's
          // remainder is still that step, which finishes first.
          ctx.resumeAfterDecisions(
            rest.length === 1 ? rest[0] : { kind: "sequence", effects: rest },
            parked,
          );
          return;
        }
      }
      return;
    }
    case "for-each-target": {
      // One step per member still there, each binding it to slot `from` —
      // as steps of a `sequence`, so a member's effect that stops to ask
      // something holds the rest until it's answered.
      const members: number[] = [];
      for (let index = spec.from; index < ctx.targets.length; index += 1) {
        if (ctx.targets[index] !== undefined) members.push(index);
      }
      if (members.length === 0) return;
      // Target players each told to do the same thing act — and make their
      // choices — in APNAP order, whatever order they were targeted in (rule
      // 101.4): Priest of Forgotten Gods' "any number of target players each
      // … sacrifice a creature" asks the active player first, then the
      // rest in turn order.
      if (members.every((index) => ctx.targets[index]?.kind === "player")) {
        const order = ctx.playersInScope("each-player");
        const rank = (index: number): number => {
          const target = ctx.targets[index];
          const at = target?.kind === "player" ? order.indexOf(target.player) : -1;
          return at < 0 ? order.length : at;
        };
        members.sort((a, b) => rank(a) - rank(b));
      }
      const steps: EffectSpec[] = members.map((index) => ({
        kind: "for-target",
        from: spec.from,
        index,
        effect: spec.effect,
      }));
      applyEffectSpec(
        { kind: "sequence", effects: steps, ...(spec.simultaneous === true ? { simultaneous: true } : {}) },
        ctx,
      );
      return;
    }
    case "for-target": {
      applyEffectSpec(spec.effect, ctx.withTargetAt(spec.from, spec.index));
      return;
    }
    case "for-each-convoker": {
      const remaining = spec.remaining ?? Array.from({ length: ctx.convokerCount() }, (_, index) => index);
      if (remaining.length === 0) return;
      const one = (index: number): EffectSpec => ({ kind: "for-convoker", index, effect: spec.effect });
      if (remaining.length === 1) {
        applyEffectSpec(one(remaining[0]), ctx);
        return;
      }
      // One at a time, in the order the controller chooses: which next — the
      // rest after it, asked again.
      ctx.chooseModes(
        1,
        1,
        remaining.map((index) => ({
          text: ctx.convokerLabel(index),
          effect: {
            kind: "sequence",
            effects: [one(index), { ...spec, remaining: remaining.filter((i) => i !== index) }],
          },
        })),
      );
      return;
    }
    case "for-convoker":
      applyEffectSpec(spec.effect, ctx.withConvoker(spec.index));
      return;
    case "choose-opponent": {
      const opponents = ctx.playersInScope("each-opponent");
      if (opponents.length === 0) return;
      if (opponents.length === 1) {
        applyEffectSpec(spec.then, ctx.aboutPlayer(opponents[0]));
        return;
      }
      ctx.chooseModes(
        1,
        1,
        opponents.map((player) => ({
          text: `Choose ${player.charAt(0).toUpperCase()}${player.slice(1)}`,
          effect: { kind: "about-player", player, effect: spec.then },
        })),
      );
      return;
    }
    case "about-player":
      if (!ctx.playersInScope("each-player").includes(spec.player)) return;
      applyEffectSpec(spec.effect, ctx.aboutPlayer(spec.player));
      return;
    case "choose-permanents":
      ctx.choosePermanents(
        spec.filter,
        spec.min ?? 0,
        amountValue(spec.upTo, ctx),
        spec.then,
        spec.prompt,
        spec.exceptSource,
      );
      return;
    case "damage-divided-evenly": {
      // A member found illegal as it resolved isn't there (rule 608.2b), and
      // doesn't count toward the division.
      const members = ctx.targets.slice(spec.from).filter((t): t is TargetRef => t !== undefined);
      if (members.length === 0) return;
      ctx.dealDamageToEach(members, Math.floor(amountValue(spec.amount, ctx) / members.length));
      return;
    }
    case "damage": {
      if (spec.toControllerOfTarget !== undefined) {
        const of = ctx.targets[spec.toControllerOfTarget];
        const controller = of === undefined ? undefined : ctx.controllerOf(of);
        if (controller !== undefined) {
          ctx.dealDamage(
            { kind: "player", player: controller },
            amountValue(spec.amount, ctx, controller),
            spec.from,
          );
        }
        return;
      }
      if (spec.who !== undefined) {
        ctx.dealDamageScoped(spec.who, (player) => amountValue(spec.amount, ctx, player), spec.from);
        return;
      }
      const target =
        spec.toTriggerRecipient === true
          ? ctx.triggerRecipient()
          : spec.target !== undefined
            ? ctx.targets[spec.target]
            : undefined;
      if (target !== undefined) {
        const each = target.kind === "player" ? target.player : undefined;
        ctx.dealDamage(target, amountValue(spec.amount, ctx, each), spec.from);
      }
      return;
    }
    case "add-mana": {
      // What a permanent tapped for mana produced is known only to the
      // triggered mana ability the engine applies there (`tapped-for-mana`).
      if (spec.mana === "produced") return;
      // A spell or an ability on the stack adding mana with a choice in it
      // asks as the mana is added (rule 608.2d); a mana ability's choice came
      // with its activation (`ResolutionContext.manaAbility`).
      if (ctx.manaAbility !== true) {
        const asked = addManaChoice(spec, ctx);
        if (asked !== null) {
          applyEffectSpec(asked, ctx);
          return;
        }
      }
      // "Each player adds …" (`who`) — the controller otherwise.
      for (const player of spec.who === undefined ? [ctx.controller] : ctx.playersInScope(spec.who)) {
        // "Any color in your commander's color identity" — nothing at all
        // with no colour there (no commander, or a colourless one).
        if (spec.mana === "commander-identity") {
          const colors = ctx.commanderColors();
          if (colors.length > 0) ctx.addMana(player, { oneOf: colors }, amountValue(spec.amount, ctx), spec);
        } else if (typeof spec.mana === "object" && "all" in spec.mana) {
          const times = amountValue(spec.amount, ctx);
          for (const type of spec.mana.all) ctx.addMana(player, type, times, spec);
        } else if (typeof spec.mana === "object" && "eachColorAmong" in spec.mana) {
          // One of each colour among them, `amount` times over.
          const times = amountValue(spec.amount, ctx);
          for (const type of ctx.manaTypesOf(spec.mana)) ctx.addMana(player, type, times, spec);
        } else ctx.addMana(
          player,
          // "The chosen color" — resolved against the source permanent; falls
          // back to the payer's choice if the label isn't a colour (it always
          // is on the cards that use this).
          spec.mana === "chosen" ? (ctx.chosenColorOfSource() ?? "any-color") : spec.mana,
          amountValue(spec.amount, ctx),
          spec,
        );
      }
      if (spec.painToController !== undefined && spec.painToController > 0) {
        ctx.dealDamage(
          { kind: "player", player: ctx.controller },
          spec.painToController,
        );
      }
      if (spec.also !== undefined) applyEffectSpec(spec.also, ctx);
      return;
    }
    case "draw": {
      if (spec.target !== undefined) {
        const ref = ctx.targets[spec.target];
        if (ref?.kind === "player") ctx.draw(ref.player, amountValue(spec.amount, ctx, ref.player));
        return;
      }
      for (const player of ctx.playersInScope(spec.who ?? "you")) {
        ctx.draw(player, amountValue(spec.amount, ctx, player));
      }
      return;
    }
    case "discard-hand":
      for (const player of ctx.playersInScope(spec.who)) ctx.discardHand(player);
      return;
    case "gain-life": {
      const gained = amountValue(spec.amount, ctx);
      if (spec.toControllerOfTarget !== undefined) {
        const of = ctx.targets[spec.toControllerOfTarget];
        const who = of === undefined ? undefined : ctx.controllerOf(of);
        if (who !== undefined) ctx.gainLife(who, gained);
        return;
      }
      if (spec.who === undefined || spec.who === "you") ctx.gainLife(ctx.controller, gained);
      else if (!readsEachPlayer(spec.amount)) ctx.changeLifeScoped(spec.who, gained);
      else {
        for (const p of ctx.playersInScope(spec.who)) ctx.gainLife(p, amountValue(spec.amount, ctx, p));
      }
      return;
    }
    case "lose-life": {
      if (spec.target !== undefined && spec.toControllerOfTarget === undefined) {
        // A per-player amount is the target's own: Peer into the Abyss's
        // "target player … loses half their life".
        const ref = ctx.targets[spec.target];
        if (ref?.kind === "player") ctx.loseLife(ref.player, amountValue(spec.amount, ctx, ref.player));
        return;
      }
      const life = amountValue(spec.amount, ctx);
      if (spec.toControllerOfTarget !== undefined) {
        const of = ctx.targets[spec.toControllerOfTarget];
        const who = of === undefined ? undefined : ctx.controllerOf(of);
        if (who !== undefined) ctx.loseLife(who, life);
        return;
      }
      if (spec.who === undefined || spec.who === "you") ctx.loseLife(ctx.controller, life);
      else if (!readsEachPlayer(spec.amount)) ctx.changeLifeScoped(spec.who, -life);
      else {
        // "Each opponent loses half their life": each one's own amount,
        // read as their turn in APNAP order comes.
        for (const p of ctx.playersInScope(spec.who)) ctx.loseLife(p, amountValue(spec.amount, ctx, p));
      }
      return;
    }
    case "tap": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.tapPermanent(target, spec.doesntUntapNext === true);
      return;
    }
    case "untap": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target === undefined) return;
      // "That player untaps it": no such player, nothing is untapped.
      if (spec.by !== undefined && effectPlayer(spec.by, ctx) === undefined) return;
      ctx.untapPermanent(target);
      return;
    }
    case "put-on-bottom-of-library": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.putOnBottomOfLibrary(target);
      return;
    }
    case "destroy": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.destroyPermanent(target, spec.cantBeRegenerated === true);
      return;
    }
    case "destroy-all":
      ctx.destroyAll(spec.filter, spec.onlyControllersDamagedBySource, spec.cantBeRegenerated === true);
      return;
    case "regenerate": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.regenerate(target);
      return;
    }
    case "regenerate-all":
      ctx.regenerateAll(spec.filter);
      return;
    case "return-to-hand-all":
      ctx.returnToHandAll(spec.filter);
      return;
    case "exile-all":
      ctx.exileAll(spec.filter);
      return;
    case "damage-all":
      ctx.damageAll(
        spec.filter,
        amountValue(spec.amount, ctx),
        spec.exceptSource === true,
        spec.whose === undefined ? undefined : ctx.playersInScope(spec.whose),
        spec.from,
      );
      return;
    case "creatures-damage-controllers":
      ctx.creaturesDamageControllers(spec.filter, amountValue(spec.amount, ctx));
      return;
    case "sacrifice": {
      const exceptId = spec.exceptSource ? ctx.source : undefined;
      if (spec.who === "target") {
        const target = ctx.targets[0];
        if (target?.kind === "player") {
          ctx.sacrificePermanents({ player: target.player }, spec.filter, spec.count, exceptId);
        }
      } else {
        ctx.sacrificePermanents(spec.who, spec.filter, spec.count, exceptId);
      }
      return;
    }
    case "sacrifice-source": {
      // "Sacrifice ~. If you do, …" — the tail only applies when the sacrifice
      // actually happened (rule 603.4-adjacent: the source may have been
      // removed in response).
      const sacrificed = ctx.sacrificeSource();
      if (sacrificed && spec.then !== undefined) {
        // "The sacrificed creature" in the tail is the source, as it was.
        applyEffectSpec(spec.then, ctx.withSacrificed(ctx.source));
      }
      return;
    }
    case "fight": {
      const a = resolveEffectTarget(spec.a, ctx);
      const b = resolveEffectTarget(spec.b, ctx);
      if (a !== undefined && b !== undefined) ctx.fight(a, b, spec.oneSided === true);
      return;
    }
    case "counter": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.counterSpell(target, spec.into);
      return;
    }
    case "gain-control": {
      // Rule 608.2b: nothing is done to an illegal target, and an illegal
      // player target does nothing — so either one stops the whole change.
      const target = resolveEffectTarget(spec.target, ctx);
      if (target === undefined || illegalSlot(spec.target, ctx)) return;
      const player = effectPlayer(spec.who ?? "you", ctx);
      if (player !== undefined) ctx.gainControl(target, spec.untilEndOfTurn, player, spec.whileSource === true);
      return;
    }
    case "gain-control-all": {
      const who = spec.who === "owner" ? "owner" : effectPlayer(spec.who ?? "you", ctx);
      if (who === undefined) return;
      if (spec.controlledBy !== undefined) {
        const from = ctx.playersInScope(spec.controlledBy)[0];
        if (from === undefined) return;
        ctx.gainControlAll(spec.filter, spec.untilEndOfTurn, who, spec.exceptSource === true, from);
        return;
      }
      ctx.gainControlAll(spec.filter, spec.untilEndOfTurn, who, spec.exceptSource === true);
      return;
    }
    case "rotate-control":
      ctx.rotateControl(spec.filter, spec.direction, spec.exceptSource === true);
      return;
    case "cant-be-sacrificed": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.grantCantBeSacrificed(target, spec.duration);
      return;
    }
    case "return-to-hand": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.returnToHand(target, spec.from);
      return;
    }
    case "exile": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.exileObject(target, spec.untilSourceLeaves === true, spec.withCounters, spec.mayCast, spec.linked === true);
      return;
    }
    case "return-exiled-by-source": {
      if (spec.linked === "hand") {
        for (const card of ctx.cardsExiledWithSource()) ctx.returnToHand({ kind: "object", object: card }, "exile");
        return;
      }
      // Each case below that puts something onto the battlefield may stop
      // first to ask an "as this enters" choice (a Clone's copy — rule
      // 614.12); it moved nothing, and runs again once that's answered.
      const parked = ctx.parkedCount();
      if (ctx.returnExiledBySource(spec.linked === "battlefield")) ctx.resumeAfterDecisions(spec, parked);
      return;
    }
    case "choose-creature-type":
      ctx.chooseCreatureType(spec.then);
      return;
    case "put-onto-battlefield": {
      const target = resolveEffectTarget(spec.target, ctx);
      const parked = ctx.parkedCount();
      if (target !== undefined) {
        let under = spec.underYourControl === true ? ctx.controller : undefined;
        if (spec.under !== undefined) {
          // Someone else puts it there, under their control: an illegal
          // target — the card or that player — and nothing moves (608.2b).
          if (illegalSlot(spec.target, ctx)) return;
          under = effectPlayer(spec.under, ctx);
          if (under === undefined) return;
        }
        const asked = ctx.putOntoBattlefield(
          target,
          under,
          spec.enterTapped === true,
          spec.withCounters,
          spec.exileIfItWouldLeave === true,
          spec.transformed === true,
          spec.setTypes !== undefined || spec.addSubtypes !== undefined
            ? {
                ...(spec.setTypes !== undefined ? { setTypes: spec.setTypes } : {}),
                ...(spec.addSubtypes !== undefined ? { addSubtypes: spec.addSubtypes } : {}),
              }
            : undefined,
        );
        if (asked) ctx.resumeAfterDecisions(spec, parked);
      }
      return;
    }
    case "exile-graveyard": {
      if (spec.target === "each-player" || spec.target === "each-opponent") {
        // "Exile all graveyards" is one move, not one per player.
        const scope = spec.target;
        ctx.simultaneously(() => {
          for (const player of ctx.playersInScope(scope)) {
            ctx.exileGraveyard({ kind: "player", player }, spec.filter);
          }
        });
        return;
      }
      const target =
        spec.target === "you"
          ? ({ kind: "player", player: ctx.controller } as const)
          : ctx.targets[spec.target];
      if (target !== undefined) ctx.exileGraveyard(target, spec.filter);
      return;
    }
    case "sacrifice-all":
      ctx.sacrificeAll(ctx.playersInScope(spec.who), spec.filter);
      return;
    case "put-exiled-this-way-onto-battlefield": {
      const parked = ctx.parkedCount();
      if (ctx.putExiledThisWayOntoBattlefield()) ctx.resumeAfterDecisions(spec, parked);
      return;
    }
    case "put-arrived-onto-battlefield": {
      const parked = ctx.parkedCount();
      if (ctx.putArrivedOntoBattlefield(spec.count)) ctx.resumeAfterDecisions(spec, parked);
      return;
    }
    case "reveal-until-count": {
      let progress = spec.progress;
      if (progress === undefined) {
        const n = amountValue(spec.count, ctx);
        if (n <= 0) return;
        progress = ctx.revealUntilCount(ctx.controller, spec.filter, n);
      }
      const parked = ctx.parkedCount();
      if (ctx.putOntoBattlefieldTogether(progress.found)) {
        ctx.resumeAfterDecisions({ ...spec, progress }, parked);
        return;
      }
      const found = new Set(progress.found);
      ctx.placeRevealed(
        ctx.controller,
        progress.revealed.filter((id) => !found.has(id)),
        spec.rest,
        false,
      );
      return;
    }
    case "flicker": {
      const target = spec.target;
      const refs: EffectTargetRef[] =
        typeof target !== "object"
          ? [target]
          : "from" in target
            ? Array.from({ length: Math.max(0, ctx.targets.length - target.from) }, (_unused, i) => target.from + i)
            : [...target];
      const targets: TargetRef[] = [];
      for (const ref of refs) {
        const target = resolveEffectTarget(ref, ctx);
        if (target !== undefined) targets.push(target);
      }
      const parked = ctx.parkedCount();
      const returning = ctx.flicker(targets, {
        ...(spec.thenCounters !== undefined ? { thenCounters: spec.thenCounters } : {}),
        ...(spec.underYourControl === true ? { underYourControl: true } : {}),
        ...(spec.returnAt !== undefined ? { returnAt: spec.returnAt } : {}),
        ...(spec.returnText !== undefined ? { returnText: spec.returnText } : {}),
        ...(spec.transformed === true ? { transformed: true } : {}),
        ...(spec.tapped === true ? { tapped: true } : {}),
        ...(spec.target === "source" ? { fromSource: true } : {}),
      });
      if (returning !== null) ctx.resumeAfterDecisions(returning, parked);
      return;
    }
    case "return-flickered": {
      const parked = ctx.parkedCount();
      const asked = ctx.returnFlickered(
        spec.link,
        spec.thenCounters,
        spec.underYourControl === true,
        spec.transformed === true,
        spec.tapped === true,
      );
      if (asked) ctx.resumeAfterDecisions(spec, parked);
      return;
    }
    case "grant-flashback": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.grantFlashback(target);
      return;
    }
    case "grant-flashback-all":
      ctx.grantFlashbackAll(spec.filter);
      return;
    case "grant-graveyard-cast": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.grantGraveyardCast(target);
      return;
    }
    case "mill": {
      for (const target of scopedOrTargetedPlayers(spec.target, ctx)) {
        ctx.mill(target, amountValue(spec.amount, ctx, target.kind === "player" ? target.player : undefined));
      }
      return;
    }
    case "exile-from-library": {
      // One instruction, so one move: "exile the top three cards" — or the
      // top card of each player's library (Pako) — puts them all into exile
      // at once, a single event for "whenever one or more cards are put into
      // exile" (rule 603.2c). Each count is read before anything moves.
      const plan = scopedOrTargetedPlayers(spec.whose ?? "you", ctx).map((target) => ({
        target,
        count:
          spec.allBut !== undefined
            ? { allBut: spec.allBut }
            : {
                top: amountValue(
                  spec.amount ?? 1,
                  ctx,
                  target.kind === "player" ? target.player : undefined,
                ),
              },
      }));
      ctx.simultaneously(() => {
        for (const { target, count } of plan) ctx.exileFromLibrary(target, count, spec.withCounters);
      });
      return;
    }
    case "delayed-trigger": {
      let controller = ctx.controller;
      if (spec.controller !== undefined) {
        const of = ctx.targets[spec.controller.controllerOfTarget];
        // The target may already be gone (Arcane Denial counters first);
        // `controllerOf` reads last-known information for exactly this.
        const who = of === undefined ? undefined : ctx.controllerOf(of);
        if (who === undefined) return;
        controller = who;
      }
      if (typeof spec.at === "object" && "dealsCombatDamage" in spec.at) {
        const watched = resolveEffectTarget(spec.at.dealsCombatDamage, ctx);
        if (watched?.kind !== "object") return;
        ctx.delayTrigger({ dealsCombatDamage: watched.object }, spec.effect, spec.text, controller);
        return;
      }
      if (typeof spec.at === "object" && "nextSpell" in spec.at) {
        ctx.delayTrigger({ nextSpell: spec.at.nextSpell }, spec.effect, spec.text, controller);
        return;
      }
      if (typeof spec.at === "object") {
        // "When it dies": only a permanent can die, so there must be one to
        // watch as this applies.
        const watched = resolveEffectTarget(spec.at.leaves, ctx);
        if (watched?.kind !== "object") return;
        ctx.delayTrigger(
          {
            leaves: watched.object,
            to: spec.at.to,
            ...(spec.at.thisTurn === true ? { thisTurn: true } : {}),
          },
          spec.effect,
          spec.text,
          controller,
        );
        return;
      }
      if (spec.about !== undefined) {
        const done = ctx.thisWay(spec.about).map((e) => ({ kind: "object", object: e.object }) as const);
        if (done.length > 0) ctx.delayTrigger(spec.at, spec.effect, spec.text, controller, done);
        return;
      }
      ctx.delayTrigger(spec.at, spec.effect, spec.text, controller);
      return;
    }
    case "enters-with-counters": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.entersWithCounters(target, spec.counter, amountValue(spec.amount, ctx));
      return;
    }
    case "cast-now":
      applyCastNowSpec(spec, ctx);
      return;
    case "choose-exiled-to-play":
      ctx.chooseExiledToPlay(spec.filter, spec.free === true);
      return;
    case "allow-cast-from-exile": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.allowCastFromExile(target, spec.free === true, spec.laterTurns === true);
      return;
    }
    case "earthbend": {
      // Earthbend N: "Target land you control becomes a 0/0 creature with
      // haste that's still a land. Put N +1/+1 counters on it. When it dies
      // or is exiled, return it to the battlefield tapped." The steps are
      // applied in that order within one resolution, so the 0/0 never faces
      // state-based actions before its counters arrive.
      const target = spec.target;
      applyEffectSpec(
        {
          kind: "animate",
          target,
          power: 0,
          toughness: 0,
          addTypes: ["creature"],
          addSubtypes: [],
          keywords: ["haste"],
          duration: "permanent",
        },
        ctx,
      );
      applyEffectSpec({ kind: "add-counter", target, counter: "+1/+1", amount: spec.amount }, ctx);
      applyEffectSpec(
        {
          kind: "delayed-trigger",
          at: { leaves: target, to: ["graveyard", "exile"] },
          effect: { kind: "put-onto-battlefield", target: "trigger-object", enterTapped: true },
          text: "When it dies or is exiled, return it to the battlefield tapped.",
        },
        ctx,
      );
      return;
    }
    case "sacrifice-target": {
      const target =
        spec.target === "source"
          ? ({ kind: "object", object: ctx.source } as const)
          : spec.target === "trigger-object"
            ? ctx.triggerObject === undefined
              ? undefined
              : ({ kind: "object", object: ctx.triggerObject } as const)
            : ctx.targets[spec.target];
      if (target !== undefined) ctx.sacrificeTarget(target);
      return;
    }
    case "put-on-library": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.putOnLibrary(target, spec.position);
      return;
    }
    case "return-from-graveyard": {
      const parked = ctx.parkedCount();
      const asked = ctx.returnFromGraveyard(
        spec.filter,
        spec.destination,
        spec.count,
        spec.enterTapped ?? false,
        spec.withCounters,
        {
          ...(spec.from === "all-graveyards" ? { allGraveyards: true } : {}),
          ...(spec.enterAs !== undefined ? { enterAs: spec.enterAs } : {}),
        },
      );
      if (asked) ctx.resumeAfterDecisions(spec, parked);
      return;
    }
    case "discard": {
      for (const target of scopedOrTargetedPlayers(spec.target, ctx)) {
        ctx.discardCards(
          target,
          amountValue(spec.amount, ctx, target.kind === "player" ? target.player : undefined),
          spec.random === true,
          spec.unlessOne,
        );
      }
      return;
    }
    case "modify-pt": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) {
        ctx.modifyPt(
          target,
          ptChangeValue(spec.power, ctx),
          ptChangeValue(spec.toughness, ctx),
          spec.duration,
        );
      }
      return;
    }
    case "modify-pt-all":
      ctx.modifyPtAll(
        spec.filter,
        ptChangeValue(spec.power, ctx),
        ptChangeValue(spec.toughness, ctx),
        spec.duration,
        spec.exceptSource === true,
        scopedController(spec.controlledByTarget, ctx),
      );
      return;
    case "double-pt-all":
      ctx.doublePtAll(spec.filter, spec.duration);
      return;
    case "grant-player-hexproof":
      ctx.grantPlayerHexproof(spec.who ?? "you");
      return;
    case "populate":
      ctx.populate();
      return;
    case "amass": {
      const chosen = spec.onto === undefined ? undefined : ctx.targets[spec.onto];
      if (spec.onto !== undefined && chosen?.kind !== "object") return;
      ctx.amass(
        amountValue(spec.amount, ctx),
        spec.creatureType,
        chosen?.kind === "object" ? chosen.object : undefined,
      );
      return;
    }
    case "monstrosity":
      ctx.monstrosity(amountValue(spec.amount, ctx));
      return;
    case "add-counter-all": {
      const scopeTo = scopedController(spec.controlledByTarget, ctx);
      if (spec.controlledByTarget !== undefined && scopeTo === undefined) return;
      ctx.addCounterAll(
        spec.filter,
        spec.counter,
        spec.amount === "own-toughness" ? spec.amount : amountValue(spec.amount, ctx),
        spec.exceptSource === true,
        scopeTo,
      );
      return;
    }
    case "double-counters-all":
      ctx.doubleCountersAll(spec.filter, spec.counterKind);
      return;
    case "double-counters": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.doubleCounters(target, spec.counter);
      return;
    }
    case "grant-keyword-all":
      ctx.grantKeywordAll(spec.filter, spec.keyword, spec.duration, spec.exceptSource === true);
      return;
    case "connive": {
      const target = resolveEffectTarget(spec.target, ctx);
      // One that has left — or is back as a new object — still connives, as
      // it last existed: its last controller draws and discards, and nothing
      // gets a counter (rule 701.50b). A context that only reads it (a
      // `for-each-convoker`'s) says which it was.
      const read = target ?? (typeof spec.target === "number" ? ctx.readTargets?.[spec.target] : undefined);
      if (read?.kind !== "object") return;
      if (spec.discardsSince === undefined) {
        const player = ctx.controllerOf(read);
        const n = amountValue(spec.amount ?? 1, ctx);
        if (player === undefined || n <= 0) return;
        const since = ctx.nextEventSeq();
        ctx.draw(player, n);
        const parked = ctx.parkedCount();
        const pendingBefore = ctx.decisionPending();
        ctx.discardCards({ kind: "player", player }, n, false);
        const rest = { ...spec, discardsSince: since };
        // No actions happen in between (the ruling): the counters wait only
        // for the discard to be chosen.
        if (!pendingBefore && ctx.decisionPending()) {
          ctx.resumeAfterDecisions(rest, parked);
          return;
        }
        applyEffectSpec(rest, ctx);
        return;
      }
      const nonland = ctx.thisWay("discarded", undefined, { notTypes: ["land"] }, spec.discardsSince);
      const amount = nonland.reduce((n, e) => n + e.count, 0);
      if (amount > 0 && target !== undefined) ctx.addCounter(target, "+1/+1", amount);
      return;
    }
    case "remove-counter": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.removeCounter(target, spec.counter, amountValue(spec.amount, ctx));
      return;
    }
    case "add-counter": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target === undefined) return;
      // "That player puts a counter on it": no such player, no counter.
      const by = spec.by === undefined ? undefined : effectPlayer(spec.by, ctx);
      if (spec.by !== undefined && by === undefined) return;
      ctx.addCounter(target, spec.counter, amountValue(spec.amount, ctx), by);
      return;
    }
    case "proliferate":
      ctx.proliferate(spec.then ?? null);
      return;
    case "grant-keyword": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) {
        ctx.grantKeyword(target, spec.keyword, spec.duration);
      }
      return;
    }
    case "player-effect":
      ctx.addPlayerEffect({
        owner: ctx.controller,
        expires: spec.duration === "end-of-turn" ? { kind: "end-of-turn" } : { kind: "your-next-turn" },
        ...(spec.reduceSpells !== undefined
          ? {
              reduceSpells: {
                applies: spec.reduceSpells.applies,
                reduceGeneric: amountValue(spec.reduceSpells.reduceGeneric, ctx),
              },
            }
          : {}),
        ...(spec.castFromHandFree !== undefined ? { castFromHandFree: spec.castFromHandFree } : {}),
        ...(spec.damageTo !== undefined
          ? {
              damageTo: {
                players: ctx.playersInScope(spec.damageTo.who),
                multiplier: spec.damageTo.multiplier,
                ...(spec.damageTo.permanentsToo === true ? { permanentsToo: true } : {}),
              },
            }
          : {}),
        ...(spec.cantLoseGame !== undefined ? { cantLoseGame: ctx.playersInScope(spec.cantLoseGame) } : {}),
        ...(spec.cantWinGame !== undefined ? { cantWinGame: ctx.playersInScope(spec.cantWinGame) } : {}),
        ...(spec.cantLoseLife !== undefined ? { cantLoseLife: ctx.playersInScope(spec.cantLoseLife) } : {}),
        ...(spec.damageLifeFloor !== undefined
          ? {
              damageLifeFloor: {
                players: ctx.playersInScope(spec.damageLifeFloor.who),
                floor: spec.damageLifeFloor.floor,
              },
            }
          : {}),
        ...(spec.tokenMultiplier !== undefined ? { tokenMultiplier: spec.tokenMultiplier } : {}),
      });
      return;
    case "win-game":
      ctx.winGame(ctx.controller);
      return;
    case "lose-game": {
      if (spec.target !== undefined) {
        const target = ctx.targets[spec.target];
        if (target?.kind === "player") ctx.loseGame([target.player]);
        return;
      }
      ctx.loseGame(ctx.playersInScope(spec.who ?? "you"));
      return;
    }
    case "flip-coin": {
      // One flip, or flips until one is lost — each flip's branch applied as
      // it lands, since what a win does can matter to the next.
      for (let i = 0; i < MAX_FLIPS; i += 1) {
        const won = ctx.flipCoin();
        const branch = won ? spec.won : spec.lost;
        if (branch !== undefined) applyEffectSpec(branch, ctx);
        if (!won || spec.untilLose !== true) return;
      }
      return;
    }
    case "prohibit": {
      if (spec.target !== undefined) {
        const target = resolveEffectTarget(spec.target, ctx);
        if (target !== undefined) ctx.prohibit([], target, false, true);
        return;
      }
      const slot = typeof spec.who === "number" ? ctx.targets[spec.who] : undefined;
      const players =
        spec.who === undefined
          ? [ctx.controller]
          : typeof spec.who === "number"
            ? slot?.kind === "player"
              ? [slot.player]
              : []
            : ctx.playersInScope(spec.who);
      ctx.prohibit(
        players,
        undefined,
        typeof spec.spells === "object" ? { ...spec.spells, you: ctx.controller } : spec.spells === true,
        spec.abilities === true,
      );
      return;
    }
    case "restrict": {
      if (spec.filter !== undefined) {
        ctx.restrict(undefined, spec.filter, spec.restrictions);
        return;
      }
      const target = spec.target === undefined ? undefined : resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.restrict(target, undefined, spec.restrictions, spec.duration);
      return;
    }
    case "attack-despite-defender": {
      if (spec.filter !== undefined) {
        ctx.attackDespiteDefender(undefined, spec.filter);
        return;
      }
      const target = spec.target === undefined ? undefined : resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.attackDespiteDefender(target, undefined);
      return;
    }
    case "damage-by-toughness": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.damageByToughness(target);
      return;
    }
    case "attack-random-opponent": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target?.kind !== "object") return;
      const chosen = ctx.attackRandomOpponent(target.object, spec.notAttackedLastCombat === true);
      if (!chosen && spec.else !== undefined) applyEffectSpec(spec.else, ctx);
      return;
    }
    case "put-in-command-zone": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.putInCommandZone(target);
      return;
    }
    case "exchange-life-toughness": {
      const target = resolveEffectTarget(spec.target, ctx);
      const player = effectPlayer(spec.player ?? "you", ctx);
      if (target !== undefined && player !== undefined) ctx.exchangeLifeToughness(target, player);
      return;
    }
    case "grant-triggered": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.grantTriggered(target, spec.ability, spec.duration);
      return;
    }
    case "grant-triggered-all":
      ctx.grantTriggeredAll(spec.filter, spec.ability, spec.duration);
      return;
    case "grant-activated": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.grantActivated(target, spec.ability, spec.duration);
      return;
    }
    case "grant-activated-all":
      ctx.grantActivatedAll(spec.filter, spec.ability, spec.duration);
      return;
    case "lose-abilities-all":
      ctx.loseAbilitiesAll(spec.filter, spec.duration);
      return;
    case "lose-abilities": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) {
        ctx.loseAbilities(target, {
          loseLandTypes: spec.loseLandTypes === true,
          activated: spec.activated ?? [],
          duration: spec.duration,
        });
      }
      return;
    }
    case "gift":
      ctx.giveGift(spec.gift);
      return;
    case "take-extra-turn": {
      const target = spec.target === undefined ? undefined : ctx.targets[spec.target];
      if (spec.target !== undefined && target?.kind !== "player") return;
      ctx.takeExtraTurn(target?.kind === "player" ? target.player : ctx.controller);
      return;
    }
    case "storm": {
      const spell = spec.of === "trigger-object" ? ctx.triggerObject : ctx.source;
      if (spell !== undefined) ctx.storm(spell);
      return;
    }
    case "cascade": {
      if (spec.finish !== undefined) {
        ctx.finishCascade(spec.finish);
        return;
      }
      const found = ctx.cascade(ctx.controller, ctx.source);
      if (found === null) return;
      const finish = (cast: boolean): EffectSpec => ({
        kind: "cascade",
        finish: { hit: found.hit, exiled: found.exiled, cast },
      });
      ctx.chooseModes(
        0,
        1,
        [{ text: `Cast ${found.name} without paying its mana cost`, effect: finish(true) }],
        finish(false),
      );
      return;
    }
    case "reveal-until":
      applyRevealUntil(spec, ctx);
      return;
    case "exile-spell-as-it-resolves":
      if (spec.applyFirst !== undefined) ctx.finishExiledAsItResolves(spec.applyFirst.spell, spec.applyFirst.feather);
      else ctx.exileTriggerSpellAsItResolves(spec.returnAtNextEndStep === true);
      return;
    case "copy-spell": {
      const newTargets = spec.newTargets === true;
      // "Copy it for each …": the count, read as this applies.
      const times =
        spec.count === undefined ? 1 : Math.min(Math.max(0, amountValue(spec.count, ctx)), MAX_COPY_COUNT);
      let copied = false;
      if (spec.target === "trigger-spell" || spec.spell !== undefined) {
        const spell = spec.spell?.snapshot ?? ctx.triggerSpell();
        if (spell !== null && (spec.ifTargets === undefined || targetsPermanentOrPlayer(spell))) {
          if (spec.forEachItCouldTarget !== undefined) {
            ctx.copyTriggerSpellForEach(spell, spec.forEachItCouldTarget);
            copied = true;
          } else {
            const retargetTo = spec.retargetTo === undefined ? undefined : resolveEffectTarget(spec.retargetTo, ctx);
            // A slot whose target has gone, or a source that has left, has
            // nothing to aim the copy at.
            if (spec.retargetTo === undefined || retargetTo !== undefined) {
              for (let i = 0; i < times; i += 1) {
                const made = ctx.copyTriggerSpell(spell, {
                  newTargets,
                  ...(retargetTo !== undefined ? { retargetTo } : {}),
                  ...(spec.spell !== undefined ? { original: spec.spell.original } : {}),
                });
                copied = copied || made;
              }
            }
          }
        }
      } else {
        // "Copy this spell" — the spell now resolving, still on the stack.
        const target =
          spec.target === "source" ? ({ kind: "object", object: ctx.source } as const) : ctx.targets[spec.target];
        if (target !== undefined) {
          for (let i = 0; i < times; i += 1) ctx.copySpell(target, newTargets);
          copied = times > 0;
        }
      }
      if (!copied && spec.otherwise !== undefined) applyEffectSpec(spec.otherwise, ctx);
      return;
    }
    case "copy-ability": {
      if (spec.target === "trigger-ability") {
        ctx.copyAbility("trigger-ability", spec.newTargets === true);
        return;
      }
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.copyAbility(target, spec.newTargets === true);
      return;
    }
    case "additional-combat":
      ctx.additionalCombat(
        spec.afterThisPhase === true ? { withMain: spec.withMain === true } : undefined,
      );
      return;
    case "additional-upkeep-steps":
      ctx.additionalUpkeeps(amountValue(spec.amount, ctx));
      return;
    case "additional-land-drop":
      ctx.additionalLandDrops(spec.amount);
      return;
    case "shuffle-library":
      ctx.shuffleLibrary();
      return;
    case "damage-divided":
      ctx.division.forEach((amount, i) => {
        const target = ctx.targets[spec.from + i];
        if (target !== undefined && amount > 0) ctx.dealDamage(target, amount);
      });
      return;
    case "untap-all":
      ctx.untapAll(spec.filter, scopedController(spec.controlledByTarget, ctx), spec.exceptSource === true);
      return;
    case "exert": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.exert(target, spec.asItAttacks === true);
      return;
    }
    case "tap-all":
      ctx.tapAll(spec.filter);
      return;
    case "animate": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) {
        ctx.animate(target, {
          power: amountValue(spec.power, ctx),
          toughness: amountValue(spec.toughness, ctx),
          addTypes: spec.addTypes,
          addSubtypes: spec.addSubtypes,
          setSubtypes: spec.setSubtypes,
          setColors: spec.setColors,
          loseAbilities: spec.loseAbilities,
          keywords: spec.keywords ?? [],
          duration: spec.duration,
        });
      }
      return;
    }
    case "add-types": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) {
        ctx.addTypes(target, spec.addTypes ?? [], spec.addSubtypes ?? [], spec.duration);
      }
      return;
    }
    case "animate-all":
      ctx.animateAll(spec.filter, {
        power: amountValue(spec.power, ctx),
        toughness: amountValue(spec.toughness, ctx),
        addTypes: spec.addTypes ?? [],
        addSubtypes: spec.addSubtypes ?? [],
        keywords: spec.keywords ?? [],
        duration: spec.duration,
      });
      return;
    case "change-text": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.changeText(target);
      return;
    }
    case "create-token":
      // A per-player count ("its controller creates a token for each
      // creature destroyed this way") is read for each player the scope
      // names, each creating their own.
      if (spec.who !== undefined && spec.who !== "target-controller" && readsEachPlayer(spec.count)) {
        for (const player of ctx.playersInScope(spec.who)) {
          ctx
            .aboutPlayer(player)
            .createToken(
              spec.token,
              amountValue(spec.count, ctx, player) * ctx.stackMultiplier,
              "that-player",
              spec.tapped === true,
              spec.sacrificeAtEndStep === true,
              spec.gainUntilEndOfTurn,
              spec.goadedForGame === true,
              spec.thenCounters === undefined
                ? undefined
                : { kind: spec.thenCounters.kind, amount: amountValue(spec.thenCounters.amount, ctx, player) },
              spec.basePt === undefined
                ? undefined
                : [amountValue(spec.basePt.power, ctx, player), amountValue(spec.basePt.toughness, ctx, player)],
              resolveEnterAttacking(spec.attacking, ctx.aboutPlayer(player)),
              spec.separate === true,
              spec.exileAtEndStep === true,
              spec.attacksThisCombat === true,
            );
        }
        return;
      }
      ctx.createToken(
        spec.token,
        amountValue(spec.count, ctx) * ctx.stackMultiplier,
        spec.who,
        spec.tapped === true,
        spec.sacrificeAtEndStep === true,
        spec.gainUntilEndOfTurn,
        spec.goadedForGame === true,
        spec.thenCounters === undefined
          ? undefined
          : { kind: spec.thenCounters.kind, amount: amountValue(spec.thenCounters.amount, ctx) },
        spec.basePt === undefined
          ? undefined
          : [amountValue(spec.basePt.power, ctx), amountValue(spec.basePt.toughness, ctx)],
        resolveEnterAttacking(spec.attacking, ctx),
        spec.separate === true,
        spec.exileAtEndStep === true,
        spec.attacksThisCombat === true,
      );
      return;
    case "for-each-player": {
      // Player by player, as a `sequence`'s steps: one whose effect stops to
      // ask something is answered before the next player's happens, the rest
      // parked with the players fixed as they were when this began.
      const players = spec.remaining ?? ctx.playersInScope(spec.who);
      const pendingBefore = ctx.decisionPending();
      for (let i = 0; i < players.length; i += 1) {
        const parked = ctx.parkedCount();
        applyEffectSpec(spec.effect, ctx.aboutPlayer(players[i]));
        if (i + 1 < players.length && !pendingBefore && ctx.decisionPending()) {
          ctx.resumeAfterDecisions({ ...spec, remaining: players.slice(i + 1) }, parked);
          return;
        }
      }
      return;
    }
    case "create-token-copy": {
      const copy = (of: ObjectId, count: number): void =>
        ctx.createTokenCopy(of, count, {
          gainsHaste: spec.gainsHaste ?? false,
          sacrificeAtEndStep: spec.sacrificeAtEndStep ?? false,
          exileAtEndStep: spec.exileAtEndStep ?? false,
          notLegendary: spec.notLegendary ?? false,
          under: spec.who === "you" ? ctx.controller : undefined,
          ...(spec.basePt
            ? { basePt: [ptSetValue(spec.basePt[0], ctx), ptSetValue(spec.basePt[1], ctx)] as const }
            : {}),
          ...(spec.gainUntilEndOfTurn ? { gainUntilEndOfTurn: spec.gainUntilEndOfTurn } : {}),
          ...(spec.exceptions ? { exceptions: spec.exceptions } : {}),
          ...(spec.asCard === true ? { asCard: true } : {}),
          ...(spec.tapped === true ? { tapped: true } : {}),
          ...(spec.attacking !== undefined ? { attacking: resolveEnterAttacking(spec.attacking, ctx) } : {}),
          ...(spec.exileAtEndOfCombat === true ? { exileAtEndOfCombat: true } : {}),
        });
      if (spec.of === "entered-together") {
        for (const { object, count } of ctx.enteredTogether ?? []) copy(object, spec.count * count);
        return;
      }
      if (typeof spec.of === "object") {
        // Which permanents, fixed before the first copy enters (rule 608.2h):
        // a copy made here doesn't count itself.
        for (const { object, count } of ctx.permanentsMatching(spec.of.each)) copy(object, spec.count * count);
        return;
      }
      let of: ObjectId | undefined;
      if (spec.of === "source") of = ctx.source;
      else if (spec.of === "trigger-object") of = ctx.triggerObject;
      else {
        const ref = ctx.targets[spec.of];
        of = ref?.kind === "object" ? ref.object : undefined;
      }
      if (of !== undefined) copy(of, spec.count * ctx.stackMultiplier);
      return;
    }
    case "conditional": {
      const branch = ctx.conditionMet(spec.condition) ? spec.then : spec.else;
      if (branch !== undefined) applyEffectSpec(branch, ctx);
      return;
    }
    case "attach": {
      const target = spec.target === "created" ? createdThisWay(ctx) : ctx.targets[spec.target];
      if (target === undefined) return;
      if (spec.attachment === undefined) {
        ctx.attach(target);
        return;
      }
      const attachment = resolveEffectTarget(spec.attachment, ctx);
      if (attachment !== undefined) ctx.attach(target, attachment);
      return;
    }
    case "transform": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.transform(target);
      return;
    }
    case "become-copy": {
      // Acting on `target` needs it to be the same object still (rule
      // 400.7); `of` is only read, so one that has left is read as it last
      // existed (rule 608.2h).
      const target = resolveEffectTarget(spec.target, ctx);
      const of = resolveAmountRef(spec.of, ctx);
      if (target?.kind === "object" && of?.kind === "object") ctx.becomeCopy(target.object, of.object, spec.exceptions);
      return;
    }
    case "day-night":
      ctx.setDayNight(spec.value);
      return;
    case "become-monarch":
      ctx.becomeMonarch(spec.who);
      return;
    case "get-energy":
      ctx.getEnergy(spec.amount, spec.who);
      return;
    case "add-player-counters": {
      const players =
        spec.target !== undefined
          ? scopedOrTargetedPlayers(spec.target, ctx).flatMap((ref) =>
              ref.kind === "player" ? [ref.player] : [],
            )
          : ctx.playersInScope(spec.who ?? "you");
      for (const player of players) {
        ctx.addPlayerCounters(player, spec.counter, amountValue(spec.amount, ctx, player));
      }
      return;
    }
    case "create-emblem":
      ctx.createEmblem(spec.text, spec.static);
      return;
    case "prevent-all-combat-damage":
      ctx.preventAllCombatDamage(spec.by);
      return;
    case "prevent-damage": {
      const ref = ctx.targets[spec.target];
      if (ref !== undefined) {
        ctx.preventDamage(ref, amountValue(spec.amount, ctx), spec.combatOnly ?? false);
      }
      return;
    }
    case "modal":
      // Announced as the ability went on the stack: those modes, in printed
      // order.
      if (spec.announced === true && ctx.announcedModes !== undefined) {
        // Each mode with targets of its own reads just those, as slots 0…
        // (rule 700.2): the ability's own targets come first, then each
        // chosen mode's, in listed order — so a mode whose target has gone
        // illegal still does whatever else it says, as a modal spell's does.
        const counts = ctx.announcedModes.map((i) => spec.modes[i]?.targets?.length ?? 0);
        let offset = ctx.targets.length - counts.reduce((a, b) => a + b, 0);
        ctx.announcedModes.forEach((i, k) => {
          const mode = spec.modes[i];
          const count = counts[k];
          const modeCtx = count > 0 ? ctx.withTargetSlice(offset, count) : ctx;
          offset += count;
          if (mode !== undefined) applyEffectSpec(mode.effect, modeCtx);
        });
        return;
      }
      ctx.chooseModes(
        spec.minModes,
        amountValue(spec.maxModes, ctx),
        spec.modes,
        undefined,
        undefined,
        spec.notChosenThisTurn === true,
      );
      return;
    case "may": {
      // An action that can't be done in full isn't offered: it is as though
      // the player declined (see `mayBeDone`).
      if (!mayBeDone(spec.effect, ctx)) {
        if (spec.else !== undefined) applyEffectSpec(spec.else, ctx);
        return;
      }
      const chosenEffect: EffectSpec =
        spec.then === undefined
          ? spec.effect
          : { kind: "sequence", effects: [spec.effect, spec.then] };
      ctx.chooseModes(
        0,
        1,
        [{ text: spec.prompt, effect: chosenEffect }],
        spec.else,
        spec.cost,
        spec.oncePerTurn === true,
        spec.costLife === undefined && spec.costEnergy === undefined
          ? undefined
          : {
              ...(spec.costLife !== undefined ? { life: amountValue(spec.costLife, ctx) } : {}),
              ...(spec.costEnergy !== undefined ? { energy: amountValue(spec.costEnergy, ctx) } : {}),
            },
        spec.aboutThatPlayer === true ? effectPlayer("that-player", ctx) : undefined,
      );
      return;
    }
    case "sacrifice-all-but":
      for (const player of ctx.playersInScope(spec.who)) {
        ctx.sacrificeAllBut(player, spec.keep, spec.filter);
      }
      return;
    case "encore":
      ctx.encore();
      return;
    case "goad": {
      const forGame = spec.forGame === true;
      if (spec.who !== undefined) {
        for (const player of ctx.playersInScope(spec.who)) ctx.goadCreaturesOf(player, forGame);
        return;
      }
      if (spec.filter !== undefined) {
        ctx.goadMatching(spec.filter, forGame);
        return;
      }
      const ref = spec.target === undefined ? undefined : ctx.targets[spec.target];
      if (ref?.kind === "player") ctx.goadCreaturesOf(ref.player, forGame);
      else if (ref?.kind === "object") ctx.goadCreature(ref, forGame);
      return;
    }
    case "suspect": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.suspect(target);
      return;
    }
    case "unsuspect": {
      if (spec.filter !== undefined) {
        ctx.unsuspect({ filter: spec.filter });
        return;
      }
      const target = spec.target === undefined ? undefined : resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.unsuspect(target);
      return;
    }
    case "attack-requirement":
      ctx.addAttackRequirement(spec.filter, spec.otherThanYou);
      return;
    case "impulse-exile": {
      const whoseIf = spec.whoseIf;
      const players =
        spec.whose !== undefined && spec.whose !== "you"
          ? scopedOrTargetedPlayers(spec.whose, ctx).flatMap((ref) => (ref?.kind === "player" ? [ref.player] : []))
          : whoseIf !== undefined
            ? [ctx.controller]
            : undefined;
      ctx.impulseExile(amountValue(spec.amount, ctx), spec.duration, spec.castOnly === true, {
        ...(players !== undefined
          ? {
              players:
                whoseIf === undefined ? players : players.filter((p) => ctx.aboutPlayer(p).conditionMet(whoseIf)),
            }
          : {}),
        ...(spec.whileSource === true ? { whileSource: true } : {}),
        ...(spec.oncePerTurn === true ? { oncePerTurn: true } : {}),
        ...(spec.faceDown === true ? { faceDown: true } : {}),
        ...(spec.playedBy === "owner" ? { ownerPlays: true } : {}),
        choose: spec.choose,
        yourTurnOnly: spec.yourTurnOnly,
        gate: spec.gate,
        ...(spec.filter !== undefined ? { filter: spec.filter } : {}),
        ...(spec.free !== undefined ? { free: spec.free } : {}),
        ...(spec.spendAs !== undefined ? { spendAs: spec.spendAs } : {}),
      });
      return;
    }
    case "unless":
      ctx.unless(
        spec.chooser,
        // A generic amount is fixed as the effect applies.
        spec.options.map((option): BoundUnlessOption => {
          if (!("payGeneric" in option)) return option;
          const n = amountValue(option.payGeneric, ctx);
          return { pay: `{${n}}`, text: option.text.split("{X}").join(`{${n}}`) };
        }),
        spec.otherwise,
      );
      return;
    case "each-player-may":
      applyEachPlayerMay(spec, ctx);
      return;
    case "reflexive-trigger":
      ctx.reflexiveTrigger(
        spec.targets,
        spec.effect,
        spec.text,
        spec.value === undefined ? undefined : amountValue(spec.value, ctx),
      );
      return;
    case "ward":
      ctx.ward(spec.cost);
      return;
    case "scry":
      ctx.scry(amountValue(spec.amount, ctx), false, spec.then);
      return;
    case "reveal-top": {
      if (spec.of === undefined) {
        ctx.revealTop(spec.then);
        return;
      }
      const of = ctx.targets[spec.of.ownerOfTarget];
      const owner = of === undefined ? undefined : ctx.ownerOf(of);
      if (owner !== undefined) ctx.revealTop(spec.then, owner);
      return;
    }
    case "shuffle-into-library": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.shuffleIntoLibrary(target);
      return;
    }
    case "surveil":
      ctx.scry(amountValue(spec.amount, ctx), true, spec.then);
      return;
    case "search-library": {
      let searcher: PlayerId | null = null;
      if (spec.who !== undefined) {
        const of = ctx.targets[spec.who.controllerOfTarget];
        // A target that has already gone (Path to Exile exiles first) still
        // names its last-known controller; nothing at all means no search.
        const who = of === undefined ? undefined : ctx.controllerOf(of);
        if (who === undefined) return;
        searcher = who;
      }
      ctx.searchLibrary(
        searcher,
        spec.filter,
        spec.destination,
        spec.min,
        amountValue(spec.max, ctx),
        spec.enterTapped === true,
        spec.restDestination,
        spec.reveal === true,
        spec.zones,
        spec.together,
      );
      return;
    }
    case "look-and-choose": {
      // "Each player looks at … their library": nobody, once that player has
      // left the game.
      const chooser = spec.player === "that-player" ? ctx.playersInScope("that-player")[0] : undefined;
      if (spec.player === "that-player" && chooser === undefined) return;
      // "…of an opponent's choice" (Tasigur): they pick from your zone.
      const picker = spec.chooser === "that-player" ? ctx.playersInScope("that-player")[0] : undefined;
      if (spec.chooser === "that-player" && picker === undefined) return;
      // "Up to one target card … for each opponent": the targets still legal
      // (an illegal one's slot is blank — rule 608.2b).
      const zone =
        spec.zone === "targets"
          ? { cards: ctx.targets.flatMap((t) => (t?.kind === "object" ? [t.object] : [])) }
          : spec.zone;
      ctx.lookAndChoose(
        zone,
        spec.count === undefined ? undefined : amountValue(spec.count, ctx),
        amountValue(spec.min, ctx),
        amountValue(spec.max, ctx),
        spec.destination,
        spec.leftover,
        spec.filter,
        spec.enterTapped === true,
        spec.then,
        spec.reveal ?? false,
        spec.leftoverIf,
        spec.secondPick === undefined
          ? undefined
          : {
              ...(spec.secondPick.filter !== undefined ? { filter: spec.secondPick.filter } : {}),
              min: spec.secondPick.min,
              max: amountValue(spec.secondPick.max, ctx),
              destination: spec.secondPick.destination,
              ...(spec.secondPick.enterTapped === true ? { enterTapped: true } : {}),
              ...(spec.secondPick.ifNoneChosen === true ? { ifNoneChosen: true } : {}),
            },
        resolveEnterAttacking(spec.attacking, ctx),
        spec.enterAs,
        chooser,
        picker,
      );
      return;
    }
    default:
      throw new Error(
        `unhandled effect kind: ${(spec as { kind: string }).kind}`,
      );
  }
}
