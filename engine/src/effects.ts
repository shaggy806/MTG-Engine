/**
 * The effect layer: a small declarative vocabulary that the engine interprets,
 * plus the `ResolutionContext` API that both declarative effects and imperative
 * `resolve` scripts (the escape hatch) call into.
 *
 * The engine ({@link Game}) supplies the concrete {@link EffectApi} implementation
 * — these functions just describe *what* to do. A `target` field is an index
 * into the spell's or ability's chosen targets, or the literal `"source"`.
 */

import type { TriggeredAbility } from "./abilities.js";
import type { CardType, Keyword, StaticAbility, StaticCondition, TurnStat } from "./cards.js";
import type { AggregateSpec, CardFilter } from "./filter.js";
import type { Color, ManaType } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { DelayedTriggerTiming } from "./state.js";
import type { ResolvedTargets, TargetRef, TargetSpec } from "./target.js";

/** `"trigger-object"` reads `ResolutionContext.triggerObject` (needed-cards
 * P15 — Exalted's "that creature gets +1/+1", the lone attacker rather than
 * a target or the ability's own source). */
export type EffectTargetRef = number | "source" | "trigger-object";
/**
 * What an amount that reads an object (`powerOf`, `toughnessOf`,
 * `manaValueOf`, `manaSpentOf`) may point at: anything an
 * {@link EffectTargetRef} can, plus `"sacrificed"` — the permanent sacrificed
 * to pay the spell's or ability's cost, or by a `sacrifice-source` step
 * before this one ("where X is the sacrificed creature's power" — Dina, Soul
 * Steeper). Nothing sacrificed reads 0.
 *
 * An object that was a permanent when the spell or ability referred to it
 * and has left the battlefield since is read as it last existed there (rule
 * 608.2h — see `LastKnownRefs`): "When Juri dies, it deals damage equal to
 * its power" counts the counters Juri died with.
 */
export type AmountRef = EffectTargetRef | "sacrificed";
/** Where a `return-to-hand` effect takes its object from. */
export type ReturnToHandZone = "battlefield" | "graveyard" | "exile" | "stack";
export type PtDuration = "end-of-turn" | "permanent";

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
  readonly abilityOf?: CardFilter;
  readonly chosenType?: boolean;
  /** "…and that spell can't be countered" (Cavern of Souls, Delighted
   * Halfling). A property of the spell this mana pays for, not of the land. */
  readonly uncounterable?: boolean;
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
}

/** How a `flicker` returns what it exiled — the non-target half of its
 * {@link EffectSpec}. */
