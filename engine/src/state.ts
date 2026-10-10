/**
 * The game state tree and pure selectors over it.
 *
 * `GameState` is a plain, structurally-cloneable object: no class instances,
 * functions, `Map`s, or `Set`s. The {@link Game} class owns the single mutable
 * instance and is the only thing that writes to it; everything else reads.
 */

import type { CastSpellOffer, CastVia, PlayLandOffer } from "./actions.js";
import type { ActivatedAbility, TriggeredAbility } from "./abilities.js";
import type {
  AffectSpec,
  CardType,
  CombatRestriction,
  Keyword,
  StaticAbility,
  StaticCondition,
  Supertype,
} from "./cards.js";
import type {
  EffectSpec,
  EnterTypes,
  LookAndChooseLeftoverIf,
  ManaSplitRiders,
  ResolvedEnterAttacking,
  ZoneSecondPick,
} from "./effects.js";
import type { CardFilter } from "./filter.js";
import type { Color, ManaOrigin, ManaType, ManaUnit, SpendAs } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameEvent } from "./events.js";
import type { ResolvedTargets, TargetRef, TargetSpec } from "./target.js";
import type { Step } from "./turn.js";
import type { ZoneChoiceTogether } from "./zone-choice-together.js";

export type PrivateZone = "library" | "hand" | "graveyard";
export type SharedZone = "battlefield" | "stack" | "exile" | "command";
export type ZoneType = PrivateZone | SharedZone;

/** One layer-2 control-changing effect on a permanent — see
 * `GameObject.controlEffects`. */
export interface ControlEffect {
  /** Who the effect says controls the permanent. */
  readonly controller: PlayerId;
  /** When the effect was created (`GameState.timestampSeq`) — the latest
   * applicable control effect wins (rule 613.7). */
  readonly timestamp: number;
  /** Act of Treason's "until end of turn" — ends in the cleanup step. */
  readonly untilEndOfTurn: boolean;
  /** Made by "put it onto the battlefield under your control" rather than a
   * control-changing effect: `controller` is then who the permanent entered
   * under, its default controller (rule 110.2). The two differ only once that
   * player leaves the game — an effect giving them control ends, but a
   * permanent they control by default is exiled (rule 800.4a). */
  readonly entered?: boolean;
  /** "For as long as [that permanent] remains on the battlefield"
   * (Opportunistic Dragon): it ends as that permanent, in that stint,
   * leaves. */
  readonly whileSource?: { readonly id: ObjectId; readonly zoneChangeCount: number };
}

