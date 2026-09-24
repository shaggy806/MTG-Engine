/**
 * The game state tree and pure selectors over it.
 *
 * `GameState` is a plain, structurally-cloneable object: no class instances,
 * functions, `Map`s, or `Set`s. The {@link Game} class owns the single mutable
 * instance and is the only thing that writes to it; everything else reads.
 */

import type { CastVia } from "./actions.js";
import type { TriggeredAbility } from "./abilities.js";
import type { CardType, Keyword, StaticAbility, StaticCondition } from "./cards.js";
import type { EffectSpec, FlickerCounters } from "./effects.js";
import type { CardFilter } from "./filter.js";
import type { Color, ManaUnit } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameEvent } from "./events.js";
import type { ResolvedTargets, TargetRef, TargetSpec } from "./target.js";
import type { Phase, Step } from "./turn.js";
import { phaseOfStep } from "./turn.js";

export type PrivateZone = "library" | "hand" | "graveyard";
export type SharedZone = "battlefield" | "stack" | "exile" | "command";
export type ZoneType = PrivateZone | SharedZone;

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
  /**
   * Was this permanent attacking when it left the battlefield? — the
   * last-known-information counterpart of `attacking`, for a dies-trigger
   * filtered on it (Kardur, Doomscourge's "whenever an attacking creature
   * dies"). `moveObject` clears `attacking` before any such trigger is
   * matched. See `lastKnownCounters`, which exists for the same reason.
   */
  wasAttacking?: boolean;
  /**
   * This card is in exile because of an "exile until ~ leaves the
   * battlefield" ability, and this is the id of the permanent that did it
   * (rule 720.2 — Banishing Light). Set *after* the move to exile, since
   * `moveObject` clears zone-scoped state on the way.
   */
  exiledBy?: ObjectId;
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
  /** True once dealt damage by a deathtouch source this turn (rule 704.5h). Cleared with `damageMarked`. */
  markedByDeathtouch: boolean;
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
   * "Activate only once each turn", Steel Hellkite). Reset in the
   * controller's untap step alongside `loyaltyActivatedThisTurn`.
   */
  abilitiesUsedThisTurn?: number[];
  /** True once this permanent has been declared as an attacker this turn —
   * the "attacked this turn" half of Boast (rule 702.135). Reset in the
   * controller's untap step. */
  attackedThisTurn?: boolean;
  /**
   * Players who have goaded this creature (rule 701.38). While non-empty it
   * "attacks each combat if able and attacks a player other than [the
   * goader] if able".
   *
   * Cleared for a given goader as *their* next turn begins, which is exactly
   * how long the goad lasts. A creature can be goaded by several players at
   * once, hence a list.
   */
  goadedBy?: PlayerId[];
  /** This creature must attack this specific player if able — Encore's
   * "create a token copy that attacks that opponent this turn if able". */
  mustAttackPlayer?: PlayerId;
  /** The counters this object had the last time it was on the battlefield,
   * snapshotted by `moveObject` before it clears them. Last-known information
   * (rule 603.10) for a question that can only be asked after the permanent
   * has left — Undying's "if it had no +1/+1 counters on it". */
  lastKnownCounters?: Record<string, number>;
  /**
   * Who controlled this permanent as it left the battlefield — last-known
   * information (rule 603.10a) for a leaves-the-battlefield trigger, which
   * has to be matched after `moveObject` has already handed the card back to
   * its owner (rule 110.2). "Whenever a creature **you control** dies" asks
   * about the thief's creature, not the owner's, and the ability of a stolen
   * Blood Artist that dies is the thief's.
   *
   * Set by the move that took it off the battlefield and cleared by every
   * other move, so it is only ever present on an object whose last move was
   * that one.
   */
  lastKnownController?: PlayerId;
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
     */
    expiry:
      | { readonly kind: "end-of-turn"; readonly turn: number }
      | { kind: "your-turns"; remaining: number }
      | { readonly kind: "while-source"; readonly source: ObjectId };
    readonly castOnly?: boolean;
    /** Extra gates on *using* the permission, as opposed to when it lapses —
     * Theater of Horrors' "**During your turn, if an opponent lost life this
     * turn**, you may play …". Evaluated live, so the cards become playable
     * and unplayable again as the condition changes. */
    readonly yourTurnOnly?: boolean;
    readonly gate?: StaticCondition;
  };
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
  /** True when a temporary control-change effect (Act of Treason) controls this
   * permanent — cleanup reverts `controller` to `owner`. Cleared by
   * `moveObject` on any zone change. */
  controlEndsAtCleanup: boolean;
  /**
   * A *permanent* control change from an effect rather than an Aura — "put it
   * onto the battlefield under your control" (Gravespawn Sovereign), or a
   * `gain-control` with `untilEndOfTurn: false`.
   *
   * Needed because layer 2 recomputes control on every state-based-action
   * pass and reverts to the owner unless something still says otherwise; an
   * Aura says so by staying attached, and this is how an effect says so.
   * Cleared by `moveObject` with every other per-permanent flag.
   */
  controlledByEffect?: PlayerId;
  /** The name of the card this permanent is currently a *copy* of (rule 707 /
   * layer 1), or `null` when it is just itself. Every characteristic read —
   * P/T, types, abilities, the client's card face — resolves through
   * `printedCardName`, which returns this when set. Cleared on any zone change
   * (a Clone that dies and returns is a Clone again). */
  copyOf: string | null;
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
   * the stack object and preserved onto the permanent it becomes, so an
   * "enters with X counters"-style effect can still read it. `null` when the
   * cost had no `{X}`. Cleared by `moveObject` on any later zone change. */
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
  /** This spell was kicked as it was cast (rule 702.33 — needed-cards P8): its
   * kicker cost was paid, so `resolveTopOfStack` applies the kicked `effect`.
   * Absent for an unkicked or unkickable spell; cleared on any zone change. */
  kicked?: boolean;
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
   * `untilEndOfTurn`) in cleanup. */
  grantedFlashback?: { cost: string; untilEndOfTurn: boolean } | null;
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
   * end step (Encore — rule 702.140). Distinct from `exileAtEndStep`: a
   * sacrifice sees dies-triggers, an exile doesn't. */
  sacrificeAtEndStep?: boolean;
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
  /** `"card"` for a real card/token; `"ability"` for an ability on the stack. */
  kind: "card" | "ability";
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
  /** A card's mana value as it last existed on the stack, {X} included (rule
   * 202.3e), set each time it leaves the stack. Read only through a target
   * that was a spell — see `targetZones` — so it needn't be cleared when the
   * card moves on (a countered spell exiled from the graveyard was still
   * that spell). */
  lastStackManaValue?: number;
  /** How much mana was actually spent to cast this spell — the `{ manaSpentOf }`
   * amount and the `manaSpent` filter clause (Prossh; The Emperor of
   * Palamecia's "if at least four mana was spent to cast it"). Set as it's
   * cast (0 for a free cast), kept by the permanent it resolves into, and
   * cleared by any other zone change. */
  manaSpent?: number;
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
  /** For an activated ability whose source stays in a non-battlefield zone
   * while it's on the stack (`ActivatedAbility.zone: "command"`, or
   * `staysInZone`): the source's `zoneChangeCount` as it was activated. If
   * the source has moved since, it is a new object (rule 400.7) and the
   * ability's `"source"` names nothing. */
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
  /** Temporary modifiers (P/T and/or granted keywords). `untilEndOfTurn` ones expire in cleanup. */
  modifiers: PtModifier[];
  /** Order this object entered the battlefield (rule 613.7 timestamp); 0 if never. */
  timestamp: number;
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
   * permanent — the overwhelmingly common case, entirely unaffected.
   */
  stackCount?: number;
  /** True for a copy of a spell on the stack (rule 707.10 — storm, Twincast).
   * `cardName` is the copied spell's name; the copy ceases to exist instead of
   * moving to any zone other than the stack. ROADMAP Phase 8. */
  isCopy?: boolean;
  /** Spells (by any player) cast this turn *before* this spell — captured when
   * it's cast, read by a `storm` effect on it (rule 702.40a). ROADMAP Phase 8. */
  stormCount?: number;
  /** The permanent this Aura/Equipment is attached to, or `null`. */
  attachedTo: ObjectId | null;
  /**
   * True for a player's designated commander (intrinsic, like `isToken` —
   * never reset by `moveObject`). Lets it be cast from the command zone
   * (rule 903.4, with tax) and redirects it back to the command zone
   * instead of hand/library/graveyard/exile (rule 903.9a, "commander
   * replacement" — applied automatically here, with no opt-out).
   */
  isCommander: boolean;
}