export interface FlickerOptions {
  readonly thenCounters?: FlickerCounters;
  readonly underYourControl?: boolean;
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
   * "the sacrificed creature's power". */
  | { readonly powerOf: AmountRef }
  /** The current toughness of whatever an {@link AmountRef} points at —
   * Condemn's "its controller gains life equal to its toughness", read as
   * the creature last existed on the battlefield. */
  | { readonly toughnessOf: AmountRef }
  /** Your **devotion** to a colour (rule 700.5): every mana symbol of that
   * colour in the mana costs of permanents you control, hybrid pips included.
   * Gray Merchant of Asphodel's "each opponent loses X life, where X is your
   * devotion to black". */
  | { readonly devotionTo: Color }
  /** How many creatures died under the effect controller's control this turn
   * — Liliana's Standard Bearer. Reads `PlayerState.creaturesDiedThisTurn`. */
  | { readonly creaturesDiedThisTurn: true }
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
  /**
   * A per-player running total for this turn ({@link TurnStat}), summed over
   * the players `who` names (default `"you"`) — Kydele's "{C} for each card
   * you've drawn this turn", or "the total life your opponents lost this
   * turn" as `who: "each-opponent"`. A player who has left the game is no
   * longer in any scope, so their total drops out.
   */
  | { readonly turnStat: TurnStat; readonly who?: PlayerScope }
  /**
   * How many of the players `who` names have a nonzero {@link TurnStat} this
   * turn — "for each opponent who lost life this turn". Counts players, not
   * the amount: an opponent who lost 10 counts once.
   */
  | { readonly playersWithTurnStat: TurnStat; readonly who: PlayerScope };

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

/** One way out of an `"unless"` clause. Exactly one field is set. */
export type UnlessOption =
  | { readonly pay: string; readonly text: string }
  | { readonly payLife: number; readonly text: string }
  | { readonly sacrifice: CardFilter; readonly text: string };

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

/** Which players an "each" / mass effect reaches. */
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
  | "each-other-opponent";

/** A declarative effect. Grows as milestones add vocabulary. */
export type EffectSpec =
  | {
      /** Apply several effects in order, sharing the same targets and X.
       * (e.g. Blightning: 3 damage to target player *and* that player
       * discards two cards.) */
      readonly kind: "sequence";
      readonly effects: readonly EffectSpec[];
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
       * "deals 2 damage to **that permanent or player**" (Ghyrson Starn).
       * See `LastKnownRefs.recipient`: a permanent that has left the
       * battlefield since is not dealt anything. */
      readonly toTriggerRecipient?: true;
      /** Who deals it, when that isn't the effect's own source: `"trigger-
       * object"` is the object that fired the trigger — "**it** deals damage
       * equal to its power to any target" (Be'lakor, the Dark Master: the
       * entering Demon), "**it** deals that much damage to each other
       * opponent" (Kediss: the commander that dealt combat damage). Its
       * lifelink, deathtouch and colours (for protection) apply, as it last
       * existed on the battlefield if it has left (rule 608.2h). */
      readonly from?: "trigger-object";
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
       * player's choice (Arcane Signet, Command Tower, Treasure). During
       * cost payment the planner picks the colour it needs; a standalone
       * activation (holding priority, not paying anything) just adds white.
       * `mana: { oneOf: [...] }` — `amount` mana in any combination of the
       * listed colours, each unit independently chosen (Orcish Lumberjack:
       * "three mana in any combination of {R} and/or {G}" —
       * `{ oneOf: ["R", "G"] }`, `amount: 3`). During cost payment the planner
       * enumerates every achievable combination as a separate option and
       * picks whichever pays the cost; a standalone activation defaults to
       * `amount` of `oneOf[0]`, same simplification as "any-color" defaulting
       * to white. needed-cards P20. */
      readonly kind: "add-mana";
      /** `"chosen"` is the colour this permanent's controller named as it
       * entered (Heraldic Banner's "{T}: Add one mana of the chosen color") —
       * see `GameObject.chosenOnEnter`. */
      readonly mana:
        | ManaType
        | "any-color"
        | "chosen"
        | { readonly oneOf: readonly ManaType[] }
        /**
         * "…of any color that a land an opponent controls could produce"
         * (Exotic Orchard, Fellwar Stone). A `oneOf` whose list is read off
         * the board rather than printed, so it shrinks and grows with what
         * the opponents actually have out — and is empty, producing nothing
         * at all, when they have no coloured lands.
         */
        | { readonly producedBy: "opponents-lands" };
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
  | { readonly kind: "tap"; readonly target: number }
  | {
      /** `target` accepts `"trigger-object"` for an untargeted "untap it"
       * off a trigger (Amulet of Vigor: untap the permanent that just
       * entered tapped). needed-cards P17. */
      readonly kind: "untap";
      readonly target: EffectTargetRef;
    }
  | { readonly kind: "destroy"; readonly target: number }
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
    }
  | {
      /** Deal `amount` damage to every battlefield permanent matching `filter`
       * (Pyroclasm: 2 to each creature). The source of the damage is the
       * resolving spell/ability. */
      readonly kind: "damage-all";
      readonly filter: CardFilter;
      readonly amount: EffectAmount;
      /** Spare the effect's own source — "each **other** creature with
       * flying" (Harbinger of the Hunt). A `CardFilter` can't say this: it
       * describes the permanent being matched, not its relationship to the
       * thing dealing the damage. */
      readonly exceptSource?: boolean;
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
       * (Rabid Bite). */
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
      /** Put a target permanent into exile. */
      readonly kind: "exile";
      readonly target: number;
      /**
       * Exile **until this source leaves the battlefield** — an "O-Ring"
       * (Banishing Light, Conclave Tribunal). Rule 720.2: one ability that
       * exiles and sets up a linked delayed trigger, so the card carries a
       * second `leaves-battlefield` ability running `return-exiled-by-source`.
       *
       * Marks `GameObject.exiledBy` with the source's id, which is what links
       * the two halves. If the source leaves before the exile happens, or the
       * exiled card moves on to somewhere else, nothing comes back — the same
       * way the printed card behaves.
       */
      readonly untilSourceLeaves?: boolean;
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
      readonly enterTapped?: boolean;
      /** Counters it enters with (Undying: "with a +1/+1 counter on it";
       * Admiral Brass, Unsinkable: "with a finality counter on it" — a
       * finality counter needs nothing more, since `moveObject` reads it). */
      readonly withCounters?: { readonly kind: string; readonly amount: number };
      /** "If it would leave the battlefield, exile it instead of putting it
       * anywhere else" (Whip of Erebos) — sets
       * `GameObject.exileIfItWouldLeave` on the permanent it becomes. */
      readonly exileIfItWouldLeave?: boolean;
    }
  | {
      /** Exile every card in a target *player's* graveyard (rule 406 — Bojuka
       * Bog). `target` is a target-slot index holding a player, `"you"` for
       * the effect's own controller with no slot, or `"each-player"` for every
       * graveyard at once (Rest in Peace). needed-cards P8. */
      readonly kind: "exile-graveyard";
      readonly target: number | "you" | "each-player";
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
       * battlefield before any of their enters triggers is looked at.
       *
       * `"source"` names the permanent the ability came from *as it was when
       * the ability was put on the stack*: one that has since left and come
       * back is a new object (rule 400.7), and is left alone.
       */
      readonly target: EffectTargetRef | readonly number[];
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
    }
  | {
      /** Counter a target spell on the stack — it moves to its owner's
       * graveyard without resolving (rule 701.5). A spell that can't be
       * countered stays on the stack and resolves, and a copy of a spell
       * ceases to exist rather than going anywhere (rule 707.10c). */
      readonly kind: "counter";
      readonly target: number;
      /**
       * `"hand"`: if the spell is countered this way, put it into its
       * owner's hand instead of into their graveyard (Remand). Still a
       * counter — it does nothing to a spell that can't be countered — unlike
       * `return-to-hand` with `from: "stack"`, which isn't one.
       */
      readonly into?: "hand";
    }
  | {
      /** Gain control of a target permanent (rule 613.1b, layer 2): a
       * control effect timestamped as it resolves, recorded on
       * `GameObject.controlEffects`; the latest one on the permanent wins
       * (rule 613.7). `untilEndOfTurn` ends it in the cleanup step (Act of
       * Treason); otherwise it lasts until the permanent changes zones. */
      readonly kind: "gain-control";
      readonly target: number;
      readonly untilEndOfTurn: boolean;
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
      readonly at: DelayedTriggerTiming;
      readonly effect: EffectSpec;
      /** Text for the log and the stack. */
      readonly text: string;
      /** Who controls it when it fires — the effect's own controller by
       * default, or the controller of a target slot (Arcane Denial hands its
       * "may draw two cards" to the player whose spell was countered). */
      readonly controller?: { readonly controllerOfTarget: number };
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
      readonly target: number;
      readonly position: "top" | "bottom";
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
      readonly kind: "add-counter";
      readonly target: EffectTargetRef;
      readonly counter: string;
      /** A fixed amount, `"x"`, or a live count (Will of the Sultai: "X
       * +1/+1 counters, where X is the number of lands you control" —
       * needed-cards P16). */
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
      readonly amount: EffectAmount;
      /** Spare the effect's own source — "put a +1/+1 counter on each
       * **other** creature you control" (Finneas, Ace Archer). */
      readonly exceptSource?: boolean;
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
       * Populate (rule 701.32) — create a token that's a copy of a creature
       * token you control (Rootborn Defenses).
       *
       * The rules let the controller pick which creature token to copy; this
       * copies the largest by power. With zero or one creature token — which
       * is every case the precons produce — the choice is forced anyway. See
       * AUTHORING §15 "Partial".
       */
      readonly kind: "populate";
    }
  | {
      /**
       * Amass N (rule 701.44) — "Amass Zombies 2": put N +1/+1 counters on an
       * Army you control; it's also a `creatureType`. If you control no Army,
       * create a 0/0 black Army creature token first.
       *
       * One effect rather than a `conditional` + `create-token` +
       * `add-counter` sequence, because "an Army you control" has to be the
       * *same* Army across the create and the counters — the whole point of
       * the mechanic is that repeated amassing grows one creature.
       */
      readonly kind: "amass";
      readonly amount: EffectAmount;
      /** The creature type amass names; the Army gains it (701.44b). */
      readonly creatureType: string;
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
       * "Proliferate. Draw a card." A `sequence` can't express this: it runs
       * every step synchronously, so the draw would happen *before* the
       * choice came back. Same shape and same reason as `scry`'s `then`. */
      readonly then?: EffectSpec;
    }
  | {
      readonly kind: "grant-keyword";
      readonly target: EffectTargetRef;
      readonly keyword: Keyword;
      readonly duration: PtDuration;
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
      /** The effect's controller takes an extra turn after this one (Time
       * Warp — rule 500.7 / ROADMAP Phase 7). */
      readonly kind: "take-extra-turn";
    }
  | {
      /** Storm (rule 702.40 — ROADMAP Phase 8): put a copy of the spell this
       * ability is on onto the stack for each other spell its controller cast
       * before it this turn. Copies keep the original's targets. */
      readonly kind: "storm";
    }
  | {
      /** Cascade (rule 702.85 — ROADMAP Phase 8): exile cards off the top of
       * the controller's library until a nonland card with lesser mana value
       * is exiled, then cast that card for free; the rest go to the bottom. */
      readonly kind: "cascade";
    }
  | {
      /** Copy target instant/sorcery spell on the stack (Twincast — rule
       * 707.10 / ROADMAP Phase 8). The copy keeps the original's targets. */
      readonly kind: "copy-spell";
      readonly target: number;
    }
  | {
      /** After this (post-combat) main phase there is an additional combat
       * phase then an additional main phase (Aggravated Assault — rule 500.8 /
       * ROADMAP Phase 7). */
      readonly kind: "additional-combat";
    }
  | {
      /** Untap every battlefield permanent matching `filter` (Aggravated
       * Assault: `{ type: "creature", controlledBy: "you" }`). */
      readonly kind: "untap-all";
      readonly filter: CardFilter;
      /** As on `modify-pt-all` — "untap them" after pumping a targeted
       * player's creatures (Great Oak Guardian). */
      readonly controlledByTarget?: number;
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
      readonly power: number;
      readonly toughness: number;
      readonly addTypes: readonly CardType[];
      readonly addSubtypes: readonly string[];
      /** Replace the printed subtypes entirely (Turn to Frog: "a … Frog"). */
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
       * animated whole rather than split.
       */
      readonly kind: "animate-all";
      readonly filter: CardFilter;
      readonly power: number;
      readonly toughness: number;
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
      readonly of: "source" | "trigger-object" | number;
      readonly count: number;
      /** The token copies gain haste (Miirym). */
      readonly gainsHaste?: boolean;
      /** Exile the token copies at the beginning of the next end step (Miirym). */
      readonly exileAtEndStep?: boolean;
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
      /** Override the copies' base power/toughness (Saw in Half — "except
       * they're each 1/1"; a layer-7b set, so counters / anthems still apply). */
      readonly basePt?: readonly [number, number];
    }
  | {
      /** Attach the source (an Aura/Equipment) to a target permanent. */
      readonly kind: "attach";
      readonly target: number;
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
       * Must be the whole effect or the last step of a `sequence`. */
      readonly kind: "modal";
      readonly minModes: number;
      readonly maxModes: number;
      readonly modes: readonly ModeOption[];
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
       * `choose-modes` decision — one optional mode. Same non-targeted /
       * terminal restriction as `modal`. */
      readonly kind: "may";
      readonly effect: EffectSpec;
      /** The yes/no prompt, e.g. "Draw a card?". */
      readonly prompt: string;
      /**
       * An optional *cost* to say yes — "you may pay {B}. If you do, draw a
       * card" (Nihil Spellbomb, Dawn of Hope, Mentor of the Meek).
       *
       * The choice is only offered when the player could actually pay, so
       * declining for lack of mana and declining by choice both land on
       * `else`. Paid as the choice is answered, not when the effect resolves.
       */
      readonly cost?: string;
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
      /** Who decides: a target-slot index holding a player, or the controller
       * of the permanent whose event fired this trigger (Kazuul's attacker). */
      readonly chooser: number | "trigger-controller";
      /** What they may do to avoid `otherwise`. At most one mana option, since
       * the mana cost rides on the decision itself. */
      readonly options: readonly UnlessOption[];
      /** What happens if they take none of the options. */
      readonly otherwise: EffectSpec;
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
       * Encore (rule 702.140) — "For each opponent, create a token copy of
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
       * Goad every creature a target player controls (rule 701.38 — Geode
       * Rager). Until the goader's next turn those creatures attack each
       * combat if able, and attack someone other than the goader if able.
       */
      readonly kind: "goad";
      /** A target-slot index holding the player whose creatures are goaded. */
      readonly target?: number;
      /** Goad a whole scope of players instead of one chosen target — Kardur,
       * Doomscourge's "creatures your opponents control attack each combat if
       * able". Mutually exclusive with `target`. */
      readonly who?: PlayerScope;
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
      readonly duration: "end-of-turn" | "your-next-turn" | "while-source";
      readonly castOnly?: boolean;
      /** Grant the permission to only this many of the exiled cards, chosen
       * by the controller — Tectonic Giant's "exile the top two cards of your
       * library. **Choose one of them.**" The rest stay exiled with no
       * permission. Omit to grant it to all of them. */
      readonly choose?: number;
      /** Gates on *using* the permission (Theater of Horrors), as opposed to
       * `duration`, which is when it lapses for good. */
      readonly yourTurnOnly?: boolean;
      readonly gate?: StaticCondition;
    }
  | {
      /** Scry `amount` (rule 701.18) — look at the top N, put any number on
       * the bottom, keep the rest on top. `then` (Preordain: draw a card) is
       * applied after. */
      readonly kind: "scry";
      readonly amount: number;
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
       */
      readonly kind: "reveal-top";
      readonly then: EffectSpec;
    }
  | {
      /** Surveil `amount` (rule 701.43) — look at the top N, put any number
       * into the graveyard, keep the rest on top. `then` applied after. */
      readonly kind: "surveil";
      readonly amount: number;
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
      /** `"hand"` is the "you may put a land card **from your hand** onto the
       * battlefield" family (Growth Spiral, Ghalta) — nothing is revealed
       * there, the chooser is looking at their own hand, and `leftover` is
       * always `"stay"` because the cards not chosen simply stay in it. */
      readonly zone: "library" | "graveyard" | "hand";
      /** How deep into a library to look. An amount, so it can be read at
       * resolution: Gishath, Sun's Avatar's "reveal **that many** cards" is
       * `{ triggerValue: true }`, the combat damage it dealt. */
      readonly count?: EffectAmount;
      /** The looked-at library cards are **revealed** to every player (rule
       * 701.16), not just seen by the chooser: Gishath's "reveal that many
       * cards". */
      readonly reveal?: boolean;
      readonly min: number;
      readonly max: number;
      /** `"library-top"` with `zone: "hand"` is Brainstorm's "put two cards
       * from your hand on top of your library" — the chosen cards go back on
       * the deck rather than anywhere visible. */
      readonly destination: "battlefield" | "hand" | "library-top";
      /** Chosen cards bound for the battlefield enter **tapped** (Terrain
       * Generator). */
      readonly enterTapped?: boolean;
      /** `"hand"` (needed-cards P19 — Genesis Ultimatum: "…and the rest into
       * your hand") puts every non-chosen looked-at card into the chooser's
       * hand, regardless of `filter`. */
      readonly leftover: "bottom-random" | "stay" | "hand";
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

/** One selectable mode of a `modal` effect (rule 700.2) or a `castModal` card
 * (ROADMAP Phase 11 EG-2). */
export interface ModeOption {
  /** Rules text of this mode, shown in the chooser. */
  readonly text: string;
  readonly effect: EffectSpec;
  /** Target specs this mode needs (ROADMAP Phase 11 EG-2 — `castModal` only).
   * The mode's `effect` reads them as slots `0..n-1` of the resolution
   * context's targets. Omitted / empty for a non-targeted mode. The
   * resolution-time `modal` / `may` effect requires *non*-targeted modes and
   * ignores this. */
  readonly targets?: readonly TargetSpec[];
}

/** Primitive mutations an effect can perform. Implemented by the engine. */
export interface EffectApi {
  /** `from: "trigger-object"`: the triggering object deals it, not the
   * effect's source — see the `damage` {@link EffectSpec}'s `from`. */
  dealDamage(target: TargetRef, amount: number, from?: "trigger-object"): void;
  /** Deal damage to a whole scope of players, untargeted (Sabotender /
   * Tannuk: "deals 1 damage to each opponent" — needed-cards P16), all at
   * once. `amountFor` is asked per player, for a per-player amount. */
  dealDamageScoped(
    who: PlayerScope,
    amountFor: (player: PlayerId) => number,
    from?: "trigger-object",
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
  /** A player's current life total — see the `{ lifeTotal }` {@link EffectAmount}. */
  lifeTotalOf(player: PlayerId): number;
  /** One player's running total for `stat` this turn — see the `turnStat`
   * {@link EffectAmount}. */
  turnStatOf(player: PlayerId, stat: TurnStat): number;
  /** See the `{ countInGraveyard }` {@link EffectAmount}. */
  countInGraveyard(filter: CardFilter): number;
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
  /** See the `{ opponentsControllingFewer }` {@link EffectAmount}. */
  opponentsControllingFewer(filter: CardFilter): number;
  /** See the `{ creaturesDiedThisTurn }` {@link EffectAmount}. */
  creaturesDiedThisTurn(): number;
  /** See the `{ powerOf }` / `{ toughnessOf }` {@link EffectAmount}s — a
   * permanent that has left the battlefield since the spell or ability
   * referred to it reads as it last existed there. */
  powerOf(target: TargetRef): number;
  toughnessOf(target: TargetRef): number;
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
  addMana(
    player: PlayerId,
    mana:
      | ManaType
      | "any-color"
      | { readonly oneOf: readonly ManaType[] }
      | { readonly producedBy: "opponents-lands" },
    amount: number,
    /** The whole `add-mana` spec, so the engine can stamp this mana's
     * provenance (a spend restriction, a spend rider, a "doesn't empty"
     * permission) on the units it makes. Needed here as well as in the
     * payment planner: activating a mana ability *by hand* floats the mana,
     * and that is exactly where an untagged pool loses the restriction. */
    spec?: Extract<EffectSpec, { kind: "add-mana" }>,
  ): void;
  tapPermanent(target: TargetRef): void;
  untapPermanent(target: TargetRef): void;
  destroyPermanent(target: TargetRef): void;
  /** Destroy every battlefield permanent matching `filter`. With
   * `onlyControllersDamagedBySource`, restricted to those whose controller
   * this effect's source dealt combat damage to this turn. */
  destroyAll(filter: CardFilter, onlyControllersDamagedBySource?: boolean): void;
  /** Return every battlefield permanent matching `filter` to its owner's hand. */
  returnToHandAll(filter: CardFilter): void;
  /** Deal `amount` damage to every battlefield permanent matching `filter`. */
  damageAll(filter: CardFilter, amount: number, exceptSource?: boolean): void;
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
  /** The card types of what `target` points at — as it last existed on the
   * battlefield if it has left since the effect referred to it. For binding
   * `CardFilter.sharesCardTypeWith`. */
  cardTypesOf(target: TargetRef): readonly CardType[];
  /** See the `"return-to-hand"` {@link EffectSpec} — `from` defaults to the
   * battlefield. */
  returnToHand(target: TargetRef, from?: ReturnToHandZone): void;
  exileObject(target: TargetRef, untilSourceLeaves?: boolean): void;
  /** See the `"return-exiled-by-source"` {@link EffectSpec}. */
  returnExiledBySource(): void;
  /** Sacrifice one named permanent — see the `"sacrifice-target"`
   * {@link EffectSpec}. */
  sacrificeTarget(target: TargetRef): void;
  /** Put `target` on top of / on the bottom of its owner's library — see the
   * `"put-on-library"` {@link EffectSpec}. */
  putOnLibrary(target: TargetRef, position: "top" | "bottom"): void;
  /** Set up a delayed triggered ability — see the `"delayed-trigger"`
   * {@link EffectSpec}. `controller` is who will control it when it fires. */
  delayTrigger(
    at: DelayedTriggerTiming,
    effect: EffectSpec,
    text: string,
    controller: PlayerId,
  ): void;
  /** See the `"choose-creature-type"` {@link EffectSpec}. */
  chooseCreatureType(then: EffectSpec): void;
  /** Exile every card in `target`'s graveyard (a player — Bojuka Bog). */
  exileGraveyard(target: TargetRef): void;
  /** Exile `targets`, then return them to the battlefield together — at once,
   * or linked to a delayed return — see the `"flicker"` {@link EffectSpec}.
   * `fromSource` marks a target that is the ability's own source, which is
   * skipped if it has become a new object since. */
  flicker(targets: readonly TargetRef[], options: FlickerOptions): void;
  /** See the `"return-flickered"` {@link EffectSpec}. */
  returnFlickered(
    link: string,
    thenCounters: FlickerCounters | undefined,
    underYourControl: boolean,
  ): void;
  /** Grant flashback to `target` (an instant/sorcery card in a graveyard) for
   * the rest of the turn, at a flashback cost equal to its mana cost
   * (Snapcaster Mage). */
  grantFlashback(target: TargetRef): void;
  /** Let this effect's controller cast `target` (a card in a graveyard)
   * from there this turn — see the `grant-graveyard-cast` effect. */
  grantGraveyardCast(target: TargetRef): void;
  /** `a` and `b` (both creatures) fight; with `oneSided` only `a` deals. */
  fight(a: TargetRef, b: TargetRef, oneSided: boolean): void;
  /** Counter a target spell on the stack — into its owner's hand instead
   * of their graveyard with `into: "hand"`. */
  counterSpell(target: TargetRef, into?: "hand"): void;
  /** The effect's controller gains control of `target`. */
  gainControl(target: TargetRef, untilEndOfTurn: boolean): void;
  /** `target` (a player) mills `amount` cards. */
  mill(target: TargetRef, amount: number): void;
  /** Number of battlefield permanents matching `filter`, evaluated with the
   * effect's controller as "you" (for an `EffectAmount` `{ countOf }`). */
  countMatching(filter: CardFilter, except?: readonly ObjectId[]): number;
  /** See the aggregate {@link EffectAmount}: the raw sum or maximum, with
   * `except` left out one permanent apiece. */
  aggregate(spec: AggregateSpec, except: readonly ObjectId[]): number;
  /** See the `"return-from-graveyard"` {@link EffectSpec} — from the effect's
   * controller's graveyard. */
  returnFromGraveyard(
    filter: CardFilter,
    destination: "battlefield" | "hand",
    count: number | "all",
    enterTapped: boolean,
  ): void;
  /** `target` (a player) discards `amount` cards. */
  discardCards(target: TargetRef, amount: number): void;
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
  /** See the `"goad"` {@link EffectSpec}. */
  goadCreaturesOf(player: PlayerId): void;
  /** See the `"impulse-exile"` {@link EffectSpec}. */
  impulseExile(
    amount: number,
    duration: "end-of-turn" | "your-next-turn" | "while-source",
    castOnly: boolean,
    opts?: {
      readonly choose?: number;
      readonly yourTurnOnly?: boolean;
      readonly gate?: StaticCondition;
    },
  ): void;
  /** See the `"ward"` {@link EffectSpec}. */
  ward(cost: WardCost): void;
  /** See the `"unless"` {@link EffectSpec}. */
  unless(
    chooser: number | "trigger-controller",
    options: readonly UnlessOption[],
    otherwise: EffectSpec,
  ): void;
  /** See the `"populate"` {@link EffectSpec}. */
  populate(): void;
  /** See the `"amass"` {@link EffectSpec}. */
  amass(amount: number, creatureType: string): void;
  /** See the `"add-counter-all"` {@link EffectSpec}. */
  addCounterAll(
    filter: CardFilter,
    counter: string,
    amount: number,
    exceptSource?: boolean,
  ): void;
  /** See the `"double-counters-all"` {@link EffectSpec}. */
  doubleCountersAll(filter: CardFilter, counterKind: string): void;
  addCounter(target: TargetRef, counter: string, amount: number): void;
  /** Proliferate — see the `"proliferate"` {@link EffectSpec}. */
  proliferate(then: EffectSpec | null): void;
  grantKeyword(target: TargetRef, keyword: Keyword, duration: PtDuration): void;
  /** See the `"grant-triggered"` {@link EffectSpec}. */
  grantTriggered(
    target: TargetRef,
    ability: TriggeredAbility,
    duration: PtDuration,
  ): void;
  /** The effect's controller takes an extra turn after this one (Time Warp). */
  takeExtraTurn(): void;
  /** Storm — copy the spell `sourceId` for each earlier spell its controller
   * cast this turn. */
  storm(sourceId: ObjectId): void;
  /** Cascade off `sourceId` (the cascade spell) for `controller`. */
  cascade(controller: PlayerId, sourceId: ObjectId): void;
  /** Copy the spell at `TargetRef` (an instant/sorcery on the stack). */
  copySpell(target: TargetRef): void;
  /** Queue an additional combat + main phase after this main phase (Aggravated
   * Assault). */
  additionalCombat(): void;
  /** Untap every battlefield permanent matching `filter`. */
  untapAll(filter: CardFilter, scopeTo?: PlayerId): void;
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
    },
  ): void;
  /** True if `condition` holds from the effect source's controller's
   * perspective — see the `"conditional"` {@link EffectSpec}. */
  conditionMet(condition: StaticCondition): boolean;
  /** Attach `ctx.source` (an Aura/Equipment) to `target`. */
  attach(target: TargetRef): void;
  /** Transform `target` (a transforming DFC permanent) — see the `"transform"`
   * {@link EffectSpec}. */
  transform(target: TargetRef): void;
  /** The game becomes day or night (rule 726). */
  setDayNight(value: "day" | "night"): void;
  /** `who` becomes the monarch (rule 720). */
  becomeMonarch(who: PlayerScope | undefined): void;
  /** `who` gets `amount` energy counters (rule 122). */
  getEnergy(amount: number, who: PlayerScope | undefined): void;
  /** The effect's controller gets an emblem (rule 114). */
  createEmblem(text: string, staticAbility: StaticAbility | undefined): void;
  /** Prevent all combat damage this turn (Fog). */
  preventAllCombatDamage(): void;
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
  ): void;
  /** Scry (`surveil: false`) or surveil (`surveil: true`) `amount` cards;
   * apply `then` afterwards. See the `"scry"` / `"surveil"` {@link EffectSpec}. */
  scry(amount: number, surveil: boolean, then: EffectSpec | undefined): void;
  /** See the `"put-onto-battlefield"` {@link EffectSpec}. */
  putOntoBattlefield(
    target: TargetRef,
    underYourControl: boolean,
    enterTapped: boolean,
    withCounters?: { readonly kind: string; readonly amount: number },
    exileIfItWouldLeave?: boolean,
  ): void;
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
  ): void;
  /** See the `"reveal-top"` {@link EffectSpec}. */
  revealTop(then: EffectSpec): void;
  /** See the `"look-and-choose"` {@link EffectSpec}. */
  lookAndChoose(
    zone: "library" | "graveyard" | "hand",
    count: number | undefined,
    min: number,
    max: number,
    destination: "battlefield" | "hand" | "library-top" | "graveyard",
    leftover: "bottom-random" | "stay" | "hand",
    filter: ZoneChoiceFilter | undefined,
    enterTapped?: boolean,
    then?: EffectSpec,
    reveal?: boolean,
  ): void;
}