/** An instance of a card (or token) somewhere in the game. */
export interface GameObject {
  readonly id: ObjectId;
  /** Key into the {@link CardRegistry} for printed characteristics. */
  readonly cardName: string;
  readonly owner: PlayerId;
  controller: PlayerId;
  zone: ZoneType;
  tapped: boolean;
  damageMarked: number;
  /**
   * This permanent's spell was cast kicked — the one piece of `kicked` that
   * survives the stack-to-battlefield move, for a permanent whose kicker
   * rider is an ETB trigger (Verix Bladewing). See `moveObject`.
   */
  enteredKicked?: boolean;
  /** How many times its spell was kicked, for a multikicker spell (rule
   * 702.33c) — `timesKicked` carried across the stack-to-battlefield move
   * the way `enteredKicked` is, for "enters with a charge counter on it for
   * each time it was kicked" (Everflowing Chalice). */
  enteredTimesKicked?: number;
  /** How it came onto the battlefield, this stint — see {@link EntryRecord}.
   * Set by the move onto the battlefield, gone with its next move. */
  entry?: EntryRecord;
  /** The zone this spell was cast from, set as it's cast; what the move
   * onto the battlefield records as `entry.cast.from`. Gone with its next
   * move. */
  castFrom?: ZoneType;
  /** The creatures that convoked this spell (rule 702.51a), each as the
   * battlefield stint it tapped from, in the order they were tapped — "each
   * creature that convoked this spell" (Lethal Scheme). Gone with its next
   * move. */
  convokedBy?: readonly { readonly object: ObjectId; readonly stint: number }[];
  /**
   * This card is in exile because of an "exile until ~ leaves the
   * battlefield" ability, and this is the id of the permanent that did it
   * (rule 720.2 — Banishing Light). Set *after* the move to exile, since
   * `moveObject` clears zone-scoped state on the way.
   */
  exiledBy?: ObjectId;
  /**
   * The player whose effect put this card into exile — what "cards **you
   * exiled**" means (Haldan, Avid Arcanist's `playFromExile.exiledByYou`).
   * Set by an `exile` or `exile-from-library` effect after its move, and
   * cleared by `moveObject` like `exiledBy`, so a card that leaves exile is
   * no longer one anybody exiled.
   */
  exiledByPlayer?: PlayerId;
  /**
   * This card is in exile because of a `flicker` whose return is delayed
   * (Norin the Wary), and this names that particular exile — the key its
   * `return-flickered` delayed trigger looks for (rule 610.3). Cleared by
   * `moveObject` like `exiledBy`, so a card that leaves exile before the
   * return, even only to come straight back, is a new object and stays put.
   */
  flickerLink?: string;
  /** This permanent's `castFromGraveyard` permission has been used this turn
   * (Gisa and Geralf's "once during each of your turns"). Reset with the
   * other once-per-turn flags as its controller's turn begins. */
  graveyardCastUsedThisTurn?: boolean;
  /** The permanent types whose `castFromGraveyard.perType` allowance this
   * permanent has spent this turn (Muldrotha). Reset with
   * `graveyardCastUsedThisTurn`, and by `moveObject` — a new Muldrotha is a
   * new object with a fresh set. */
  graveyardCastTypesUsedThisTurn?: CardType[];
  /**
   * A one-shot permission on a card in a graveyard: `player` may cast it
   * during turn `turn` (Silas Renn, Emry: "choose target artifact card in
   * your graveyard. You may cast that card this turn"). It belongs to the
   * card, not to whatever granted it, so it outlives its grantor — and it
   * ends when the card leaves the graveyard (`moveObject` clears it): a card
   * that comes back is a new object with no permission.
   */
  graveyardCastPermission?: { readonly player: PlayerId; readonly turn: number };
  /** This spell was cast under a permission that exiles it instead of letting
   * it reach a graveyard (Kess, Dissident Mage — `castFromGraveyard
   * .exileAfterwards`). Consulted by `moveObject` for the move off the
   * stack, and cleared by any move after that. */
  exileIfWouldGoToGraveyard?: boolean;
  /** This spell is to be exiled instead of put into `player`'s graveyard as
   * it resolves, and, with `returnAtNextEndStep`, returned to their hand at
   * the beginning of the next end step — Feather, the Redeemed (`source`),
   * the `exile-spell-as-it-resolves` effect. Read only as the spell
   * resolves (`Game.leaveStackAfterResolving`); cleared by any move. */
  exileAsItResolves?: {
    readonly player: PlayerId;
    readonly source: ObjectId;
    readonly returnAtNextEndStep?: true;
  };
  /** True once dealt damage by a deathtouch source since state-based actions
   * were last checked (rule 704.5h): each check clears it, as do regeneration,
   * cleanup and a zone change. So an indestructible creature that survived
   * it isn't destroyed by losing indestructible later in the turn. */
  markedByDeathtouch: boolean;
  /**
   * Regeneration shields on this permanent (rule 701.15a): each replaces the
   * next time it would be destroyed this turn — by an effect, or by lethal
   * or deathtouch damage (704.5g-h) — with removing all damage from it,
   * tapping it and removing it from combat. Gone at cleanup (514.2) and when
   * it changes zones (400.7). For a token stack, each token in it has this
   * many.
   */
  regenerationShields?: number;
  /** Turn number this object last entered the battlefield; `null` otherwise. */
  enteredBattlefieldOnTurn: number | null;
  /**
   * Turn number this card was put into a graveyard **from a library** — milled,
   * surveilled, or any other library-to-graveyard move (Captain N'ghathrod's
   * "a card … that was put there from a library this turn"). Compared against
   * `turn.number` rather than cleared at end of turn, so a card milled on an
   * earlier turn simply doesn't match. `moveObject` rewrites it on every zone
   * change: a card that leaves the graveyard and comes back is a new object
   * (rule 400.7) and wasn't put there from a library.
   */
  putIntoGraveyardFromLibraryOnTurn?: number;
  /**
   * True while the creature has not been under its controller's control since
   * the start of that player's most recent turn (rule 302.6). Set on entering
   * the battlefield, cleared in the controller's untap step.
   */
  summoningSick: boolean;
  /**
   * True once a loyalty ability of this permanent has been activated this turn
   * (rule 606.3 — at most one per turn). Reset in the controller's untap step.
   */
  loyaltyActivatedThisTurn: boolean;
  /**
   * Indices of this permanent's activated abilities marked
   * `oncePerTurn` that have already been used this turn (rule 602.5g —
   * "Activate only once each turn", Steel Hellkite). Reset as every turn
   * begins, whoever's it is (an untap step's first act).
   */
  abilitiesUsedThisTurn?: number[];
  /** Indices of this object's exhaust abilities already activated — once
   * each for as long as the object exists (see `ActivatedAbility.exhaust`).
   * Cleared by any zone change. */
  exhaustedAbilities?: number[];
  /**
   * Indices of this object's triggered abilities marked `oncePerTurn` that
   * have already triggered — "This ability triggers only once each turn"
   * (Morbid Opportunist). Stamped with the turn number and the object's
   * `zoneChangeCount`, so it lapses by itself when the turn ends or the
   * object changes zones (rule 400.7 — a new object), with nothing to reset.
   */
  triggeredOnce?: {
    readonly turn: number;
    readonly zoneChangeCount: number;
    readonly indices: readonly number[];
  };
  /** True once this permanent has been declared as an attacker this turn —
   * the "attacked this turn" half of Boast (rule 702.135), and the
   * `attackedThisTurn` filter clause. Reset as each turn begins, and by any
   * change of zone (the permanent that comes back never attacked). */
  attackedThisTurn?: boolean;
  /** The combat this permanent was last declared an attacker in, and the
   * player it attacked then (`null` for a planeswalker) — "that this
   * creature didn't attack during your last combat" (Territorial Hellkite).
   * Gone with any change of zone. */
  lastAttack?: { readonly combat: CombatId; readonly player: PlayerId | null };
  /** `mustAttackPlayer` lasts only this combat (rule 500.5a) — Territorial
   * Hellkite's "attacks that player this combat if able". */
  mustAttackPlayerThisCombat?: true;
  /** What damaged this permanent this turn — see {@link DamageHistory}.
   * Only this stint's (a zone change makes a new object, rule 400.7), and
   * only this turn's: a record from an earlier turn is stale. */
  damageThisTurn?: DamageHistory;
  /** The turn it last dealt damage to another creature (Wolverine's "if
   * it dealt damage to another creature this turn"). */
  dealtDamageToCreatureOnTurn?: number;
  /**
   * Players who have goaded this creature (rule 701.15) with a one-shot goad
   * — "goad target creature", "goad each creature target player controls".
   * While it lasts the creature "attacks each combat if able and attacks a
   * player other than [the goader] if able" (701.15b).
   *
   * Cleared for a given goader as *their* next turn begins, which is exactly
   * how long such a goad lasts (701.15a). A creature can be goaded by several
   * players at once, hence a list; the same player goading it again adds
   * nothing (701.15d). Goaded is a designation of this object, so a zone
   * change ends it (rule 400.7). This is one of three ways to be goaded —
   * `goadedForGameBy` and a static goad are the others — so ask `goadersOf`
   * (`goad.ts`), never this field, whether a creature is goaded.
   */
  goadedBy?: PlayerId[];
  /**
   * The player whose **Ring-bearer** this permanent is (rule 701.54a-b): a
   * designation, not a copiable value. It lasts until another creature
   * becomes that player's Ring-bearer or another player gains control of it
   * (cleared on the control change, even if control comes back), and a
   * zone change ends it (rule 400.7). Ask `isRingBearer` (`ring.ts`), which
   * also checks who controls it now, rather than this field.
   */
  ringBearer?: PlayerId;
  /**
   * Players who have goaded this creature **for the rest of the game** — Jon
   * Irenicus's "it's goaded for the rest of the game", the tokens Rendmaw,
   * Creaking Nest makes. Never lapses; only leaving the battlefield ends it
   * (rule 400.7), as for `goadedBy`.
   */
  goadedForGameBy?: PlayerId[];
  /**
   * The permanent is **suspected** (rule 701.60): `GameState.timestampSeq` as
   * it became so. While suspected it has menace and "This creature can't
   * block" (701.60c) — folded into its characteristics in layer 6, where an
   * ability-removing effect with a later timestamp takes both away though it
   * stays suspected (the ruling). A suspected permanent can't become
   * suspected again (701.60d), so the timestamp is the first one. Neither an
   * ability nor a copiable value (701.60b); a zone change ends it (701.60a).
   */
  suspectedAt?: number;
  /**
   * The permanent is **monstrous** (rule 701.37b): a designation the
   * `monstrosity` effect gives it, which the monstrosity action reads ("if
   * this permanent isn't monstrous") and a `becomes-monstrous` trigger
   * watches for. Neither an ability nor a copiable value, so losing its
   * abilities or a copy effect leaves it be; it lasts until the permanent
   * leaves the battlefield (`moveObject` clears it).
   */
  monstrous?: true;
  /**
   * Exerted (rule 701.43a): it won't untap during this player's next untap
   * step — the player who exerted it, whoever controls it then (a creature
   * borrowed until end of turn and exerted still untaps in its owner's untap
   * step, the ruling). Cleared as that untap step happens, whether or not it
   * was tapped, and by any change of zone.
   */
  exertedBy?: PlayerId;
  /** The turn it was last exerted — Combat Celebrant's "if this creature
   * hasn't been exerted this turn". Gone with any change of zone. */
  exertedOnTurn?: number;
  /**
   * "It doesn't untap during its controller's next untap step" (Junk
   * Winder; the `tap` effect's `doesntUntapNext`): the next untap step of
   * whoever controls it then passes it by. The effect tracks the permanent,
   * not its controller (the rulings — Icy Blast, Grip of the Roil): one that
   * changes hands first stays tapped through its new controller's next untap
   * step instead. Another player's untap step it untaps in (Seedborn Muse)
   * isn't its controller's. Cleared as that untap step happens, whether or
   * not it was tapped, and by any change of zone.
   */
  skipsNextUntap?: true;
  /** This creature must attack this specific player if able — Encore's
   * "create a token copy that attacks that opponent this turn if able". */
  mustAttackPlayer?: PlayerId;
  /**
   * This object as it last existed on the battlefield — last-known
   * information (rules 603.10a, 608.2h). See {@link LastKnownInfo}.
   *
   * Taken by the move that takes it off the battlefield, before that move
   * resets control, counters, modifiers and any copy effect, and **kept**
   * through later moves until the next departure from the battlefield
   * replaces it: a dies trigger still reads its creature's power after the
   * card has been exiled from the graveyard in response. Nothing reads it
   * without saying which departure it means — see {@link LastKnownRefs}.
   */
  lastKnown?: LastKnownInfo;
  /** The snapshots `lastKnown` held before, newest first, a few kept: a
   * permanent that left, came back and left again before an ability
   * referring to its first departure resolved is still read as it was then. */
  earlierLastKnown?: LastKnownInfo[];
  /**
   * For a spell or ability object: which battlefield stint of the objects it
   * refers to it means, for last-known information. See
   * {@link LastKnownRefs}.
   */
  lastKnownRefs?: LastKnownRefs;
  /**
   * "Impulse draw" — this card is exiled face-up and its owner may play it.
   * `until` is the turn number the permission lapses on (an "until end of
   * turn" impulse); absent means it lasts as long as `exiledWith` is on the
   * battlefield (Theater of Horrors).
   *
   * `castOnly` distinguishes "you may **cast spells** from among those cards"
   * (Dream Pillager — no lands) from "you may **play** them" (Tectonic Giant).
   */
  impulse?: {
    readonly player: PlayerId;
    /**
     * When the permission lapses:
     * - `end-of-turn` — this turn only (Dream Pillager).
     * - `your-turns` — through the end of the player's next `remaining`
     *   turns (Tectonic Giant's "until the end of your next turn").
     *   Counted down as each of *their* turns ends, so extra turns and
     *   multiplayer turn order are handled exactly rather than by guessing a
     *   turn number.
     * - `while-source` — for as long as the permanent that exiled it is on
     *   the battlefield (Theater of Horrors).
     * - `while-exiled` — "for as long as it remains exiled": never, while it
     *   stays (leaving exile ends it anyway, as for every permission).
     * - `end-step-of` — "until your next end step" (Rocco, Street Chef): as
     *   that player's next end step begins.
     */
    expiry:
      | { readonly kind: "end-of-turn"; readonly turn: number }
      | { kind: "your-turns"; remaining: number }
      | { readonly kind: "end-step-of"; readonly player: PlayerId }
      | { readonly kind: "while-source"; readonly source: ObjectId }
      | { readonly kind: "while-exiled" };
    readonly castOnly?: boolean;
    /** Which of the exiled cards the permission covers — Narset, Enlightened
     * Master's "noncreature, nonland cards". Matched from the permission
     * holder's side; a card it doesn't match can't be played this way. */
    readonly filter?: CardFilter;
    /** Cast without paying its mana cost: every card the permission covers,
     * or those matching `filter` (Nahiri, Forged in Fury's "you may cast
     * Equipment spells this way without paying their mana costs"). `only`
     * is a permission that is *only* to cast them free (Narset). */
    readonly free?: { readonly filter?: CardFilter; readonly only?: boolean };
    /** Extra gates on *using* the permission, as opposed to when it lapses —
     * Theater of Horrors' "**During your turn, if an opponent lost life this
     * turn**, you may play …". Evaluated live, so the cards become playable
     * and unplayable again as the condition changes. */
    readonly yourTurnOnly?: boolean;
    /** Not usable before this turn number — warp's "after the current turn
     * has ended" (rule 702.185a). */
    readonly fromTurn?: number;
    readonly gate?: StaticCondition;
    /** The permanent the card was exiled with, in the stint it was in then —
     * Maralen, Fae Ascendant's "cards exiled with Maralen". Set with
     * `whileSource` or `oncePerTurn`; it also answers `filter`'s `{ amount }`
     * operands, from that permanent's side, live. */
    readonly source?: { readonly id: ObjectId; readonly zoneChangeCount: number };
    /** Usable only while `source` is still on the battlefield as the same
     * object (rule 400.7): the permission is a static ability of it ("you may
     * cast … from among cards exiled with Maralen this turn"), on top of
     * whatever `expiry` says. */
    readonly whileSource?: boolean;
    /** "Once each turn": one cast a turn among every card `source` gave this
     * permission, counted on `source` (`GameObject.impulseCastOnTurn`). */
    readonly oncePerTurn?: boolean;
    /** "…and mana of any type can be spent to cast that spell" (Gonti, Canny
     * Acquisitor) / "…as though it were mana of any color" (Grenzo, Havoc
     * Raiser): how freely mana may pay for a spell cast under this permission
     * — and only one cast this way (rule 118.14). */
    readonly spendAs?: SpendAs;
  };
  /** The turn a `oncePerTurn` impulse permission this permanent gave was
   * last used (Maralen, Fae Ascendant). Cleared on any zone change: the
   * permanent that comes back is a new object (rule 400.7). */
  impulseCastOnTurn?: number;
  /**
   * Players this permanent has dealt combat damage to this turn — Steel
   * Hellkite's "whose controller was dealt combat damage by this creature
   * this turn". Reset at the start of each turn, and by `moveObject` like
   * every other per-permanent flag: a creature that left and came back is a
   * new object and has damaged nobody.
   */
  combatDamagedPlayersThisTurn?: PlayerId[];
  /**
   * This stack object is a delayed triggered ability that has fired (rule
   * 603.7) — the whole record, because there is no card ability for
   * `stackAbilityOf` to look up by index. Only ever set on an `"ability"`
   * object on the stack.
   */
  delayedTrigger?: DelayedTrigger;
  /** For an ability object: the `eventSeq` as it was put on the stack. An
   * ability of a permanent transforms that permanent only if it hasn't
   * transformed since (rule 701.28f — see `transformedAtSeq`). */
  stackedAtSeq?: number;
  /** The `eventSeq` this permanent last transformed at (rule 701.28f).
   * Cleared as it changes zones — entering transformed isn't transforming. */
  transformedAtSeq?: number;
  /** This stack object is a reflexive triggered ability (rule 603.12) — the
   * whole record, for the same reason as `delayedTrigger`. Only ever set on
   * an `"ability"` object on the stack. */
  reflexiveTrigger?: ReflexiveTrigger;
  /** Chosen targets while this is a spell/ability on the stack; `null` otherwise. */
  /** A hole (`undefined`) marks an optional target slot the caster chose to
   * leave empty — see `ResolvedTargets`. */
  targets: (TargetRef | undefined)[] | null;
  /**
   * This spell can't be countered because of *how it was paid for* — Cavern
   * of Souls' "and that spell can't be countered". Distinct from
   * `CardDefinition.cantBeCountered`, which is printed on the spell itself;
   * this is a property one particular casting picked up from the mana.
   * Cleared by `moveObject` with every other per-object flag.
   */
  uncounterable?: boolean;
  /** True when one of `controlEffects` is a temporary one (Act of Treason)
   * that cleanup has yet to end. Cleared by cleanup and by `moveObject` on any
   * zone change. */
  controlEndsAtCleanup: boolean;
  /**
   * The control-changing effects (layer 2) that came from a resolved spell or
   * ability rather than an attached Aura — a `gain-control` (Act of Treason,
   * Sliver Overlord), or "put it onto the battlefield under your control"
   * (Gravespawn Sovereign). Each carries the timestamp it was created at
   * (rule 613.7b); `Game.recomputeControl` weighs them against every attached
   * control-granting Aura (whose timestamp is when it became attached, rule
   * 613.7e) and the latest one wins, else the owner. An `untilEndOfTurn` one
   * is dropped in cleanup. Absent on almost every permanent; cleared by
   * `moveObject` on any zone change, since a new object has no history
   * (rule 400.7).
   */
  controlEffects?: ControlEffect[];
  /** The name of the card this permanent is currently a *copy* of (rule 707 /
   * layer 1), or `null` when it is just itself. Every characteristic read —
   * P/T, types, abilities, the client's card face — resolves through
   * `printedCardName`, which returns this when set. Cleared on any zone change
   * (a Clone that dies and returns is a Clone again). */
  copyOf: string | null;
  /** The card whose rules text this permanent has (layer 3, rule 612.5): an
   * exchange of text boxes (Deadpool, Trading Card) gave it another
   * permanent's text as it then was — every ability, keyword and static —
   * while its name, mana cost, colors, types and P/T stay its own. Its
   * abilities are read through {@link rulesTextName}. Cleared on any zone
   * change, with `copyOf`. */
  textFrom?: string;
  /** Its copy effect lasts until end of turn (Cursed Mirror — rule 514.2):
   * the cleanup step clears `copyOf` along with the copy's exceptions, which
   * were made until-end-of-turn modifiers. Cleared on any zone change. */
  copyEndsAtCleanup?: true;
  /** What it was before a `become-copy` until end of turn made it a copy
   * (Sarkhan, Soul Aflame): its `copyOf` and the copiable modifiers that
   * copy set aside (a copy's copiable values replace them all — rule
   * 707.2). The cleanup step puts them back with `copyEndsAtCleanup`.
   * Cleared on any zone change. */
  copyRestore?: { readonly copyOf: string | null; readonly modifiers: PtModifier[] };
  /** The creature type chosen as this permanent entered (Urza's Incubator —
   * needed-cards P14, rule 601.2f-adjacent — an ETB choice, not a cast-time
   * one). Absent for a permanent with no such choice; cleared on any zone
   * change (a fresh entry chooses again). */
  chosenCreatureType?: string | null;
  /**
   * The word chosen as this permanent entered, for "as this enters, choose a
   * colour / choose Khans or Dragons" (Heraldic Banner, Frontier Siege).
   *
   * Separate from `chosenCreatureType`, which feeds a cost-matching check and
   * nothing else; this one is read by static abilities, mana abilities and
   * trigger conditions, so it stays a bare label the card's own text
   * interprets.
   */
  chosenOnEnter?: string | null;
  /**
   * "As this enters" choices (rule 614.12) made while it was still on its way:
   * a Clone's copy (`copyOf`, `null` for none — rule 707.9), a chosen
   * creature type or word (`chosen`), and what an Aura enchants (`enchant` —
   * its target, for an Aura spell, or its controller's choice, rule 303.4f;
   * `null` when there's nothing it could enchant, and then it doesn't enter,
   * 303.4g). They're asked before it moves, so the replacements that apply
   * as it enters and the triggers that see it arrive both see it as chosen;
   * `moveObject` applies them as it enters and clears them on any move. See
   * `Game.askEnterChoice`.
   */
  enterChoice?: {
    readonly copyOf?: string | null;
    /** The copied permanent's copy exceptions (its `copiable` modifiers),
     * which the copy takes too (rule 707.9b), then this copy effect's own
     * (`CopyOnEnter.except`). */
    readonly copyModifiers?: readonly PtModifier[];
    /** What copying adds to how it enters, beyond what it copies (rule
     * 707.9e — `CopyOnEnter.tapped` / `counters`): tapped, and counters,
     * each `ifType` judged once it's the copy. */
    readonly copyEnter?: {
      readonly tapped?: true;
      readonly counters?: readonly { readonly kind: string; readonly amount: number; readonly ifType?: CardType }[];
      /** The copy lasts until end of turn (`CopyOnEnter.untilEndOfTurn`). */
      readonly untilEndOfTurn?: true;
    };
    readonly chosen?: string;
    readonly enchant?: ObjectId | null;
    /** The player an "Enchant player" Aura enters attached to — its spell's
     * target, or its controller's choice (303.4f). Answers what `enchant`
     * would otherwise ask, and then `enchant` stays unset. */
    readonly enchantPlayer?: PlayerId;
    /** The card a reveal land's controller revealed from hand, or `null`
     * for none (it enters tapped). */
    readonly reveal?: ObjectId | null;
    /** Riot's choice (rule 702.136a): an additional +1/+1 counter, or haste. */
    readonly riot?: "counter" | "haste";
    /** The permanent it exchanges text boxes with as it enters
     * (`CardDefinition.exchangeTextOnEnter` — Deadpool), or `null` when its
     * controller declined or there was none. */
    readonly exchangeText?: ObjectId | null;
  };
  /** The faces of a multi-face card (rule 712 — ROADMAP Phase 10), by name,
   * front first — copied from `CardDefinition.faces` when the object is
   * created. Absent for a single-faced card. */
  faces?: readonly string[];
  /** Which face of a multi-face card is up (index into `faces`). `0` / absent
   * = the front face. Set by the cast/play face choice; a transform effect
   * toggles it in place; reset to `0` on a move to a hidden zone (rule 712 —
   * a DFC has only its front face's characteristics while not on the
   * battlefield or stack). */
  face?: number;
  /** The value chosen for `{X}` when this spell was cast (rule 601.2b). Set on
   * the stack object and preserved onto the permanent it becomes, because the
   * permanent's own enters-the-battlefield replacement ("enters with X
   * counters") and triggered abilities use it (rule 107.3m) — the latter via
   * `PendingTrigger.x`, which copies it onto the ability object. Nothing else
   * reads it off a permanent: for everything else the permanent's X is 0
   * (a filter's mana value only counts it on the stack). `null` when the
   * cost had no `{X}` or the permanent entered without being cast. Cleared by
   * `moveObject` on any later zone change, so a flickered permanent comes
   * back as a new object with no X. On an ability object it is the X that
   * ability resolves with (`ctx.x`). */
  xValue: number | null;
  /** For a triggered-ability object on the stack: a numeric quantity from the
   * triggering event (the entering / attacking creature's power, or the combat
   * damage a creature dealt), snapshotted at trigger time — read by
   * `EffectAmount` `{ triggerValue: true }` (Terror of the Peaks, Old
   * Gnawbone). ROADMAP P4b. */
  triggerValue?: number;
  /** For a triggered-ability object on the stack: the object whose entering /
   * attacking / etc. fired the trigger, snapshotted at trigger time — read by
   * a `create-token-copy` effect with `of: "trigger-object"` (Miirym, Sentinel
   * Wyrm — needed-cards P5b). */
  triggerObject?: ObjectId;
  /** For a triggered-ability object on the stack fired by a `becomes-target`
   * trigger: the spell or ability that targeted — see {@link TargetedBy}. */
  targetedBy?: TargetedBy;
  /** For a triggered-ability object on the stack: how many real, independent
   * firings this one stack-object represents — the ability's own source's
   * `stackCount` (a `stackCount`-carrying token's ability fired once but
   * stands for that many identical creatures each triggering separately,
   * rule 603.3d) times the triggering event's own `count`, if any. Read by
   * `applyEffectSpec`'s `create-token` / `create-token-copy` cases to scale
   * `count` — the only effect kinds proven safe to multiply this way (no
   * per-firing choice or target). `1` outside a scaled resolution; a
   * multiplier > 1 is only ever produced for a *non-targeted* ability whose
   * whole effect is safe to scale (see `Game.isCountScalableEffect`) —
   * anything else is fired once per real instance instead, at full cost, so
   * this never changes another card's observable behaviour. Pure engine
   * resource-safety optimization, not derived from any rule. */
  stackMultiplier?: number;
  /** The modes chosen for a targeted modal spell as it was cast (rule 700.2 —
   * ROADMAP Phase 11 EG-2), sorted ascending — indices into
   * `CardDefinition.castModal.modes`. `resolveTopOfStack` applies each with its
   * own slice of `targets`. Absent for a non-modal spell; cleared on any zone
   * change. */
  chosenModes?: readonly number[];
  /** How a spell's divided amount was split among its group's targets as it
   * was cast (rule 601.2d — `CardDefinition.divided`), one per target in
   * order. Cleared on any zone change. */
  division?: readonly number[];
  /** This spell was kicked as it was cast (rule 702.33 — needed-cards P8): its
   * kicker cost was paid, so `resolveTopOfStack` applies the kicked `effect`.
   * Absent for an unkicked or unkickable spell; cleared on any zone change. */
  kicked?: boolean;
  /** How many times a multikicker cost was paid as this spell was cast
   * (rule 702.33c–d) — set with `kicked` on a multikicker spell, cleared
   * with it. */
  timesKicked?: number;
  /** A granted offspring cost was paid as this spell was cast (Zinnia): the
   * permanent it becomes gets offspring's trigger as it enters. Cleared on
   * any zone change after that. */
  offspringGrantPaid?: boolean;
  /** Gift (rule 702.174): the opponent this spell's gift was promised to —
   * chosen as its gift cost was paid (`GiftAsk`), copied to a copy of it
   * (the ruling). Cleared on any zone change; a permanent spell carries it
   * onto the battlefield as `enteredGiftTo`. */
  giftTo?: PlayerId;
  /** The opponent the gift of this permanent's spell was promised to, for
   * its "when this permanent enters, if its gift cost was paid" ability
   * (rule 702.174b). Gone with its next move; a copy of the permanent
   * doesn't have it (the ruling). */
  enteredGiftTo?: PlayerId;
  /** This spell was cast for its evoke cost (rule 702.74): the permanent it
   * becomes gets evoke's sacrifice trigger as it enters. Cleared on any
   * zone change after that. */
  evokePaid?: boolean;
  /** This spell was cast for its overload cost (rule 702.126 — Cyclonic
   * Rift): its overload cost was paid instead of its mana cost, with no
   * targets, so `resolveTopOfStack` applies `CardDefinition.overload.effect`.
   * Absent otherwise; cleared on any zone change. */
  overloaded?: boolean;
  /** The alternative permission this spell was cast under while it's on the
   * stack (ROADMAP Phase 6). `"flashback"` (rule 702.34) additionally means it
   * is exiled instead of going anywhere else from the stack. `null` / absent
   * for a normally-cast spell. Cleared by `moveObject` on any zone change. */
  castVia?: CastVia | null;
  /** A temporary "this instant/sorcery card in a graveyard has flashback"
   * grant (Snapcaster Mage — ROADMAP Phase 6b). Read alongside
   * `CardDefinition.flashback`. Cleared on any zone change and (when
   * `untilEndOfTurn`) in cleanup. `by` is the source of the effect that gave
   * it (Past in Flames), which names this flashback beside the card's own. */
  grantedFlashback?: { cost: string; untilEndOfTurn: boolean; by?: ObjectId } | null;
  /** True while this card is suspended — exiled with time counters (rule
   * 702.62 — ROADMAP Phase 6b). A turn-based action removes one time counter
   * at the owner's upkeep; at zero it's cast for free. Cleared on any zone
   * change. */
  suspended?: boolean;
  /** True on a permanent cast from suspend (or another "has haste until it
   * leaves" grant) — `hasSummoningSickness` returns false for it. Cleared on
   * any zone change. */
  hastyUntilItLeaves?: boolean;
  /** True on a token copy that must be exiled at the beginning of the next end
   * step (Miirym, Sentinel Wyrm — rule 707 / needed-cards P5b). Swept in
   * `endStepActions`. */
  exileAtEndStep?: boolean;
  /** True on a token that must be *sacrificed* at the beginning of the next
   * end step (Encore — rule 702.141). Distinct from `exileAtEndStep`: a
   * sacrifice sees dies-triggers, an exile doesn't. */
  sacrificeAtEndStep?: boolean;
  /** "If it would leave the battlefield, exile it instead of putting it
   * anywhere else" (rule 614 — Whip of Erebos, Necromancy): a replacement
   * that follows this one object, not a static on some permanent. Set by the
   * effect that put it onto the battlefield (`put-onto-battlefield
   * { exileIfItWouldLeave }`), read by `moveObject` on the way out, and
   * cleared by that same move — the card that lands in exile is a new object
   * the replacement no longer applies to (rule 400.7). */
  exileIfItWouldLeave?: boolean;
  /** True on a token copy created "except it's not legendary" (Miirym — rule
   * 707 / needed-cards P5b). The legend-rule SBA skips it. Intrinsic, like
   * `isToken` — never reset. */
  notLegendary?: boolean;
  /** True while this card is foretold — exiled face-down for `{2}`, castable
   * later for its foretell cost (rule 702.144 — ROADMAP Phase 6b).
   * `foretoldOnTurn` is the turn it was foretold (can't be cast the same
   * turn). Both cleared on any zone change. */
  foretold?: boolean;
  foretoldOnTurn?: number | null;
  /** Exiled **face down** (rule 406.3): nobody may look at it but these
   * players — the one an instruction let look at it ("look at the top card
   * of that player's library, then exile it face down" — Edward Kenway), who
   * may go on looking for as long as it stays exiled. Its owner isn't one
   * unless named. Cleared on any zone change: it's turned face up as it
   * leaves exile. */
  exiledFaceDown?: { readonly lookers: readonly PlayerId[] };
  /** A **face-down permanent** (rule 708): manifested (701.40) or cloaked
   * (701.58). It has no characteristics but a face-down 2/2's — no name, no
   * text, no subtypes, no mana cost, and ward {2} if cloaked (708.2a) — which
   * are its copiable values, so {@link printedCardName} reads it as one of
   * the internal {@link FACE_DOWN_CARDS} definitions and every
   * characteristic and ability read follows. Only its controller may look at
   * it (708.5). Cleared on any zone change, where it's revealed (708.9);
   * turned face up as a special action (701.40b). */
  faceDown?: { readonly kind: FaceDownKind };
  /**
   * A **Room**'s unlocked designations (rule 709.5c — a split permanent with
   * a shared type line): which of its doors, the card's left and right
   * halves, are unlocked. On the battlefield only; it enters with the door
   * that was cast unlocked and with neither otherwise (709.5d), and a door is
   * unlocked by its unlock cost (a special action, 709.5e) or an effect
   * (709.5f). A locked door's name, mana cost and rules text aren't the
   * permanent's (709.5): with one door unlocked it is that half (`face` 1 or
   * 2), with both the whole card (`face` 0), and with neither the internal
   * {@link LOCKED_ROOM} definition that {@link printedCardName} reads.
   * Cleared on any zone change.
   */
  doors?: { readonly left: boolean; readonly right: boolean };
  /**
   * The permanent this card was exiled with, in the battlefield stint it was
   * in then — what a linked ability of that object means by "the exiled
   * card" (rule 607.2a — hideaway, rule 702.75). Only that object's abilities
   * reach it: the permanent back from a blink is a new object (rule 400.7).
   * While the card stays exiled face down, whoever controls that permanent
   * may look at it (702.75a), and goes on being able to (406.3). Cleared on
   * any zone change.
   */
  exiledWith?: { readonly source: ObjectId; readonly zoneChangeCount: number };
  /**
   * How many cards have been exiled *with* this permanent (an `exile {
   * linked }` — rule 607.2a) in its battlefield stint `stint`, ever — a card
   * that has left exile since still counts (the Colfenor's Urn ruling: "over
   * the course of the entire game"). A different stint is a different
   * object (rule 400.7) with none. Read by the `exiled-with-source`
   * condition.
   */
  exiledWithCount?: { readonly stint: number; readonly count: number };
  /** True while this adventure card sits in exile after its adventure resolved
   * (rule 715.3 — ROADMAP Phase 10): its owner may cast the creature half from
   * exile. Cleared on any zone change. */
  onAdventure?: boolean;
  /** What this creature is attacking — a player, or an opponent's planeswalker
   * (rule 508.1) — or `null` if not attacking. */
  attacking: PlayerId | ObjectId | null;
  /** The attacker this creature is blocking, or `null` if not blocking. */
  blocking: ObjectId | null;
  /** Blockers assigned to this attacker, in damage-assignment order. */
  blockedBy: ObjectId[];
  /** True once this attacker has been blocked (even if the blockers later die). */
  blocked: boolean;
  /** `"card"` for a real card/token; `"ability"` for an ability on the stack;
   * `"emblem"` for an emblem with triggered abilities (`EmblemState.object` —
   * rule 114: in the command zone, in no zone list, never moving). */
  kind: "card" | "ability" | "emblem";
  /** For an ability object: `"activated"` or `"triggered"`. */
  abilityKind: "activated" | "triggered" | "chapter" | null;
  /** For an ability object: the permanent whose ability this is. */
  sourceObjectId: ObjectId | null;
  /** For an ability object: index into the source's `activated`/`triggered` list. */
  abilityIndex: number | null;
  /** For a spell or ability on the stack: where each of its object targets
   * was when it was targeted (`null` for a player or an empty slot). An
   * object that has left that zone is read by last-known information (rule
   * 608.2h) — for a spell, as it last existed on the stack. A delayed
   * trigger carries its creator's zones forward. */
  targetZones?: (ZoneType | null)[];
  /** For a spell or ability on the stack: each object target's
   * `zoneChangeCount` when it was targeted (`null` for a player or an empty
   * slot). One that has changed zones since is a new object (rule 400.7) —
   * no longer the one meant — so it counts as gone when this resolves. A
   * delayed trigger, which chose no targets of its own, carries its
   * creator's as they were when it was created (`DelayedTrigger.targetStints`):
   * it acts on none that has changed zones since, while what it reads of
   * them still comes from last-known information (rule 608.2h — Mana
   * Drain's "that spell's mana value"). */
  targetStints?: (number | null)[];
  /** A spell's counters to enter the battlefield with — the
   * `enters-with-counters` effect. Cleared by any zone change but its own
   * resolution onto the battlefield. */
  entersWithCounters?: { readonly kind: string; readonly amount: number }[];
  /** A card's mana value as it last existed on the stack, {X} included (rule
   * 202.3e), set each time it leaves the stack. Read only through a target
   * that was a spell — see `targetZones` — so it needn't be cleared when the
   * card moves on (a countered spell exiled from the graveyard was still
   * that spell). */
  lastStackManaValue?: number;
  /** This spell as it last existed on the stack, set each time it leaves:
   * what a copy of it copies once it has gone (rule 707.10 — Shiko and
   * Narset, Unified copies "that spell" even after it was countered in
   * response). Kept through later moves like `lastStackManaValue`; its
   * `zoneChangeCount` says which stint on the stack it describes. */
  lastOnStack?: SpellSnapshot;
  /** How much mana was actually spent to cast this spell — the `{ manaSpentOf }`
   * amount and the `manaSpent` filter clause (Prossh; The Emperor of
   * Palamecia's "if at least four mana was spent to cast it"). Set as it's
   * cast (0 for a free cast), kept by the permanent it resolves into, and
   * cleared by any other zone change. */
  manaSpent?: number;
  /** Where the mana spent to cast this spell came from, one entry per unit
   * spent — the `manaFrom` filter clause ("if mana from an artifact was
   * spent to cast it"). Kept and cleared with `manaSpent`. */
  manaSpentFrom?: ManaOrigin[];
  /** The colours of the mana spent to cast this spell, each once, in WUBRG
   * order — converge's "the number of colors of mana spent to cast this
   * spell" (the `{ colorsSpentOf }` amount). Colourless isn't a colour. Kept
   * and cleared with `manaSpent`. */
  manaSpentColors?: Color[];
  /** For a triggered ability object: the target slots its triggering event
   * filled rather than its controller choosing — a saboteur's "that player"
   * (Hypnotic Specter's discard). Those aren't targets (rule 115.1), so
   * hexproof and protection don't stop them; resolution still checks that
   * the slot can hold what's in it. */
  autoTargetSlots?: number[];
  /** For an ability object: its source's `timestamp` when the ability was put
   * on the stack. A permanent that leaves and returns gets a new timestamp,
   * which is how "the Nth time this ability has resolved this turn" tells the
   * two objects apart (see `GameState.abilityResolutionsThisTurn`). */
  sourceTimestamp?: number;
  /** For an ability object: its source's `zoneChangeCount` as it went on
   * the stack (for a delayed trigger, as it was created). If the source has
   * moved since, it is a new object (rule 400.7), and the ability's
   * `"source"` names nothing to act on — "put a +1/+1 counter on ~" on a
   * creature flickered in response puts none — while a read of it ("its
   * power") uses last-known information. */
  sourceZoneChangeCount?: number;
  /** How many times this object has changed zones — bumped by every
   * `moveObject`. Object ids survive zone changes in this engine (a commander
   * keeps its id), so this is what tells the card an ability was activated
   * from apart from the same card after a round trip. Absent means 0. */
  zoneChangeCount?: number;
  /** For an ability object whose ability was *granted* rather than printed:
   * where it came from, so it still resolves once the grant is gone (see
   * {@link GrantedAbilityRef}). Absent for a printed ability. */
  grantedAbility?: GrantedAbilityRef;
  /** Counters on this object, e.g. `{ "+1/+1": 2 }`. Cleared on any zone change. */
  counters: Record<string, number>;
  /** When each kind of keyword counter was last put on it (rule 613.7c — every
   * counter of a kind takes the newest one's timestamp), for ordering the
   * keyword it gives against a loss of all abilities in layer 6. A kind
   * missing here was on it as it entered, and has its timestamp. Cleared with
   * the counters. */
  counterTimestamps?: Record<string, number>;
  /** Temporary modifiers (P/T and/or granted keywords). `untilEndOfTurn` ones expire in cleanup. */
  modifiers: PtModifier[];
  /** Order this object entered the battlefield (rule 613.7 timestamp); 0 if never. */
  timestamp: number;
  /**
   * What this permanent has done since it entered the battlefield: life its
   * controller's opponents lost to it (`lifeTaken`: damage it dealt them, in
   * combat or by an ability of its own, and life one of its abilities made
   * them lose -- Ob Nixilis, the Fallen's drain counts as much as a hit),
   * and cards its controller drew while one of its
   * abilities resolved. Public — every part of it is in the event log — and
   * read only by the bots (`bot/features.ts`'s `trackRecordOf`), to spot a
   * proven engine the printed stats undersell. Cleared when it leaves the
   * battlefield: back, it's a new object (rule 400.7). Absent until it has
   * done either.
   *
   * `thisTurn` is the current turn's share of the totals (stale once its
   * `turn` has passed — see {@link settledTally}): a bot reads only what was
   * done in earlier turns, so nothing its own search simulates this turn can
   * add to the record it is judging by.
   */
  tally?: {
    lifeTaken: number;
    cardsDrawn: number;
    thisTurn: { turn: number; lifeTaken: number; cardsDrawn: number };
  };
  /** True for a token (rule 111): ceases to exist as an SBA once it leaves the battlefield. */
  isToken: boolean;
  /**
   * A pure engine resource-safety optimization, **not derived from any
   * rule**: when set (> 1), this one `GameObject` stands in for `stackCount`
   * fully interchangeable, still-pristine token copies — e.g. a self-copying
   * token generator (Scute Swarm) that would otherwise mint one real object
   * per copy and blow up exponentially over a long game. Only ever set on a
   * freshly-minted, untouched token batch with no activated ability (see
   * `Game.isStackableTokenName`); the moment anything singles one out
   * (targeted, attacked/blocked, damaged, given a counter, attached to,
   * sacrificed, destroyed, tapped alone, copied) that one is split off into
   * its own ordinary object first (`Game.splitOneFromStack`) — a stacked
   * object's fields besides this one and `id`/`timestamp` are always exactly
   * the shared "just entered" state every member has. A *uniform* action
   * (destroy-all, damage-all, untap-all, or the stack lapsing as a whole —
   * rule 707/111 apply the same to every member) mutates or removes the
   * whole object directly, no split needed. Absent/`1` = an ordinary single
   * permanent — the overwhelmingly common case, entirely unaffected. A token
   * split off goes back into a stack once nothing tells it apart any more
   * (`Game.refoldSplitTokens`, `Game.recompactTokens`).
   *
   * On an ability on the stack it means the same thing: `stackCount`
   * identical copies of a triggered ability that chooses no targets, put on
   * the stack together (`PendingTrigger.copies`). Each resolves on its own,
   * one at a time with priority between, taking one off the count; a spell
   * or ability that targets one of them (Stifle) splits it off first.
   */
  stackCount?: number;
  /**
   * This single token was part of a token stack and was split off it
   * (`Game.splitOneFromStack`) — or was the last of one, the rest split off.
   * Bookkeeping, not a characteristic: it marks the tokens worth folding back
   * together once they're identical again, during the turn as soon as nothing
   * is waiting (`Game.refoldSplitTokens`), and at cleanup even when fewer than
   * a fresh batch's stacking threshold (`Game.recompactTokens`). Cleared as
   * the token absorbs others into a stack; left out of every comparison
   * (`tokenFoldKey`, `exactTokenShape`).
   */
  splitFromStack?: true;
  /** True for a copy of a spell on the stack (rule 707.10 — storm, Twincast).
   * `cardName` is the copied spell's name; the copy ceases to exist instead of
   * moving to any zone other than the stack. ROADMAP Phase 8. Also a copy of
   * a *card* made to be cast (rule 707.12 — Isochron Scepter, a `cast-now`'s
   * `copies`), which ceases to exist if it's still outside the stack and
   * the battlefield at the next state-based check (704.5e). */
  isCopy?: boolean;
  /** Spells (by any player) cast this turn *before* this spell — captured when
   * it's cast, read by a `storm` effect on it (rule 702.40a). ROADMAP Phase 8. */
  stormCount?: number;
  /** The permanent this Aura/Equipment is attached to, or `null`. */
  attachedTo: ObjectId | null;
  /** The player this Aura is attached to — a Curse's "Enchant player" (rule
   * 303.4: an Aura can be attached to a player). Set instead of
   * `attachedTo`, never with it; cleared on any zone change. */
  attachedToPlayer?: PlayerId;
  /**
   * True for a player's designated commander (intrinsic, like `isToken` —
   * never reset by `moveObject`). Lets it be cast from the command zone
   * (rule 903.4, with tax) and redirects it back to the command zone
   * instead of hand/library/graveyard/exile (rule 903.9a, "commander
   * replacement" — applied automatically here, with no opt-out).
   */
  isCommander: boolean;
}

