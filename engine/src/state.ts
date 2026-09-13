/**
 * The game state tree and pure selectors over it.
 *
 * `GameState` is a plain, structurally-cloneable object: no class instances,
 * functions, `Map`s, or `Set`s. The {@link Game} class owns the single mutable
 * instance and is the only thing that writes to it; everything else reads.
 */

import type { CastVia } from "./actions.js";
import type { CardType, Keyword, StaticAbility } from "./cards.js";
import type { EffectSpec } from "./effects.js";
import type { CardFilter } from "./filter.js";
import type { Color, ManaPool } from "./mana.js";
import { emptyPool } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameEvent } from "./events.js";
import type { TargetRef, TargetSpec } from "./target.js";
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
  /** True once dealt damage by a deathtouch source this turn (rule 704.5h). Cleared with `damageMarked`. */
  markedByDeathtouch: boolean;
  /** Turn number this object last entered the battlefield; `null` otherwise. */
  enteredBattlefieldOnTurn: number | null;
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
  /** Chosen targets while this is a spell/ability on the stack; `null` otherwise. */
  targets: TargetRef[] | null;
  /** True when a temporary control-change effect (Act of Treason) controls this
   * permanent — cleanup reverts `controller` to `owner`. Cleared by
   * `moveObject` on any zone change. */
  controlEndsAtCleanup: boolean;
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
  untilEndOfTurn: boolean;
}

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
}

export interface PlayerState {
  readonly id: PlayerId;
  life: number;
  manaPool: ManaPool;
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
  /** Cumulative combat damage taken from each opponent's commander since the
   * game began, keyed by that commander's controller. 21+ from the same
   * commander is a loss (rule 903.10a / SBA 704.5m). */
  commanderDamageTaken: Record<PlayerId, number>;
  /** Spells *this player* has cast this turn — read by "your first spell each
   * turn" triggers. (Storm counts *all* players' spells — see
   * `GameState.spellsCastThisTurn`.) Reset in `beginTurn`. ROADMAP Phase 8. */
  spellsCastThisTurn: number;
  /** Energy counters this player has (rule 122 / {E} — ROADMAP Phase 10). A
   * player resource, not tied to any permanent; spent by a `payEnergy` ability
   * cost, gained by a `get-energy` effect. */
  energy: number;
}

export interface GameRules {
  startingLife: number;
  openingHandSize: number;
  maxHandSize: number;
  maxLandsPerTurn: number;
  /** In a two-player game the player who goes first skips their first draw. */
  skipFirstDraw: boolean;
}

export const DEFAULT_RULES: GameRules = {
  startingLife: 20,
  openingHandSize: 7,
  maxHandSize: 7,
  maxLandsPerTurn: 1,
  skipFirstDraw: true,
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
      readonly kind: "order-blockers";
      readonly player: PlayerId;
      /** The attacker whose blockers are being ordered for damage assignment. */
      readonly attacker: ObjectId;
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
      readonly destination: "battlefield" | "hand";
      /** What happens to any candidate not chosen: shuffled to the bottom of
       * the library; left exactly where it already was (nothing was ever
       * moved just to look at it — the graveyard-search case); the whole
       * library is shuffled (a library *search* / tutor — rule 701.19); or
       * put into the chooser's hand (Genesis Ultimatum — needed-cards P19). */
      readonly leftover: "bottom-random" | "stay" | "shuffle" | "hand";
      /** A library-search result that enters the battlefield does so tapped
       * (Rampant Growth). Only meaningful with `destination: "battlefield"`. */
      readonly enterTapped?: boolean;
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
      /** "As this enters, choose a creature type" (Urza's Incubator — needed-cards
       * P14). `source`'s `chosenCreatureType` is set once answered; a
       * `CardDefinition.costModification` reads it back. */
      readonly kind: "choose-creature-type";
      readonly player: PlayerId;
      readonly source: ObjectId;
      readonly options: readonly string[];
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
      /** A `may` effect's `else` — applied instead when zero modes are
       * chosen. `undefined` for an ordinary `modal` effect (declining a
       * modal spell/ability entirely isn't a legal answer, so it never
       * reaches zero chosen). needed-cards P19. */
      readonly onDecline?: EffectSpec;
      /** The enclosing ability's own already-chosen targets, forwarded to the
       * modes (and to `onDecline`) — a `may`/`modal` effect doesn't choose
       * new targets itself, so a mode referencing `target: 0` means "the
       * ability's own target 0" (Ob Nixilis, the Fallen: "you may have
       * *target player* lose 3 life"). Empty for the ordinary case where
       * nothing outside the modal choice was targeted. needed-cards P19. */
      readonly targets: readonly TargetRef[];
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
      /** Lethal-damage threshold per blocker (toughness − damage already
       * marked, or 1 for a deathtouch source): each must get at least this
       * before a later blocker or the defender is assigned any. */
      readonly lethal: readonly number[];
      readonly trample: boolean;
    };

/** The zones a commander can be moved to that offer the 903.9a choice. */
export type CommanderReplacementZone = "graveyard" | "exile" | "hand" | "library";

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
  /** A declaration the engine is waiting for, or `null`. */
  awaiting: AwaitingDecision | null;
  /**
   * Attackers with multiple blockers still awaiting a damage-assignment order
   * from the attacking player. Drained one `order-blockers` action at a time.
   */
  pendingBlockerOrders: ObjectId[];
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
   * destroy, one at a time — so a commander's 903.9a choice mid-wipe can pause
   * and resume without dropping the rest. Drained by `drainPendingDestruction`
   * inside the `prepareForPriority` fixpoint.
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
  }[];
  /**
   * Specific permanents (chosen, or auto-selected when there was no choice)
   * still to be moved to the graveyard as a sacrifice — drained one at a time
   * so a commander's 903.9a choice can pause it.
   */
  pendingSacrificeVictims: { readonly player: PlayerId; readonly object: ObjectId }[];
  /**
   * A commander that is *about to* be put into a hidden zone from the
   * battlefield and whose owner is being asked whether to send it to the
   * command zone instead (rule 903.9a — a replacement effect). While this is
   * set the corresponding `commander-replacement` decision is on
   * `awaiting`; `moveObject` has NOT moved the commander yet, so a "dies"
   * trigger never sees it in the graveyard. `applyCommanderChoice` completes
   * the move. `null` when no such choice is pending.
   */
  deferredCommanderMove: {
    readonly commander: ObjectId;
    /** Where it would have gone had 903.9a not applied. */
    readonly intendedZone: CommanderReplacementZone;
  } | null;
  /** True while a Fog-style effect has prevented all combat damage this turn
   * (rule 614 replacement, but turn-scoped with no permanent to hang it on).
   * Set by the `prevent-all-combat-damage` effect, cleared at the start of the
   * next turn. */
  preventAllCombatDamage: boolean;
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
    manaPool: emptyPool(),
    maxHandSize: rules.maxHandSize,
    landsPlayedThisTurn: 0,
    hasLost: false,
    lossReason: null,
    attemptedDrawFromEmptyLibrary: false,
    commanderCastCounts: {},
    commanderDamageTaken: {},
    spellsCastThisTurn: 0,
    energy: 0,
  };
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