export interface PtModifier {
  power: number;
  toughness: number;
  keywords: Keyword[];
  /** Layer 4 — card types this modifier adds (a man-land's "becomes a …
   * creature. It's still a land." keeps the printed types and adds these). */
  addTypes?: CardType[];
  /** Layer 4 — subtypes this modifier adds (e.g. `["Blinkmoth"]`). */
  addSubtypes?: string[];
  /** Layer 4 — subtypes this modifier *replaces* the printed ones with (Turn
   * to Frog: "becomes a … Frog"). Applied before `addSubtypes`. */
  setSubtypes?: string[];
  /** Layer 3 — a text-changing effect (Artificial Evolution): every instance
   * of the creature-type word `from` reads as `to`, in this permanent's own
   * subtypes *and* in its static abilities' `subtype` clause. */
  textSubstitution?: { from: string; to: string };
  /** Layer 5 — colours this modifier adds ("becomes red in addition to its
   * other colours"). */
  addColors?: Color[];
  /** Layer 5 — colours this modifier *sets* (Turn to Frog: "becomes … blue").
   * Applied before `addColors`; the latest such modifier wins. */
  setColors?: Color[];
  /** Layer 6 — this permanent loses all of its own abilities (Turn to Frog).
   * External anthems / grants still apply to it; its own keywords / activated
   * / triggered / static abilities stop functioning. */
  loseAbilities?: boolean;
  /** Layer 7b — a "becomes a N/N" that *sets* base P/T rather than adding to
   * it. Applied after a CDA, before counters (7c) and +N/+N bonuses (7d);
   * the latest such modifier wins. */
  setPt?: [number, number];
  /** Layer 6 — triggered abilities this modifier grants, for a one-shot
   * "gains '[trigger]' until end of turn" (Hunter's Prowess, Hunter's
   * Insight). The ongoing, static equivalent is
   * `StaticAbility.grantsTriggered`. */
  grantsTriggered?: TriggeredAbility[];
  untilEndOfTurn: boolean;
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
      readonly list: "activated" | "triggered";
      readonly index: number;
    }
  | { readonly kind: "modifier"; readonly ability: TriggeredAbility };