/**
 * A spell's copiable state on the stack (rule 707.10): its characteristics
 * and every choice made as it was cast — modes, targets, {X}, the additional
 * and alternative costs paid. What a copy of it starts from, read off the
 * live spell or, once it has left the stack, off `GameObject.lastOnStack`.
 */
export interface SpellSnapshot {
  /** The spell's `zoneChangeCount` on the stack, matched against
   * `LastKnownRefs.triggerSpell`. */
  readonly zoneChangeCount: number;
  /** `printedCardName` — the face or half that was cast. */
  readonly cardName: string;
  readonly targets: readonly (TargetRef | undefined)[] | null;
  readonly targetZones?: readonly (ZoneType | null)[];
  readonly targetStints?: readonly (number | null)[];
  readonly autoTargetSlots?: readonly number[];
  readonly xValue: number | null;
  readonly chosenModes?: readonly number[];
  readonly division?: readonly number[];
  readonly kicked?: boolean;
  readonly timesKicked?: number;
  readonly overloaded?: boolean;
  readonly evokePaid?: boolean;
  readonly offspringGrantPaid?: boolean;
  /** Who its gift was promised to — a copy's is promised to them too. */
  readonly giftTo?: PlayerId;
  /** The creatures that convoked it (`GameObject.convokedBy`): a copy's
   * "each creature that convoked this spell" means the original's — an
   * effect of a copy that refers to objects used to pay its costs uses
   * those that paid the original's (rule 707.10). */
  readonly convokedBy?: readonly { readonly object: ObjectId; readonly stint: number }[];
  /** Its copiable modifiers (a prototyped spell's — rule 718.3c). */
  readonly modifiers: readonly PtModifier[];
}

export interface PtModifier {
  power: number;
  toughness: number;
  keywords: Keyword[];
  /** Combat restrictions this modifier imposes, with it — "target creature
   * can't block this turn", "~ must be blocked each combat this turn if
   * able" (the `restrict` effect). */
  restrictions?: CombatRestriction[];
  /** Layer 4 — card types this modifier adds (a man-land's "becomes a …
   * creature. It's still a land." keeps the printed types and adds these). */
  addTypes?: CardType[];
  /** Layer 4 — it loses all its land types (Ultima, Origin of Oblivion's
   * blight); its other subtypes, card types and supertypes stay. */
  loseLandTypes?: true;
  /** Layer 4 — card types this modifier *replaces* them with (Myrkul, Lord
   * of Bones's copy: "it's an enchantment and loses all other card types").
   * A subtype tied to a card type it no longer has goes too (rule 205.1a).
   * Applied before `addTypes`. */
  setTypes?: CardType[];
  /** Layer 4 — subtypes this modifier adds (e.g. `["Blinkmoth"]`). */
  addSubtypes?: string[];
  /** Layer 4 — subtypes this modifier *replaces* them with (Turn to Frog:
   * "becomes a … Frog"): each replaces the existing subtypes of its own kind
   * (rule 205.1a — a Frog loses its creature types, not an Equipment's
   * artifact type). Applied before `addSubtypes`. */
  setSubtypes?: string[];
  /** Layer 5 — colours this modifier adds ("becomes red in addition to its
   * other colours"). */
  addColors?: Color[];
  /** Layer 5 — colours this modifier *sets* (Turn to Frog: "becomes … blue").
   * Applied before `addColors`; the latest such modifier wins. */
  setColors?: Color[];
  /** Layer 6 — this permanent loses all of its abilities (Turn to Frog): its
   * own keywords and activated, triggered and static abilities, and what
   * was granted it before this modifier's `timestamp` — by an anthem, an
   * Aura or Equipment, a keyword counter or a one-shot grant. What's granted
   * after (including by this same modifier's `keywords`) it has (rule
   * 613.7). */
  loseAbilities?: boolean;
  /** Layer 7b — a "becomes a N/N" that *sets* base P/T rather than adding to
   * it. Applied after a CDA, before counters (7c) and +N/+N bonuses (7d);
   * the latest such modifier wins. */
  setPt?: [number, number];
  /** Layer 7b — sets base toughness alone, ordered with `setPt` by
   * timestamp: an exchange of a life total with a toughness (rule 701.12g —
   * Tree of Redemption's "exchange your life total with this creature's
   * toughness"), which leaves its power as it was. */
  setToughness?: number;
  /** Layer 6 — triggered abilities this modifier grants, for a one-shot
   * "gains '[trigger]' until end of turn" (Hunter's Prowess, Hunter's
   * Insight). The ongoing, static equivalent is
   * `StaticAbility.grantsTriggered`. */
  grantsTriggered?: TriggeredAbility[];
  /** Layer 6 — activated abilities this modifier grants: a copy exception's
   * "and it has '{2}, {T}, Sacrifice this token: You gain 3 life.'"
   * (Brenard, Ginger Sculptor). Seen by `legalActions`, activation and the
   * mana payer like any granted activated ability. */
  grantsActivated?: ActivatedAbility[];
  /** "Until your next turn": it ends as this player's next turn begins, or
   * as it would have begun once they've left the game (rule 800.4m). */
  untilTurnOf?: PlayerId;
  /** "Until end of combat" / "this combat" (rules 500.5a, 511.2): it ends as
   * the combat phase does — Legion Warboss's token "attacks this combat if
   * able", which a later combat that turn doesn't bind. Set with
   * `untilEndOfTurn` too, so a turn with no combat after it still ends it. */
  untilEndOfCombat?: true;
  /** "For as long as it has a [kind] counter on it" (rule 611.2b): it ends
   * as the last one is removed, and a new one doesn't bring it back. */
  whileCounter?: string;
  /** "For as long as [that permanent] remains on the battlefield"
   * (Opportunistic Dragon): it ends as that permanent, in that stint,
   * leaves — once everything leaving with it has left, so what it took away
   * stays away for that event's look back (rule 603.10a). */
  whileSource?: { readonly id: ObjectId; readonly zoneChangeCount: number };
  /** It can attack as though it didn't have defender (the
   * `attack-despite-defender` effect). A rule about it, not an ability it
   * has, so a loss of abilities doesn't end it. */
  canAttackAsThoughNoDefender?: true;
  /** It assigns combat damage equal to its toughness rather than its power
   * (the `damage-by-toughness` effect, rule 510.1a). Like the above, not an
   * ability. */
  combatDamageByToughness?: true;
  /** Layer 6 — it gains "This creature can't be sacrificed" (the
   * `"cant-be-sacrificed"` effect). The static equivalent is
   * `StaticAbility.cantBeSacrificed`. */
  cantBeSacrificed?: boolean;
  /** Part of the object's **copiable values** (rule 707.9b): an exception a
   * copy effect made ("except it's a 3/3 black Zombie creature in addition
   * to its other types"). Anything that copies this object copies these
   * too — a token copy, a Clone. Timestamped under every other effect. */
  copiable?: true;
  /** Its name — a copy exception's "except its name is Mishra's Warform".
   * Read through {@link nameOf}. */
  setName?: string;
  /** It isn't legendary — a copy exception's "and it isn't legendary"
   * (Spark Double). Read through `supertypesOf`. */
  notLegendary?: true;
  /** Supertypes it has in addition — a copy exception's "it's legendary in
   * addition to its other types" (Sakashima the Impostor). Read through
   * `supertypesOf`. */
  addSupertypes?: Supertype[];
  /** Layer 6 — it has "the 'legend rule' doesn't apply to [these
   * permanents]", scoped from its own side: a copy exception's "it has
   * Sakashima's other abilities" (Sakashima of a Thousand Faces). The static
   * form is `StaticAbility.legendRuleOff`; both are read by
   * `exemptFromLegendRule`. */
  legendRuleOff?: AffectSpec;
  /** It has no mana cost — eternalize's and embalm's "a copy of it, except
   * … with no mana cost" (rules 702.128a, 702.129a): mana value 0. Read
   * through {@link manaCostOverride}. */
  noManaCost?: true;
  /** Its mana cost is this instead — a prototyped spell's or permanent's
   * (rule 718.3b). Read through {@link manaCostOverride}. */
  setManaCost?: string;
  /** The prototype characteristics of a spell cast prototyped (rule 718):
   * kept from the stack onto the battlefield, gone on any other move. */
  prototype?: true;
  /** An effect the spell got for how it was cast, which goes on applying to
   * the permanent it becomes (rules 400.7b, 400.7h, 611.3d) — Thundermane Dragon's
   * "if you cast a creature spell this way, it gains haste until end of
   * turn". Kept from the stack onto the battlefield like `prototype`. */
  castRider?: true;
  untilEndOfTurn: boolean;
  /**
   * `GameState.timestampSeq` when the modifier was applied, for ordering its
   * layer-4 and layer-7b parts against static abilities' (rule 613.7): it
   * sorts after a static whose source has this timestamp or an earlier one.
   * Absent (the modifiers that change no types and set no P/T) sorts after
   * every static. A copy exception's base P/T (Saw in Half) is `-1`: it's a
   * copiable value, under every other effect. In layer 6 it orders what the
   * modifier grants against a loss of all abilities, where absent counts as
   * the earliest — so every modifier that grants something carries one.
   */
  timestamp?: number;
}

/**
 * Where a granted ability came from — a `grantsActivated` / `grantsTriggered`
 * static (Presence of Gond, Staggering Insight), or a one-shot modifier's
 * `grantsTriggered` (Hunter's Prowess).
 *
 * An ability on the stack exists independently of its source (rule 113.7a),
 * but a granted one can't be found again by index once the grant ends: the
 * Aura that granted it goes to the graveyard alongside the creature it was on,
 * and the index now points past the end of the creature's printed abilities.
 * Recorded when the ability is activated or triggers, and read back instead of
 * re-deriving it.
 */
export type GrantedAbilityRef =
  | {
      readonly kind: "static";
      /** The granting card's printed name, and where in its definition. */
      readonly cardName: string;
      readonly staticIndex: number;
      /** `"spell-triggered"`: a `grantsToSpells` static's `triggered`. */
      readonly list: "activated" | "triggered" | "spell-triggered";
      readonly index: number;
    }
  | { readonly kind: "modifier"; readonly ability: TriggeredAbility }
  /** An activated ability a modifier grants (`PtModifier.grantsActivated`). */
  | { readonly kind: "modifier-activated"; readonly ability: ActivatedAbility }
  /** A land's intrinsic mana ability from a basic land type it wasn't
   * printed with (rule 305.6 — `intrinsicManaColors`). */
  | { readonly kind: "intrinsic"; readonly color: Color }
  /** A card's cycling ability (rule 702.29a: "[Cost], Discard this card:
   * Draw a card", or landcycling's search), on the stack once it's been
   * cycled — `cyclingAbility` of the card named. */
  | { readonly kind: "cycling"; readonly cardName: string }
  /** Another card's own printed activated ability, at `index` — granted by
   * a `grantsActivatedOfLinkedExile` static (Steward of the Harvest gives a
   * creature an exiled land card's abilities). */
  | { readonly kind: "card-activated"; readonly cardName: string; readonly index: number }
  /** Another card's own printed triggered ability, at `index`: a permanent
   * whose text box came from that card (`GameObject.textFrom`, rule 612.5),
   * so the trigger resolves as that text however its source changes. */
  | { readonly kind: "card-triggered"; readonly cardName: string; readonly index: number };

/**
 * A permanent as it last existed on the battlefield (rules 603.10a, 608.2h):
 * its *computed* characteristics — layers, counters, anthems and copy effects
 * folded in — and the per-permanent state a leaves-the-battlefield trigger or
 * a resolving ability may ask about once it has gone.
 *
 * Plain data, taken by `moveObject` as the permanent leaves (`GameObject
 * .lastKnown`). The permanents of one simultaneous event (a wrath, a sweep of
 * state-based actions) are all snapshotted before the first of them moves, so
 * a creature and the lord it dies beside each keep the other's bonus. A token
 * that ceases to exist keeps its snapshot in `GameState.ceasedTokens` for the
 * rest of the turn.
 */
export interface LastKnownInfo {
  /** The permanent's `zoneChangeCount` while it was on the battlefield — which
   * of its stints there this describes. A reference to the permanent names
   * the stint it means the same way (see {@link LastKnownRefs}), so a card
   * that has since come back and left again isn't read through the wrong
   * snapshot. */
  readonly zoneChangeCount: number;
  /** The name its characteristics came from (`printedCardName`): the card it
   * was a copy of, or the face that was up. Its abilities are read off this,
   * unless `textName` says otherwise. */
  readonly name: string;
  /** The card whose rules text it had (`GameObject.textFrom`, rule 612.5),
   * when an exchange of text boxes gave it another's: its abilities are read
   * off this. Absent when they're `name`'s. */
  readonly textName?: string;
  readonly owner: PlayerId;
  readonly controller: PlayerId;
  readonly power: number;
  readonly toughness: number;
  /** Its base power and toughness (`Characteristics.basePower`). */
  readonly basePower: number;
  readonly baseToughness: number;
  readonly types: readonly CardType[];
  /** Computed subtypes — a changeling's with its every-creature-type marker
   * (`subtypes.ts`), so ask through `hasSubtype`. */
  readonly subtypes: readonly string[];
  readonly supertypes: readonly Supertype[];
  readonly colors: readonly Color[];
  readonly keywords: readonly Keyword[];
  /** Whether it had a mana ability (`characteristics.ts`'s `hasManaAbility`)
   * and any ability at all (`hasAnyAbility`), its granted ones included. */
  readonly hasManaAbility: boolean;
  readonly hasAbilities: boolean;
  readonly counters: Readonly<Record<string, number>>;
  /** Printed mana value of what it was (a copy effect's, a transformed card's
   * front face's); `{X}` is 0 off the stack (rule 202.3e). */
  readonly manaValue: number;
  /** The mana spent to cast it, if it was cast (`GameObject.manaSpent`). */
  readonly manaSpent?: number;
  /** Where that mana came from (`GameObject.manaSpentFrom`). */
  readonly manaSpentFrom?: readonly ManaOrigin[];
  /** Its colours (`GameObject.manaSpentColors`). */
  readonly manaSpentColors?: readonly Color[];
  readonly isToken: boolean;
  readonly isCommander: boolean;
  readonly tapped: boolean;
  /** Its spell was cast kicked (or its offspring cost paid) — `enteredKicked`,
   * so "if it was kicked" still answers once it has left. */
  readonly enteredKicked?: boolean;
  /** Who its spell's gift was promised to — `enteredGiftTo` — so the gift
   * is still given once it has left. */
  readonly enteredGiftTo?: PlayerId;
  /** The turn it entered the battlefield on, and the turn it attacked on if
   * it did — for the `enteredThisTurn` / `attackedThisTurn` filter clauses. */
  readonly enteredOnTurn?: number;
  /** How it had entered — `GameObject.entry`. */
  readonly entry?: EntryRecord;
  readonly attackedOnTurn?: number;
  /** `GameObject.damageThisTurn` and `dealtDamageToCreatureOnTurn` as it
   * left: a creature that died of it was still dealt it this turn. */
  readonly damageThisTurn?: DamageHistory;
  readonly dealtDamageToCreatureOnTurn?: number;
  readonly attacking: boolean;
  readonly blocking: boolean;
  readonly equipped: boolean;
  readonly enchanted: boolean;
  /** What it was attached to, if it was an Equipment or Aura on something —
   * so an "equipped creature dies" trigger still knows its host when both
   * left together. */
  readonly attachedTo?: ObjectId;
  /** The player it was attached to, if it was a Curse on one — so an
   * "enchanted player" trigger still knows them once it has left. */
  readonly attachedToPlayer?: PlayerId;
  /** Enchanted by an Aura its own controller controlled — rule 700.9's
   * "modified". */
  readonly enchantedByController: boolean;
  /** The controllers of the Auras on it, when there were any — the filter's
   * `enchantedBy`. */
  readonly enchantedBy?: readonly PlayerId[];
  /** Every player who had goaded it, whichever way (`goadersOf` — a one-shot
   * goad, one for the rest of the game, a static one), for the `goaded`
   * filter clause: "whenever a goaded attacking or blocking creature dies"
   * (Baeloth Barrityl, Entertainer). Absent when none had. */
  readonly goaders?: readonly PlayerId[];
  /** It was suspected (rule 701.60). */
  readonly suspected?: boolean;
  /** It had lost all its abilities (layer 6 — Turn to Frog), so none of its
   * own leaves-the-battlefield abilities trigger. */
  readonly lostAbilities: boolean;
  /** The name a copy exception gave it, where that isn't its card's
   * (`name`, which stays the registry key) — see {@link nameOf}. */
  readonly renamed?: string;
  /** Its copy exceptions (`copiable` modifiers) and whether one made it not
   * legendary: with `name` — the card it was a copy of, or the face that
   * was up — its last copiable values, which a copy of it made once it has
   * left copies (rule 608.2h — Ratadrabik of Urborg's "a copy of that
   * creature"). Absent when it had none. */
  readonly copiable?: readonly PtModifier[];
  readonly notLegendary?: true;
  /** The creature type chosen as it entered, if one was — what an ability
   * of it that resolves after it left reads for "of the chosen type" (rule
   * 608.2h: Herald's Horn's upkeep look). */
  readonly chosenCreatureType?: string;
  /** `GameObject.chosenOnEnter` as it left — which of a Siege's abilities it
   * had, for a leaves-the-battlefield trigger that looks back at it leaving
   * along with the creatures (rule 603.10a: Outpost Siege's "Dragons"). */
  readonly chosenOnEnter?: string;
  /** The triggered abilities it had been *granted* — by another permanent's
   * static or a one-shot modifier — in the order `effectiveTriggered` lists
   * them after its printed ones; with `lostAbilities`, only those granted
   * after the loss (rule 613.7). A granted dies trigger fires even when its
   * grantor is gone by the time the death is matched. Absent when none. */
  readonly grantedTriggers?: readonly GrantedAbilityRef[];
}

/**
 * A spell as it was cast (rule 601.2i): its last-known snapshot as it
 * reached the stack — characteristics as cast, mana value counting its {X}
 * (rule 202.3e). What it has become since doesn't change what was cast: an
 * Adventure cast as its instant half is a creature card in exile a moment
 * later, and a creature spell's permanent can change type.
 */
export interface CastSpellRecord {
  readonly id: ObjectId;
  readonly spell: LastKnownInfo;
}

/**
 * Which battlefield stint of the objects a spell or ability refers to it
 * means, for last-known information (rule 608.2h). Each is the referred
 * object's `zoneChangeCount` while it was on the battlefield: recorded when
 * the ability triggered or was activated (the source and the triggering
 * object), or when the permanent was sacrificed. A reference that names a
 * stint reads that stint's {@link LastKnownInfo} once the permanent has left
 * — and nothing, rather than a later stint's, once it has come back and left
 * again. A missing entry means the object wasn't a permanent when referred
 * to (a spell, a card in a hand, graveyard or the command zone), and it is
 * read as it is now.
 *
 * Targets need no entry: `GameObject.targetZones` already says which were
 * permanents.
 */