export interface ResolutionContext extends EffectApi {
  readonly controller: PlayerId;
  readonly source: ObjectId;
  /** One entry per declared slot; a hole marks an **optional** slot the
   * player left empty (see `ResolvedTargets`). Reading `ctx.targets[i]` and
   * checking for `undefined` — which effects already do for an out-of-range
   * index — is all a skipped slot needs. */
  readonly targets: ResolvedTargets;
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
  /** How many real, independent firings this resolution stands for — see
   * `GameObject.stackMultiplier`. `1` outside a scaled resolution. Only
   * `create-token` / `create-token-copy` read it (the only effect kinds
   * proven safe to multiply). Pure engine resource-safety optimization. */
  readonly stackMultiplier: number;
  /** Which resolution of this ability this turn is in progress — `1` the
   * first time — for `StaticCondition` `resolved-this-turn`. `0` for a spell,
   * which is not an ability. */
  readonly resolutionCount?: number;
  /** The ability's source stayed in a non-battlefield zone while it was on
   * the stack (`ActivatedAbility.zone: "command"`, or `staysInZone`) and has
   * changed zones since: it's a new object (rule 400.7), so an effect naming
   * `"source"` finds nothing. Absent otherwise. */
  readonly sourceLost?: boolean;
  /** The permanent sacrificed to pay this spell's or ability's cost, or by a
   * `sacrifice-source` step before this one — what an {@link AmountRef}
   * `"sacrificed"` reads. Absent when nothing was. */
  readonly sacrificed?: ObjectId;
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
      return effect.of !== "trigger-object" && typeof effect.of !== "number";
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

/** Resolve an {@link EffectAmount} against the resolution context. `each`
 * is the player a scoped effect is being applied to right now, for a
 * per-player amount (`lifeTotal: "each"`). */
export function amountValue(
  amount: EffectAmount,
  ctx: ResolutionContext,
  each?: PlayerId,
): number {
  if (amount === "x") return ctx.x;
  if (typeof amount === "number") return amount;
  if ("triggerValue" in amount) return ctx.triggerValue;
  if ("lifeTotal" in amount) {
    return ctx.lifeTotalOf(amount.lifeTotal === "each" ? (each ?? ctx.controller) : ctx.controller);
  }
  if ("half" in amount) {
    const n = amountValue(amount.half, ctx, each) / 2;
    return Math.max(0, amount.round === "up" ? Math.ceil(n) : Math.floor(n));
  }
  if ("countInGraveyard" in amount) return ctx.countInGraveyard(amount.countInGraveyard);
  if ("product" in amount) {
    return amount.product.reduce<number>((n, a) => n * amountValue(a, ctx, each), 1);
  }
  if ("countPlayers" in amount) return ctx.playersInScope(amount.countPlayers).length;
  if ("turnStat" in amount) {
    return ctx
      .playersInScope(amount.who ?? "you")
      .reduce((n, p) => n + ctx.turnStatOf(p, amount.turnStat), 0);
  }
  if ("playersWithTurnStat" in amount) {
    return ctx
      .playersInScope(amount.who)
      .filter((p) => ctx.turnStatOf(p, amount.playersWithTurnStat) > 0).length;
  }
  if ("opponentsControllingFewer" in amount) {
    return ctx.opponentsControllingFewer(amount.opponentsControllingFewer);
  }
  if ("devotionTo" in amount) return ctx.devotionTo(amount.devotionTo);
  if ("creaturesDiedThisTurn" in amount) return ctx.creaturesDiedThisTurn();
  if ("powerOf" in amount) {
    const ref = resolveAmountRef(amount.powerOf, ctx);
    return ref === undefined ? 0 : ctx.powerOf(ref);
  }
  if ("toughnessOf" in amount) {
    const ref = resolveAmountRef(amount.toughnessOf, ctx);
    return ref === undefined ? 0 : ctx.toughnessOf(ref);
  }
  if ("manaValueOf" in amount) {
    const ref = resolveAmountRef(amount.manaValueOf, ctx);
    return ref === undefined ? 0 : ctx.manaValueOf(ref);
  }
  if ("manaSpentOf" in amount) {
    const ref = resolveAmountRef(amount.manaSpentOf, ctx);
    return ref === undefined ? 0 : ctx.manaSpentOf(ref);
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

/** Imperative escape hatch for a spell or ability the vocab can't express. */
export type SpellResolver = (ctx: ResolutionContext) => void;

function resolveAmountRef(ref: AmountRef, ctx: ResolutionContext): TargetRef | undefined {
  if (ref === "sacrificed") {
    return ctx.sacrificed === undefined ? undefined : { kind: "object", object: ctx.sacrificed };
  }
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
    return ctx.triggerObject !== undefined
      ? { kind: "object", object: ctx.triggerObject }
      : undefined;
  }
  return ctx.targets[ref];
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
 * `CardFilter.sharesCardTypeWith: "sacrificed"` is bound the same way, to the
 * card types the sacrificed permanent had as it last existed on the
 * battlefield (an `anyOf` of one `typesAnyOf`, so an `anyOf` the filter
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
    const walked = Object.fromEntries(
      Object.entries(record).map(([key, v]) => [key, NESTED_EFFECT_KEYS.has(key) ? v : walk(v)]),
    );
    if (!("sharesCardTypeWith" in walked)) return walked;
    // "Shares a card type with it": the sacrificed permanent's types as it
    // last existed, ANDed with whatever `anyOf` the filter already had.
    const { sharesCardTypeWith: _with, anyOf, ...rest } = walked as CardFilter;
    const types =
      ctx.sacrificed === undefined
        ? []
        : ctx.cardTypesOf({ kind: "object", object: ctx.sacrificed });
    const shares: CardFilter = { typesAnyOf: types, ...(anyOf !== undefined ? { anyOf } : {}) };
    return { ...rest, anyOf: [shares] };
  };
  return walk(spec) as EffectSpec;
}

/** Does `amount` read a per-player value (`lifeTotal: "each"`), so a scoped
 * effect has to read it once for each player? */
function readsEachPlayer(amount: EffectAmount): boolean {
  if (typeof amount !== "object") return false;
  if ("lifeTotal" in amount) return amount.lifeTotal === "each";
  if ("half" in amount) return readsEachPlayer(amount.half);
  if ("product" in amount) return amount.product.some(readsEachPlayer);
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

export function applyEffectSpec(unbound: EffectSpec, ctx: ResolutionContext): void {
  const spec = bindDynamicCompares(unbound, ctx);
  switch (spec.kind) {
    case "sequence": {
      for (const step of spec.effects) applyEffectSpec(step, ctx);
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
    case "add-mana":
      ctx.addMana(
        ctx.controller,
        // "The chosen color" — resolved against the source permanent; falls
        // back to the payer's choice if the label isn't a colour (it always
        // is on the cards that use this).
        spec.mana === "chosen" ? (ctx.chosenColorOfSource() ?? "any-color") : spec.mana,
        amountValue(spec.amount, ctx),
        spec,
      );
      if (spec.painToController !== undefined && spec.painToController > 0) {
        ctx.dealDamage(
          { kind: "player", player: ctx.controller },
          spec.painToController,
        );
      }
      return;
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
      const life = amountValue(spec.amount, ctx);
      if (spec.toControllerOfTarget !== undefined) {
        const of = ctx.targets[spec.toControllerOfTarget];
        const who = of === undefined ? undefined : ctx.controllerOf(of);
        if (who !== undefined) ctx.loseLife(who, life);
        return;
      }
      if (spec.target !== undefined) {
        const ref = ctx.targets[spec.target];
        if (ref?.kind === "player") ctx.loseLife(ref.player, life);
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
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.tapPermanent(target);
      return;
    }
    case "untap": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.untapPermanent(target);
      return;
    }
    case "put-on-bottom-of-library": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.putOnBottomOfLibrary(target);
      return;
    }
    case "destroy": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.destroyPermanent(target);
      return;
    }
    case "destroy-all":
      ctx.destroyAll(spec.filter, spec.onlyControllersDamagedBySource);
      return;
    case "return-to-hand-all":
      ctx.returnToHandAll(spec.filter);
      return;
    case "damage-all":
      ctx.damageAll(spec.filter, amountValue(spec.amount, ctx), spec.exceptSource === true);
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
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.counterSpell(target, spec.into);
      return;
    }
    case "gain-control": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.gainControl(target, spec.untilEndOfTurn);
      return;
    }
    case "return-to-hand": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.returnToHand(target, spec.from);
      return;
    }
    case "exile": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.exileObject(target, spec.untilSourceLeaves === true);
      return;
    }
    case "return-exiled-by-source":
      ctx.returnExiledBySource();
      return;
    case "choose-creature-type":
      ctx.chooseCreatureType(spec.then);
      return;
    case "put-onto-battlefield": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) {
        ctx.putOntoBattlefield(
          target,
          spec.underYourControl === true,
          spec.enterTapped === true,
          spec.withCounters,
          spec.exileIfItWouldLeave === true,
        );
      }
      return;
    }
    case "exile-graveyard": {
      if (spec.target === "each-player") {
        for (const player of ctx.playersInScope("each-player")) {
          ctx.exileGraveyard({ kind: "player", player });
        }
        return;
      }
      const target =
        spec.target === "you"
          ? ({ kind: "player", player: ctx.controller } as const)
          : ctx.targets[spec.target];
      if (target !== undefined) ctx.exileGraveyard(target);
      return;
    }
    case "flicker": {
      const refs: EffectTargetRef[] =
        typeof spec.target === "object" ? [...spec.target] : [spec.target];
      const targets: TargetRef[] = [];
      for (const ref of refs) {
        const target = resolveEffectTarget(ref, ctx);
        if (target !== undefined) targets.push(target);
      }
      ctx.flicker(targets, {
        ...(spec.thenCounters !== undefined ? { thenCounters: spec.thenCounters } : {}),
        ...(spec.underYourControl === true ? { underYourControl: true } : {}),
        ...(spec.returnAt !== undefined ? { returnAt: spec.returnAt } : {}),
        ...(spec.returnText !== undefined ? { returnText: spec.returnText } : {}),
        ...(spec.target === "source" ? { fromSource: true } : {}),
      });
      return;
    }
    case "return-flickered":
      ctx.returnFlickered(spec.link, spec.thenCounters, spec.underYourControl === true);
      return;
    case "grant-flashback": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.grantFlashback(target);
      return;
    }
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
      ctx.delayTrigger(spec.at, spec.effect, spec.text, controller);
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
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.putOnLibrary(target, spec.position);
      return;
    }
    case "return-from-graveyard":
      ctx.returnFromGraveyard(
        spec.filter,
        spec.destination,
        spec.count,
        spec.enterTapped ?? false,
      );
      return;
    case "discard": {
      for (const target of scopedOrTargetedPlayers(spec.target, ctx)) {
        ctx.discardCards(
          target,
          amountValue(spec.amount, ctx, target.kind === "player" ? target.player : undefined),
        );
      }
      return;
    }
    case "modify-pt": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) {
        ctx.modifyPt(
          target,
          amountValue(spec.power, ctx),
          amountValue(spec.toughness, ctx),
          spec.duration,
        );
      }
      return;
    }
    case "modify-pt-all":
      ctx.modifyPtAll(
        spec.filter,
        amountValue(spec.power, ctx),
        amountValue(spec.toughness, ctx),
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
    case "amass":
      ctx.amass(amountValue(spec.amount, ctx), spec.creatureType);
      return;
    case "add-counter-all":
      ctx.addCounterAll(
        spec.filter,
        spec.counter,
        amountValue(spec.amount, ctx),
        spec.exceptSource === true,
      );
      return;
    case "double-counters-all":
      ctx.doubleCountersAll(spec.filter, spec.counterKind);
      return;
    case "grant-keyword-all":
      ctx.grantKeywordAll(spec.filter, spec.keyword, spec.duration, spec.exceptSource === true);
      return;
    case "add-counter": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) {
        ctx.addCounter(target, spec.counter, amountValue(spec.amount, ctx));
      }
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
    case "grant-triggered": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.grantTriggered(target, spec.ability, spec.duration);
      return;
    }
    case "take-extra-turn":
      ctx.takeExtraTurn();
      return;
    case "storm":
      ctx.storm(ctx.source);
      return;
    case "cascade":
      ctx.cascade(ctx.controller, ctx.source);
      return;
    case "copy-spell": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.copySpell(target);
      return;
    }
    case "additional-combat":
      ctx.additionalCombat();
      return;
    case "untap-all":
      ctx.untapAll(spec.filter, scopedController(spec.controlledByTarget, ctx));
      return;
    case "tap-all":
      ctx.tapAll(spec.filter);
      return;
    case "animate": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) {
        ctx.animate(target, {
          power: spec.power,
          toughness: spec.toughness,
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
    case "animate-all":
      ctx.animateAll(spec.filter, {
        power: spec.power,
        toughness: spec.toughness,
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
      ctx.createToken(
        spec.token,
        amountValue(spec.count, ctx) * ctx.stackMultiplier,
        spec.who,
        spec.tapped === true,
        spec.sacrificeAtEndStep === true,
      );
      return;
    case "create-token-copy": {
      let of: ObjectId | undefined;
      if (spec.of === "source") of = ctx.source;
      else if (spec.of === "trigger-object") of = ctx.triggerObject;
      else {
        const ref = ctx.targets[spec.of];
        of = ref?.kind === "object" ? ref.object : undefined;
      }
      if (of !== undefined) {
        ctx.createTokenCopy(of, spec.count * ctx.stackMultiplier, {
          gainsHaste: spec.gainsHaste ?? false,
          sacrificeAtEndStep: spec.sacrificeAtEndStep ?? false,
          exileAtEndStep: spec.exileAtEndStep ?? false,
          notLegendary: spec.notLegendary ?? false,
          under: spec.who === "you" ? ctx.controller : undefined,
          ...(spec.basePt ? { basePt: spec.basePt } : {}),
        });
      }
      return;
    }
    case "conditional": {
      const branch = ctx.conditionMet(spec.condition) ? spec.then : spec.else;
      if (branch !== undefined) applyEffectSpec(branch, ctx);
      return;
    }
    case "attach": {
      const target = ctx.targets[spec.target];
      if (target !== undefined) ctx.attach(target);
      return;
    }
    case "transform": {
      const target = resolveEffectTarget(spec.target, ctx);
      if (target !== undefined) ctx.transform(target);
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
    case "create-emblem":
      ctx.createEmblem(spec.text, spec.static);
      return;
    case "prevent-all-combat-damage":
      ctx.preventAllCombatDamage();
      return;
    case "prevent-damage": {
      const ref = ctx.targets[spec.target];
      if (ref !== undefined) {
        ctx.preventDamage(ref, amountValue(spec.amount, ctx), spec.combatOnly ?? false);
      }
      return;
    }
    case "modal":
      ctx.chooseModes(spec.minModes, spec.maxModes, spec.modes);
      return;
    case "may": {
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
      if (spec.who !== undefined) {
        for (const player of ctx.playersInScope(spec.who)) ctx.goadCreaturesOf(player);
        return;
      }
      const ref = spec.target === undefined ? undefined : ctx.targets[spec.target];
      if (ref?.kind === "player") ctx.goadCreaturesOf(ref.player);
      return;
    }
    case "impulse-exile":
      ctx.impulseExile(amountValue(spec.amount, ctx), spec.duration, spec.castOnly === true, {
        choose: spec.choose,
        yourTurnOnly: spec.yourTurnOnly,
        gate: spec.gate,
      });
      return;
    case "unless":
      ctx.unless(spec.chooser, spec.options, spec.otherwise);
      return;
    case "ward":
      ctx.ward(spec.cost);
      return;
    case "scry":
      ctx.scry(spec.amount, false, spec.then);
      return;
    case "reveal-top":
      ctx.revealTop(spec.then);
      return;
    case "surveil":
      ctx.scry(spec.amount, true, spec.then);
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
      );
      return;
    }
    case "look-and-choose":
      ctx.lookAndChoose(
        spec.zone,
        spec.count === undefined ? undefined : amountValue(spec.count, ctx),
        spec.min,
        spec.max,
        spec.destination,
        spec.leftover,
        spec.filter,
        spec.enterTapped === true,
        spec.then,
        spec.reveal === true,
      );
      return;
    default:
      throw new Error(
        `unhandled effect kind: ${(spec as { kind: string }).kind}`,
      );
  }
}