/** A triggered ability waiting to be put on the stack (rule 603.3). */
export interface PendingTrigger {
  readonly sourceObjectId: ObjectId;
  readonly cardName: string;
  readonly abilityIndex: number;
  readonly controller: PlayerId;
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
  /** See {@link GameObject.stackMultiplier} — how many real firings this one
   * queued trigger represents. `undefined`/`1` outside a scaled resolution. */
  readonly multiplier?: number;
  /** True for a Saga chapter ability (rule 714) — `abilityIndex` indexes
   * `def.chapters` rather than `def.triggered`. ROADMAP Phase 10. */
  readonly chapter?: boolean;
  /** Set when the ability was granted — see {@link GrantedAbilityRef}. */
  readonly grantedAbility?: GrantedAbilityRef;
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
}

export interface PlayerState {
  readonly id: PlayerId;
  life: number;
  /** Mana floating in this player's pool, as individual units rather than a
   * count per colour — a unit may be restricted in what it pays for, may
   * survive the end of a step, or may carry a rider that fires when it's
   * spent, and none of that survives being added up. `poolCounts` gives the
   * totals. Usually empty: the engine auto-pays, so mana is normally made and
   * spent without ever landing here. */
  manaPool: ManaUnit[];
  maxHandSize: number;
  landsPlayedThisTurn: number;
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
  /** The spells this player has cast this turn, in order, for "your first
   * enchantment spell each turn" (Tuvasa): a cast trigger with a `filter`
   * counts first/Nth among the ones that match. Reset in `beginTurn`. */
  spellsCastThisTurnIds?: ObjectId[];
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
  /** This player cast a spell from a graveyard, or activated an ability of a
   * card in a graveyard, this turn (Laboratory Drudge). */
  usedGraveyardThisTurn: boolean;
  /** Energy counters this player has (rule 122 / {E} — ROADMAP Phase 10). A
   * player resource, not tied to any permanent; spent by a `payEnergy` ability
   * cost, gained by a `get-energy` effect. */
  energy: number;
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

export interface TurnState {
  number: number;
  activePlayerIndex: number;
  step: Step;
  /** True when this turn was taken via an extra-turn effect (Time Warp) rather
   * than the normal rotation — ROADMAP Phase 7. */
  isExtra: boolean;
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
    }
  | {
      readonly kind: "choose-from-zone";
      readonly player: PlayerId;
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
       * own shuffle. */
      readonly destination: "battlefield" | "hand" | "exile-playable" | "library-top" | "graveyard";
      /** For `destination: "exile-playable"` — the impulse permission to
       * stamp on the chosen cards, which stay in exile either way
       * (Tectonic Giant: "exile the top two, choose one of them"). */
      readonly impulseGrant?: GameObject["impulse"];
      /** What happens to any candidate not chosen: shuffled to the bottom of
       * the library; left exactly where it already was (nothing was ever
       * moved just to look at it — the graveyard-search case); the whole
       * library is shuffled (a library *search* / tutor — rule 701.19); or
       * put into the chooser's hand (Genesis Ultimatum — needed-cards P19). */
      readonly leftover: "bottom-random" | "stay" | "shuffle" | "hand";
      /** A library-search result that enters the battlefield does so tapped
       * (Rampant Growth). Only meaningful with `destination: "battlefield"`. */
      readonly enterTapped?: boolean;
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
      /** A commander *would* be put into a hidden/graveyard zone from the
       * battlefield; its owner may send it to the command zone instead
       * (rule 903.9a). The move hasn't happened yet — it's still on the
       * battlefield until this is answered. */
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
      /** A Clone-style permanent just entered; its controller chooses what
       * (if anything) it copies (rule 707). */
      readonly kind: "choose-copy";
      readonly player: PlayerId;
      readonly source: ObjectId;
      readonly options: readonly ObjectId[];
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
      readonly then?: EffectSpec;
      readonly targets?: ResolvedTargets;
      readonly x?: number;
    }
  | {
      /** A text-changing spell is resolving (Artificial Evolution); its
       * controller picks which creature-type word to replace, and with what
       * (rule 612 / layer 3). */
      readonly kind: "choose-text";
      readonly player: PlayerId;
      readonly source: ObjectId;
      readonly target: ObjectId;
      /** The target's current creature subtypes — the word to replace. */
      readonly fromOptions: readonly string[];
      /** The creature types the new word may be. */
      readonly toOptions: readonly string[];
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
      /** A modal spell/ability is resolving (rule 700.2), or a "you may"
       * clause (rule 601.3e). The controller picks between `minModes` and
       * `maxModes` distinct modes; their effects apply after. */
      readonly kind: "choose-modes";
      readonly player: PlayerId;
      /** The permanent (for an ability) or spell object the effect belongs to
       * — used to build the resolution context for the chosen modes. */
      readonly source: ObjectId;
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
  | "your-next-main-phase";

/**
 * A delayed triggered ability (rule 603.7): created by a resolving spell or
 * ability, waiting on one future step, then gone. It isn't an ability *of* any
 * permanent — it exists on its own here, which is exactly why `detectTriggers`
 * (a scan over battlefield permanents) can't see it and `enterStep` fires it
 * directly.
 */
export interface DelayedTrigger {
  readonly id: string;
  /** Who controls it when it fires (rule 603.7d). Usually whoever created it,
   * but not always — Arcane Denial's draw belongs to the countered spell's
   * controller. */
  readonly controller: PlayerId;
  readonly at: DelayedTriggerTiming;
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
   * new targets (rule 603.7d), so these are fixed here and `effect` refers to
   * them by slot index exactly like any other effect.
   */
  readonly targets: ResolvedTargets;
  /** Where those targets were when the creating spell or ability targeted
   * them — see `GameObject.targetZones`. */
  readonly targetZones?: readonly (ZoneType | null)[];
  readonly effect: EffectSpec;
  readonly text: string;
}

/** The zones a commander can be moved to that offer the 903.9a choice. */
export type CommanderReplacementZone = "graveyard" | "exile" | "hand" | "library";
/** Where a commander waits while its 903.9 choice is pending, other than the
 * battlefield (see `GameState.deferredCommanderMove`). */
export type CommanderMoveOrigin = "stack" | "graveyard" | "exile";

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


/** A one-shot damage-prevention shield (Healing Salve — ROADMAP Phase 11 EG-6). */
export interface PreventionShield {
  /** The player or object it protects. */
  readonly target: TargetRef;
  /** Damage still to absorb (shrinks as hits are prevented; removed at 0). */
  amount: number;
  /** Only prevents combat damage. */
  readonly combatOnly: boolean;
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
}

/** An emblem (rule 114 — ROADMAP Phase 10): a player-owned object carrying one
 * ability, with no zone and no way to be removed. Currently only a
 * `"creatures-you-control"` anthem `static` is modeled (the common
 * planeswalker-ultimate emblem) — folded in by the layer system. `text` is for
 * the log / client. */
export interface EmblemState {
  readonly id: string;
  readonly owner: PlayerId;
  readonly text: string;
  /** Timestamp (rule 613.7) for ordering this emblem's anthem among others. */
  readonly timestamp: number;
  readonly static: StaticAbility | null;
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
    )[];
    /** See {@link PendingTrigger.triggerValue}. */
    readonly triggerValue?: number;
    /** See {@link PendingTrigger.triggerObject}. */
    readonly triggerObject?: ObjectId;
    /** See {@link PendingTrigger.grantedAbility}. */
    readonly grantedAbility?: GrantedAbilityRef;
  } | null;
  /**
   * A suspended spell coming off suspend, parked while its controller chooses
   * targets (ROADMAP Phase 11 EG-1). `applyChooseTargets` commits the free cast.
   */
  pendingTargetedCast:
    | { readonly cardId: ObjectId; readonly via: CastVia; readonly grantHaste: boolean }
    | null;
  /** Suspended cards still to be free-cast this upkeep, after one of them
   * paused on a `choose-targets` decision. Drained by `applyChooseTargets`. */
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
   * A commander that is *about to* be put into a hidden zone from the
   * battlefield and whose owner is being asked whether to send it to the
   * command zone instead (rule 903.9a — a replacement effect). `moveObject`
   * has NOT moved the commander yet, so a "dies" trigger never sees it in the
   * graveyard. `applyCommanderChoice` completes the move. `null` when no such
   * choice is pending.
   *
   * The `commander-replacement` decision is normally on `awaiting` while this
   * is set, but not always: a later step of the same resolution can raise a
   * decision of its own over it (Path to Exile's "may search"). The question
   * is asked again once that one is answered — `raiseNextCommanderChoice`.
   */
  deferredCommanderMove: {
    readonly commander: ObjectId;
    /** Where it would have gone had 903.9a not applied. */
    readonly intendedZone: CommanderReplacementZone;
    /** The O-Ring (Banishing Light) exiling it "until this leaves", whose link
     * `applyCommanderChoice` sets if the card does go to exile. */
    readonly exiledBy?: ObjectId;
    /** The permanents that left the battlefield in the same simultaneous
     * event as this commander's deferred move (a wrath, one state-based
     * sweep). Its move is carried out later, once its owner answers, but it
     * still happened at the same time as theirs, so their leaves-the-
     * battlefield abilities look back at it and it at them (rule 603.10a).
     * See `Game.withLeaveBatch`. */
    readonly leftWith?: readonly ObjectId[];
    /** Where it waits meanwhile — the battlefield when absent. A commander
     * put into its owner's hand *from anywhere* is asked too (rule 903.9b):
     * a spell countered into its owner's hand (Remand) or returned there
     * from the stack (Unsubstantiate), or a card from a graveyard or exile,
     * each of which waits where it is. */
    readonly from?: CommanderMoveOrigin;
  } | null;
  /**
   * Commanders that tried to leave the battlefield while their owner's 903.9a
   * choice couldn't be asked yet — another decision was on `awaiting`, or
   * another commander's choice was already being asked. Each stays on the
   * battlefield, exactly like the one on `deferredCommanderMove`, until
   * `prepareForPriority` asks about it in turn.
   *
   * Without this the move went ahead unasked: an overloaded Cyclonic Rift
   * asked about the first opponent's commander and bounced the rest silently.
   */
  pendingCommanderMoves: {
    readonly commander: ObjectId;
    readonly intendedZone: CommanderReplacementZone;
    readonly exiledBy?: ObjectId;
    readonly leftWith?: readonly ObjectId[];
    readonly from?: CommanderMoveOrigin;
  }[];
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
   * "Blinks" (the `flicker` effect) whose exile half raised a commander's
   * 903.9a choice, parked until that choice is answered — without this the
   * whole effect was abandoned there, and a flickered commander whose owner
   * declined the command zone stayed in exile forever. One entry per
   * commander: a flicker of several targets can defer more than one.
   *
   * `applyCommanderChoice` completes each: the card is returned (or, for a
   * delayed return, given its `flickerLink`) only if the choice actually left
   * it in exile.
   */
  pendingFlickerReturns: {
    readonly object: ObjectId;
    /** Counters the returning permanent gets — the `flicker` effect's
     * `thenCounters`, carried across the pause. */
    readonly counters?: FlickerCounters;
    /** Who it returns under, when that isn't its owner (`underYourControl`). */
    readonly returnUnder?: PlayerId;
    /** A delayed return's link — the card is marked, not returned. */
    readonly link?: string;
  }[];
  /** True while a Fog-style effect has prevented all combat damage this turn
   * (rule 614 replacement, but turn-scoped with no permanent to hang it on).
   * Set by the `prevent-all-combat-damage` effect, cleared at the start of the
   * next turn. */
  preventAllCombatDamage: boolean;
  /**
   * Players with hexproof until end of turn (Lazotep Plating: "**You** and
   * permanents you control gain hexproof"). Turn-scoped rather than a
   * per-player flag for the same reason `preventAllCombatDamage` is: there's
   * no permanent to hang it on. Cleared as each turn begins.
   */
  hexproofPlayers: PlayerId[];
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
 * its own. Every `registry.get` for an object's characteristics/abilities
 * should go through this. */
export const printedCardName = (object: GameObject): string =>
  object.copyOf ?? faceName(object);

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

export const currentPhaseOf = (state: GameState): Phase =>
  phaseOfStep(state.turn.step);

export const privateZone = (
  state: GameState,
  player: PlayerId,
  zone: PrivateZone,
): readonly ObjectId[] => state.zones.perPlayer[player][zone];

export const battlefieldOf = (state: GameState): readonly ObjectId[] =>
  state.zones.shared.battlefield;

export const resolveObjects = (
  state: GameState,
  ids: readonly ObjectId[],
): GameObject[] => ids.map((id) => state.objects[id]);