export interface LastKnownRefs {
  readonly source?: number;
  readonly triggerObject?: number;
  /** For an activated ability whose cost returned an attacking creature to
   * its owner's hand (`AbilityCost.returnToHand`): what that creature was
   * attacking as the cost was paid — the player, planeswalker or battle a
   * ninja put onto the battlefield attacks (rule 702.49c). */
  readonly returnedAttacking?: PlayerId | ObjectId;
  /** For a trigger fired by a spell — its casting (Baral and Kari Zev's
   * "your first instant or sorcery spell each turn"): the spell's
   * `zoneChangeCount` on the stack. Once it has left the stack (countered in
   * response), "that spell's mana value" is read as it last was there, its
   * {X} included (`GameObject.lastStackManaValue` — rule 608.2h). */
  readonly triggerSpell?: number;
  /** "For each of them" (Kambal, Profiteering Mayor): the permanents of the
   * simultaneous entry a batched `enters-battlefield` trigger fired on, each
   * with its battlefield stint and how many tokens it stood for (a
   * compacted stack is its tokens). */
  /** For a trigger fired by attackers being declared (`attack-with`): each
   * attacker, its battlefield stint and what it was attacking then — what an
   * "if two or more of those creatures are attacking you" re-reads as it
   * resolves (Mangara, the Diplomat — rule 603.4). */
  readonly attackers?: readonly {
    readonly object: ObjectId;
    readonly zoneChangeCount: number;
    readonly at: PlayerId | ObjectId | null;
  }[];
  /** "One of them" (Colossal Grave-Reaver): the cards of the move a batched
   * `put-into-graveyard` trigger fired on that counted for it, each as the
   * object it became in that graveyard. */
  readonly arrivedTogether?: readonly { readonly object: ObjectId; readonly zoneChangeCount: number }[];
  readonly enteredTogether?: readonly {
    readonly object: ObjectId;
    readonly zoneChangeCount: number;
    readonly count: number;
  }[];
  /**
   * For a trigger fired by its triggering object *leaving* the battlefield (a
   * dies trigger, a delayed "when it dies or is exiled") or arriving in a
   * graveyard (`put-into-graveyard`): that object's `zoneChangeCount` in the
   * zone the event put it in. "Return it to the
   * battlefield" follows it there and no further — a card that has moved
   * again since (exiled from the graveyard in response) is a new object the
   * ability can't find (rule 400.7). What `ResolutionContext
   * .triggerObjectLost` is worked out from; reads of it ("its power") are
   * last-known information and don't care.
   */
  readonly triggerObjectAfterLeaving?: number;
  /** "The sacrificed creature": the permanent sacrificed to pay the spell's
   * or ability's cost (Dina, Soul Steeper), or by a `sacrifice-source` step
   * before the effect reading it. */
  readonly sacrificed?: { readonly object: ObjectId; readonly zoneChangeCount: number };
  /** "The tapped creature": the one permanent tapped to pay the ability's
   * cost (`AbilityCost.tapOthers` — station's, rule 702.184a). */
  readonly tapped?: { readonly object: ObjectId; readonly zoneChangeCount: number };
  /**
   * What the triggering event was aimed at, for a trigger whose event has a
   * recipient — the permanent or player a `damage-dealt` event hit
   * (`deals-damage`, `dealt-damage`, `deals-combat-damage-to-player`), or
   * the player or planeswalker an attacker was declared attacking (`attacks`
   * — Mage Slayer's "the player or planeswalker it's attacking").
   * `zoneChangeCount` is a permanent recipient's battlefield stint: "that
   * permanent" is gone, rather than read as it last was, once it has left
   * (Ghyrson Starn's 2 damage to a creature that has since died hits
   * nothing). What a `damage` effect's `toTriggerRecipient` hits.
   */
  readonly recipient?: { readonly target: TargetRef; readonly zoneChangeCount?: number };
  /**
   * The player the triggering event names — "that player": the player dealt
   * damage (or the controller of the permanent dealt damage), the defending
   * player of an attack. What the `"trigger-player"` and
   * `"each-other-opponent"` scopes read.
   */
  readonly player?: PlayerId;
}

/**
 * The spell or ability whose targeting fired a "becomes the target"
 * trigger (rule 115.7), recorded as it triggers: ward's "counter **that
 * spell or ability** unless **that player** pays" (rule 702.21a) needs both.
 * `zoneChangeCount` is the spell's as it was targeting, so a spell that has
 * since left the stack (and come back as a new object — rule 400.7) isn't
 * the one ward counters. An ability object is never reused, so its count is
 * always 0.
 */
export interface TargetedBy {
  readonly object: ObjectId;
  readonly player: PlayerId;
  readonly zoneChangeCount: number;
}

/** A triggered ability waiting to be put on the stack (rule 603.3). */
export interface PendingTrigger {
  readonly sourceObjectId: ObjectId;
  readonly cardName: string;
  readonly abilityIndex: number;
  readonly controller: PlayerId;
  /** Its ability's `stackFirst`: placed before its controller's others. */
  readonly stackFirst?: boolean;
  /** Its controller has chosen where it goes among their simultaneous
   * triggers (the `order-triggers` decision): placed as it stands in
   * `pendingTriggers`, not re-sorted, and not asked about again. */
  readonly ordered?: boolean;
  /** A target the triggering *event* determines (not chosen) — e.g. the
   * player a saboteur just dealt combat damage to. Fills the ability's target
   * slots in order, ahead of any `chooseTargets` prompt. */
  readonly autoTargets?: readonly TargetRef[];
  /** A numeric quantity from the triggering event (the entering / attacking
   * creature's power, or the combat damage a creature dealt a player),
   * snapshotted when the trigger was detected — for an `EffectAmount`
   * `{ triggerValue: true }` (Terror of the Peaks, Old Gnawbone). ROADMAP P4b. */
  readonly triggerValue?: number;
  /** The object whose entering / attacking / etc. fired this trigger,
   * snapshotted when it was detected — for a `create-token-copy` effect with
   * `of: "trigger-object"` (Miirym, Sentinel Wyrm — needed-cards P5b). */
  readonly triggerObject?: ObjectId;
  /** For a `becomes-target` trigger: the spell or ability that did the
   * targeting — see {@link TargetedBy}. */
  readonly targetedBy?: TargetedBy;
  /** The X the source was cast with, for its own enters-the-battlefield
   * ability (rule 107.3m) — snapshotted as the trigger is detected, since the
   * permanent may be gone (a 0/0 that entered with X=0) or a new object (it
   * was flickered) by the time the ability is put on the stack. Becomes the
   * ability object's `xValue`, so the ability reads it as `ctx.x`. Absent for
   * every other trigger, and for a permanent that entered without being cast:
   * X is 0 then. */
  readonly x?: number;
  /** See {@link GameObject.stackMultiplier} — how many real firings this one
   * queued trigger represents. `undefined`/`1` outside a scaled resolution. */
  readonly multiplier?: number;
  /** How many identical copies of this trigger — one that chooses no targets,
   * fired once per token of a token stack (Authority of the Consuls seeing
   * an opponent's Scute Swarms enter) — go on the stack as one object
   * standing for them all (`GameObject.stackCount`). Unlike `multiplier`,
   * each copy is its own resolution, one at a time, with priority between;
   * this only spares minting hundreds of identical objects. */
  readonly copies?: number;
  /** True for a Saga chapter ability (rule 714) — `abilityIndex` indexes
   * `def.chapters` rather than `def.triggered`. ROADMAP Phase 10. */
  readonly chapter?: boolean;
  /** Set when the ability was granted — see {@link GrantedAbilityRef}. */
  readonly grantedAbility?: GrantedAbilityRef;
  /** Which battlefield stint of its source and triggering object the ability
   * refers to, recorded as it triggers — see {@link LastKnownRefs}. */
  readonly lastKnownRefs?: LastKnownRefs;
  /**
   * A whole ability record rather than an index into a card's `triggered`
   * list — a mana-spend rider (Path of Ancestry), which is an ability of no
   * card's ability list at all: it rides on a unit of mana. Carried the same
   * way `GameObject.delayedTrigger` carries one, and placed by the same
   * minting code, so it resolves through the existing path.
   *
   * It queues here rather than going straight onto the stack because the
   * mana is spent *during* casting, before this engine has moved the card to
   * the stack. Minting immediately would put the rider underneath the spell
   * and resolve it second; queueing lets `prepareForPriority` place it when
   * a player would next get priority, which is both rule 603.3b and the
   * right order.
   */
  readonly delayed?: DelayedTrigger;
  /** A mana-spend rider's `triggerObject` is the spell the mana paid for,
   * still being cast as the rider fires: its `lastKnownRefs.triggerSpell` —
   * which stint on the stack "that spell" is — is read as the rider is
   * placed, by when the spell is there. */
  readonly triggerSpellOnPlacement?: true;
  /** A reflexive triggered ability — see {@link ReflexiveTrigger}. Placed
   * like a card's own triggered ability, choosing its targets as it goes on
   * the stack, from this record's specs rather than a card's list. */
  readonly reflexive?: ReflexiveTrigger;
  /** A modal ability's modes ("Choose one —"), announced as it goes on the
   * stack (rules 603.3c, 700.2b) — set once its controller has answered the
   * `choose-modes` it paused for, in printed order. See the `modal`
   * effect's `announced`. */
  readonly modes?: readonly number[];
}

/**
 * A reflexive triggered ability (rule 603.12): "you may pay {2}. **When you
 * do**, return target creature card …" (Terra, Herald of Hope). A resolving
 * spell or ability creates it once the optional or conditional action has
 * happened, and it goes on the stack the next time a player would receive
 * priority — after that spell or ability has finished resolving — choosing
 * its targets then. It belongs to no card's ability list, so it carries its
 * own targets and effect, as a {@link DelayedTrigger} does; its source and
 * controller are the resolving spell's or ability's.
 */
/** One of the triggered abilities an `order-triggers` decision orders. */
export interface TriggerOrderEntry {
  /** The object whose ability it is. */
  readonly source: ObjectId;
  readonly cardName: string;
  /** The ability's text, to tell two abilities of one card apart. */
  readonly text: string;
  /** How many identical copies it stands for (`PendingTrigger.copies`). */
  readonly copies: number;
}

export interface ReflexiveTrigger {
  readonly targets: readonly TargetSpec[];
  readonly effect: EffectSpec;
  readonly text: string;
}

/** A kind of counter a player can have (rule 122.1), apart from energy — see
 * `PlayerState.counters`. */
export type PlayerCounterKind = "poison" | "experience";

/** How many poison counters make a player lose (rule 704.5c). */
export const POISON_LETHAL = 10;

export interface PlayerState {
  readonly id: PlayerId;
  life: number;
  /** How many times the Ring has tempted this player this game (rule
   * 701.54c) — what the Ring emblem's later abilities are gated on. Absent
   * until it first does. */
  ringTemptations?: number;
  /** The creature chosen as Ring-bearer by the temptation under way, between
   * its choice and its completion — what "whenever the Ring tempts you"
   * names. Cleared as the temptation completes. */
  ringChosen?: ObjectId;
  /** Mana floating in this player's pool, as individual units rather than a
   * count per colour — a unit may be restricted in what it pays for, may
   * survive the end of a step, or may carry a rider that fires when it's
   * spent, and none of that survives being added up. `poolCounts` gives the
   * totals. Usually empty: the engine auto-pays, so mana is normally made and
   * spent without ever landing here. */
  manaPool: ManaUnit[];
  maxHandSize: number;
  landsPlayedThisTurn: number;
  /** Extra land drops an effect granted this turn — Explore's "You may play
   * an additional land this turn". Reset as each turn begins; the ongoing
   * kind (Azusa) is a static, `extraLandsPerTurn`. */
  extraLandsThisTurn?: number;
  hasLost: boolean;
  lossReason: string | null;
  /**
   * Set when the player tried to draw from an empty library. Checked and
   * cleared by state-based actions (rule 704.5c).
   */
  attemptedDrawFromEmptyLibrary: boolean;
  /** Times this player has cast each commander from the command zone, keyed by
   * card name — each cast adds {2} generic to *that* commander's cost next
   * time (rule 903.8 — the tax is per-commander, so Partner pairs are tracked
   * separately). */
  commanderCastCounts: Record<string, number>;
  /** Cumulative combat damage taken from each commander since the game
   * began, keyed by that commander's object id. 21+ from the same commander
   * is a loss (rule 903.10a / SBA 704.5m).
   *
   * Per *commander*, not per opponent: two Partner commanders are counted
   * separately, and damage from a commander someone else has taken control
   * of still counts toward that same commander — the rule is about the card,
   * not who's attacking with it. A commander keeps its object id through
   * every zone change, so the count follows it to the command zone and back. */
  commanderDamageTaken: Record<ObjectId, number>;
  /** Spells *this player* has cast this turn — read by "your first spell each
   * turn" triggers. (Storm counts *all* players' spells — see
   * `GameState.spellsCastThisTurn`.) Reset in `beginTurn`. ROADMAP Phase 8. */
  spellsCastThisTurn: number;
  /** True once this player has lost life this turn — Theater of Horrors's
   * "if an opponent lost life this turn". Reset in `beginTurn`. */
  /**
   * How much life this player has **lost** this turn, as an amount.
   *
   * Was a boolean, which answered "did an opponent lose life?" (Theater of
   * Horrors, Rakdos) but not "did a player lose 4 or more?" — Y'shtola, the
   * most-played commander in the format, and Bloodchief Ascension both need
   * the number. `> 0` is the old boolean.
   *
   * Counts life *lost*, which is not the same as damage taken: a drain, a
   * cost paid and combat damage all land here, and prevention means nothing
   * arrives. Reset in `beginTurn`.
   */
  lifeLostThisTurn: number;
  /** How much life this player has **gained** this turn (The Gaffer,
   * Resplendent Angel, Lathiel: "if you gained N or more life this turn").
   * Reset in `beginTurn`. */
  lifeGainedThisTurn: number;
  /** How many cards this player has drawn this turn (Kydele's "{T}: Add {C}
   * for each card you've drawn this turn", Fists of Flame). Counts the draw
   * itself, not cards put into hand another way — a tutor to hand is not a
   * draw. Reset in `beginTurn`. */
  cardsDrawnThisTurn: number;
  /** Whether this player has drawn a card during their own draw step this
   * turn — so the next one isn't "the first one they draw in each of their
   * draw steps" (Xyris, the Writhing Storm; Orcish Bowmasters). Reset in
   * `beginTurn`. Optional so an older snapshot still loads. */
  drewInDrawStepThisTurn?: boolean;
  /** The spells this player has cast this turn, in order, each as it was
   * cast — see {@link CastSpellRecord}. What "your first enchantment spell
   * each turn" counts (Tuvasa: a cast trigger with a `filter` counts
   * first/Nth among the ones that match), "the first spell you cast with {X}
   * each turn" (Zimone's `costModification.firstEachTurn`) and "if you've
   * cast a creature spell and a noncreature spell this turn" (Eshki
   * Dragonclaw, the `cast-this-turn` condition) read. Reset in
   * `beginTurn`. */
  spellsCastThisTurnAs?: CastSpellRecord[];
  /** How many spells this player has cast this game, by the name each had as
   * it was cast — Approach of the Second Sun's "you've cast another spell
   * named Approach of the Second Sun this game" (the `spells-cast-this-game`
   * condition). Only casts count: a copy of a spell isn't cast (rule 707.10).
   * Never reset; absent until their first spell. Kept on the player rather
   * than read off the event log, which a simulation starts empty. */
  spellNamesCastThisGame?: Record<string, number>;
  /** How many creatures died **under this player's control** this turn —
   * Liliana's Standard Bearer's "draw X cards, where X is the number of
   * creatures that died under your control this turn". The per-player
   * counterpart of `GameState.creaturesDiedThisTurn`, which is global. Reset
   * with it at cleanup. */
  creaturesDiedThisTurn: number;
  /** This player created at least one token this turn (Idol of Oblivion:
   * "Activate only if you created a token this turn"). Set in
   * `mintTokenBatch`, which every token-making path goes through. */
  createdTokenThisTurn: boolean;
  /** The last turn this player declared a commander — anyone's — as an
   * attacker: "during any turn you attacked with a commander" (Neriv,
   * Crackling Vanguard). */
  attackedWithCommanderOnTurn?: number;
  /** This player cast a spell from a graveyard, or activated an ability of a
   * card in a graveyard, this turn (Laboratory Drudge). */
  usedGraveyardThisTurn: boolean;
  /** What this player's turn so far has held — see {@link TurnHistory}.
   * Absent until something is recorded; reset as each turn begins. */
  turnHistory?: TurnHistory;
  /** Energy counters this player has (rule 122 / {E} — ROADMAP Phase 10). A
   * player resource, not tied to any permanent; spent by a `payEnergy` ability
   * cost, gained by a `get-energy` effect. Kept apart from `counters`, which
   * came later, because the bots' evaluation reads it as a feature. */
  energy: number;
  /**
   * Every other kind of counter this player has (rule 122.1) — poison
   * (ten or more lose the game, rule 704.5c) and experience. Given by an
   * `add-player-counters` effect, read by the `playerCounters` amount, count
   * and cost reduction and the `player-counters` condition, and grown by
   * proliferate. A kind the player has none of is absent.
   */
  counters: Partial<Record<PlayerCounterKind, number>>;
  /**
   * The last turn each opponent attacked this player or a planeswalker they
   * control, by attacking player — public, since every attack is announced.
   * Rules never read it; the bots' evaluation does (`bot/features.ts`'s
   * `threat`): whoever swung at you last round is likelier to again, and by
   * the end of a turn — where a search scores a move — nothing is attacking
   * any more. Absent until someone attacks.
   */
  lastAttackedBy?: Partial<Record<PlayerId, number>>;
  /**
   * The last turn each player declared a creature attacking **this player**
   * — the player, not a planeswalker of theirs, and never a creature put
   * onto the battlefield attacking (the O-Kagachi, Vengeful Kami ruling on
   * "attacked you"). With `lastTurnTaken`, what "players who attacked you
   * during their last turn" reads (Weathered Sentinels — see
   * `attackedYouDuringTheirLastTurn`). Absent until someone does.
   */
  attackedByOnTurn?: Partial<Record<PlayerId, number>>;
  /** The number of the most recent turn this player took, the one under way
   * included — "their last turn". Set as each of their turns begins, and as
   * they declare attackers (so a first turn counts). */
  lastTurnTaken?: number;
  /** The combat phase of this player's turns under way or most recently
   * begun (`turn`, and `phase` — `TurnState.combatPhases` then), and the
   * one before it — "your last combat" as a new combat begins (Territorial
   * Hellkite). Set as each beginning of combat step of their turn starts. */
  currentCombat?: CombatId;
  previousCombat?: CombatId;
  /**
   * Which printing of each card this player brought, keyed by card name — a
   * Scryfall reference in the same shapes {@link CardDefinition.art} accepts
   * (see `DeckList.printings`). Purely cosmetic: nothing in the rules engine
   * reads it, and `viewFor` is the only consumer, handing it to the client
   * in place of the definition's own `art`.
   *
   * It lives on the player rather than on each `GameObject` because it's a
   * fact about the physical cards someone owns, not about any game state —
   * so it survives every zone change, copy and control change for free,
   * where a per-object field would have to be threaded through `moveObject`
   * (which deliberately resets per-object state) without being reset.
   */
  printings: Record<string, string>;
  /**
   * The colours in this player's commanders' colour identity (rule 903.4 —
   * both, for a pair), fixed by the deck at setup: what "one mana of any
   * color in your commander's color identity" (Command Tower, Arcane
   * Signet) may make. Empty for a player with no commander, or a colourless
   * one — and then it makes nothing (the rulings).
   */
  commanderIdentity?: readonly Color[];
}

export interface GameRules {
  startingLife: number;
  openingHandSize: number;
  maxHandSize: number;
  maxLandsPerTurn: number;
  /** In a two-player game the player who goes first skips their first draw. */
  skipFirstDraw: boolean;
  /** The traditional Commander mulligan rule: a player's first mulligan each
   * game doesn't require putting a card on the bottom of their library —
   * only the second and later mulligans do (London mulligan otherwise).
   * Default false; the server turns this on for its Commander rooms. */
  freeFirstMulligan: boolean;
}

export const DEFAULT_RULES: GameRules = {
  startingLife: 20,
  openingHandSize: 7,
  maxHandSize: 7,
  maxLandsPerTurn: 1,
  skipFirstDraw: true,
  freeFirstMulligan: false,
};

/**
 * The rules a live Commander room plays under (rule 903.7: 40 starting life),
 * shared so the server's rooms and the bot benchmark (`scripts/tune-bot.mjs`)
 * can't drift apart — weights tuned at 20 life are tuned for a game nobody
 * plays.
 */
export const COMMANDER_RULES: Partial<GameRules> = {
  startingLife: 40,
  freeFirstMulligan: true,
};

/**
 * Gift (rule 702.174a): "as an additional cost to cast this spell, you may
 * choose an opponent". Promising it is a cast variant — the kicker machinery
 * under the keyword `gift` — and the opponent is chosen as the cost is paid
 * (601.2h, after the targets), queued in `GameState.pendingGifts` as the
 * spell is cast and asked before anyone gets priority. With one opponent
 * there's nothing to ask; with more, the caster is asked about each in turn
 * ("promise it to this opponent?", a `choose-modes` naming them), the last
 * one left taking it. See {@link CasualtyAsk} for the same shape.
 */
export interface GiftAsk {
  readonly spell: ObjectId;
  /** The caster, who promised it. */
  readonly player: PlayerId;
  /** The opponents it may still go to, in turn order from the caster's
   * left; the first is the one a raised decision is asking about. */
  readonly candidates: readonly PlayerId[];
  readonly priorityTo: PlayerId;
}

/**
 * A spell's casualty costs being offered as it's cast (rule 702.153a): its
 * caster may sacrifice a creature with power N or greater, asked as a
 * `choose-permanents` of up to one. Each instance of casualty is its own
 * optional cost (702.153b), asked one after another. Once they're all
 * answered, `priorityTo` gets priority — the caster, as after any cast (rule
 * 117.3c), or the active player for a spell cast while something resolved.
 * Queued in `GameState.pendingCasualty` as the spell is cast and asked the
 * next time a player would get priority, before any trigger goes on the
 * stack.
 */
export interface CasualtyAsk {
  readonly spell: ObjectId;
  /** The caster, who pays. */
  readonly player: PlayerId;
  /** The N of each instance still to ask about, in order; the first is the
   * one a raised decision is asking about. */
  readonly amounts: readonly number[];
  readonly priorityTo: PlayerId;
}

/** A phase an effect added straight after the combat phase under way — see
 * `GameState.phasesAfterThisCombat`. */
export type AddedPhase =
  | { readonly kind: "combat"; readonly withMain: boolean }
  | { readonly kind: "upkeep" };

export interface TurnState {
  number: number;
  /** The round under way: each player's turn once, from the starting
   * player's seat round to it again, is one round — so at a four-player
   * table turn 37 is round 10. No rule defines it; it's how the client says
   * how far a game has gone. An extra turn belongs to the round it's taken
   * in, and a seat that has left the game is passed over without ending one.
   * Absent before the first turn (and on a state saved before it existed). */
  round?: number;
  activePlayerIndex: number;
  step: Step;
  /** The `"upkeep"` step under way is the only step of an additional
   * beginning phase (rules 500.10, 500.11 — an `AddedPhase` of kind
   * `"upkeep"`): when it ends, the turn goes on to whatever followed the
   * combat phase it came after, never to a draw step. */
  addedUpkeep?: boolean;
  /** True when this turn was taken via an extra-turn effect (Time Warp) rather
   * than the normal rotation — ROADMAP Phase 7. */
  isExtra: boolean;
  /** The seat of the last turn taken in the normal rotation, which an extra
   * turn doesn't move: an extra turn is added directly after a turn (rule
   * 500.7), so the turn after it is the one that would have come next anyway
   * — Bob's extra turn from Alice's Time Warp is followed by Bob's own turn.
   * Absent until an extra turn is first taken, when it's the active seat. */
  rotationIndex?: number;
  /** How many combat and main phases have begun this turn — the one under
   * way included — for "if it's the first combat phase of the turn"
   * (Karlach) and "your second main phase". Reset as each turn begins. */
  combatPhases?: number;
  mainPhases?: number;
}

export interface PriorityState {
  active: boolean;
  holder: PlayerId | null;
  /** Players who have passed since priority was last granted, in order. */
  passed: PlayerId[];
}

export interface GameResult {
  over: boolean;
  winner: PlayerId | null;
  reason: string | null;
}

/** One player's state within the parallel mulligan phase. */
export interface MulliganHandState {
  /** Mulligans taken so far (0 = first hand). */
  readonly taken: number;
  /** `"decide"` — still choosing keep-or-mulligan-again; `"bottom"` — kept,
   * now owes `taken` cards to the bottom of the library (London mulligan). */
  readonly step: "decide" | "bottom";
}

/**
 * A decision the rules are waiting on. While this is set, the named player's
 * only legal action is the matching declaration.
 */
/** One creature put onto the battlefield attacking, and what it may attack
 * (rule 508.4) — see the `enter-attacking` decision. */
export interface EnterAttackingChoice {
  readonly object: ObjectId;
  readonly options: readonly (PlayerId | ObjectId)[];
}

export type AwaitingDecision =
  | { readonly kind: "attackers"; readonly player: PlayerId }
  | { readonly kind: "blockers"; readonly player: PlayerId }
  | {
      readonly kind: "discard";
      readonly player: PlayerId;
      /** How many cards must be discarded. */
      readonly count: number;
      /** True when a spell/ability caused this discard (Mind Rot), as opposed
       * to the cleanup step's max-hand-size discard. Changes what happens
       * after: an effect-discard just resumes the game, cleanup runs the rest
       * of the cleanup step. */
      readonly fromEffect?: boolean;
      /** Only these cards may be discarded — a cost that names a kind of
       * card ("Discard a creature card": Tortured Existence). Absent, any
       * card in hand. */
      readonly eligible?: readonly ObjectId[];
      /** "…unless they discard a land card" (Compulsive Research): any one
       * of these on its own is an answer, instead of `count` cards. */
      readonly orOneOf?: readonly ObjectId[];
      /** A cost's discard (a spell's additional cost, an activated
       * ability's): who gets priority once it's answered — who cast or
       * activated (rule 117.3c), whoever's turn it is. Absent: the active
       * player, as after a resolution's discard. */
      readonly priorityTo?: PlayerId;
    }
  | {
      readonly kind: "choose-from-zone";
      readonly player: PlayerId;
      /** Whose the cards are when `player` chooses for someone else — an
       * opponent picking the card from your graveyard that goes to your hand
       * (Tasigur, the Golden Fang). Only what the chooser is told. */
      readonly forPlayer?: PlayerId;
      /** Candidates already revealed to `player`, in their original zone order. */
      readonly ids: readonly ObjectId[];
      /** The subset of `ids` that may actually be chosen — narrower than
       * `ids` when the effect restricts the choice (e.g. only a Dragon card),
       * equal to `ids` when it doesn't. Everything in `ids` is revealed
       * either way; this only bounds the choice itself. */
      readonly eligible: readonly ObjectId[];
      readonly min: number;
      readonly max: number;
      /** `"library-top"` — a tutor-to-top (Vampiric Tutor): the chosen cards
       * never leave the library, they are moved to the top after the search's
       * own shuffle. `"library-top"` and `"library-bottom"` both place the
       * chosen cards in the order chosen, the first chosen nearest the top
       * (rule 401.4). `"exile"`: exiled face up — an activated ability's
       * "Exile two cards from your graveyard" cost (`AbilityCost.exileFromGraveyard`),
       * or imprint's "exile a card from your hand" (Chrome Mox), linked to its
       * source through `exileLink`. */
      readonly destination:
        | "battlefield"
        | "hand"
        | "exile"
        | "exile-playable"
        | "exile-face-down"
        | "library-top"
        | "library-bottom"
        | "graveyard";
      /**
       * Only an **order** is asked: every card in `ids` is picked, and the
       * order picked is where each goes (rule 401.4 — the owner arranges
       * cards put into a library at the same time). Raised by
       * `Game.beginLibraryOrder` for "the rest on the bottom of your library
       * in any order" (a `look-and-choose`'s `"bottom-any-order"`) and a
       * scry's or surveil's cards kept on top or put on the bottom (rules
       * 701.22a, 701.25a). Nothing is taken, so no `cards-chosen-from-zone`.
       */
      readonly order?: true;
      /** Cards to ask the order of once this choice is carried out — a scry
       * that both keeps cards on top and puts cards on the bottom orders the
       * two groups one after the other (rule 701.22a). */
      readonly thenOrder?: { readonly cards: readonly ObjectId[]; readonly position: "top" | "bottom" };
      /** A cost's choice (`AbilityCost.exileFromGraveyard`): who gets
       * priority once it's paid — the player who activated the ability (rule
       * 117.3c), whoever's turn it is. Absent: the active player, as after a
       * resolution's choice. */
      readonly priorityTo?: PlayerId;
      /** For `destination: "exile-face-down"` (hideaway — rule 702.75a) and
       * `"exile"` (imprint, face up): the permanent, in the stint it's in,
       * the chosen cards are exiled with (rule 607.2a — `GameObject.exiledWith`). */
      readonly exileLink?: { readonly source: ObjectId; readonly zoneChangeCount: number };
      /** For `destination: "exile-playable"` — the impulse permission to
       * stamp on the chosen cards, which stay in exile either way
       * (Tectonic Giant: "exile the top two, choose one of them"). */
      readonly impulseGrant?: GameObject["impulse"];
      /** What happens to any candidate not chosen: shuffled to the bottom of
       * the library; left exactly where it already was (nothing was ever
       * moved just to look at it — the graveyard-search case); the whole
       * library is shuffled (a library *search* / tutor — rule 701.19); or
       * put into the chooser's hand (Genesis Ultimatum — needed-cards P19).
       * `"bottom-any-order"`: on the bottom in an order the chooser picks
       * next (`Game.beginLibraryOrder`). */
      readonly leftover:
        | "bottom-random"
        | "bottom-any-order"
        | "stay"
        | "shuffle"
        | "hand"
        | "graveyard"
        | "exile-playable";
      /** Where the rest go instead when a condition holds once the chosen
       * cards have moved — the `look-and-choose` effect's `leftoverIf`, asked
       * of `thenSource`. */
      readonly leftoverIf?: LookAndChooseLeftoverIf;
      /** A second choice over the cards this one leaves, asked once this
       * one's cards have moved; `leftover` waits for it (the
       * `look-and-choose` effect's `secondPick`). */
      readonly secondPick?: ZoneSecondPick;
      /** A library-search result that enters the battlefield does so tapped
       * (Rampant Growth). Only meaningful with `destination: "battlefield"`. */
      readonly enterTapped?: boolean;
      /** …and attacking (rule 508.4 — a `look-and-choose`'s `attacking`):
       * Kaalia of the Vast, Winota. Only meaningful with `destination:
       * "battlefield"`. */
      readonly enterAttacking?: ResolvedEnterAttacking;
      /** Battlefield-bound cards enter under this player's control — a
       * `look-and-choose` over every graveyard (Necromantic Selection). */
      readonly enterUnder?: PlayerId;
      /** …with these types and colours in addition to their own, in place as
       * they enter (a `look-and-choose`'s `enterAs`). */
      readonly enterAs?: EnterTypes;
      /** Counters each card put onto the battlefield enters with — a
       * `return-from-graveyard`'s `withCounters`. */
      readonly enterWithCounters?: { readonly kind: string; readonly amount: number };
      /** The chosen cards are shown to every player ("search your library for
       * an artifact card, **reveal it**, …" — Enlightened Tutor). */
      readonly reveal?: boolean;
      /** Applied once the choice is answered, with the chosen cards as its
       * targets — see the `look-and-choose` effect's `then`. `thenSource` and
       * `thenX` rebuild the resolution context, since the spell that set this
       * up has finished resolving by then. */
      readonly then?: EffectSpec;
      readonly thenSource?: ObjectId;
      readonly thenX?: number;
      /** Where every *chosen* card after the first goes, when a tutor splits
       * its finds across two zones (Cultivate: "put one onto the battlefield
       * tapped and the other into your hand"). Absent means every chosen card
       * goes to `destination`. Distinct from `leftover`, which is about cards
       * that were **not** chosen. */
      readonly restDestination?: "battlefield" | "hand";
      /** A rule the chosen cards must obey as a set — a `search-library`'s
       * `together` (Myriad Landscape's "that share a land type"). */
      readonly together?: ZoneChoiceTogether;
    }
  | {
      /**
       * The pre-turn-1 mulligan phase (London style). Unlike every other
       * decision this one is **parallel** — every player in `hands` may act
       * right now, in any order, not turn order (rule 103.4 — players don't
       * wait on each other). `player` is just the lowest-turn-order player
       * still to act, for generic `awaiting.player` consumers. A player is
       * removed from `hands` once they've kept (and bottomed, if they took
       * any mulligans); the phase ends and turn 1 begins when `hands` is
       * empty.
       */
      readonly kind: "mulligan";
      readonly player: PlayerId;
      readonly hands: Readonly<Record<string, MulliganHandState>>;
    }
  | {
      /**
       * A commander's owner may put it into the command zone (rule 903.9).
       * `intendedZone` is where it stays, or goes, if they don't:
       * - `"graveyard"` / `"exile"`: it's already there. Rule 903.9a makes
       *   this a state-based action, so it died (or was exiled) first, and
       *   everything that sees a creature die saw it.
       * - `"hand"` / `"library"`: it hasn't moved yet. Rule 903.9b is a
       *   replacement effect, so it waits where it was — on the battlefield,
       *   or for a return to hand, on the stack or in a graveyard or exile —
       *   until this is answered.
       */
      readonly kind: "commander-replacement";
      readonly player: PlayerId;
      readonly commander: ObjectId;
      readonly intendedZone: CommanderReplacementZone;
    }
  | {
      /** A "shock land" (rule 614.13) just entered: its controller may pay
       * `life` life to have it enter untapped, otherwise it stays tapped. The
       * land is already on the battlefield (tapped) — answering yes untaps it
       * and deducts the life. */
      readonly kind: "pay-life-for-untapped";
      readonly player: PlayerId;
      readonly source: ObjectId;
      readonly life: number;
    }
  | {
      /** A "reveal land" (Port Town: "As this land enters, you may reveal a
       * Plains or Island card from your hand. If you don't, this land enters
       * tapped") is about to enter; its controller picks which of `options`,
       * the qualifying cards in their hand, to reveal, or none. Asked before
       * it moves (`Game.askEnterChoice`, rule 614.12). */
      readonly kind: "reveal-for-untapped";
      readonly player: PlayerId;
      readonly source: ObjectId;
      readonly options: readonly ObjectId[];
    }
  | {
      /** A Clone-style permanent is about to enter; its controller chooses
       * what (if anything) it enters as a copy of (rule 707.9) — asked before
       * it moves, see `Game.askEnterChoice`. */
      readonly kind: "choose-copy";
      readonly player: PlayerId;
      readonly source: ObjectId;
      readonly options: readonly ObjectId[];
    }
  | {
      /** An Aura is about to enter the battlefield other than by resolving
       * as an Aura spell, with nothing saying what it enchants: the player
       * it's entering under chooses, from `options` — every permanent it
       * could legally enchant (rule 303.4f). Asked before it moves, see
       * `Game.askEnterChoice`; with nothing to choose from it isn't asked,
       * and the Aura stays where it was (303.4g). */
      readonly kind: "choose-enchant";
      readonly player: PlayerId;
      readonly source: ObjectId;
      readonly options: readonly ObjectId[];
      /** The players an "Enchant player" Aura could enchant instead (rule
       * 303.4f — a Curse returned to the battlefield). Absent when none. */
      readonly players?: readonly PlayerId[];
    }
  | {
      /** The legend rule (704.5j): `player` controls two or more legendary
       * permanents named `name` — `options`, the one they've controlled
       * longest first — and chooses the one to keep; the rest are put into
       * their owners' graveyards. Asked by the state-based check before
       * anything moves, which performs every move it finds once each such
       * choice is made (704.3). */
      readonly kind: "legend-rule";
      readonly player: PlayerId;
      readonly name: string;
      readonly options: readonly ObjectId[];
    }
  | {
      /** Rule 603.3b: `player` puts their simultaneous triggered abilities
       * on the stack in any order they choose. Asked only of a player who
       * orders their own (`GameState.ordersOwnTriggers`), and only when two
       * or more of theirs are waiting and they aren't all the same ability;
       * otherwise the engine's own order stands. `triggers` is that order,
       * the one that would resolve first first. */
      readonly kind: "order-triggers";
      readonly player: PlayerId;
      readonly triggers: readonly TriggerOrderEntry[];
    }
  | {
      /**
       * Choose one of `options`. Two quite different uses share this shape:
       *
       * - A **creature type** (`catalog: true`, `options` is every creature
       *   type — rule 205.3m). Either as a permanent enters (Urza's
       *   Incubator: `source`'s `chosenCreatureType` is set) or as a spell
       *   resolves (Crippling Fear: `then` is applied with the answer
       *   substituted in, against `targets` and `x`).
       * - A **short fixed menu** (`catalog: false`) for "as this enters,
       *   choose …" — Heraldic Banner's colours, Frontier Siege's
       *   Khans/Dragons. Recorded on `source.chosenOnEnter`.
       *
       * `catalog` is what lets a client offer a searchable picker for the one
       * and plain buttons for the other.
       */
      readonly kind: "choose-creature-type";
      readonly player: PlayerId;
      readonly source: ObjectId;
      readonly options: readonly string[];
      readonly catalog: boolean;
      /** Riot's "+1/+1 counter or haste" as `source` is about to enter (rule
       * 702.136a): the answer is recorded as its riot choice rather than as
       * a chosen word. */
      readonly riot?: true;
      readonly then?: EffectSpec;
      readonly targets?: ResolvedTargets;
      readonly x?: number;
    }
  | {
      /** A scry / surveil (rule 701.18 / 701.43): `player` has looked at the
       * top `cards` of their library and chooses which to move away — to the
       * bottom (scry) or the graveyard (surveil); the rest stay on top in
       * their current order (the "reorder the ones you keep" clause isn't
       * modeled). `then`, if set, is applied afterwards (Preordain's draw). */
      readonly kind: "scry";
      readonly player: PlayerId;
      readonly cards: readonly ObjectId[];
      readonly mode: "scry" | "surveil";
      readonly then: EffectSpec | null;
      readonly source: ObjectId;
      readonly x: number;
    }
  | {
      /** A sacrifice *effect* (Diabolic Edict, Fleshbag Marauder) — `player`
       * chooses `count` of `eligible` permanents they control to sacrifice
       * (rule 701.16). Only raised when there's an actual choice (they
       * control more than `count` matches). */
      readonly kind: "sacrifice";
      readonly player: PlayerId;
      readonly count: number;
      readonly eligible: readonly ObjectId[];
    }
  | {
      /**
       * Proliferate (rule 701.27): `player` chooses **any number** of
       * permanents and/or players that have counters on them, and each chosen
       * one gets another counter of each kind already there.
       *
       * "Any number" is the whole decision and the reason this is a decision
       * at all. The engine used to proliferate every permanent on the
       * battlefield, which grew opponents' creatures and topped up their
       * planeswalkers — not a simplification of the card but a different and
       * often worse one. Choosing nothing is a legal answer.
       *
       * `eligible` is everything with at least one counter *right now*,
       * permanents in battlefield order followed by any player holding energy
       * counters (rule 122 — energy is a counter a player has, and
       * proliferate does reach it).
       */
      readonly kind: "proliferate";
      readonly player: PlayerId;
      readonly eligible: readonly TargetRef[];
      /** Applied once answered — Contentious Plan's "Proliferate. Draw a
       * card." `source`/`x` rebuild the resolution context, exactly as
       * `scry`'s `then` does, because the spell that set this up has finished
       * resolving by the time the choice comes back. */
      readonly then: EffectSpec | null;
      readonly source: ObjectId;
      readonly x: number;
    }
  | {
      /**
       * "Add N mana in any combination of …" with too many splits to list as
       * modes (Klauth, Unrivaled Ancient's power-sized attack trigger):
       * `player` says how many of each of `colors`, summing to `amount` —
       * one decision, where each unit's colour used to be asked in turn
       * (`effects.ts`' `addManaChoice`; rule 608.2d, chosen as it's added).
       */
      readonly kind: "split-mana";
      readonly player: PlayerId;
      readonly colors: readonly ManaType[];
      readonly amount: number;
      /** What every colour's share carries: a spend restriction, `persists`
       * (`ManaSplitRiders`). */
      readonly riders: ManaSplitRiders;
      /** The rest of the instruction, applied once answered, in a context
       * rebuilt from `source`/`x` as `proliferate`'s `then` is. */
      readonly then: EffectSpec | null;
      readonly source: ObjectId;
      readonly x: number;
    }
  | {
      /**
       * Permanents chosen as an effect resolves, with no targeting — "untap
       * up to two lands" (the `choose-permanents` effect: Snap, Frantic
       * Search). `player` picks from `min` to `max` of `eligible`, and
       * `then` is applied to each one picked, as target 0, in the order
       * picked; `source`/`x` rebuild the resolution context for it, as
       * `proliferate`'s do. A compacted token stack is one entry that may be
       * named up to its size.
       */
      /** Creatures this player put onto the battlefield attacking, each with
       * a choice of what it attacks (rule 508.4): a defending player, or a
       * planeswalker one controls — unless the effect named the player, when
       * it's that player or their planeswalkers. Asked only where there's a
       * real choice; each is attacking its first option until answered. */
      readonly kind: "enter-attacking";
      readonly player: PlayerId;
      readonly creatures: readonly EnterAttackingChoice[];
    }
  | {
      readonly kind: "choose-permanents";
      readonly player: PlayerId;
      readonly eligible: readonly ObjectId[];
      readonly min: number;
      readonly max: number;
      /** What the choice is for, as a prompt — "Untap up to two lands". */
      readonly prompt: string;
      readonly then: EffectSpec;
      readonly source: ObjectId;
      readonly x: number;
      /** Set when the choice is a spell's casualty cost being paid as it's
       * cast, rather than an effect resolving — see {@link CasualtyAsk}.
       * `then` is unused. */
      readonly casualty?: CasualtyAsk;
      /** Set when the choice pays an activated ability's cost (its
       * `returnToHand`), not an effect resolving: the player who activated
       * it, who gets priority once it's made (rule 117.3c). */
      readonly priorityTo?: PlayerId;
      /** Set for a `keep-total-power` choice (Slaughter the Strong): what's
       * picked is kept, and its total power — a negative power subtracting
       * (the ruling) — may be at most this. `then` is unused; the picks are
       * collected in `GameState.keptByChoice`. */
      readonly maxTotalPower?: number;
      /** Set when the choice is an entering permanent's "you may exchange its
       * text box and another creature's" (`CardDefinition
       * .exchangeTextOnEnter`): `source` is the permanent about to enter,
       * and what's picked (or nothing) is what it exchanges with as it
       * enters. `then` is unused. */
      readonly exchangeText?: true;
      /** Set when the choice pays an activated ability's `returnToHand`
       * cost: that ability on the stack, which records what the returned
       * creature was attacking (`LastKnownRefs.returnedAttacking`). */
      readonly costOf?: ObjectId;
    }
  | {
      /** A modal spell/ability is resolving (rule 700.2), or a "you may"
       * clause (rule 601.3e). The controller picks between `minModes` and
       * `maxModes` distinct modes; their effects apply after. */
      readonly kind: "choose-modes";
      readonly player: PlayerId;
      /** The player the question is about — see the offer's `about`. */
      readonly about?: PlayerId;
      /** No mode at all is also an answer, besides `minModes` to `maxModes`
       * — an announced modal's `optional` ("you may choose two"). */
      readonly orNone?: true;
      /** A draw `player` is about to make, with dredge cards in their
       * graveyard (rule 702.52): mode 0 draws it, mode i dredges `cards[i-1]`
       * instead. Answered by the engine itself; the modes' effects are
       * unused. */
      readonly dredgeFor?: { readonly cards: readonly ObjectId[] };
      /** The permanent (for an ability) or spell object the effect belongs to
       * — used to build the resolution context for the chosen modes. */
      readonly source: ObjectId;
      /** The modes of a triggered ability going on the stack
       * (`GameState.pendingModalTrigger`), not ones chosen as something
       * resolves: the answer is recorded on the ability, not applied. */
      readonly announcing?: true;
      readonly minModes: number;
      readonly maxModes: number;
      /** The modes, in order — text for the chooser, effect to apply. Plain
       * data (an `EffectSpec` carries no functions), captured here so the
       * modes can be applied after the source has left the stack. */
      readonly modes: readonly { readonly text: string; readonly effect: EffectSpec }[];
      /** `{X}` from the resolving spell/ability, forwarded to the modes. */
      readonly x: number;
      /**
       * The triggering event's numeric value and object, forwarded to the
       * modes the same way `x` and `targets` are.
       *
       * A `may` inside a triggered ability *suspends* resolution — the modes
       * are applied later, from this record, with a freshly built resolution
       * context. Without these, an `EffectAmount` `{ triggerValue: true }`
       * read 0 and a `trigger-object` condition read nothing: "you may have
       * it deal **that much** damage" silently dealt none.
       */
      readonly triggerValue?: number;
      readonly triggerObject?: ObjectId;
      /** The resolving spell's or ability's last-known references and where
       * its targets were, forwarded the same way, so a mode still reads a
       * source or target that has left the battlefield as it last existed
       * there. See {@link LastKnownRefs}. */
      readonly lastKnownRefs?: LastKnownRefs;
      readonly targetZones?: readonly (ZoneType | null)[];
      /** A `may` effect's `else` — applied instead when zero modes are
       * chosen. `undefined` for an ordinary `modal` effect (declining a
       * modal spell/ability entirely isn't a legal answer, so it never
       * reaches zero chosen). needed-cards P19. */
      readonly onDecline?: EffectSpec;
      /** Whose effect `onDecline` is, when that isn't the chooser's. An
       * `unless` punisher asks someone else whether to pay, but what happens
       * when they won't is still its controller's effect: an opponent who
       * declines Rhystic Study's {1} lets *you* draw. Omitted = the chooser. */
      readonly declineController?: PlayerId;
      /** Whose effect the chosen modes are, when that isn't the chooser's —
       * a villainous choice's options ("you draw a card", "that player
       * discards a card") are its controller's, with the chooser as
       * `"that-player"`. Omitted = the chooser's. */
      readonly modesController?: PlayerId;
      /** The enclosing ability's own already-chosen targets, forwarded to the
       * modes (and to `onDecline`) — a `may`/`modal` effect doesn't choose
       * new targets itself, so a mode referencing `target: 0` means "the
       * ability's own target 0" (Ob Nixilis, the Fallen: "you may have
       * *target player* lose 3 life"). Empty for the ordinary case where
       * nothing outside the modal choice was targeted. needed-cards P19. */
      readonly targets: ResolvedTargets;
      /** A mana cost the chooser must pay to pick a mode (`may.cost` — "you
       * may pay {B}. If you do, …"). Only offered when it's payable, so
       * declining by choice and being unable to pay both land on `onDecline`. */
      readonly cost?: string;
      /** The colour `cost`'s X is paid in — a `may`'s `xColor` ("pay any
       * amount of {R}"). */
      readonly xColor?: Color;
      /** Set when this is a ward payment (rule 702.21a): the one mode pays
       * the ward cost of `warded`, declining counters `spell` (also the
       * decision's target 0). Choosing to pay logs `ward-paid`. */
      readonly ward?: { readonly warded: ObjectId; readonly spell: ObjectId };
      /** Set when this is a gift being promised (rule 702.174a — see
       * {@link GiftAsk}): its one mode promises it to `about`, the first of
       * the candidates; declining asks about the next. Its modes' effects
       * are unused. */
      readonly giftAsk?: GiftAsk;
      /** The life and energy parts of a `may`'s cost — see `may.costLife`
       * and `may.costEnergy` — paid alongside `cost` as the choice is made. */
      readonly costLife?: number;
      readonly costEnergy?: number;
      /** The ability's source had become a new object by the time it
       * resolved (rule 400.7 — `ResolutionContext.sourceLost`), so "~" in
       * the modes finds nothing: a Bloodghast exiled and put back in the
       * graveyard in response isn't returned by the "you may" of its first
       * self. */
      readonly sourceLost?: true;
      /** Which ability is choosing (`ResolutionContext.abilityKey`), so a
       * mode's effect resolves as part of it. */
      readonly abilityKey?: string;
      /** "That hasn't been chosen this turn": which of the ability's modes
       * each offered one is, recorded in `GameState.modesChosenThisTurn`
       * once chosen. */
      readonly notChosenThisTurn?: readonly number[];
      /** Announcing (`announcing`) out of fewer than all of the ability's
       * modes — one needing a target it can't have can't be chosen (rule
       * 603.3c): which of its own modes each offered one is. */
      readonly announcedFrom?: readonly number[];
      /**
       * A triggered ability's "you may" being asked as it resolves: the
       * ability object, what makes another trigger the *same* one
       * (`Game.triggerSignature`), and the identical triggers still on the
       * stack under it — `alikeCount` counts each copy a stack object stands
       * for (`stackCount`). With any there, the chooser may answer for all of
       * them at once (`choose-modes`' `forAll` — a shortcut, rule 732.2a).
       * Absent for a spell, a ward payment, or a choice among several modes.
       */
      readonly trigger?: {
        readonly object: ObjectId;
        readonly signature: string;
        readonly alike: readonly ObjectId[];
        readonly alikeCount: number;
      };
    }
  | {
      /** A triggered ability (or a suspended spell coming off suspend) needs
       * targets and its controller has a real choice (rule 603.3d / 601.2c —
       * ROADMAP Phase 11 EG-1). `specs[i]` / `options[i]` are the spec and the
       * legal `TargetRef`s for the i-th slot still to be chosen (auto-filled
       * slots — a saboteur's victim — aren't listed). The answer supplies one
       * `TargetRef` per spec, in order. */
      readonly kind: "choose-targets";
      readonly player: PlayerId;
      readonly source: ObjectId;
      readonly cardName: string;
      readonly specs: readonly TargetSpec[];
      readonly options: readonly (readonly TargetRef[])[];
      /**
       * Choosing new targets for a copy of a spell (rule 707.10c —
       * `GameState.pendingCopyTargets`): the target each slot has now, which
       * is `options[i][0]` and may be kept even if it's no longer legal. Any
       * other answer for a slot must be a legal target for it.
       */
      readonly current?: readonly TargetRef[];
      /** A triggered ability that divides an amount among the targets of its
       * `divided` group (rule 603.3d — Dragonlord Atarka): `total` shared by
       * the answer's targets from `slot` on (an index into the answer, not
       * the ability's own slots), split as the answer's `division` says. */
      readonly divide?: { readonly total: number; readonly slot: number };
    }
  | {
      /**
       * "You may cast [a card]" while a spell or ability resolves (the
       * `cast-now` effect — Chandra, Acolyte of Flame's −2, Baral's
       * Expertise): `player` casts one of `cards` now, following the casting
       * rules in full (601.2 — modes, X, kicker, targets, costs) but ignoring
       * timing (608.2g), or declines. `offers` are the cards' cast variants,
       * worked out as this was raised (the board can't change while it's
       * asked); the answer names one, or nothing. `source` is what's
       * resolving.
       */
      readonly kind: "cast-now";
      readonly player: PlayerId;
      readonly source: ObjectId;
      /** The cards on offer, each with at least one way in `offers`. */
      readonly cards: readonly ObjectId[];
      /** Cards `player` looks at to choose among — the top of their library
       * (Velomachus Lorehold) — castable or not; revealed to them alone. */
      readonly looked?: readonly ObjectId[];
      readonly offers: readonly CastSpellOffer[];
      /** "You may **play**": the land cards on offer, each as the face it'd
       * be played as (rules 305.2a, 305.3) — see the `cast-now` effect's
       * `play`. */
      readonly lands?: readonly PlayLandOffer[];
      /** "Without paying its mana cost" — the only way it's offered. */
      readonly free: boolean;
      /** What the spell must be, matched as it's cast — see the effect's
       * `spell`, bound when it was raised. */
      readonly spell?: CardFilter;
      /** "If that spell would be put into your graveyard, exile it instead." */
      readonly exileAfter: boolean;
      /** Cascade's or suspend's own free cast — see `CastNowOptions`. */
      readonly freeCastOf?: "cascade" | "suspend";
    }
  | {
      /** A blocked attacker's controller assigns its combat damage among the
       * blockers (and, with trample, the defender) — rule 510.1c / ROADMAP
       * Phase 11 EG-4a. Only raised when there's a real choice (2+ blockers,
       * or trample with room to divide). The answer is one amount per blocker
       * in `blockers` order; `power − sum` (must be ≥ 0, and 0 unless
       * `trample`) is dealt to the defending player / planeswalker. */
      readonly kind: "assign-combat-damage";
      readonly player: PlayerId;
      readonly attacker: ObjectId;
      readonly blockers: readonly ObjectId[];
      /** How much combat damage the attacker assigns (`combatDamageOf`): its
       * power, or its toughness under a `combatDamageByToughness` static. */
      readonly power: number;
      /** Lethal damage per blocker (toughness − damage already marked, or 1
       * from a deathtouch source). Any division is legal; every blocker must
       * have its lethal before any damage tramples over (702.19b). */
      readonly lethal: readonly number[];
      readonly trample: boolean;
      /** Per blocker: lethal damage won't destroy it. The default split
       * (`standardAssignment`) spends damage on these last. */
      readonly indestructible: readonly boolean[];
    };

/**
 * When a delayed triggered ability fires (rule 603.7).
 *
 * "Next" always means the next such step to *begin*, never one already in
 * progress — an effect that resolves during an end step and says "at the
 * beginning of the next end step" waits for the following turn's.
 */
export type DelayedTriggerTiming =
  /** The next end step, whoever's turn it is — the common one ("sacrifice it
   * at the beginning of the next end step"). */
  | "next-end-step"
  /** The next upkeep, whoever's turn it is (Arcane Denial, Mishra's Bauble:
   * "at the beginning of the next turn's upkeep"). */
  | "next-upkeep"
  /** Your own next upkeep / end step / precombat main phase — these wait for
   * the ability's *controller* to be the active player (Mana Drain's "at the
   * beginning of your next main phase"). */
  | "your-next-upkeep"
  | "your-next-end-step"
  | "your-next-main-phase"
  /** "At end of combat" — the beginning of the next end of combat step
   * (rule 511.2): myriad's "exile the tokens at end of combat". */
  | "end-of-combat";

/** Which combat phase: the turn's number, and which of that turn's combat
 * phases (`TurnState.combatPhases` as it began — 1 for the first). */
export interface CombatId {
  readonly turn: number;
  readonly phase: number;
}

/** One object in a {@link TurnHistory} list; a token stack entering or
 * leaving at once counts as every token in it. */
export interface TurnHistoryEntry {
  readonly object: ObjectId;
  readonly count: number;
}

/** The lists a {@link TurnHistory} keeps. */
export type TurnHistoryKind = "entered" | "died" | "sacrificed" | "exiled" | "descended";

/**
 * What one player's turn so far has held, for "this turn" conditions and
 * amounts — "if another Human entered the battlefield under your control this
 * turn" (Éowyn, Shieldmaiden), "the number of opponents that were dealt combat
 * damage this turn" (Tymna the Weaver), "for each creature that died under
 * your control this turn", "the number of times you descended this turn".
 * Recorded off the events themselves (`Game.recordTurnHistory`, from `emit`),
 * so every path that announces one counts; reset as each turn begins.
 */
export interface TurnHistory {
  /** Permanents that entered the battlefield under this player's control. */
  entered?: TurnHistoryEntry[];
  /** Creatures that died under this player's control. */
  died?: TurnHistoryEntry[];
  /** Permanents this player sacrificed. */
  sacrificed?: TurnHistoryEntry[];
  /** Permanents exiled from the battlefield while this player controlled
   * them — Vren, the Relentless's "creatures your opponents controlled that
   * were exiled this turn". */
  exiled?: TurnHistoryEntry[];
  /** Permanent cards put into this player's graveyard from anywhere — each
   * is this player "descending". */
  descended?: TurnHistoryEntry[];
  /** Cards put into this player's graveyard from their hand or library —
   * discarded, milled, surveilled, cycled — Welcome the Dead's "the number
   * of cards that were put into your graveyard from your hand or library
   * this turn" (`TurnStat` `"cards-to-graveyard-from-hand-or-library"`). */
  toGraveyardFromHandOrLibrary?: number;
  /** Cards that left this player's graveyard, for anywhere — Essence
   * Anchor's "if a card left your graveyard this turn" (`TurnStat`
   * `"cards-left-graveyard"`). */
  leftGraveyard?: number;
  /** Damage dealt to this player, and the part of it that was combat damage. */
  damageTaken?: number;
  combatDamageTaken?: number;
  /** Damage dealt by sources this player controlled, to anything — each
   * with its source's colours as it dealt it: "if red sources you controlled
   * dealt 4 or more noncombat damage this turn" (Ojer Axonil's Temple of
   * Power). */
  damageDealt?: {
    readonly source: ObjectId;
    readonly amount: number;
    readonly combat: boolean;
    readonly colors: readonly Color[];
  }[];
  /** This player declared one or more attackers (raid). */
  attacked?: boolean;
  /** Each creature this player declared as an attacker, once — in the
   * battlefield stint it was in (a creature that left and came back is a
   * different one, rule 400.7). */
  attackers?: { readonly object: ObjectId; readonly zoneChangeCount: number }[];
}

/** Where a permanent can go when it leaves the battlefield. */
export type LeaveDestination = "graveyard" | "exile" | "hand" | "library" | "command";

/**
 * A delayed trigger keyed to one permanent leaving the battlefield rather
 * than to a step (rule 603.7) — earthbend's "when it dies or is exiled,
 * return it to the battlefield tapped", Kelsien, the Plague's "when that
 * creature dies this turn". It fires the first time that permanent leaves
 * for one of `to`, as a triggered ability whose trigger object is the
 * permanent, and is gone once it leaves for anywhere: whatever comes back is
 * a new object (rule 400.7) it never knew.
 */
export interface DelayedLeaveWatch {
  readonly leaves: ObjectId;
  /** The permanent's `zoneChangeCount` on the battlefield as the trigger was
   * made — which stint of it this watches. */
  readonly stint: number;
  /** `["graveyard"]` is "dies"; `["graveyard", "exile"]` "dies or is
   * exiled". */
  readonly to: readonly LeaveDestination[];
  /** "…this turn": it lapses as the next turn begins. */
  readonly thisTurn?: boolean;
}

/** A delayed trigger waiting for its controller's next spell this turn
 * matching `nextSpell` — see `DelayedNextSpell`. */
/** A delayed trigger waiting on a permanent's combat damage to a player this
 * turn — see `DelayedCombatDamage`. Fires each time; lapses with the turn. */
export interface DelayedDamageWatch {
  readonly dealsCombatDamage: ObjectId;
  /** Which stint of it on the battlefield. */
  readonly stint: number;
  readonly turn: number;
}

export interface DelayedCastWatch {
  readonly nextSpell: CardFilter;
  /** The turn it was made on: it lapses as the next begins. */
  readonly turn: number;
}

/**
 * A delayed triggered ability (rule 603.7): created by a resolving spell or
 * ability, waiting on one future step — or on one permanent leaving the
 * battlefield ({@link DelayedLeaveWatch}) — then gone. It isn't an ability
 * *of* any permanent — it exists on its own here, which is exactly why
 * `detectTriggers`' scan over battlefield permanents can't see it: `enterStep`
 * fires the step-keyed ones directly, and a leave event checks the watchers.
 */
export interface DelayedTrigger {
  readonly id: string;
  /** Who controls it when it fires (rule 603.7d). Usually whoever created it,
   * but not always — Arcane Denial's draw belongs to the countered spell's
   * controller. */
  readonly controller: PlayerId;
  /** The step it waits for, the permanent whose leaving it waits for, or
   * the spell its controller casts next. */
  readonly at: DelayedTriggerTiming | DelayedLeaveWatch | DelayedCastWatch | DelayedDamageWatch;
  /** The creating ability's trigger object, and its `zoneChangeCount` then
   * — "return **that card** to the battlefield" (Shirei, Shizo's Caretaker).
   * It's the delayed ability's trigger object too, as long as it's still that
   * object (rule 400.7). */
  readonly triggerObject?: ObjectId;
  readonly triggerObjectStint?: number;
  readonly triggerObjectRefs?: LastKnownRefs;
  /** A trigger object that was a token and has ceased to exist (rule 111.7),
   * as it last existed on the battlefield — "create a token that's a copy
   * of that artifact" of a sacrificed Treasure (Esoteric Duplicator). Kept
   * here because `GameState.ceasedTokens` lasts only the turn, and "the
   * next end step" may be the next turn's. */
  readonly triggerObjectCeased?: LastKnownInfo;
  /** The turn it was created on, so "the next end step" can't mean one the
   * game is already in. */
  readonly createdOnTurn: number;
  /** Created during that turn's end step (or cleanup) — so "the next end
   * step" means the *following* turn's, not the one it was made in. */
  readonly createdDuringEndStep: boolean;
  /** The object whose ability this is — `ctx.source` on resolution, and what
   * the log names it after. May well have left the battlefield by then; that
   * is normal and fine (rule 603.7e). */
  readonly source: ObjectId;
  readonly sourceName: string;
  /**
   * Targets captured when it was created. A delayed ability doesn't choose
   * new targets — its text doesn't say "target" (rules 115.1d, 115.10a) —
   * so these are fixed here and `effect` refers to
   * them by slot index exactly like any other effect.
   */
  readonly targets: ResolvedTargets;
  /** Where those targets were when the creating spell or ability targeted
   * them — see `GameObject.targetZones`. */
  readonly targetZones?: readonly (ZoneType | null)[];
  /** Which object each target was as this was created (its
   * `zoneChangeCount` then; `null` for a player). "Exile it at the
   * beginning of the next end step" does nothing to one that has changed
   * zones since, as it's a new object (rule 400.7), though what the ability
   * reads of it still comes from last-known information. */
  readonly targetStints?: readonly (number | null)[];
  /** The source's `zoneChangeCount` as this was created, when the source was
   * a card or permanent rather than a spell: "return **it** to its owner's
   * hand at the beginning of the next end step" (The Locust God) finds
   * nothing once it has changed zones again (rule 400.7). */
  readonly sourceStint?: number;
  /** The `eventSeq` it was created at: it transforms its source only if the
   * source hasn't transformed since (rule 701.28f). */
  readonly createdAtSeq?: number;
  readonly effect: EffectSpec;
  readonly text: string;
}

/** The zones a commander's owner is offered the command zone from: a
 * graveyard or exile once it's there (rule 903.9a), a hand or library in
 * place of going there (903.9b). */
export type CommanderReplacementZone = "graveyard" | "exile" | "hand" | "library";
/** Where a commander waits while its 903.9 choice is pending, other than the
 * battlefield (see `GameState.deferredCommanderMove`): the graveyard or exile
 * it was put into (903.9a), or for a return to hand, the zone it's leaving;
 * or the hand a `choose-from-zone` is putting it into a library from
 * (`heldByZoneChoice`). */
export type CommanderMoveOrigin = "stack" | "graveyard" | "exile" | "hand";
/** Where in its owner's library a commander's deferred 903.9b move puts it
 * if its owner declines the command zone: where the move was putting it
 * (Noxious Revival's top, Chaos Warp's shuffle). A plain move to a library
 * puts a card on the bottom. */
export type CommanderLibraryPlacement = "top" | "bottom" | "shuffle" | { readonly fromTop: number };

/**
 * What caused the decision on {@link GameState.awaiting} — the resolving
 * spell or the permanent whose ability is resolving. Carries `cardName`
 * alongside the id because the object is often no longer anywhere the
 * deciding player can see it by the time they answer: a sorcery that ordered
 * a sacrifice has already gone to its controller's graveyard, and an ability
 * object is deleted off the stack the moment it finishes resolving.
 */
export interface DecisionSource {
  readonly object: ObjectId;
  readonly cardName: string;
}

/** One source that dealt a permanent damage, as that source was as it
 * dealt it: whose it was and what it was — "dealt damage this turn by a
 * Spider you controlled" (Shelob, Child of Ungoliant) reads the past. */
export interface DamageSourceRecord {
  readonly source: ObjectId;
  readonly controller: PlayerId;
  readonly types: readonly CardType[];
  readonly subtypes: readonly string[];
}

/**
 * What damaged a permanent during turn `turn`: every source that dealt it
 * damage (`by`), and whether any of it was **excess damage** (rule 120.4a
 * — more than the lethal damage it needed then: toughness less damage
 * already marked, or 1 from a deathtouch source; for a planeswalker, more
 * than its loyalty) — Maarika, Brutal Gladiator's "if that creature was
 * dealt excess damage this turn".
 */
export interface DamageHistory {
  readonly turn: number;
  readonly by: readonly DamageSourceRecord[];
  readonly excess?: true;
}

/**
 * How a permanent came onto the battlefield, this stint — read by the filter
 * clauses `enteredFrom`, `cast`, `castBy`, `castFrom` and
 * `putThereBySource`.
 */
export interface EntryRecord {
  /** The zone it came from: "enters from exile" (Fire Lord Zuko), "came
   * from a graveyard". A permanent spell comes from the stack. */
  readonly from: ZoneType;
  /** It got here as a spell that was cast and resolved: who cast it and
   * from which zone — "if you cast it" (Anti-Venom, Rocco, Tiamat), "cast
   * from a graveyard". A copy of a spell was never cast. */
  readonly cast?: {
    readonly by: PlayerId;
    readonly from: ZoneType;
    /** The permission it was cast under, if not a normal cast from hand
     * (`GameObject.castVia`) — Uro's "unless it escaped". */
    readonly via?: CastVia;
  };
  /** The source of the ability that put it here, with that source's
   * timestamp then — Kodama of the East Tree's "if it wasn't put onto the
   * battlefield with this ability". */
  readonly by?: { readonly source: ObjectId; readonly timestamp: number };
}

/**
 * A resolution that stopped partway to ask someone something — see
 * {@link GameState.suspendedResolutions}. Either what is left of it (a
 * {@link ParkedSteps}), or, once nothing is left, just a note that it isn't
 * over until its last decision has been answered — or, with `enter`, a
 * permanent waiting on its "as this enters" choice to finish entering; or,
 * with `leaveStack`, an instant, a sorcery or an ability whose instructions are done,
 * leaving the stack as the final part of its resolution (rule 608.2n) once
 * the steps it parked above this are: a spell it lets its controller cast
 * as it resolves is cast while it's still on the stack (608.2g).
 */
export type SuspendedResolution =
  | ParkedSteps
  | { readonly effect: null; readonly enter?: PendingEntry; readonly leaveStack?: ObjectId };

/**
 * A permanent part of the way onto the battlefield, stopped to make an "as
 * this enters" choice (rule 614.12 — `Game.askEnterChoice`) before it moves:
 * a permanent spell still resolving, or a land being played. It finishes
 * entering once that's answered. An effect putting something onto the
 * battlefield needs none of this — it parks itself, and runs again.
 */
export type PendingEntry =
  | { readonly kind: "spell"; readonly object: ObjectId }
  | {
      readonly kind: "land";
      readonly object: ObjectId;
      readonly player: PlayerId;
      readonly from: ZoneType;
    }
  | {
      /** The answer to a `choose-from-zone` decision, not yet carried out
       * because a card it puts onto the battlefield had to choose first (a
       * tutored Cavern of Souls). */
      readonly kind: "zone-choice";
      readonly awaiting: Extract<AwaitingDecision, { kind: "choose-from-zone" }>;
      readonly player: PlayerId;
      readonly chosen: readonly ObjectId[];
      /** Or because a chosen card is its owner's commander, bound from their
       * hand for their library, whose owner may put it into the command zone
       * instead (rule 903.9b): each one's answer, once given — `true` for the
       * command zone. */
      readonly commanderAnswers?: Readonly<Record<string, boolean>>;
    }
  | {
      /** Cards exiled "until" a permanent leaves, coming back because its
       * owner left the game (rules 610.3, 800.4a — `Game.leaveGame`), waiting
       * on one of them's "as this enters" choice. */
      readonly kind: "exiled-return";
      readonly objects: readonly ObjectId[];
    };

/**
 * The steps of a resolution still to apply, with everything its resolution
 * context was built from, so they resume as the same spell or ability: its
 * source and controller, its targets and where they were, its X, the
 * triggering event's value and object, and which battlefield stints it
 * refers to (last-known information).
 */
export interface ParkedSteps {
  readonly effect: EffectSpec;
  readonly source: ObjectId;
  readonly controller: PlayerId;
  readonly targets: ResolvedTargets;
  readonly targetZones: readonly (ZoneType | null)[];
  /** See `ResolutionContext.illegalTargets`: found as the resolution began,
   * so the steps after a decision still know. */
  readonly illegalTargets?: readonly number[];
  readonly x: number;
  readonly triggerValue: number;
  readonly triggerObject?: ObjectId;
  readonly stackMultiplier: number;
  readonly resolutionCount: number;
  readonly lastKnownRefs: LastKnownRefs;
  /** See `ResolutionContext.sourceLost`. */
  readonly sourceLost?: boolean;
  /** See `ResolutionContext.abilityKey`. */
  readonly abilityKey?: string;
  /** The `eventSeq` after which its source transforming stops the ability
   * transforming it (rule 701.28f) — see `GameObject.stackedAtSeq`. */
  readonly transformSince?: number;
  /** The timestamp the source had when the ability went on the stack, so
   * "exile ~" still skips a source that has become a new object. */
  readonly sourceTimestamp?: number;
  /** What the resolution's decisions are said to come from — restored while
   * the rest runs, so a decision it raises still names its card. */
  readonly decisionSource: DecisionSource | null;
}


/** See {@link GameState.standingModeAnswers}. */
export interface StandingModeAnswer {
  readonly player: PlayerId;
  readonly signature: string;
  /** The identical triggers it answers for. */
  readonly objects: readonly ObjectId[];
  /** The stack as it was answered. */
  readonly stack: readonly ObjectId[];
  /** The question it answered, which a later one must match. */
  readonly modeTexts: readonly string[];
  readonly modes: readonly number[];
  readonly xValue?: number;
}

/** A one-shot damage-prevention shield (Healing Salve — ROADMAP Phase 11 EG-6). */
export interface PreventionShield {
  /** The player or object it protects. */
  readonly target: TargetRef;
  /** Damage still to absorb (shrinks as hits are prevented; removed at 0). */
  amount: number;
  /** Only prevents combat damage. */
  readonly combatOnly: boolean;
  /** Prevents *all* damage to `target` this turn and is never used up
   * (Gideon Jura's "prevent all damage that would be dealt to him this
   * turn"); `amount` is unused. */
  readonly all?: true;
  /** For an object target: the stint it was made for (rule 400.7) — once
   * that object has changed zones it's a new object the shield doesn't
   * cover. Absent on a state saved before it was recorded. */
  readonly zoneChangeCount?: number;
}

/**
 * The combat-damage step in progress (rule 510 — ROADMAP Phase 11 EG-4).
 * `"single"` = no first/double striker in combat, one pass; `"first"` = the
 * first-strike sub-pass (510.5); `"regular"` = the main sub-pass. `regularOwed`
 * is true only during `"first"`, and drives `endStep` to start the regular
 * sub-pass (with a priority window between — 510.4) rather than leaving combat.
 */
export interface CombatDamageState {
  readonly pass: "single" | "first" | "regular";
  readonly regularOwed: boolean;
  /** Blocked attackers dealing damage this sub-pass whose controller still
   * owes an `assign-combat-damage` choice (multiple blockers, or trample with
   * slack). Drained one at a time. */
  readonly pendingAssignments: readonly ObjectId[];
  /** Damage-assignment choices already made this sub-pass: attacker id → the
   * amount dealt to each of its blockers, in `blockedBy` order (leftover, if
   * trample, goes to the defender). */
  readonly assigned: Readonly<Record<string, readonly number[]>>;
  /** The attackers and blockers that had first strike or double strike as the
   * first-strike step began (rule 510.4), id → battlefield timestamp then —
   * the second step's roster is everyone *not* here plus whoever has double
   * strike by then. Empty for a `"single"` step. Lives and dies with this
   * record, so it's gone by end of combat. */
  readonly firstStepStrikers: Readonly<Record<string, number>>;
}

/** An emblem (rule 114 — ROADMAP Phase 10): a player-owned object carrying one
 * ability, with no zone and no way to be removed. Currently only a
 * `"creatures-you-control"` anthem `static` is modeled (the common
 * planeswalker-ultimate emblem) — folded in by the layer system. `text` is for
 * the log / client. */
/**
 * A continuous effect a resolved spell or ability gave a player for a while
 * — an emblem that expires. See the `player-effect` EffectSpec.
 */
export interface PlayerEffect {
  readonly owner: PlayerId;
  /** Gone at this turn's cleanup, or as `owner`'s next turn begins. */
  readonly expires: { readonly kind: "end-of-turn" } | { readonly kind: "your-next-turn" };
  /** Matching spells `owner` casts cost this much generic mana less — the
   * amount read as the effect was created (rule 611.2b). */
  readonly reduceSpells?: { readonly applies: CardFilter; readonly reduceGeneric: number };
  /** `owner` may cast matching spells from their hand without paying their
   * mana costs. */
  readonly castFromHandFree?: { readonly filter?: CardFilter };
  /** `owner` may cast matching spells from their graveyard (Liliana,
   * Untouched by Death's −3) — a graveyard grant whose `source` is the
   * effect's source, never used up. */
  readonly castFromGraveyard?: { readonly filter: CardFilter; readonly source: ObjectId };
  /** Damage any source would deal to one of `players` — or, with
   * `permanentsToo`, to a permanent one of them controls — is multiplied. */
  readonly damageTo?: {
    readonly players: readonly PlayerId[];
    readonly multiplier: number;
    readonly permanentsToo?: boolean;
  };
  /** These players can't lose the game (Angel's Grace: "you can't lose the
   * game this turn") — no state-based action and no effect that says they
   * lose makes them lose; conceding still does (rule 104.3a). See
   * `playerCantLoseGame`. */
  readonly cantLoseGame?: readonly PlayerId[];
  /** These players can't win the game ("your opponents can't win the game
   * this turn") — an effect that says they win does nothing. Being the last
   * player left still wins (rule 104.2a). See `playerCantWinGame`. */
  readonly cantWinGame?: readonly PlayerId[];
  /** These players can't lose life (rule 119.8 — Everybody Lives!): damage
   * dealt to them is still dealt but changes nothing, an effect that says
   * they lose life does nothing, and a cost that has them pay life (more
   * than 0, rule 119.4b) can't be paid. See `playerCantLoseLife`. */
  readonly cantLoseLife?: readonly PlayerId[];
  /** "Damage that would reduce your life total to less than `floor` reduces
   * it to `floor` instead" (Angel's Grace, `floor: 1`) — for damage dealt to
   * one of `players`. Only damage, and only a total at or above the floor:
   * a player already below it loses life to damage as normal (the ruling).
   * The damage itself is still dealt in full. */
  readonly damageLifeFloor?: { readonly players: readonly PlayerId[]; readonly floor: number };
  /** "If one or more tokens would be created under your control, twice that
   * many of those tokens are created instead" for a while (Kaya, Geist
   * Hunter's −2): multiplies every token creation under `owner`'s control,
   * alongside a Doubling Season's (rule 614 — they compound). */
  readonly tokenMultiplier?: number;
}

/**
 * "Until your next turn, creatures your opponents control attack each combat
 * if able and attack a player other than you if able" (Kardur, Doomscourge):
 * goad's two requirements (rule 701.15b) as a continuous effect that modifies
 * the rules of the game, not a designation on anything. So it binds every
 * creature matching `filter` (from `by`'s side) for as long as it lasts —
 * including creatures that come under an opponent's control after it began
 * (rule 611.2c) — and a creature it binds isn't *goaded*: nothing that asks
 * about goaded creatures sees it. Read by the attack-requirement checks in
 * `combat/eligibility.ts`; lapses as `by`'s next turn begins.
 */
export interface AttackRequirementRule {
  /** The effect's controller — the "you" of "a player other than you". */
  readonly by: PlayerId;
  readonly filter: CardFilter;
  /** "…and attack a player other than you if able", as well as "attack
   * each combat if able". */
  readonly otherThanYou: boolean;
}

/**
 * A stretch of the game during which every player knew what an object was:
 * from the event it became public (`from`, an `eventSeq`) until knowledge of
 * it was lost (`until`, exclusive — absent while it still holds). It becomes
 * public by entering a public zone or being revealed. It stays known when it
 * goes from there into a hand or library (a bounced card is still known to be
 * that card), and stops being known when it moves on from a hidden zone, when
 * its library is shuffled, or when it's turned face down (foretold). The
 * history names an event's objects by the stint covering that event, so a
 * line keeps the name it had when it happened. `name` is the face it showed
 * last while public.
 */
export interface PublicStint {
  from: number;
  until?: number;
  name: string;
}

/** The name `id` was publicly known by when the event numbered `seq`
 * happened, or `undefined` if nobody but its holder knew what it was then —
 * the {@link PublicStint} covering that moment. */
export function publicNameAt(
  stints: Readonly<Record<string, readonly PublicStint[]>>,
  id: string,
  seq: number,
): string | undefined {
  const list = stints[id];
  if (list === undefined) return undefined;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const s = list[i];
    if (s.from <= seq && (s.until === undefined || seq < s.until)) return s.name;
  }
  return undefined;
}

export interface EmblemState {
  readonly id: string;
  readonly owner: PlayerId;
  readonly text: string;
  /** The name of the card whose effect created it ("Elspeth, Knight-Errant"),
   * for a player reading their emblems. `undefined` in a state saved before
   * it was recorded. */
  readonly sourceName?: string;
  /** Timestamp (rule 613.7) for ordering this emblem's anthem among others. */
  readonly timestamp: number;
  readonly static: StaticAbility | null;
  /** The emblem's object, when it has triggered abilities — the source its
   * triggers come from (kind `"emblem"`, abilities on its modifiers). */
  readonly object?: ObjectId;
  /** Who controlled the effect that made it, when that wasn't its owner —
   * Ob Nixilis Reignited gives an opponent a punishing emblem, which is no
   * asset of theirs. */
  readonly createdBy?: PlayerId;
  /** The Ring (rule 701.54c): one per player, its text growing with the
   * temptations — `ring.ts`. */
  readonly ring?: true;
}

export interface GameState {
  seed: number;
  /** Current PRNG position; rebuild the stream with `createRng(rngState)`. */
  rngState: number;
  rules: GameRules;
  /** Seating order, also the order priority passes. */
  turnOrder: PlayerId[];
  startingPlayer: PlayerId;
  players: Record<PlayerId, PlayerState>;
  objects: Record<ObjectId, GameObject>;
  zones: {
    perPlayer: Record<PlayerId, Record<PrivateZone, ObjectId[]>>;
    shared: Record<SharedZone, ObjectId[]>;
  };
  turn: TurnState;
  priority: PriorityState;
  result: GameResult;
  /**
   * Cards revealed to all players this turn (rule 701.16), so `viewFor` can
   * put their identity in *every* seat's view — a reveal is momentary, but a
   * client only ever sees whole frames, so the identity has to outlive the
   * instant or the event names a card nobody can draw.
   *
   * Turn-scoped, cleared as the next turn begins: a card revealed and then
   * drawn on the same turn stays visible, which is right (everyone did just
   * see it), while one revealed and drawn later does not.
   */
  revealedThisTurn: ObjectId[];
  /** When each object's identity was known to every player — see
   * {@link PublicStint}. Absent until the first object becomes public. */
  publicStints?: Record<ObjectId, PublicStint[]>;
  /**
   * The {@link GameObject.lastKnown} of each token that ceased to exist this
   * turn (rule 111.7), keyed by its old id: the object is deleted, but an
   * ability on the stack may still read it by last-known information —
   * Clement, the Worrywort's "lesser mana value" after a token copy that
   * entered was killed in response, a Saproling's dies trigger. Cleared as
   * the next turn begins; absent when no such token has been deleted.
   */
  ceasedTokens?: Record<ObjectId, LastKnownInfo>;
  /**
   * Tokens `moveObject` has taken off the battlefield since the last
   * state-based check, which deletes them (rule 111.7, 704.5d) and empties
   * this. The check used to walk every object in the game — each library
   * card included — on every pass to find them.
   */
  tokensLeftBattlefield?: ObjectId[];
  /**
   * How many times each ability has resolved this turn, for "if this is the
   * Nth time this ability has resolved this turn" (`StaticCondition`
   * `resolved-this-turn`). Keyed by source object, that object's timestamp
   * and which of its abilities, so a permanent that left and came back
   * starts again (rule 400.7) while an ability still on the stack from the
   * old one keeps counting against it. Turn-scoped, cleared as a turn
   * begins. Optional so an older snapshot still loads.
   */
  abilityResolutionsThisTurn?: Record<string, number>;
  /**
   * Which modes each ability has had chosen this turn, keyed like
   * `abilityResolutionsThisTurn` — for "choose one that hasn't been chosen
   * this turn" (`modal`'s `notChosenThisTurn`) and "do this only once each
   * turn" (`may`'s `oncePerTurn`, a choice of one mode). Turn-scoped,
   * cleared as a turn begins.
   */
  modesChosenThisTurn?: Record<string, number[]>;
  /**
   * "The same for all of them": a player's answer to one trigger's "you
   * may", standing for the identical triggers that were under it on the
   * stack (`choose-modes`' `forAll`). Each is answered with it as it
   * resolves, so long as nothing new has gone on the stack since (`stack`
   * is the stack as it was answered: anything added — a response, a new
   * trigger — ends the shortcut, rule 732.2b) and the question is still the
   * same one. Dropped once none of its triggers is left. Never in a view.
   */
  standingModeAnswers?: StandingModeAnswer[];
  /** A declaration the engine is waiting for, or `null`. */
  awaiting: AwaitingDecision | null;
  /**
   * Delayed triggered abilities still waiting to fire (rule 603.7) — see
   * {@link DelayedTrigger}. Drained by `enterStep`, which is the only place
   * that can see them: they belong to no permanent, so the `detectTriggers`
   * battlefield scan never matches one.
   */
  delayedTriggers: DelayedTrigger[];
  /**
   * The spell or permanent whose resolution raised `awaiting` — what a client
   * shows the deciding player so a forced sacrifice or discard isn't a prompt
   * out of nowhere. Only meaningful while `awaiting` is set *and*
   * `decisions/registry.ts`'s `decisionHasSource` accepts it; cleared whenever priority is handed
   * off with nothing pending.
   *
   * It is tracked separately from the decision itself because the two are
   * raised in different places: the resolving object is known at the top of
   * `resolveTopOfStack`/`resolveAbility`, while the decision can surface
   * several layers down inside an effect (or, for a sacrifice effect, a whole
   * fixpoint iteration later, out of `pendingSacrifices`).
   */
  decisionSource: DecisionSource | null;
  /**
   * Defending players (3+ player games can have more than one) still owed a
   * "declare-blockers" turn this combat, in the order they'll be asked.
   * Drained one `declare-blockers` action at a time.
   */
  pendingBlockerDeclarations: PlayerId[];
  /** Triggered abilities that have fired but not yet been put on the stack. */
  pendingTriggers: PendingTrigger[];
  /**
   * A fired trigger (or Saga chapter) parked mid-placement while its controller
   * chooses targets (ROADMAP Phase 11 EG-1). The corresponding `choose-targets`
   * decision is on `awaiting`; `applyChooseTargets` mints the ability onto the
   * stack with the assembled targets, then resumes placing the rest of
   * `pendingTriggers`. `null` when no such choice is pending.
   */
  pendingTargetedTrigger: {
    readonly sourceObjectId: ObjectId;
    readonly cardName: string;
    readonly abilityKind: "triggered" | "chapter";
    readonly abilityIndex: number;
    readonly controller: PlayerId;
    /** One entry per target slot, in order: an `auto`-filled slot (a saboteur's
     * victim) or a `spec` slot whose `TargetRef` comes from the answer. */
    readonly slots: readonly (
      | { readonly auto: TargetRef }
      | { readonly spec: TargetSpec }
      /** An "up to one" or "any number of" slot with nothing to point at:
       * left empty — a hole, or for a group no slot at all. */
      | { readonly skip: true }
    )[];
    /** See {@link PendingTrigger.triggerValue}. */
    readonly triggerValue?: number;
    /** See {@link PendingTrigger.triggerObject}. */
    readonly triggerObject?: ObjectId;
    /** See {@link PendingTrigger.x}. */
    readonly x?: number;
    /** See {@link PendingTrigger.grantedAbility}. */
    readonly grantedAbility?: GrantedAbilityRef;
    /** See {@link PendingTrigger.lastKnownRefs}. */
    readonly lastKnownRefs?: LastKnownRefs;
    /** See {@link PendingTrigger.targetedBy}. */
    readonly targetedBy?: TargetedBy;
    /** See {@link PendingTrigger.reflexive}. */
    readonly reflexive?: ReflexiveTrigger;
    /** See {@link PendingTrigger.modes}. */
    readonly modes?: readonly number[];
  } | null;
  /**
   * A fired modal trigger ("Choose one —") parked as it goes on the stack
   * while its controller announces its modes (rules 603.3c, 700.2b): the
   * `choose-modes` on `awaiting` is marked `announcing`, and answering it
   * places this trigger again with its `modes` — on to its targets, if it
   * has any. Absent when none is.
   */
  pendingModalTrigger?: PendingTrigger;
  /**
   * A copy of a spell on the stack whose controller is choosing new targets
   * for it (rule 707.10c — "you may choose new targets for the copy"): the
   * `choose-targets` on `awaiting` carries `current`, and `slots` maps its
   * answers back onto the copy's target slots. Absent when none is.
   */
  pendingCopyTargets?: { readonly copy: ObjectId; readonly slots: readonly number[] } | null;
  /** Copies made while another decision was up — storm's several — waiting
   * to be asked about their new targets, oldest first. Drained one at a time
   * in the `prepareForPriority` fixpoint. Absent when empty. */
  copyTargetsQueue?: ObjectId[];
  /** Ability objects that left the stack while a triggered ability waiting
   * on it named one as its trigger object, as they last were there — what
   * Illusionist's Bracers' "copy that ability" copies once the ability has
   * been countered in response (rule 707.10, as Rings of Brighthearth's
   * ruling has it). Emptied as each turn begins. Absent when empty. */
  departedAbilities?: Record<ObjectId, GameObject>;
  /** Suspended cards still to be offered their free cast this upkeep, after
   * one of them raised its `cast-now`. Drained as that is answered. */
  pendingSuspendedCasts: ObjectId[];
  /**
   * Battlefield permanents a mass-destroy effect (Wrath of God) still has to
   * destroy. `drainPendingDestruction` destroys them all at once, as one leave
   * batch (rule 603.10a) — a commander among them waits for its 903.9a
   * choice without holding up the rest — but only once nothing else is being
   * asked: a wipe that began while another decision was pending waits here
   * for the `prepareForPriority` fixpoint.
   */
  pendingDestruction: ObjectId[];
  /** The members of `pendingDestruction` that "can't be regenerated" (rule
   * 701.15c — Wrath of God). */
  pendingDestructionNoRegen?: ObjectId[];
  /**
   * Players still owed a "discard N cards" decision from a *scoped* discard
   * effect ("each opponent discards a card") — one player's choice is asked
   * at a time, so the rest wait here. Drained one at a time by
   * `promptNextDiscard` in the `prepareForPriority` fixpoint, APNAP-ordered.
   * A player with no real choice (a hand no bigger than what's owed)
   * discards straight away and never waits here. Any effect discard raised
   * while another decision is up waits here too, rather than overwriting it.
   */
  pendingDiscards: {
    readonly player: PlayerId;
    readonly count: number;
    /** What ordered the discard — see `pendingSacrifices`' `source`. */
    readonly source?: DecisionSource;
    /** Only cards matching this may go — see the `discard` decision's
     * `eligible`. */
    readonly filter?: CardFilter;
    /** See the `discard` effect's `unlessOne`. */
    readonly unlessOne?: CardFilter;
  }[];
  /**
   * Attackers just declared whose "you may exert this creature as it
   * attacks" (rule 701.43d, an optional cost to attack — 508.1g) is still to
   * be asked: queued by the declaration and asked one at a time, as a
   * `choose-modes`, by `promptNextExert` in the `prepareForPriority`
   * fixpoint — before anything that triggered on the attack goes on the
   * stack. Optional so a snapshot saved before it existed still loads.
   */
  pendingExerts?: ObjectId[];
  /**
   * Creatures put onto the battlefield attacking whose controller still owes
   * the choice of what each attacks (rule 508.4) — queued as they enter and
   * asked, one batch per player, by `promptNextEnterAttacking` in the
   * `prepareForPriority` fixpoint (see `Game.putIntoAttack`). Each is already
   * attacking its first option meanwhile; the answer only re-points it.
   * Optional so a snapshot saved before it existed still loads.
   */
  /** What the players asked by a resolving `keep-total-power` effect have
   * chosen to keep so far (a token stack once per member kept), read and
   * cleared as the effect resumes. */
  keptByChoice?: ObjectId[];
  /** Draws waiting behind a dredge question (rule 702.52): the rest of an
   * instruction's draws, each made — and offered dredge again — one at a
   * time once the question before it is answered (the ruling). */
  pendingDraws?: { readonly player: PlayerId; readonly count: number }[];
  pendingEnterAttacking?: {
    readonly player: PlayerId;
    readonly creatures: readonly EnterAttackingChoice[];
    /** What put them there — see `pendingSacrifices`' `source`. */
    readonly source?: DecisionSource;
  }[];
  /**
   * Players still owed a "choose N permanents to sacrifice" decision from a
   * sacrifice *effect* (Diabolic Edict, Fleshbag Marauder). Drained one at a
   * time by `promptNextSacrifice`, APNAP-ordered.
   */
  pendingSacrifices: {
    readonly player: PlayerId;
    readonly filter: CardFilter;
    readonly count: number;
    /** A permanent to exclude — "sacrifice **another** permanent" (Korvold). */
    readonly exceptId?: ObjectId;
    /** What ordered the sacrifice, carried across the deferral so the
     * decision can still say where it came from — see {@link
     * GameState.decisionSource}. The spell has usually left the stack by the
     * time the prompt is raised. */
    readonly source?: DecisionSource;
  }[];
  /**
   * Specific permanents (chosen, or auto-selected when there was no choice)
   * still to be moved to the graveyard as a sacrifice. Drained only once
   * every player owed a choice has made it, and then all at once as one
   * leave batch (rule 101.4 — the players choose in turn, then sacrifice
   * simultaneously; rule 603.10a) — `drainPendingSacrificeVictims`.
   */
  pendingSacrificeVictims: { readonly player: PlayerId; readonly object: ObjectId }[];
  /**
   * A sacrifice *cost* of several permanents being paid (rules 601.2h, 602.2b
   * — Sai, Master Thopterist's "Sacrifice two artifacts", Jarad, Golgari Lich
   * Lord's "a Swamp and a Forest"): the ability is on the stack and the rest
   * of its cost paid. `parts` are still to be chosen, a `sacrifice` decision
   * each (none when there's no choice), and `picked` holds what's chosen so
   * far — still on the battlefield, a token named out of a stack already
   * split off it — all sacrificed together once the last part is chosen.
   * Nobody gets priority and no state-based action is checked until then
   * (rule 704.3). Optional so a snapshot saved before it existed still loads.
   */
  pendingCostSacrifice?: {
    readonly player: PlayerId;
    /** The card whose cost it is, named in the prompt. */
    readonly source: ObjectId;
    readonly parts: readonly { readonly filter: CardFilter; readonly count: number }[];
    /** "Sacrifice two **other** creatures": the source can't pay. */
    readonly except?: ObjectId;
    readonly picked: readonly ObjectId[];
    /** Who gets priority once it's paid: the player who activated it. */
    readonly priorityTo: PlayerId;
  };
  /**
   * The commander whose owner is being asked whether to put it into the
   * command zone (rule 903.9), or `null`. Either it's in the graveyard or
   * exile it was put into, and this is the state-based action of 903.9a; or
   * it's *about to* be put into a hand or library, 903.9b's replacement, and
   * `moveObject` hasn't moved it yet. `applyCommanderChoice` does whichever
   * move the answer calls for.
   *
   * The `commander-replacement` decision is normally on `awaiting` while this
   * is set, but not always: a later step of the same resolution can raise a
   * decision of its own over a 903.9b question. The question is asked again
   * once that one is answered — `raiseNextCommanderChoice`.
   */
  deferredCommanderMove: {
    readonly commander: ObjectId;
    /** Where it stays (903.9a) or goes (903.9b) if its owner declines. */
    readonly intendedZone: CommanderReplacementZone;
    /** A 903.9a offer's: the zone-change count it arrived with, so it's asked
     * about only while it's still that object (rule 400.7). */
    readonly stint?: number;
    /** The permanents that left the battlefield in the same simultaneous
     * event as this commander's deferred move (a wrath, one state-based
     * sweep). Its move is carried out later, once its owner answers, but it
     * still happened at the same time as theirs, so their leaves-the-
     * battlefield abilities look back at it and it at them (rule 603.10a).
     * See `Game.withLeaveBatch`. */
    readonly leftWith?: readonly ObjectId[];
    /** Where it waits meanwhile — the battlefield when absent. A 903.9a
     * offer waits in the graveyard or exile it's in. A commander put into
     * its owner's hand or library *from anywhere* is asked too (rule
     * 903.9b): a spell countered into its owner's hand (Remand) or returned
     * there from the stack (Unsubstantiate), an Omen shuffled away as it
     * resolves, or a card from a graveyard or exile (Noxious Revival), each
     * of which waits where it is. */
    readonly from?: CommanderMoveOrigin;
    /** A move to a library: where in it the commander goes if its owner
     * declines (absent: the bottom). */
    readonly libraryPlacement?: CommanderLibraryPlacement;
    /** A commander a `choose-from-zone` answer is putting from its owner's
     * hand into their library (Brainstorm, Valakut Awakening, Teferi's
     * Puzzle Box — rule 903.9b): the answer is only *recorded* (the parked
     * `PendingEntry`'s `commanderAnswers`), and the choice carries out the
     * move with the rest of its cards, in the order picked. */
    readonly heldByZoneChoice?: true;
  } | null;
  /**
   * Commanders whose owner is owed the choice on `deferredCommanderMove` and
   * hasn't been asked yet, in the order they'll be asked: every 903.9a offer
   * one state-based check found (in APNAP order of their owners, rule
   * 101.4), and every 903.9b move that came while another decision was on
   * `awaiting`, which waits where it is until `prepareForPriority` asks.
   *
   * Without this a move went ahead unasked: an overloaded Cyclonic Rift asked
   * about the first opponent's commander and bounced the rest silently.
   */
  pendingCommanderMoves: {
    readonly commander: ObjectId;
    readonly intendedZone: CommanderReplacementZone;
    readonly stint?: number;
    readonly leftWith?: readonly ObjectId[];
    readonly from?: CommanderMoveOrigin;
    readonly libraryPlacement?: CommanderLibraryPlacement;
    readonly heldByZoneChoice?: true;
  }[];
  /**
   * Commanders put into a graveyard or exile since state-based actions were
   * last checked, each with the zone-change count it arrived with. Rule
   * 903.9a: the next check offers each one that's still there its owner's
   * choice of the command zone (`offerArrivedCommanders`), and the list
   * starts again. One that moved on before the check isn't offered for the
   * zone it left, only for where it is now if that's a graveyard or exile.
   */
  commanderArrivals: { readonly commander: ObjectId; readonly stint: number }[];
  /**
   * Shock lands ("you may pay 2 life; if you don't, it enters tapped" — rule
   * 614.13) that entered while another decision was on `awaiting`. Each is on
   * the battlefield tapped, as if its controller had declined, until
   * `prepareForPriority` offers the payment in turn.
   *
   * Without this the offer was dropped, and the tap with it: a fetch land put
   * Watery Grave onto the battlefield while its own search was still being
   * answered, and the land came in untapped for free.
   */
  pendingPayLifeForUntapped: {
    readonly player: PlayerId;
    /** The land that entered. */
    readonly source: ObjectId;
    readonly life: number;
  }[];
  /**
   * Resolutions waiting on a decision one of their own steps raised, most
   * recent last (rule 608.2c: a spell's instructions are followed in order,
   * so "each opponent sacrifices a creature, then you draw a card" can't
   * draw before the sacrifices are chosen).
   *
   * A `sequence` step that leaves a decision to answer parks the steps after
   * it here, and a resolution that ends with one still unanswered parks an
   * empty remainder. `prepareForPriority` resumes the newest once nothing is
   * awaited and no queued prompt is left, so a remainder nested inside a
   * chosen mode finishes before the steps after that mode. While any is
   * parked the resolution is still under way: no state-based actions are
   * performed (rule 704.3 — they are checked only as a player would receive
   * priority) and no triggered ability is put on the stack (rule 603.3).
   */
  suspendedResolutions: SuspendedResolution[];
  /** The permanents players have chosen to keep under the legend rule in the
   * state-based check under way (the `legend-rule` decision); spent once that
   * check performs its moves. */
  legendRuleKeeps?: ObjectId[];
  /** Players who order their own simultaneous triggered abilities (rule
   * 603.3b, the `order-triggers` decision) rather than leave it to the
   * engine — a preference set from outside (`Game.setOrdersOwnTriggers`),
   * off for everyone by default. */
  ordersOwnTriggers?: PlayerId[];
  /**
   * The `eventSeq` the spell or ability now resolving began at — what "this
   * way" reads (the `thisWay` amount and the `this-way` condition): every
   * event since is its own, because nothing else happens while it resolves,
   * across the decisions it waits on too. Set as it begins, cleared once it
   * and everything it parked have finished; absent between resolutions.
   */
  resolutionSince?: number;
  /** While an ability resolves (across the decisions it waits on, like
   * `resolutionSince`): its source and that source's timestamp then — what
   * a permanent it puts onto the battlefield records as `entry.by`. Absent
   * while a spell resolves, and between resolutions. */
  resolvingSource?: { readonly source: ObjectId; readonly timestamp: number };
  /** Player-level continuous effects that expire (the `player-effect`
   * effect) — see {@link PlayerEffect}. */
  playerEffects?: PlayerEffect[];
  /** This turn's one-shot prohibitions (the `prohibit` effect): players who
   * can't cast spells and/or activate abilities, and permanents — the stint
   * they were in — whose activated abilities can't be activated. Turn-scoped. */
  turnProhibitions?: {
    players: {
      readonly player: PlayerId;
      readonly spells: boolean;
      readonly abilities: boolean;
      /** Only the spells matching this, from `you`'s side — "can't cast
       * noncreature spells this turn". */
      readonly spellsMatching?: { readonly filter: CardFilter; readonly you: PlayerId };
    }[];
    permanents: { readonly object: ObjectId; readonly zoneChangeCount: number }[];
  };
  /** The permanents some effect lasts "for as long as [it] remains on the
   * battlefield" for (a modifier's or control effect's `whileSource`) — so a
   * permanent leaving looks for effects to end only when it's one of these. */
  whileSourceIds?: ObjectId[];
  /** Combat restrictions imposed as a rule for the rest of the turn — "creatures
   * your opponents control can't block this turn" (the `restrict` effect's
   * `filter` form): every permanent matching `filter`, from `you`'s side,
   * including ones that enter later (rule 611.2c). Read through
   * `restrictionsOf`. Turn-scoped. */
  turnRestrictions?: {
    readonly filter: CardFilter;
    readonly you: PlayerId;
    readonly restrictions: readonly CombatRestriction[];
  }[];
  /** "Creatures you control with defender can attack this turn as though
   * they didn't have defender" (the `attack-despite-defender` effect's
   * `filter` form — Wakestone Gargoyle): every permanent matching `filter`
   * from `you`'s side, including ones that arrive later. Read through
   * `canAttackDespiteDefender`. Turn-scoped. */
  turnDefenderAttacks?: { readonly filter: CardFilter; readonly you: PlayerId }[];
  /** Attack requirements imposed as a rule of the game until a player's next
   * turn — the `attack-requirement` effect (Kardur, Doomscourge). See
   * {@link AttackRequirementRule}. Absent when there are none. */
  attackRequirements?: AttackRequirementRule[];
  /** Phases owed straight after the combat phase under way, the next one
   * first — each is added directly after the phase it was made in, so the
   * most recently created goes first (rule 500.8). An additional combat
   * phase ("after this phase, there is an additional combat phase"), maybe
   * "followed by an additional main phase"; or an additional beginning phase
   * holding only an upkeep step (Obeka, Splitter of Seconds' "you get that
   * many additional upkeep steps after this phase" — rules 500.10, 500.11:
   * its untap and draw steps are skipped). Turn-scoped. */
  phasesAfterThisCombat?: AddedPhase[];
  /** Spells just cast whose casualty costs (rule 702.153a) are still to be
   * offered — see {@link CasualtyAsk}. Absent when there are none. */
  pendingCasualty?: CasualtyAsk[];
  /** Spells just cast with their gift promised whose opponent is still to
   * be chosen — see {@link GiftAsk}. Absent when there are none. */
  pendingGifts?: GiftAsk[];
  /** Additional main phases owed after the postcombat main phase under way
   * (a `withMain` combat's). Turn-scoped. */
  extraMainPhases?: number;
  /** True while a Fog-style effect has prevented all combat damage this turn
   * (rule 614 replacement, but turn-scoped with no permanent to hang it on).
   * Set by the `prevent-all-combat-damage` effect, cleared at the start of the
   * next turn. */
  preventAllCombatDamage: boolean;
  /** The same for only some sources — a `prevent-all-combat-damage` with
   * `by` (Arachnogenesis: "by non-Spider creatures"): combat damage a source
   * matching one of these filters would deal is prevented, each matched as
   * the damage would be dealt from `you`'s side. Cleared with
   * `preventAllCombatDamage`; absent when there are none. */
  combatDamagePreventedBy?: { readonly filter: CardFilter; readonly you: PlayerId }[];
  /**
   * Players with hexproof until end of turn (Lazotep Plating: "**You** and
   * permanents you control gain hexproof"). Turn-scoped rather than a
   * per-player flag for the same reason `preventAllCombatDamage` is: there's
   * no permanent to hang it on. Cleared as each turn begins.
   */
  hexproofPlayers: PlayerId[];
  /** Abilities each player's spells gain as they're cast for the rest of the
   * turn (`grant-spells-this-turn` — Yidris, Maelstrom Wielder's cascade),
   * one entry per resolution. Ends with the turn. Absent when empty. */
  spellGrantsThisTurn?: {
    readonly player: PlayerId;
    readonly castFrom?: readonly ZoneType[];
    readonly triggered: readonly TriggeredAbility[];
  }[];
  /** How many creatures have died this turn — Liliana's Devotee's "if a
   * creature died this turn". Turn-scoped; reset as each turn begins. */
  creaturesDiedThisTurn: number;
  /** One-shot damage-prevention shields (Healing Salve — rule 614.9 / ROADMAP
   * Phase 11 EG-6). Each absorbs up to `amount` damage aimed at `target`;
   * consumed (and shrunk / removed) in `dealDamage` before the hit lands.
   * Cleared at the start of the next turn (all such effects are "this turn"). */
  preventionShields: PreventionShield[];
  /** Extra turns still owed, in the order they'll be taken (rule 500.7 —
   * ROADMAP Phase 7). `beginTurn` shifts the front instead of advancing the
   * active-player rotation. Time Warp pushes the caster. */
  extraTurns: PlayerId[];
  /** Additional combat phases still owed *this turn* (Aggravated Assault —
   * ROADMAP Phase 7). When the postcombat main phase ends with this > 0,
   * `endStep` decrements it and re-enters `begin-combat` (a combat phase then
   * another main phase) instead of moving to the end step. */
  extraCombats: number;
  /** Spells cast this turn by *any* player — the Storm count (rule 702.40a).
   * Reset in `beginTurn`. `PlayerState.spellsCastThisTurn` is the per-player
   * count for "your first spell each turn" triggers. ROADMAP Phase 8. */
  spellsCastThisTurn: number;
  /** The day/night designation (rule 726 — ROADMAP Phase 10b). `null` until a
   * card or effect first makes it day or night. `beginTurn` then flips it per
   * 726.3/726.4 (day → night if the previous turn's player cast no spells;
   * night → day if they cast two or more). Daybound/nightbound permanents
   * transform when it changes. */
  dayNight: "day" | "night" | null;
  /** The monarch (rule 720 — ROADMAP Phase 10), or `null` when no player is the
   * monarch. The monarch draws a card at the beginning of their end step
   * (720.6); a creature dealing combat damage to the monarch makes its
   * controller the monarch (720.5). */
  monarch: PlayerId | null;
  /** Emblems in the game (rule 114 — ROADMAP Phase 10). An emblem is a
   * player-owned object with one ability and no other characteristics; it has
   * no zone and can't be removed. Its `ability` is applied by the layer system
   * (a `"creatures-you-control"` anthem) and/or `detectTriggers`. */
  emblems: EmblemState[];
  /** The last die roll made (rule 706), what a `roll-dice`'s results and
   * `{ roll }` amounts read: who rolled, each die's natural result, and the
   * result with the roll's modifier. */
  lastRoll?: { readonly player: PlayerId; readonly sides: number; readonly results: readonly number[]; readonly total: number };
  /** The combat-damage step in progress (rule 510 — ROADMAP Phase 11 EG-4).
   * Tracks which sub-pass is running (first strike / regular), whether a
   * regular sub-pass is still owed, and any blocked attackers whose
   * controller still owes a damage-assignment choice. `null` outside the
   * combat-damage step. */
  combatDamage: CombatDamageState | null;
  /** Monotonic source for battlefield-entry timestamps. */
  timestampSeq: number;
  eventLog: GameEvent[];
  eventSeq: number;
  nextObjectSeq: number;
}

export function createPlayerState(id: PlayerId, rules: GameRules): PlayerState {
  return {
    id,
    life: rules.startingLife,
    manaPool: [],
    maxHandSize: rules.maxHandSize,
    landsPlayedThisTurn: 0,
    hasLost: false,
    lossReason: null,
    attemptedDrawFromEmptyLibrary: false,
    commanderCastCounts: {},
    commanderDamageTaken: {},
    spellsCastThisTurn: 0,
    lifeLostThisTurn: 0,
  lifeGainedThisTurn: 0,
  cardsDrawnThisTurn: 0,
    creaturesDiedThisTurn: 0,
    createdTokenThisTurn: false,
    usedGraveyardThisTurn: false,
    energy: 0,
    counters: {},
    printings: {},
  };
}

/**
 * Deep-copy a `GameState` — a drop-in replacement for `structuredClone`,
 * several times faster because it can assume what `GameState` guarantees: a
 * plain tree of objects, arrays and primitives (no class instances, `Map`/
 * `Set`, `Date`, typed arrays, cycles or functions). Bot search clones a
 * whole state per simulated candidate (and, for v3, per sampled world), so
 * this is directly on the "how many candidates fit in the decision budget"
 * path.
 */
export function cloneGameState(state: GameState): GameState {
  return clonePlainTree(state) as GameState;
}

/** Deep-copy one piece of a `GameState` — an object of it, say — under the
 * same guarantees as {@link cloneGameState}. */
export function clonePlain<T>(value: T): T {
  return clonePlainTree(value) as T;
}

function clonePlainTree(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    const out = new Array(value.length);
    for (let i = 0; i < value.length; i += 1) out[i] = clonePlainTree(value[i]);
    return out;
  }
  const out: Record<string, unknown> = {};
  for (const key in value) {
    out[key] = clonePlainTree((value as Record<string, unknown>)[key]);
  }
  return out;
}

// --- selectors -------------------------------------------------------------

/** The name of the face of a multi-face card that is currently up (rule 712) —
 * its front face's name (`object.cardName`) unless a different face was chosen
 * / it was transformed. */
export const faceName = (object: GameObject): string => {
  const faces = object.faces;
  if (faces === undefined || faces.length < 2) return object.cardName;
  return faces[object.face ?? 0] ?? object.cardName;
};

/** The card name whose printed characteristics this object currently has — the
 * one it's a copy of (rule 707 / layer 1), else its up face (rule 712), else
 * its own. Every `registry.get` for an object's name, cost, colors, types or
 * P/T goes through this; one for its abilities goes through
 * {@link rulesTextName}. */
export const printedCardName = (object: GameObject): string =>
  object.faceDown !== undefined
    ? FACE_DOWN_CARDS[object.faceDown.kind]
    : object.doors !== undefined && !object.doors.left && !object.doors.right
      ? LOCKED_ROOM
      : (object.copyOf ?? faceName(object));

/** The registry name of a Room with both doors locked (rule 709.5): an
 * enchantment — Room with no name, mana cost or rules text — an internal
 * definition, like {@link FACE_DOWN_CARDS}, registered by
 * `createDefaultRegistry` (`cards/locked-room.ts`). */
export const LOCKED_ROOM = "Room (Both Doors Locked)";

/** The face a Room's doors give it (`GameObject.doors`): the whole card with
 * both unlocked, one half with one, and 0 with neither (when
 * {@link printedCardName} reads {@link LOCKED_ROOM} instead). */
export const doorsFace = (doors: { readonly left: boolean; readonly right: boolean }): number =>
  doors.left && doors.right ? 0 : doors.left ? 1 : doors.right ? 2 : 0;

/** How a permanent came to be face down: manifested (rule 701.40) or cloaked
 * (701.58, a manifest with ward {2}). Morph and disguise aren't modeled. */
export type FaceDownKind = "manifest" | "cloak";

/** The registry names of the face-down 2/2s (rule 708.2a): internal
 * definitions, not cards — `cards/face-down.ts` defines them, and
 * `createDefaultRegistry` registers them beside the pool. A face-down
 * permanent's {@link printedCardName} is one of these, so it has its
 * characteristics as its copiable values (708.2): a face-down permanent that
 * becomes a copy stays a face-down 2/2 (708.10, since this is read before
 * `copyOf`), and a Clone copying one copies the 2/2. */
export const FACE_DOWN_CARDS: Readonly<Record<FaceDownKind, string>> = {
  manifest: "Face-Down Creature",
  cloak: "Face-Down Creature (Ward {2})",
};

/** The card whose rules text this object has (layer 3): another's, once an
 * exchange of text boxes gave it that (`GameObject.textFrom`, rule 612.5),
 * else its {@link printedCardName}. Every read of an object's *abilities* —
 * keywords, statics, triggered and activated abilities, anything else its
 * text says — goes through this; its name, mana cost, colors, types and P/T
 * still come from `printedCardName`. */
export const rulesTextName = (object: GameObject): string =>
  object.textFrom ?? printedCardName(object);

/** The name `object` has (rule 201.2): one a copy exception gave it
 * ("except its name is Mishra's Warform" — a copiable `setName`, the latest
 * such), else its card's ({@link printedCardName}). What the legend rule and
 * every "named …" read; the registry stays keyed by `printedCardName`. */
/** The mana cost a copiable value gives it in place of its printed one: a
 * prototyped spell's (`setManaCost`, rule 718.3b), or none at all
 * (`noManaCost` — eternalize, embalm: mana value 0, rule 202.1b). The
 * latest wins; `undefined` when nothing replaces the printed cost. */
export const manaCostOverride = (object: GameObject): string | null | undefined => {
  for (let i = object.modifiers.length - 1; i >= 0; i -= 1) {
    const m = object.modifiers[i];
    if (m.copiable !== true) continue;
    if (m.noManaCost === true) return null;
    if (m.setManaCost !== undefined) return m.setManaCost;
  }
  return undefined;
};

export const nameOf = (object: GameObject): string => {
  // A face-down permanent has no name at all (rule 708.2a), whatever a copy
  // effect's exception would have named it: its registry key stands in. So
  // does a Room with both doors locked (709.5).
  if (object.faceDown !== undefined || printedCardName(object) === LOCKED_ROOM) return printedCardName(object);
  for (let i = object.modifiers.length - 1; i >= 0; i -= 1) {
    const m = object.modifiers[i];
    if (m.copiable === true && m.setName !== undefined) return m.setName;
  }
  return printedCardName(object);
};

/**
 * How many permanents `ids` stand for: a compacted token stack is every token
 * in it (`GameObject.stackCount`), not one object. Anything that counts
 * permanents — "for each Goblin you control", "three or more artifacts" — has
 * to count this way, or a board of stacked tokens reads as a handful.
 *
 * One known gap: an "other"/"another" count leaves out its source object
 * whole, so a stacked token whose *own* ability counts "each other X" misses
 * its stack-mates. Asking whether they match would mean asking whether the
 * source matches, which can recurse into that same ability. No stackable
 * token has such an ability today.
 */
export const permanentCount = (state: GameState, ids: readonly ObjectId[]): number =>
  ids.reduce((n, id) => n + (state.objects[id]?.stackCount ?? 1), 0);

export const activePlayerOf = (state: GameState): PlayerId =>
  state.turnOrder[state.turn.activePlayerIndex];

/**
 * Whether `them` attacked `you` during their last turn — the most recent
 * turn they took (Weathered Sentinels' "players who attacked you during
 * their last turn"): declared a creature attacking `you` then, not only a
 * planeswalker of yours (the O-Kagachi, Vengeful Kami ruling). See
 * `PlayerState.attackedByOnTurn`.
 */
export function attackedYouDuringTheirLastTurn(state: GameState, you: PlayerId, them: PlayerId): boolean {
  const last = state.players[them]?.lastTurnTaken;
  return last !== undefined && state.players[you]?.attackedByOnTurn?.[them] === last;
}

/**
 * Everything two tokens must share to be folded into one stack, as one
 * string — `Game`'s `findMergeableStack` compares a new batch against it and
 * `recompactTokens` groups on it, and the bots use it to tell twin targets
 * apart (`bot/twins.ts`). Anything that tells one token from another belongs
 * here — whose it is (owner as well as controller: a token someone stole for
 * good isn't one of the thief's own), its state, what's been done to it
 * (counters, modifiers, a goad, a control effect, a transformed face, a choice
 * made as it entered), what's still due to happen to it, and the turn it
 * entered — "each creature token you control that entered this turn"
 * (Redoubled Stormsinger) tells tokens made today from yesterday's twins.
 */
export function tokenFoldKey(o: GameObject): string {
  return JSON.stringify([
    o.cardName,
    o.copyOf,
    o.copyEndsAtCleanup ?? false,
    o.copyRestore ?? null,
    o.owner,
    o.controller,
    o.tapped,
    o.summoningSick,
    o.enteredBattlefieldOnTurn,
    o.face ?? 0,
    o.exileAtEndStep ?? false,
    o.sacrificeAtEndStep ?? false,
    o.notLegendary ?? false,
    o.goadedBy ?? [],
    o.goadedForGameBy ?? [],
    o.suspectedAt ?? null,
    o.monstrous ?? false,
    o.exertedBy ?? null,
    o.exertedOnTurn ?? null,
    o.skipsNextUntap ?? false,
    o.mustAttackPlayer ?? null,
    o.controlEffects ?? null,
    o.controlEndsAtCleanup,
    o.chosenOnEnter ?? null,
    o.chosenCreatureType ?? null,
    o.counters,
    o.counterTimestamps ?? null,
    o.modifiers,
    o.regenerationShields ?? 0,
  ]);
}

/** `object`'s `tally` up to the end of the turn before `turn`: what it had
 * done before the turn now being played. */
export function settledTally(
  object: GameObject,
  turn: number,
): { readonly lifeTaken: number; readonly cardsDrawn: number } {
  const tally = object.tally;
  if (tally === undefined) return { lifeTaken: 0, cardsDrawn: 0 };
  if (tally.thisTurn.turn !== turn) return tally;
  return {
    lifeTaken: tally.lifeTaken - tally.thisTurn.lifeTaken,
    cardsDrawn: tally.cardsDrawn - tally.thisTurn.cardsDrawn,
  };
}
