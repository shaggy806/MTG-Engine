/**
 * The game driver. Owns the single mutable {@link GameState}, advances the turn
 * structure, runs state-based actions, and appends to the event log.
 *
 * Milestone 2 scope: the stack and casting. Play lands (a special action),
 * cast creature/instant spells with auto-paid mana costs, choose targets,
 * resolve the stack LIFO, fizzle spells whose targets have all become illegal,
 * and destroy creatures with lethal damage or non-positive toughness. No combat.
 */

import { isManaAbility } from "./abilities.js";
import type {
  ActivatedAbility,
  CostReductionAmount,
  SacrificeCost,
  StackAbility,
  TriggeredAbility,
  TriggerSpec,
  TriggerWho,
} from "./abilities.js";
import { actionPlayer } from "./actions.js";
import type {
  Action,
  AttackerDeclaration,
  BlockerDeclaration,
  CastVia,
  ConvokePayment,
  GraveyardGrant,
  LegalAction,
  TapCostOffer,
} from "./actions.js";
import {
  autoAssignForAttacker,
  lethalFor,
  liveBlockersOf,
  needsDamageAssignmentChoice,
} from "./combat/damage.js";
import {
  creatureDef,
  currentAttackers,
  defendingPlayerOf,
  hasSummoningSickness,
  isPlaneswalkerTarget,
  legalDefenders,
  whyCannotAttack,
  whyCannotBlock,
} from "./combat/eligibility.js";
import { CardRegistry, createDefaultRegistry } from "./cards.js";
import type {
  AdditionalCostOption,
  CardDefinition,
  CardType,
  CombatRestriction,
  Keyword,
  StaticAbility,
  StaticCondition,
} from "./cards.js";
import {
  assignedCombatDamage,
  computeCharacteristics,
  computedCacheMemo,
  objHasKeyword,
  restrictionsOf,
  effectiveSubtypes,
  effectiveTypes,
  hasLostAbilities,
  invalidateComputedCache,
  staticConditionMet,
  staticReaches,
  suspendComputedCache,
  turnStatOf,
  withComputedCache,
} from "./characteristics.js";
import type { Characteristics } from "./characteristics.js";
import { AutomaticController } from "./controller.js";
import type { ControllerView, PlayerController } from "./controller.js";
import type { DecisionHost, DecisionReadCtx } from "./decisions/contract.js";
import { decisionFor, decisionForAction, mayActOn } from "./decisions/registry.js";
import { assignCombatDamage } from "./decisions/assign-combat-damage.js";
import { attackers } from "./decisions/attackers.js";
import { chooseTargets } from "./decisions/choose-targets.js";
import { blockers } from "./decisions/blockers.js";
import { chooseCopy } from "./decisions/choose-copy.js";
import { mulligan } from "./decisions/mulligan.js";
import { mulliganCardsOwed } from "./decisions/shared/mulligan-math.js";
import { commanderReplacement } from "./decisions/commander-replacement.js";
import { discard } from "./decisions/discard.js";
import { sacrifice } from "./decisions/sacrifice.js";
import { chooseFromZone } from "./decisions/choose-from-zone.js";
import { chooseModes } from "./decisions/choose-modes.js";
import { chooseCreatureType } from "./decisions/choose-creature-type.js";
import { proliferate } from "./decisions/proliferate.js";
import { CHANGEABLE_CREATURE_TYPES, chooseText } from "./decisions/choose-text.js";
import { payLifeForUntapped } from "./decisions/pay-life-for-untapped.js";
import { scry } from "./decisions/scry.js";
import { CREATURE_TYPES } from "./creature-types.js";
import {
  amountValue,
  applyEffectSpec,
  isCountScalableEffect,
  substituteChosenCreatureType,
  wardCostText,
} from "./effects.js";
import type {
  EffectAmount,
  EffectSpec,
  FlickerCounters,
  FlickerOptions,
  UnlessOption,
  WardCost,
  ModeOption,
  PlayerScope,
  PtDuration,
  ResolutionContext,
  ReturnToHandZone,
  ZoneChoiceFilter,
} from "./effects.js";
import {
  aggregateOver,
  attachmentsOf,
  matchesFilter,
  printedManaCost,
  weightedMatches,
} from "./filter.js";
import type { AggregateSpec, CardFilter } from "./filter.js";
import type {
  EventOfType,
  GameEvent,
  GameEventInput,
  GameEventType,
} from "./events.js";
import {
  COLORS,
  MANA_TYPES,
  cheapestManaAmount,
  coloredReductionOf,
  manaValue,
  parseManaCost,
  reduceManaCost,
} from "./mana.js";
import type {
  Color,
  ColoredReduction,
  ManaCost,
  ManaRestriction,
  ManaSpendRider,
  ManaType,
  ManaUnit,
} from "./mana.js";
import { manaCombinations, planPayment, standaloneManaChoices } from "./mana-payment.js";
import type {
  ManaOption,
  ManaPayment,
  ManaPlanStep,
  ManaPlanningView,
  ManaPurpose,
  ManaSource,
} from "./mana-payment.js";
import type { ObjectId, PlayerId, Rng } from "./primitives.js";
import { asObjectId, createRng, shuffle } from "./primitives.js";
import {
  DEFAULT_RULES,
  POISON_LETHAL,
  activePlayerOf,
  cloneGameState,
  createPlayerState,
  permanentCount,
  printedCardName,
} from "./state.js";
import type {
  AwaitingDecision,
  CombatDamageState,
  CommanderMoveOrigin,
  CommanderReplacementZone,
  DelayedTrigger,
  DelayedTriggerTiming,
  GameObject,
  GameRules,
  GameState,
  GrantedAbilityRef,
  LastKnownInfo,
  LastKnownRefs,
  MulliganHandState,
  PendingTrigger,
  PlayerCounterKind,
  PreventionShield,
  ReflexiveTrigger,
  PtModifier,
  TargetedBy,
  ZoneType,
} from "./state.js";
import { describeTargetSpec, isOptionalSpec, normalizeTargets, otherThan } from "./target.js";
import { distinctTargetCount, targetCountBounds } from "./target-count.js";
import type { TargetCopies, TargetCountRange } from "./target-count.js";
import type { ResolvedTargets, TargetRef, TargetSpec } from "./target.js";
import {
  cardSource,
  invalidTargetReason,
  isLegalTarget,
  legalTargets,
  permanentSource,
  protectionBlocks,
} from "./targeting.js";
import type { TargetSource } from "./targeting.js";
import { PHASE_OF_STEP, isMainPhase, nextStep, stepUsesPriority } from "./turn.js";
import type { Step } from "./turn.js";
import { COMMANDER_DAMAGE_LETHAL, viewFor } from "./view.js";
import type { PlayerView, ViewOptions } from "./view.js";

export interface DeckList {
  readonly player: PlayerId;
  readonly cards: readonly string[];
  /** Name of a card to start in the command zone instead of the library
   * (rule 903.4). Not one of `cards` — an extra card on top of the deck. */
  readonly commander?: string;
  /** One or two commanders (Partner / "Choose a Background" — rule 702.124 /
   * ROADMAP Phase 9). Takes precedence over `commander` when set. */
  readonly commanders?: readonly string[];
  /**
   * Which printing this player's copy of each card is, keyed by card name —
   * a Scryfall reference in any of the shapes {@link CardDefinition.art}
   * accepts (a bare card UUID is what the deck builder stores). Entirely
   * cosmetic; the rules engine never reads it, it's carried through to
   * `viewFor` so every device in the room draws the card its owner brought
   * rather than the pool's default illustration. A name with no entry falls
   * back to the definition's own `art`.
   */
  readonly printings?: Readonly<Record<string, string>>;
}

export interface GameConfig {
  /** Exactly two decks. Seating order follows array order. */
  readonly decks: readonly DeckList[];
  readonly seed?: number;
  /** Defaults to the first player in `decks`. */
  readonly startingPlayer?: PlayerId;
  /** Shuffle libraries at setup (default true). Set false for scripted setups. */
  readonly shuffle?: boolean;
  /**
   * Ask each player (in turn order) whether to mulligan before turn 1
   * begins (default false — every existing caller keeps today's behavior
   * of `Game.create` landing straight on turn 1's untap step). When true,
   * `setup` stops with `state.awaiting: {kind: "mulligan", ...}` instead of
   * calling `beginTurn` directly, exactly like any other mid-game awaiting
   * decision — so a live driver (the client) can offer a real choice
   * instead of it being silently auto-resolved by whatever controller
   * happens to be attached.
   */
  readonly mulligans?: boolean;
  readonly registry?: CardRegistry;
  readonly controllers?: Partial<Record<PlayerId, PlayerController>>;
  readonly rules?: Partial<GameRules>;
}

export interface SnapshotEnv {
  readonly registry?: CardRegistry;
  readonly controllers?: Partial<Record<PlayerId, PlayerController>>;
}

const ADVANCE_BUDGET = 200_000;
const GENERIC_SPEND_ORDER = ["C", "W", "U", "B", "R", "G"] as const;

/** One battlefield static that grants activated abilities (Chromatic Lantern,
 * Cryptolith Rite) — see `Game.activatedGrantSources`. `abilities` is
 * `ability.grantsActivated`, pulled out so it's known to be defined. */
interface GrantSource {
  readonly source: GameObject;
  readonly ability: StaticAbility;
  /** `ability`'s index in the source's printed `static` list. */
  readonly staticIndex: number;
  readonly abilities: readonly ActivatedAbility[];
}

/** The `grantsTriggered` counterpart of {@link GrantSource}. */
interface TriggeredGrantSource {
  readonly source: GameObject;
  readonly ability: StaticAbility;
  readonly staticIndex: number;
  readonly abilities: readonly TriggeredAbility[];
}

/** Combat damage from the same commander at or above this total is a loss (rule 903.10a). */
const COMMANDER_DAMAGE_THRESHOLD = COMMANDER_DAMAGE_LETHAL;


/** How many suggested creature types a catalog choice offers up front. */

/** Shared empty result for `effectiveTriggeredEntries`' common no-triggers
 * case, so the per-event battlefield scan allocates nothing for a plain land
 * or vanilla creature. */
const EMPTY_TRIGGERED_ENTRIES: readonly {
  readonly ability: TriggeredAbility;
  readonly ref?: GrantedAbilityRef;
}[] = [];

const EMPTY_ID_SET: ReadonlySet<ObjectId> = new Set();

/** How the effect moving a permanent onto the battlefield says it enters —
 * read by the enters-battlefield replacements (rule 614.1c) as it does,
 * rather than applied after the move, so a replacement can still override
 * it (The Wandering Minstrel's "lands you control enter untapped" beats a
 * "put it onto the battlefield tapped"). */
interface EnterOptions {
  /** "…onto the battlefield tapped". */
  readonly tapped?: boolean;
  /** "…under your control", when that isn't its owner. */
  readonly under?: PlayerId;
}

/** Everything the enters-battlefield replacements decided about one entry
 * (see `Game.entersBattlefieldReplacement`). */
interface EnteringReplacement {
  readonly tapped: boolean;
  readonly transformed: boolean;
  readonly counters: readonly { readonly kind: string; readonly amount: number }[];
  readonly painIfUntapped: number;
  readonly mayPayLife: number;
}

/**
 * What a condition about a spell's or ability's source is asked of once that
 * source has ceased to exist — a token, deleted after it left the
 * battlefield (rule 111.7). Every question about the permanent itself is
 * answered from `lastKnown`, which the caller passes alongside as
 * `ConditionOptions.sourceLastKnown`; the stand-in carries only its id and
 * whose ability is asking ("you"). Its zone is the stack — where the
 * intervening-if recheck's stand-in for the same token, the ability itself,
 * is too — so a `source-zone` condition never finds it somewhere the
 * token could have gone.
 */
const ceasedSourceStandIn = (
  id: ObjectId,
  controller: PlayerId,
  lastKnown: LastKnownInfo,
): GameObject => ({
  id,
  cardName: lastKnown.name,
  owner: lastKnown.owner,
  controller,
  zone: "stack",
  tapped: false,
  damageMarked: 0,
  markedByDeathtouch: false,
  enteredBattlefieldOnTurn: null,
  summoningSick: false,
  loyaltyActivatedThisTurn: false,
  targets: null,
  controlEndsAtCleanup: false,
  copyOf: null,
  xValue: null,
  attacking: null,
  blocking: null,
  blockedBy: [],
  blocked: false,
  kind: "card",
  abilityKind: null,
  sourceObjectId: null,
  abilityIndex: null,
  counters: {},
  modifiers: [],
  timestamp: 0,
  isToken: true,
  attachedTo: null,
  isCommander: false,
  lastKnown,
});

/** The events that announce a permanent leaving the battlefield, whose
 * triggers look back in time (rule 603.10a). */
type LeaveEvent = Extract<
  GameEvent,
  { type: "permanent-left-battlefield" | "permanent-destroyed" | "permanent-sacrificed" }
>;

function isLeaveEvent(event: GameEvent): event is LeaveEvent {
  return (
    event.type === "permanent-left-battlefield" ||
    event.type === "permanent-destroyed" ||
    event.type === "permanent-sacrificed"
  );
}

/** The trigger kinds that are leaves-the-battlefield abilities — the only
 * ones a permanent that has already left can still fire (rule 603.10a). */
const LOOK_BACK_TRIGGERS: ReadonlySet<TriggerSpec["on"]> = new Set<TriggerSpec["on"]>([
  "dies",
  "leaves-battlefield",
  "sacrifice",
]);

/** The modifier that gives a token being created `keywords` until end of
 * turn ("they gain haste until end of turn") — none for no keywords. */
function untilEndOfTurnKeywords(keywords: readonly Keyword[]): PtModifier[] {
  return keywords.length === 0
    ? []
    : [{ power: 0, toughness: 0, keywords: [...keywords], untilEndOfTurn: true }];
}

/** The indices of a trigger's slots the triggering event filled (see
 * `GameObject.autoTargetSlots`). */
function autoSlotsOf(slots: readonly object[]): number[] {
  const out: number[] = [];
  slots.forEach((slot, i) => {
    if ("auto" in slot) out.push(i);
  });
  return out;
}

/**
 * How one payment treats particular mana sources: `withheld` ones are being
 * tapped for another part of the same cost and can't pay (rule 602.2a — no
 * longer untapped); `last` ones are tried only after everything else, so a
 * permanent the player may yet choose to tap for that other part is spared
 * whenever it can be.
 */
/** A convoke payment with its contribution settled — see `resolveConvoke`. */
type PaidConvoke = ConvokePayment & { readonly pays: "generic" | Color };

interface ManaSourceArrangement {
  readonly last?: ReadonlySet<ObjectId>;
  readonly withheld?: ReadonlySet<ObjectId>;
}

function arrangeManaSources(
  sources: readonly ManaSource[],
  { last, withheld }: ManaSourceArrangement,
): ManaSource[] {
  // A withheld permanent is being tapped for something else, which only
  // rules out its `{T}` options — an untapped ability (Vivi Ornitier's
  // "{0}: Add …") never needed it untapped in the first place.
  const kept =
    withheld === undefined
      ? [...sources]
      : sources.flatMap((s) => {
          if (!withheld.has(s.id)) return [s];
          const options = s.options.filter((o) => o.untapped === true);
          return options.length === 0 || s.sacrificeSelf ? [] : [{ ...s, options }];
        });
  if (last === undefined) return kept;
  return [...kept.filter((s) => !last.has(s.id)), ...kept.filter((s) => last.has(s.id))];
}

/** One permission a graveyard card could be played under, with the static
 * that grants it (`null` for the card's own one-shot permission) — see
 * `Game.graveyardGrantsFor`. */
type GraveyardGrantOption = {
  readonly grant: GraveyardGrant;
  readonly permission: NonNullable<StaticAbility["castFromGraveyard"]> | null;
};

export class Game {
  readonly state: GameState;
  private readonly registry: CardRegistry;
  private readonly controllers: Record<PlayerId, PlayerController>;
  private readonly rng: Rng;
  /** The commander whose 903.9a choice `applyCommanderChoice` is carrying out
   * right now — the one move of it `moveObject` must not defer again. Not
   * game state: it only ever spans that one synchronous call. */
  private completingCommanderMove: ObjectId | null = null;
  /** The `sourceTimestamp` of the ability resolving right now, if one is —
   * how a `flicker` of its own source tells the permanent that put the
   * ability on the stack from a new object with the same id (rule 400.7).
   * Not game state: it only spans that ability's resolution. */
  private resolvingSourceTimestamp: number | null = null;

  /** What simultaneous damage owes once it has all been dealt (see {@link
   * withDamageBatch}): lifelink life gain per source, and the "whenever this
   * is dealt damage" triggers, once per permanent however many sources hit
   * it. Not game state: it only ever spans one synchronous call. */
  private damageBatch: {
    readonly lifelink: Map<ObjectId, { controller: PlayerId; amount: number }>;
    readonly dealtDamage: Map<
      string,
      { ability: TriggeredAbility; trigger: PendingTrigger; multiplier: number }
    >;
  } | null = null;

  /** The permanents that have left the battlefield so far in the one
   * simultaneous event being carried out — a wrath, a sweep of state-based
   * actions, an edict every player answers — plus the commanders whose move
   * that event deferred for a 903.9a choice. Their leaves-the-battlefield
   * abilities look back to just before it (rule 603.10a), so each of them
   * sees every other one leave, whichever of them the engine happened to
   * move first. See {@link withLeaveBatch}. Not game state: it only ever
   * spans one synchronous call; a deferred commander carries the list on its
   * own pending move (`leftWith`). */
  private leaveBatch: {
    readonly left: ObjectId[];
    readonly deferred: ObjectId[];
    /** The event's victims as they were before any of them moved — see
     * {@link snapshotLeaving}. */
    readonly snapshots: Map<ObjectId, LastKnownInfo>;
  } | null = null;

  /** The permanents that have entered the battlefield so far in the one
   * simultaneous event being carried out — a batch of tokens, a mass
   * reanimation, a flicker's return, a tutor putting several lands onto the
   * battlefield. None of them is on the battlefield yet as far as another
   * one's entry is concerned: its `others-enter-battlefield` replacements
   * don't apply to the rest, and it isn't one of the permanents "you already
   * control" (rule 614.12 — the Giada / Thalia / Wandering Minstrel rulings).
   * See {@link withEnterBatch}. Not game state: it only ever spans one
   * synchronous call. */
  private enterBatch: Set<ObjectId> | null = null;

  /** The cards that have left a graveyard so far in the one simultaneous
   * move being carried out — a whole graveyard exiled, the cards a choice
   * returned, an escape cost — each with how it was there. Announced as one
   * `cards-left-graveyard` when the move is done. See {@link
   * withGraveyardLeaveBatch}. Not game state: it only ever spans one
   * synchronous call. */
  private graveyardLeaveBatch: Map<ObjectId, LastKnownInfo> | null = null;
  /** While a `cards-left-graveyard` event is being announced, each of its
   * cards as it was in the graveyard — what a `leaves-graveyard` trigger's
   * filter is matched against (rule 603.10a). `null` the rest of the time. */
  private graveyardDepartures: ReadonlyMap<ObjectId, LastKnownInfo> | null = null;

  private constructor(
    state: GameState,
    registry: CardRegistry,
    controllers: Record<PlayerId, PlayerController>,
    rng: Rng,
  ) {
    this.state = state;
    this.registry = registry;
    this.controllers = controllers;
    this.rng = rng;
    // Built here rather than per call: `state` and `registry` are fixed for
    // the life of a `Game`, and `state` is mutated in place rather than
    // replaced, so one object stays current. `decisionHost` binds the very
    // `apply*` methods `dispatch` already called — the interface is that
    // switch transposed, not a new seam.
    this.decisionCtx = {
      state: this.state,
      registry: this.registry,
      maxAffordableAbilityX: (player, cost) => {
        const parsed = parseManaCost(cost);
        return parsed.x === 0
          ? 0
          : this.maxAffordableAbilityX(player, (x) => ({
              ...parsed,
              generic: parsed.generic + parsed.x * x,
              x: 0,
            }));
      },
      pendingTriggerTargetSource: () => {
        const pending = this.state.pendingTargetedTrigger;
        return pending === null ? undefined : this.abilityTargetSource(pending);
      },
    };
    this.decisionHost = {
      applyPayLifeForUntapped: (player, pay) => this.applyPayLifeForUntapped(player, pay),
      applyCopyChoice: (player, copy) => this.applyCopyChoice(player, copy),
      applyTextChoice: (player, from, to) => this.applyTextChoice(player, from, to),
      applyProliferate: (player, chosen) => this.applyProliferate(player, chosen),
      applyCreatureTypeChoice: (player, t) => this.applyCreatureTypeChoice(player, t),
      applyModesChoice: (player, modes, x) => this.applyModesChoice(player, modes, x),
      applyChooseFromZone: (player, chosen) => this.applyChooseFromZone(player, chosen),
      applySacrifice: (player, ps) => this.applySacrifice(player, ps),
      applyDiscard: (player, cards) => this.applyDiscard(player, cards),
      applyCommanderChoice: (player, toCz) => this.applyCommanderChoice(player, toCz),
      applyMulligan: (player, keep) => this.applyMulligan(player, keep),
      applyPutOnBottom: (player, cards) => this.applyPutOnBottom(player, cards),
      applyAssignCombatDamage: (p, a) => this.applyAssignCombatDamage(p, a),
      applyAttackerDeclarations: (p, d) => this.applyAttackerDeclarations(p, d),
      applyBlockerDeclarations: (p, b) => this.applyBlockerDeclarations(p, b),
      applyChooseTargets: (p, t) => this.applyChooseTargets(p, t),
      applyScry: (player, away) => this.applyScry(player, away),
    };
  }

  /** What a decision module may read. See `decisions/contract.ts`. */
  private readonly decisionCtx: DecisionReadCtx;

  /** What a decision module may do — `Game`'s own `apply*` methods, bound. */
  private readonly decisionHost: DecisionHost;

  static create(config: GameConfig): Game {
    if (config.decks.length < 2 || config.decks.length > 4) {
      throw new Error("Game.create currently supports two to four players");
    }
    const turnOrder = config.decks.map((deck) => deck.player);
    if (new Set(turnOrder).size !== turnOrder.length) {
      throw new Error("duplicate player id in decks");
    }
    const rules: GameRules = { ...DEFAULT_RULES, ...config.rules };
    const startingPlayer = config.startingPlayer ?? turnOrder[0];
    if (!turnOrder.includes(startingPlayer)) {
      throw new Error("startingPlayer is not one of the players");
    }
    const seed = config.seed ?? 0x9e3779b9;
    const rng = createRng(seed);
    const registry = config.registry ?? createDefaultRegistry();

    const controllers: Record<PlayerId, PlayerController> = {};
    for (const player of turnOrder) {
      controllers[player] =
        config.controllers?.[player] ?? new AutomaticController(player);
    }

    const state: GameState = {
      seed,
      rngState: rng.seed,
      rules,
      turnOrder,
      startingPlayer,
      players: {},
      objects: {},
      zones: {
        perPlayer: {},
        shared: { battlefield: [], stack: [], exile: [], command: [] },
      },
      turn: {
        number: 0,
        activePlayerIndex: turnOrder.indexOf(startingPlayer),
        step: "untap",
        isExtra: false,
      },
      priority: { active: false, holder: null, passed: [] },
      result: { over: false, winner: null, reason: null },
      awaiting: null,
      revealedThisTurn: [],
      decisionSource: null,
      delayedTriggers: [],
      pendingBlockerDeclarations: [],
      pendingTriggers: [],
      pendingTargetedTrigger: null,
      pendingTargetedCast: null,
      pendingSuspendedCasts: [],
      deferredCommanderMove: null,
      pendingCommanderMoves: [],
      pendingPayLifeForUntapped: [],
      pendingFlickerReturns: [],
      pendingDestruction: [],
      pendingDiscards: [],
      pendingSacrifices: [],
      pendingSacrificeVictims: [],
      suspendedResolutions: [],
      preventAllCombatDamage: false,
      hexproofPlayers: [],
      creaturesDiedThisTurn: 0,
      preventionShields: [],
      extraTurns: [],
      extraCombats: 0,
      spellsCastThisTurn: 0,
      dayNight: null,
      monarch: null,
      emblems: [],
      combatDamage: null,
      timestampSeq: 0,
      eventLog: [],
      eventSeq: 0,
      nextObjectSeq: 0,
    };

    const game = new Game(state, registry, controllers, rng);
    game.setup(config.decks, config.shuffle ?? true, config.mulligans ?? false);
    return game;
  }

  static fromSnapshot(snapshot: GameState, env: SnapshotEnv = {}): Game {
    const state = cloneGameState(snapshot);
    const registry = env.registry ?? createDefaultRegistry();
    const controllers: Record<PlayerId, PlayerController> = {};
    for (const player of state.turnOrder) {
      controllers[player] =
        env.controllers?.[player] ?? new AutomaticController(player);
    }
    return new Game(state, registry, controllers, createRng(state.rngState));
  }

  // --- read-only accessors ----------------------------------------------

  get events(): readonly GameEvent[] {
    return this.state.eventLog;
  }

  get activePlayer(): PlayerId {
    return activePlayerOf(this.state);
  }

  get isOver(): boolean {
    return this.state.result.over;
  }

  get winner(): PlayerId | null {
    return this.state.result.winner;
  }

  eventsOfType<K extends GameEventType>(type: K): EventOfType<K>[] {
    return this.state.eventLog.filter(
      (event): event is EventOfType<K> => event.type === type,
    );
  }

  handOf(player: PlayerId): readonly ObjectId[] {
    return this.state.zones.perPlayer[player].hand;
  }

  libraryOf(player: PlayerId): readonly ObjectId[] {
    return this.state.zones.perPlayer[player].library;
  }

  graveyardOf(player: PlayerId): readonly ObjectId[] {
    return this.state.zones.perPlayer[player].graveyard;
  }

  get stack(): readonly ObjectId[] {
    return this.state.zones.shared.stack;
  }

  get battlefield(): readonly ObjectId[] {
    return this.state.zones.shared.battlefield;
  }

  /** Current characteristics of an object after all continuous effects. */
  characteristics(id: ObjectId): Characteristics {
    return computeCharacteristics(this.state, this.registry, id);
  }

  /** Combat restrictions on `id` from static abilities (Pacifism, Juggernaut).
   * Delegates to `characteristics.ts`, which is where the combat predicates
   * reach for it without a `Game`. */
  private restrictionsOf(id: ObjectId): ReadonlySet<CombatRestriction> {
    return restrictionsOf(this.state, this.registry, id);
  }

  private objHasKeyword(id: ObjectId, keyword: Keyword): boolean {
    return objHasKeyword(this.state, this.registry, id, keyword);
  }

  /** Deep copy of the current state, suitable for {@link Game.fromSnapshot}. */
  snapshot(): GameState {
    return cloneGameState(this.state);
  }

  /** A redacted, self-contained snapshot from one player's seat. */
  viewFor(player: PlayerId, options: ViewOptions = {}): PlayerView {
    return viewFor(this.state, this.registry, player, {
      // What each of this seat's castable cards really costs, so the client
      // stops showing Blasphemous Act at {8}{R} while it is castable for
      // {R}. A capability rather than logic `viewFor` duplicates: working it
      // out needs commander tax and the battlefield's cost-modification
      // statics, neither of which it can see.
      effectiveCost: (cardId) => this.displayCostOf(player, cardId),
      ...options,
    });
  }

  // --- driving the game ------------------------------------------------

  dispatch(action: Action): readonly GameEvent[] {
    const from = this.state.eventLog.length;
    // A decision applies through its module, which calls the same `apply*`
    // this switch used to call directly. What is left below is the seven
    // priority actions — the things a player does when nothing is pending.
    const decision = decisionForAction(action);
    if (decision !== undefined) {
      decision.apply(this.decisionHost, action);
      return this.state.eventLog.slice(from);
    }
    switch (action.type) {
      case "pass-priority":
        this.passPriority(action.player);
        break;
      case "play-land":
        this.playLand(action.player, action.card, action.face ?? 0, action.graveyardGrant);
        break;
      case "suspend":
        this.suspendCard(action.player, action.card);
        break;
      case "foretell":
        this.foretellCard(action.player, action.card);
        break;
      case "cycle":
        this.cycleCard(action.player, action.card);
        break;
      case "cast-spell":
        this.castSpell(
          action.player,
          action.card,
          normalizeTargets(action.targets),
          action.xValue ?? 0,
          action.via,
          action.face ?? 0,
          action.modes,
          action.kicked === true,
          action.sacrifice,
          action.overload === true,
          action.free === true,
          action.convoke,
          action.altCost === true,
          action.costOption,
          action.tap,
          action.graveyardGrant,
          action.escapeExile,
        );
        break;
      case "activate-ability":
        this.activateAbility(
          action.player,
          action.source,
          action.abilityIndex,
          normalizeTargets(action.targets),
          action.sacrifice,
          action.xValue ?? 0,
          action.manaColors,
          action.tap,
        );
        break;
      default:
        throw new Error(
          `unhandled action: ${(action as { type: string }).type}`,
        );
    }
    return this.state.eventLog.slice(from);
  }

  /** Why `action` cannot be dispatched right now, or `null` if it can. */
  canDispatch(action: Action): string | null {
    const decision = decisionForAction(action);
    if (decision !== undefined) {
      return decision.whyCannot(this.decisionCtx, action, actionPlayer(action));
    }
    switch (action.type) {
      case "pass-priority":
        if (this.state.awaiting !== null) return "a declaration is pending";
        return this.state.priority.holder === action.player
          ? null
          : `${action.player} does not have priority`;
      case "play-land":
        return this.whyCannotPlayLand(
          action.player,
          action.card,
          action.face ?? 0,
          action.graveyardGrant,
        );
      case "suspend":
        return this.whyCannotSuspend(action.player, action.card);
      case "foretell":
        return this.whyCannotForetell(action.player, action.card);
      case "cycle":
        return this.whyCannotCycle(action.player, action.card);
      case "cast-spell":
        return this.whyCannotCastSpell(
          action.player,
          action.card,
          action.via,
          action.face ?? 0,
          action.modes,
          action.kicked === true,
          action.sacrifice,
          action.overload === true,
          action.free === true,
          action.convoke,
          action.altCost === true,
          action.costOption,
          action.tap,
          action.graveyardGrant,
          action.xValue,
          distinctTargetCount(action.targets, this.targetCopies(action.targets ?? [])),
          action.escapeExile,
        );
      case "activate-ability":
        return this.whyCannotActivateAbility(
          action.player,
          action.source,
          action.abilityIndex,
          action.tap,
        );
      default:
        return `unknown action: ${(action as { type: string }).type}`;
    }
  }

  /** Everything `player` may legally do right now. */
  legalActions(player: PlayerId): LegalAction[] {
    // Pure enumeration over one settled state — the engine's hottest read
    // path (per candidate spell it replans mana, recomputes characteristics,
    // rechecks conditions). One cache region covers the whole call; the only
    // mutation reachable from inside (`withFace`'s temporary face flip)
    // invalidates as it flips.
    return withComputedCache(() => this.legalActionsUncached(player));
  }

  private legalActionsUncached(player: PlayerId): LegalAction[] {
    if (this.state.result.over) return [];

    const awaiting = this.state.awaiting;
    if (awaiting !== null) {
      // `mayActOn` is single-player for every kind but `mulligan`, whose
      // phase is parallel — any player still in `hands` may act.
      if (!mayActOn(awaiting, player)) return [];
      return decisionFor(awaiting.kind).legal(this.decisionCtx, awaiting as never, player);
    }

    if (this.state.priority.holder !== player) return [];
    const out: LegalAction[] = [{ kind: "pass-priority" }];

    const ownCommanders = this.state.zones.shared.command.filter((id) =>
      this.isCastableCommander(player, id),
    );
    for (const card of [...this.state.zones.perPlayer[player].hand, ...ownCommanders]) {
      const ownName = this.state.objects[card].cardName;
      const ownDef = this.registry.get(ownName);
      // Each face of a *modal* multi-face card is a separately-playable option
      // (rule 712 — ROADMAP Phase 10a); a single-faced card, and a transforming
      // DFC (which is only ever cast as its front face — 10b), has just one.
      const cardFaces = ownDef.transform ? null : ownDef.faces;
      const faceList: readonly (readonly [number | undefined, string])[] =
        cardFaces !== null
          ? cardFaces.map((n, i) => [i, n] as const)
          : [[undefined, ownName] as const];
      for (const [face, cardName] of faceList) {
        const def = this.faceDef(card, face ?? 0);
        const faceProp = face !== undefined ? { face } : {};
        if (def.types.includes("land")) {
          if (this.whyCannotPlayLand(player, card, face ?? 0) === null) {
            out.push({ kind: "play-land", card, cardName, ...faceProp });
          }
        } else {
          out.push(
            ...this.castSpellActions(player, card, cardName, def, {
              ...faceProp,
              costString: def.manaCost,
            }),
          );
        }
      }
      const cardName = ownName;
      const def = ownDef;
      // Suspend (rule 702.62) — a special action, offered alongside the cast.
      if (def.suspend !== null && this.whyCannotSuspend(player, card) === null) {
        out.push({ kind: "suspend", card, cardName, n: def.suspend.n, cost: def.suspend.cost });
      }
      // Foretell (rule 702.144) — a special action.
      if (def.foretell !== null && this.whyCannotForetell(player, card) === null) {
        out.push({ kind: "foretell", card, cardName });
      }
      // Cycling (rule 702.29) — a special action, any time you could cast an instant.
      if (def.cycling !== null && this.whyCannotCycle(player, card) === null) {
        out.push({ kind: "cycle", card, cardName, cost: def.cycling.cost });
      }
    }

    // Foretell (rule 702.144) — a card foretold on an earlier turn may be cast
    // from exile for its foretell cost.
    for (const card of this.state.zones.shared.exile) {
      const object = this.state.objects[card];
      if (object === undefined || !object.foretold || object.owner !== player) continue;
      const cardName = object.cardName;
      const def = this.registry.get(cardName);
      const cost = def.foretell?.cost ?? null;
      if (cost === null) continue;
      out.push(
        ...this.castSpellActions(player, card, cardName, def, {
          via: "foretell",
          costString: cost,
        }),
      );
    }

    // Flashback (rule 702.34) — an instant/sorcery in this player's graveyard
    // with a printed *or granted* (Snapcaster Mage) flashback cost may be cast
    // from there.
    for (const card of this.state.zones.perPlayer[player].graveyard) {
      const cardName = this.state.objects[card].cardName;
      const def = this.registry.get(cardName);
      const cost = this.flashbackCostOf(card);
      if (cost === null) continue;
      out.push(
        ...this.castSpellActions(player, card, cardName, def, {
          via: "flashback",
          costString: cost,
        }),
      );
    }

    // Disturb (rule 702.150) — a transforming DFC in this player's graveyard
    // whose front face has disturb may be cast as its back face (face 1) from
    // there; the spell is then exiled (like flashback).
    for (const card of this.state.zones.perPlayer[player].graveyard) {
      const front = this.frontFaceDef(card);
      if (front.disturb === null) continue;
      const backDef = this.faceDef(card, 1);
      out.push(
        ...this.castSpellActions(player, card, backDef.name, backDef, {
          via: "disturb",
          face: 1,
          costString: front.disturb.cost,
        }),
      );
    }

    // "Impulse draw" — a card exiled face-up with permission to play it, for
    // its ordinary cost (Dream Pillager, Tectonic Giant, Theater of Horrors).
    for (const card of this.state.zones.shared.exile) {
      if (!this.impulsePlayable(player, card)) continue;
      const object = this.state.objects[card];
      const def = this.registry.get(object.cardName);
      if (def.types.includes("land")) {
        // "You may *play* them" includes lands; "cast spells from among them"
        // doesn't. Still costs the land drop.
        if (object.impulse?.castOnly === true) continue;
        if (this.whyCannotPlayLand(player, card) === null) {
          out.push({ kind: "play-land", card, cardName: def.name });
        }
        continue;
      }
      out.push(
        ...this.castSpellActions(player, card, def.name, def, {
          via: "impulse",
          costString: def.manaCost,
        }),
      );
    }

    // Graveyard permissions: one granted by a permanent (Gisa and Geralf,
    // Muldrotha) or one riding on the card itself (Silas Renn, Emry). Offered
    // once per permission that applies — and, for Muldrotha, once per
    // permanent type the card could spend — so which permission is used up is
    // the player's choice, carried as `graveyardGrant`. Each face of a modal
    // double-faced card is its own option, as it is from the hand.
    for (const card of this.state.zones.perPlayer[player].graveyard) {
      const ownDef = this.registry.get(this.state.objects[card].cardName);
      const cardFaces = ownDef.transform ? null : ownDef.faces;
      const faceList: readonly (number | undefined)[] =
        cardFaces !== null ? cardFaces.map((_n, i) => i) : [undefined];
      for (const face of faceList) {
        const grants = this.graveyardGrantsFor(player, card, face ?? 0);
        if (grants.length === 0) continue;
        const def = this.faceDef(card, face ?? 0);
        const faceProp = face !== undefined ? { face } : {};
        for (const { grant } of grants) {
          if (def.types.includes("land")) {
            if (this.whyCannotPlayLand(player, card, face ?? 0, grant) === null) {
              out.push({
                kind: "play-land",
                card,
                cardName: def.name,
                ...faceProp,
                graveyardGrant: grant,
              });
            }
            continue;
          }
          out.push(
            ...this.castSpellActions(player, card, def.name, def, {
              via: "graveyard-permission",
              ...faceProp,
              costString: def.manaCost,
              graveyardGrant: grant,
            }),
          );
        }
      }
    }

    // Adventure (rule 715.3) — a card exiled by its adventure resolving may be
    // cast as its creature half (face 0) from exile.
    for (const card of this.state.zones.shared.exile) {
      const object = this.state.objects[card];
      if (object === undefined || !object.onAdventure || object.owner !== player) continue;
      const creatureDef = this.faceDef(card, 0);
      out.push(
        ...this.castSpellActions(player, card, creatureDef.name, creatureDef, {
          via: "adventure",
          face: 0,
          costString: creatureDef.manaCost,
        }),
      );
    }

    // Escape (rule 702.139) — a card in this player's graveyard with escape,
    // enough other cards there to pay the exile cost, and the mana.
    for (const card of this.state.zones.perPlayer[player].graveyard) {
      const cardName = this.state.objects[card].cardName;
      const def = this.registry.get(cardName);
      if (def.escape === null) continue;
      out.push(
        ...this.castSpellActions(player, card, cardName, def, {
          via: "escape",
          costString: def.escape.cost,
        }),
      );
    }

    // A static permission to play lands from your graveyard (Ramunap
    // Excavator — rule 118.9). Still consumes the land drop / sorcery timing.
    for (const card of this.state.zones.perPlayer[player].graveyard) {
      const def = this.registry.get(this.state.objects[card].cardName);
      if (!def.types.includes("land")) continue;
      // A limited permission (Muldrotha's land allowance) was offered above,
      // with the grant it spends.
      if (!this.mayPlayFromGraveyard(player, card)) continue;
      if (this.whyCannotPlayLand(player, card) !== null) continue;
      out.push({ kind: "play-land", card, cardName: def.name });
    }

    // A static permission to play the top card of your library if it's a
    // land (Oracle of Mul Daya). Still consumes the land drop / sorcery
    // timing.
    const libraryTop = this.state.zones.perPlayer[player].library[0];
    if (libraryTop !== undefined) {
      const def = this.registry.get(this.state.objects[libraryTop].cardName);
      if (def.types.includes("land") && this.whyCannotPlayLand(player, libraryTop) === null) {
        out.push({ kind: "play-land", card: libraryTop, cardName: def.name });
      }
    }

    const pushActivateAbility = (
      source: ObjectId,
      cardName: string,
      ability: ActivatedAbility,
      index: number,
      manaColors?: readonly ManaType[],
    ): void => {
      if (this.whyCannotActivateAbility(player, source, index) !== null) return;
      out.push({
        kind: "activate-ability",
        source,
        abilityIndex: index,
        cardName,
        text:
          manaColors === undefined
            ? ability.text
            : `${ability.text} (add ${manaColors.map((m) => `{${m}}`).join("")})`,
        ...(manaColors !== undefined ? { manaColors } : {}),
        targetSpecs: ability.targets,
        targetOptions: this.targetOptionsFor(ability.targets, player, this.permanentSource(source)),
        ...(ability.cost.sacrifice !== undefined && ability.cost.sacrifice !== "self"
          ? { sacrifice: { choices: this.sacrificeCandidates(player, source, ability) } }
          : {}),
        ...(() => {
          const tapCost = this.abilityTapCostOffer(player, source, ability);
          return tapCost === null ? {} : { tapCost };
        })(),
        ...(ability.loyaltyCost !== undefined ? { loyalty: ability.loyaltyCost } : {}),
        ...(isManaAbility(ability) ? { manaAbility: true as const } : {}),
        ...(parseManaCost(ability.cost.mana).x > 0
          ? {
              xCost: {
                // Mirrors activateAbility's own payMana call exactly — see
                // maxAffordableAbilityX.
                maxX: this.maxAffordableAbilityX(
                  player,
                  (x) => this.activatedAbilityManaCost(player, source, ability, x).cost,
                  ability.cost.tap || ability.zone !== undefined ? undefined : source,
                  ability.cost.tap ? source : undefined,
                ),
              },
            }
          : {}),
      });
    };

    const abilityGrantors = this.activatedGrantSources();
    for (const source of this.state.zones.shared.battlefield) {
      const object = this.state.objects[source];
      if (object.controller !== player) continue;
      this.effectiveActivated(source, abilityGrantors).forEach((ability, index) => {
        // "Add one mana of any color" (Command Tower) is one ability with
        // several outcomes; enumerate it once per outcome so activating it on
        // its own is a real choice rather than whatever the engine's default
        // happened to be. Paying a *cost* never comes through here — the mana
        // planner picks the colour it needs (see `manaSources`).
        const choices = standaloneManaChoices(
          ability,
          (m) => this.manaOneOf(m as Parameters<typeof this.manaOneOf>[0], player),
          () =>
            ability.effect?.kind === "add-mana" && typeof ability.effect.amount !== "number"
              ? this.liveManaAmount(source, player, ability.effect.amount)
              : null,
        );
        if (choices === null) {
          pushActivateAbility(source, printedCardName(object), ability, index);
          return;
        }
        for (const choice of choices) {
          pushActivateAbility(source, printedCardName(object), ability, index, choice);
        }
      });
    }

    // Abilities activated from a zone other than the battlefield: Channel
    // from hand (rule 702.51a), a graveyard ability (usually "exile this card
    // from your graveyard"), and a command-zone one (Derevi) — see
    // `ActivatedAbility.zone`.
    for (const zone of ["hand", "graveyard"] as const) {
      for (const card of this.state.zones.perPlayer[player][zone]) {
        const def = this.registry.get(this.state.objects[card].cardName);
        this.effectiveActivated(card).forEach((ability, index) => {
          if (ability.zone === zone) pushActivateAbility(card, def.name, ability, index);
        });
      }
    }
    // The command zone is shared, so only the cards `player` owns.
    for (const card of this.state.zones.shared.command) {
      const object = this.state.objects[card];
      if (object === undefined || object.owner !== player || object.kind !== "card") continue;
      const def = this.registry.get(object.cardName);
      this.effectiveActivated(card).forEach((ability, index) => {
        if (ability.zone === "command") pushActivateAbility(card, def.name, ability, index);
      });
    }

    return out;
  }

  /**
   * True if `player`'s only legal actions right now are passing priority
   * and/or activating a mana ability — i.e. nothing a driver could treat as
   * a real decision. Used to let a player opt in to auto-passing these
   * windows without losing the ability to *manually* hold priority with
   * mana up (e.g. to bluff having an instant) when they haven't opted in.
   */
  isDeadForMana(player: PlayerId): boolean {
    if (this.state.priority.holder !== player) return false;
    return this.legalActions(player).every((action) => {
      if (action.kind === "pass-priority") return true;
      if (action.kind !== "activate-ability") return false;
      const ability = this.effectiveActivated(action.source)[action.abilityIndex];
      return ability !== undefined && isManaAbility(ability);
    });
  }

  private controllerView(player: PlayerId): ControllerView {
    return {
      state: this.state,
      player,
      legalActions: () => this.legalActions(player),
    };
  }

  private targetOptionsFor(
    specs: readonly TargetSpec[],
    forPlayer: PlayerId,
    source?: TargetSource,
  ): readonly (readonly TargetRef[])[] {
    return specs.map((spec) => legalTargets(this.state, this.registry, spec, forPlayer, source));
  }

  /** The colour/type identity of a card (its printed values). */
  private cardSource(def: CardDefinition, object?: ObjectId): TargetSource {
    const base = cardSource(def, object);
    const card = object !== undefined ? this.state.objects[object] : undefined;
    if (object === undefined || card === undefined) return base;
    return {
      ...base,
      // A spell's own {X} (rule 107.3) — zero until it's been chosen.
      amount: this.filterAmounts({ source: object, controller: card.controller, x: card.xValue ?? 0 }),
    };
  }

  /**
   * What answers a filter's `{ amount }` operand (`DynamicOperand`) on behalf
   * of `env.source` — the same `amountValue` an effect's own amounts go
   * through, so a target filter's "lesser mana value" and an effect's "equal
   * to its mana value" can't disagree. The resolution context is built on
   * first use: almost no filter asks, and this is made for every source.
   */
  private filterAmounts(env: {
    readonly source: ObjectId;
    readonly controller: PlayerId;
    readonly targets?: ResolvedTargets;
    readonly x?: number;
    readonly triggerValue?: number;
    readonly triggerObject?: ObjectId;
    readonly targetZones?: readonly (ZoneType | null)[];
    readonly lastKnownRefs?: LastKnownRefs;
  }): (amount: EffectAmount) => number {
    let ctx: ResolutionContext | undefined;
    return (amount) => {
      ctx ??= this.makeResolutionContext(
        env.source,
        env.controller,
        env.targets ?? [],
        env.x ?? 0,
        env.triggerValue ?? 0,
        env.triggerObject,
        1,
        0,
        env.targetZones ?? [],
        env.lastKnownRefs,
      );
      return amountValue(amount, ctx);
    };
  }

  /** The `castModal` descriptor for a `cast-spell` `LegalAction` (ROADMAP
   * Phase 11 EG-2), or `{}` when `def` isn't a targeted modal spell. Spread
   * into every `cast-spell` push — from hand *and* from an alternative zone
   * (a `castModal` instant/sorcery Snapcaster grants flashback to still needs
   * cast-time mode selection). */
  private castModalDescriptor(
    def: CardDefinition,
    player: PlayerId,
    card: ObjectId,
  ): Pick<Extract<LegalAction, { kind: "cast-spell" }>, "castModal"> {
    if (def.castModal === null) return {};
    return {
      castModal: {
        minModes: def.castModal.minModes,
        maxModes: def.castModal.maxModes,
        modes: def.castModal.modes.map((m) => ({
          text: m.text,
          targetSpecs: [...(m.targets ?? [])],
          targetOptions: this.targetOptionsFor(
            m.targets ?? [],
            player,
            this.cardSource(def, card),
          ),
        })),
      },
    };
  }

  /**
   * Every `cast-spell` `LegalAction` for one castable card in one zone — the
   * shared builder behind all six enumeration sites (hand / command zone,
   * foretell, flashback, disturb, adventure, escape), which differ only in
   * `via` / `face` / which cost string is paid.
   *
   * Usually one entry. A **kickable** card (rule 702.33 — needed-cards P8)
   * yields up to two, unkicked and kicked, each with its own cost, target specs
   * and affordability — the same "one entry per playable variant" shape `via`
   * and `face` already use, so a driver just offers both buttons.
   */
  private castSpellActions(
    player: PlayerId,
    card: ObjectId,
    cardName: string,
    def: CardDefinition,
    opts: {
      via?: CastVia;
      face?: number;
      costString: string | null;
      graveyardGrant?: GraveyardGrant;
    },
  ): LegalAction[] {
    const { via, face, costString, graveyardGrant } = opts;
    const out: LegalAction[] = [];
    const variants: {
      kicked: boolean;
      overload: boolean;
      free: boolean;
      altCost?: boolean;
      costOption?: number;
    }[] = [{ kicked: false, overload: false, free: false }];
    if (def.kicker !== null) variants.push({ kicked: true, overload: false, free: false });
    // Overload (rule 702.126) and a conditional free-cast permission (Fierce
    // Guardianship) are each an alternative cast, mutually exclusive with
    // kicker and each other (no card on the list has more than one).
    if (def.overload !== null) variants.push({ kicked: false, overload: true, free: false });
    if (def.freeCastIf !== null) variants.push({ kicked: false, overload: false, free: true });
    if (def.alternativeCost !== null) {
      variants.push({ kicked: false, overload: false, free: false, altCost: true });
    }
    // A choice of additional costs (rule 601.2b) multiplies through whatever
    // variants already exist: each is castable by paying either branch, and
    // the driver picks one by picking a `LegalAction`. Every card in the pool
    // with `options` has no kicker or overload, so this is a product of one.
    const costOptions = def.additionalCost?.options;
    if (costOptions !== undefined && costOptions.length > 0) {
      const crossed = variants.flatMap((variant) =>
        costOptions.map((_option, index) => ({ ...variant, costOption: index })),
      );
      variants.length = 0;
      variants.push(...crossed);
    }
    for (const { kicked, overload, free, altCost, costOption } of variants) {
      /** Whether this variant can be cast with `targetCount` distinct
       * targets, and whether mana alone pays for it. */
      const castableAt = (targetCount: number): { castable: boolean; manaAffordable: boolean } => {
        let castable =
          this.whyCannotCastSpell(
            player,
            card,
            via,
            face ?? 0,
            undefined,
            kicked,
            undefined,
            overload,
            free,
            undefined,
            altCost === true,
            costOption,
            undefined,
            graveyardGrant,
            0,
            targetCount,
          ) === null;
        const manaAffordable = castable;
        // Convoke (rule 702.51): not affordable with mana alone doesn't mean
        // not castable — check again assuming every untapped creature helps,
        // maximally, before giving up on this variant.
        if (!castable && def.convoke) {
          const baseCost = this.withFace(card, face ?? 0, () =>
            this.castingCostOf(
              player,
              card,
              def,
              0,
              this.castCostString(card, via, face, kicked, overload, free),
              targetCount,
            ),
          );
          const proof = this.maxConvokeFor(this.convokeCandidates(player), baseCost);
          if (
            proof.length > 0 &&
            this.whyCannotCastSpell(
              player,
              card,
              via,
              face ?? 0,
              undefined,
              kicked,
              undefined,
              overload,
              free,
              proof,
              false,
              undefined,
              undefined,
              graveyardGrant,
              0,
              targetCount,
            ) === null
          ) {
            castable = true;
          }
        }
        return { castable, manaAffordable };
      };
      // A "for each target" cost modification (Hinata, Dawn-Crowned) makes
      // the cost a function of the targets, which aren't chosen yet: offer
      // the spell if *some* number of targets a legal choice can have is
      // affordable, and say which (`targetCount`). Everything priced below
      // for the offer — X's ceiling, the convoke proof — is priced at the
      // dearer end of that range, so it holds for any count inside it.
      let targetCount: TargetCountRange | undefined;
      let pricedAt = 0;
      let manaAffordable: boolean;
      const variantCost = this.castCostString(card, via, face, kicked, overload, free, altCost === true, costOption);
      if (this.withFace(card, face ?? 0, () => this.costDependsOnTargets(player, card, def, variantCost))) {
        const bounds = this.withFace(card, face ?? 0, () =>
          this.targetCountBoundsFor(def, player, card, kicked, overload),
        );
        if (bounds === null) continue;
        const affordable: number[] = [];
        for (let k = bounds.min; k <= bounds.max; k += 1) {
          if (castableAt(k).castable) affordable.push(k);
        }
        if (affordable.length === 0) continue;
        targetCount = {
          min: affordable[0],
          max: affordable[affordable.length - 1],
          ...(bounds.copies !== undefined ? { copies: bounds.copies } : {}),
        };
        const weight = (k: number) =>
          cheapestManaAmount(this.withFace(card, face ?? 0, () => this.castingCostOf(player, card, def, 0, variantCost, k)));
        pricedAt = weight(targetCount.max) > weight(targetCount.min) ? targetCount.max : targetCount.min;
        manaAffordable = castableAt(pricedAt).manaAffordable;
      } else {
        const at = castableAt(0);
        if (!at.castable) continue;
        manaAffordable = at.manaAffordable;
      }
      const specs = this.effectiveTargetSpecs(def, undefined, kicked, overload);
      const options = this.targetOptionsFor(specs, player, this.cardSource(def, card));
      // Rule 601.2c — a spell can't be cast without a legal target for every
      // slot that demands one. An *optional* slot ("up to one target
      // creature") with nothing to point at is simply skipped, so it never
      // blocks the cast. A targeted modal spell picks its slots per mode and
      // is gated by `castModalDescriptor` instead.
      if (
        def.castModal === null &&
        specs.some((spec, i) => options[i].length === 0 && !isOptionalSpec(spec))
      ) {
        continue;
      }
      const cost = altCost === true && def.alternativeCost !== null
        ? def.alternativeCost.mana
        : free
        ? "{0}"
        : overload && def.overload !== null
          ? def.overload.cost
          : kicked && def.kicker !== null && costString !== null
            ? costString + def.kicker.cost
            : costString;
      const sacrifices = this.additionalCostSacrifices(player, def, costOption);
      const xPlan =
        parseManaCost(cost).x > 0 ? this.xPlanFor(player, card, def, cost, face ?? 0, pricedAt) : null;
      out.push({
        kind: "cast-spell",
        card,
        cardName,
        targetSpecs: specs,
        targetOptions: options,
        ...(via !== undefined ? { via } : {}),
        ...(graveyardGrant !== undefined ? { graveyardGrant } : {}),
        ...(face !== undefined ? { face } : {}),
        ...this.castModalDescriptor(def, player, card),
        ...(sacrifices.length > 0 ? { sacrifice: { choices: sacrifices } } : {}),
        ...(kicked && def.kicker !== null
          ? { kicked: true, kickerCost: def.kicker.cost }
          : {}),
        ...(overload && def.overload !== null
          ? { overload: true, overloadCost: def.overload.cost }
          : {}),
        ...(free ? { free: true } : {}),
        ...(altCost === true
          ? (() => {
              const tapCost = this.altCostTapOffer(player, card, via, face ?? 0);
              return tapCost === null ? { altCost: true } : { altCost: true, tapCost };
            })()
          : {}),
        ...(costOption !== undefined && costOptions !== undefined
          ? { costOption, costOptionText: costOptions[costOption].text }
          : {}),
        // Escape (rule 702.139a): which other graveyard cards pay the exile
        // half of the cost is the caster's choice, made as costs are paid.
        ...(via === "escape" && def.escape !== null
          ? {
              escapeExile: {
                count: def.escape.exileCount,
                choices: this.state.zones.perPlayer[player].graveyard.filter((id) => id !== card),
              },
            }
          : {}),
        ...(def.convoke
          ? (() => {
              const candidates = this.convokeCandidates(player);
              const full = this.castingCostOf(player, card, def, 0, cost, pricedAt);
              // As many creatures as the largest X on offer could use.
              const atMaxX =
                xPlan === null ? full : this.castingCostOf(player, card, def, xPlan.maxX, cost, pricedAt);
              const copies: Record<ObjectId, number> = {};
              for (const id of candidates) {
                const n = this.state.objects[id].stackCount ?? 1;
                if (n > 1) copies[id] = n;
              }
              return {
                convoke: {
                  candidates,
                  maxGeneric: full.generic,
                  proof: this.maxConvokeFor(candidates, full),
                  manaAffordable,
                  maxCreatures: atMaxX.generic + COLORS.reduce((n, c) => n + atMaxX.colored[c], 0),
                  ...(xPlan !== null
                    ? {
                        xProof: {
                          atX: xPlan.maxX,
                          genericPerX: parseManaCost(cost).x,
                          payments: xPlan.convoke,
                        },
                      }
                    : {}),
                  ...(Object.keys(copies).length > 0 ? { copies } : {}),
                },
              };
            })()
          : {}),
        ...(targetCount !== undefined ? { targetCount } : {}),
        ...(xPlan !== null
          ? { xCost: { maxX: xPlan.maxX } }
          : def.additionalCost?.payLifeX === true
            ? // "Pay X life" — the ceiling is what you have, not what your
              // lands can make (rule 118.4: any amount of life you have).
              { xCost: { maxX: this.state.players[player].life } }
            : {}),
      });
    }
    return out;
  }

  /** Every untapped creature `player` controls — the full candidate pool for
   * a convokable spell (rule 702.51a). The actual cast may use any subset,
   * each paying however the caster likes; this is just "what's eligible". */
  /** Untapped creatures `player` could convoke with, any that make mana
   * last: a creature that convokes can't also tap for mana (see
   * `whyCannotCastSpell`), so a proof built from this order leaves the mana
   * creatures for the mana whenever it can. */
  private convokeCandidates(player: PlayerId): ObjectId[] {
    const creatures = this.state.zones.shared.battlefield.filter((id) => {
      const object = this.state.objects[id];
      return (
        object.controller === player &&
        !object.tapped &&
        computeCharacteristics(this.state, this.registry, id).types.includes("creature")
      );
    });
    const makesMana = new Set(this.manaSources(player).map((s) => s.id));
    return [
      ...creatures.filter((id) => !makesMana.has(id)),
      ...creatures.filter((id) => makesMana.has(id)),
    ];
  }

  /** A greedy convoke allocation using as many of `candidates` as usefully
   * reduce `cost` (colored pips first, since a creature can only help with
   * its own colors or generic; leftover creatures go to generic; a
   * creature that can't help either is left out). Used only to test whether
   * a convokable spell is affordable *at all* — enumerated in
   * `castSpellActions`, never dispatched as-is; the real cast can use any
   * subset/allocation the driver actually chooses. */
  private maxConvokeFor(candidates: readonly ObjectId[], cost: ManaCost): PaidConvoke[] {
    const out: PaidConvoke[] = [];
    const colorLeft = { ...cost.colored };
    let genericLeft = cost.generic;
    for (const creature of candidates) {
      const colors = computeCharacteristics(this.state, this.registry, creature).colors;
      // A compacted token stack helps once per token.
      for (let i = 0; i < (this.state.objects[creature].stackCount ?? 1); i += 1) {
        const payColor = COLORS.find((c) => colors.has(c) && colorLeft[c] > 0);
        if (payColor !== undefined) {
          out.push({ creature, pays: payColor });
          colorLeft[payColor] -= 1;
        } else if (genericLeft > 0) {
          out.push({ creature, pays: "generic" });
          genericLeft -= 1;
        } else {
          break;
        }
      }
    }
    return out;
  }

  /** The colour/type identity of a permanent (its computed values).
   * Delegates to `targeting.ts`, which owns {@link TargetSource}. */
  private permanentSource(id: ObjectId): TargetSource {
    const base = permanentSource(this.state, this.registry, id);
    const object = this.state.objects[id];
    if (object === undefined) return base;
    return { ...base, amount: this.filterAmounts({ source: id, controller: object.controller }) };
  }

  // --- token stacking (engine resource safety, not a rule) ------------

  /** Whether a named token definition is ever eligible to be compacted into a
   * `stackCount` (see `GameObject.stackCount`) — only one with no activated
   * ability and, for every triggered ability, no targets and a proven
   * count-scalable effect. Anything else (Food/Treasure's activated
   * abilities; a targeted or otherwise unproven trigger) is always minted as
   * separate ordinary objects, exactly as before this optimization existed. */
  private isStackableTokenName(name: string): boolean {
    const def = this.registry.get(name);
    if (def.activated.length > 0) return false;
    return def.triggered.every(
      (t) => t.targets.length === 0 && t.effect !== null && isCountScalableEffect(t.effect),
    );
  }

  /** An existing battlefield object `repId` (itself not yet on the
   * battlefield) could merge into — same name/copy/controller and every
   * field a "just entered, untouched" token has, so folding `repId`'s count
   * into it is indistinguishable from minting `repId` separately. `null` if
   * none. */
  private findMergeableStack(repId: ObjectId, controller: PlayerId): ObjectId | null {
    const rep = this.state.objects[repId];
    const key = this.tokenFoldKey(rep);
    const pinned = this.pinnedTokenIds();
    for (const id of this.state.zones.shared.battlefield) {
      const o = this.state.objects[id];
      if (
        o.isToken &&
        o.controller === controller &&
        o.owner === rep.owner &&
        o.controlEffects === undefined &&
        o.cardName === rep.cardName &&
        this.isRestingToken(o) &&
        !pinned.has(id) &&
        this.tokenFoldKey(o) === key
      ) {
        return id;
      }
    }
    return null;
  }

  /**
   * Everything two tokens must share to be folded into one stack, as one
   * string: `findMergeableStack` compares a new batch against it and
   * `recompactTokens` groups on it. Anything that tells one token from
   * another belongs here — whose it is (owner as well as controller: a token
   * someone stole for good isn't one of the thief's own), its state, what's
   * been done to it (counters, modifiers, a goad, a control effect, a
   * transformed face, a choice made as it entered) and what's still due to
   * happen to it. A split-off target that nothing distinguishes any more
   * matches its old stack again and folds back.
   */
  private tokenFoldKey(o: GameObject): string {
    return JSON.stringify([
      o.cardName,
      o.copyOf,
      o.owner,
      o.controller,
      o.tapped,
      o.summoningSick,
      o.face ?? 0,
      o.exileAtEndStep ?? false,
      o.sacrificeAtEndStep ?? false,
      o.notLegendary ?? false,
      o.goadedBy ?? [],
      o.mustAttackPlayer ?? null,
      o.controlEffects ?? null,
      o.controlEndsAtCleanup,
      o.chosenOnEnter ?? null,
      o.chosenCreatureType ?? null,
      o.counters,
      o.modifiers,
    ]);
  }

  /** A token in the state a fresh one is in, as far as combat and damage go:
   * nothing attached to anything, not in combat, no damage marked. */
  private isRestingToken(o: GameObject): boolean {
    return (
      o.attachedTo === null &&
      o.attacking === null &&
      o.blocking === null &&
      o.damageMarked === 0 &&
      !o.markedByDeathtouch
    );
  }

  /**
   * Tokens something outside the stack still refers to by id — the target of
   * a spell or ability on the stack, the target or source of a delayed
   * trigger, the target of a prevention shield. Folding
   * one into another object deletes its id, and an Aura or Equipment on it
   * would end up on a whole stack, so these are never folded: a split-off
   * target a delayed trigger will come back for has to still be there.
   */
  private pinnedTokenIds(): Set<ObjectId> {
    const pinned = new Set<ObjectId>();
    for (const id of this.state.zones.shared.battlefield) {
      const attached = this.state.objects[id].attachedTo;
      if (attached !== null) pinned.add(attached);
    }
    for (const trigger of this.state.delayedTriggers) {
      pinned.add(trigger.source);
      for (const t of trigger.targets) if (t?.kind === "object") pinned.add(t.object);
    }
    for (const shield of this.state.preventionShields) {
      if (shield.target.kind === "object") pinned.add(shield.target.object);
    }
    // A spell or ability on the stack whose target was locked in to one token
    // (`lockInTargets`): a new batch folded into that token would make the
    // target a whole stack again, and each step of its effect would peel off
    // a different token.
    for (const id of this.state.zones.shared.stack) {
      for (const t of this.state.objects[id]?.targets ?? []) {
        if (t?.kind === "object") pinned.add(t.object);
      }
    }
    return pinned;
  }

  /** If `id` names a compacted token stack (`stackCount > 1`), peel exactly
   * one member off into its own ordinary object — decrementing the stack
   * (clearing the field entirely once it drops to 1) — and return the new
   * individual's id; callers apply whatever singles it out (a target, an
   * attacker/blocker declaration, damage, a counter, an attachment, a
   * sacrifice, a tap alone, …) to *that* id instead. A no-op returning `id`
   * unchanged when it isn't a stack — the overwhelmingly common case. The
   * split-off object shares the stack's own timestamp (they genuinely
   * entered together, rule 613.7) and is otherwise byte-for-byte what a
   * never-compacted token would have been. */
  private splitOneFromStack(id: ObjectId): ObjectId {
    const stack = this.state.objects[id];
    if (stack === undefined || (stack.stackCount ?? 1) <= 1) return id;
    const remaining = (stack.stackCount ?? 1) - 1;
    if (remaining <= 1) delete stack.stackCount;
    else stack.stackCount = remaining;
    const newId = this.mintObjectId();
    this.state.objects[newId] = {
      ...stack,
      id: newId,
      counters: { ...stack.counters },
      modifiers: stack.modifiers.map((m) => ({ ...m })),
      blockedBy: [...stack.blockedBy],
    };
    delete this.state.objects[newId].stackCount;
    if (stack.controlEffects !== undefined) {
      this.state.objects[newId].controlEffects = stack.controlEffects.map((e) => ({ ...e }));
    }
    this.state.zones.shared.battlefield.push(newId);
    // A new permanent on the battlefield: anything memoized about the board
    // (a count, a static's reach) is stale.
    invalidateComputedCache();
    return newId;
  }

  /**
   * The most members of one compacted stack that combat will ever wake up at
   * once (see {@link materializeStack}). Comfortably above any board a human
   * game reaches — a self-replicating generator (Scute Swarm) is the only
   * thing that passes it, and it passes it by orders of magnitude.
   */
  private static readonly MAX_MATERIALIZED = 100;

  /**
   * The most separate things one effect makes, one at a time, where each is a
   * real object or queued item: individually minted tokens (the kinds that
   * never stack, like Treasures), mana units in a pool, and per-instance
   * copies of a trigger that can't be scaled into one. Engine resource
   * safety, not a rule, in the same spirit as {@link MAX_MATERIALIZED}.
   *
   * Counting a token stack as the tokens in it is what makes this reachable:
   * Krenko, Mob Boss doubles his Goblins, so twenty activations put a million
   * of them in one cheap stack, and "a Treasure for each creature" or "{G}
   * for each creature" would then mint a million objects inside one
   * synchronous dispatch. No human game gets near the cap.
   */
  static readonly MAX_EFFECT_INSTANCES = 1000;

  /**
   * The most separate objects one kind of token is woken into when its tokens
   * are granted an activated ability (Cryptolith Rite's "{T}: Add"). Small on
   * purpose: tapping them one at a time is what the grant needs, but every
   * separate object is another permanent every mana plan and every scan walks.
   * A Scute Swarm copying itself under Cryptolith Rite reached 290 permanents
   * and about 35 seconds a turn before this was bounded. Past the bound they
   * stay stacked and tap as one, the lesser wrong.
   */
  private static readonly MAX_WOKEN_TOKENS = 16;

  /**
   * Expand a compacted stack into separate ordinary objects and return them —
   * `[id]` unchanged when it isn't a stack. Combat needs this (as opposed to
   * `splitOneFromStack`'s "peel off one"): a stack's shared `power` can't
   * otherwise represent "N attackers each dealing their own damage", so
   * declaring one as an attacker or blocker materializes the group and lets
   * the existing, unmodified combat code handle them from there — the only
   * place this optimization "wakes up" a stack rather than singling one member
   * out of it.
   *
   * At most {@link MAX_MATERIALIZED} members wake up; past that the remainder
   * stays compacted on `id` and simply doesn't join this combat. That's a
   * *legal* declaration, not a fudged board: attacking and blocking are both
   * optional (rules 508.1a / 509.1a — a player may attack or block with any
   * subset of their able creatures), so "only 100 of the four million attack"
   * is a choice the engine is allowed to make. Without the cap a generator
   * that doubles every land drop makes one attack declaration mint millions of
   * objects and the game stops responding — the fuzz hang this cap fixes. The
   * one clause it can't honour is a `must-attack` / `must-be-blocked`
   * restriction on an over-cap stack (508.1d / 509.1c would demand all of
   * them); no token in the pool is both stackable and restricted.
   *
   * A known, documented restriction either way: a compacted stack attacks or
   * blocks as a whole up to the cap — today's `AttackerDeclaration` /
   * `BlockerDeclaration` can't name the same id twice to mean "N of them", so
   * a player can't deliberately hold *part* of an accumulated army back.
   */
  private materializeStack(id: ObjectId): ObjectId[] {
    const stack = this.state.objects[id];
    const count = stack?.stackCount ?? 1;
    if (stack === undefined || count <= 1) return [id];
    if (count <= Game.MAX_MATERIALIZED) {
      // `id` itself becomes the last individual as its count drains to 1.
      const ids = [id];
      for (let i = 1; i < count; i += 1) ids.push(this.splitOneFromStack(id));
      return ids;
    }
    const ids: ObjectId[] = [];
    for (let i = 0; i < Game.MAX_MATERIALIZED; i += 1) {
      ids.push(this.splitOneFromStack(id));
    }
    return ids; // `id` keeps the rest, compacted and out of this combat
  }

  /**
   * Fold interchangeable, untouched tokens back into `stackCount` stacks —
   * the counterpart to `mintTokenBatch`'s fold, run once per turn in the
   * cleanup step. Without it the individuals {@link materializeStack} wakes up
   * for a combat accumulate forever: a self-replicating generator adds another
   * cap's worth every turn, and since every game event re-scans the
   * battlefield for triggers, an ever-growing object count is what actually
   * makes a long game crawl. Pure engine resource safety, not a rule — it only
   * ever merges objects that are indistinguishable in every respect the game
   * can observe, so no board state changes.
   *
   * Deliberately conservative, and gated exactly like `mintTokenBatch`'s fold
   * so the everyday case stays untouched: it runs only with an empty stack and
   * nothing pending (so no ability object, trigger, or decision can be holding
   * an id it would delete); merges only tokens that are eligible
   * (`isStackableTokenName`), pristine (nothing attached, not in combat, no
   * marked damage), not referred to from elsewhere (`pinnedTokenIds` — the
   * host of an attachment, a delayed trigger's target) and alike in every
   * respect `tokenFoldKey` compares; and only
   * collapses a group that either already contains a stack or is at least
   * `STACK_ORIGIN_THRESHOLD` strong. Two Soldier tokens from Raise the Alarm
   * stay two tiles on the board, exactly as before.
   */
  /** How many *separate* (unstacked) token objects share `token`'s printed
   * name and controller — the bound on waking tokens that were granted an
   * activated ability. */
  private separateTokenCount(token: GameObject): number {
    const name = printedCardName(token);
    let n = 0;
    for (const id of this.state.zones.shared.battlefield) {
      const o = this.state.objects[id];
      if (
        o.isToken &&
        (o.stackCount ?? 1) === 1 &&
        o.controller === token.controller &&
        printedCardName(o) === name
      ) {
        n += 1;
      }
    }
    return n;
  }

  private recompactTokens(): void {
    if (
      this.state.awaiting !== null ||
      this.state.zones.shared.stack.length > 0 ||
      this.state.pendingTriggers.length > 0
    ) {
      return;
    }
    const pinned = this.pinnedTokenIds();
    const groups = new Map<string, ObjectId[]>();
    for (const id of this.state.zones.shared.battlefield) {
      const o = this.state.objects[id];
      if (
        !o.isToken ||
        pinned.has(id) ||
        !this.isRestingToken(o) ||
        // Stolen tokens keep their own layer-2 history; never fold them.
        o.controlEffects !== undefined ||
        !this.isStackableTokenName(printedCardName(o)) ||
        // A vanilla token that's been *granted* an activated ability
        // (Cryptolith Rite) has to be tapped one at a time — until there are
        // more of them than MAX_MATERIALIZED, where resource safety wins and
        // they fold back like any other (a Scute Swarm under Cryptolith Rite
        // otherwise grew the board past 290 objects and crawled).
        (this.effectiveActivated(id).length > 0 &&
          this.separateTokenCount(o) <= Game.MAX_WOKEN_TOKENS)
      ) {
        continue;
      }
      // The same key `findMergeableStack` compares a new batch on.
      const shape = this.tokenFoldKey(o);
      const group = groups.get(shape);
      if (group === undefined) groups.set(shape, [id]);
      else group.push(id);
    }
    const merged: ObjectId[] = [];
    for (const group of groups.values()) {
      if (group.length < 2) continue;
      const worthIt =
        group.length >= Game.STACK_ORIGIN_THRESHOLD ||
        group.some((id) => (this.state.objects[id].stackCount ?? 1) > 1);
      if (!worthIt) continue;
      const into = this.state.objects[group[0]];
      for (const id of group.slice(1)) {
        into.stackCount = (into.stackCount ?? 1) + (this.state.objects[id].stackCount ?? 1);
        merged.push(id);
      }
    }
    if (merged.length === 0) return;
    const gone = new Set(merged);
    this.state.zones.shared.battlefield = this.state.zones.shared.battlefield.filter(
      (id) => !gone.has(id),
    );
    for (const id of merged) delete this.state.objects[id];
  }

  /** If `ref` names a compacted stack, split one member off and return a ref
   * to that new individual instead — see `splitOneFromStack`. Used wherever
   * an effect singles out *one* object (as opposed to a mass effect
   * uniformly hitting every matching permanent, which should mutate a stack
   * directly and never needs to split). */
  private splitTargetRef(ref: TargetRef): TargetRef {
    if (ref.kind !== "object") return ref;
    const split = this.splitOneFromStack(ref.object);
    return split === ref.object ? ref : { kind: "object", object: split };
  }

  /**
   * Lock in the targets a spell or ability goes on the stack with (rules
   * 601.2c, 602.2b, 603.3d): one that names a compacted token stack becomes
   * one token peeled off it, so from then on the target is a single real
   * object. A spell targets one token, not the stack.
   *
   * Done once, here, rather than by each effect step as it resolves. Each
   * step used to peel off its own token, so Tamiyo's Safekeeping gave
   * hexproof to one token and indestructible to another, and Act of Treason
   * stole one, untapped a second and hasted a third. Locking in also means a
   * copy of the spell targets the same token (rule 707.10), an opponent can
   * answer by targeting that token, and the spell fizzles if it's gone.
   *
   * Called once the costs are paid, so a cost that taps or sacrifices every
   * token of the same stack still finds each one. A stack named in two slots
   * gives each its own token, as a repeated id in a sacrifice or tap-cost
   * answer does. `skip` are slots the triggering event filled
   * (`autoTargetSlots`): nobody chose them, and they're left as they are.
   */
  private lockInTargets(
    targets: ResolvedTargets,
    skip: readonly number[] = [],
  ): ResolvedTargets {
    return targets.map((ref, i) => {
      if (ref === undefined || ref.kind !== "object" || skip.includes(i)) return ref;
      if (this.state.objects[ref.object]?.zone !== "battlefield") return ref;
      return this.splitTargetRef(ref);
    });
  }

  /** Run automatic game actions until the game ends. */
  advance(): void {
    this.runUntil(() => this.state.result.over);
  }

  /** Run automatic game actions until `predicate` holds or the game ends. */
  advanceUntil(predicate: (state: GameState) => boolean): void {
    this.runUntil(() => this.state.result.over || predicate(this.state));
  }

  private runUntil(done: () => boolean): void {
    let guard = 0;
    while (!done()) {
      guard += 1;
      if (guard > ADVANCE_BUDGET) {
        throw new Error("Game.advance exceeded its budget; likely an engine bug");
      }
      this.tick();
    }
  }

  private tick(): void {
    this.runStateBasedActions();
    if (this.state.result.over) return;

    // The sweep above can raise a decision mid-tick — a commander dying to
    // lethal damage owes its owner the 903.9a choice, and
    // `runStateBasedActions` stops once the sweep that raised it is done.
    // `prepareForPriority` hands that
    // player priority on the paths that go through it, but this one doesn't:
    // without this, whoever already held priority is asked to act while a
    // declaration is pending, and passing throws.
    if (
      this.state.awaiting !== null &&
      this.state.priority.holder !== this.state.awaiting.player
    ) {
      this.grantPriority(this.state.awaiting.player);
    }

    if (this.state.priority.active && this.state.priority.holder !== null) {
      const holder = this.state.priority.holder;
      const view = this.controllerView(holder);
      const action = this.controllers[holder].act(view);
      if (actionPlayer(action) !== holder) {
        throw new Error(
          `controller for ${holder} returned an action for ${actionPlayer(action)}`,
        );
      }
      this.dispatch(action);
      return;
    }

    // Steps without priority (untap, cleanup) have already run their
    // turn-based actions in enterStep; advance to the next step.
    this.endStep();
  }

  // --- setup ----------------------------------------------------------

  private setup(
    decks: readonly DeckList[],
    shuffleLibrary: boolean,
    mulligans: boolean,
  ): void {
    for (const { player, cards, commander, commanders, printings } of decks) {
      const commanderNames = commanders ?? (commander !== undefined ? [commander] : []);
      this.state.players[player] = createPlayerState(player, this.state.rules);
      // Copied, not aliased: `GameState` has to stay a self-contained,
      // `structuredClone`-able tree, and a caller's object is neither.
      this.state.players[player].printings = { ...printings };
      this.state.zones.perPlayer[player] = {
        library: [],
        hand: [],
        graveyard: [],
      };

      const ids: ObjectId[] = [];
      for (const name of cards) {
        ids.push(this.makeCardObject(name, player));
      }
      this.state.zones.perPlayer[player].library = shuffleLibrary
        ? shuffle(ids, this.rng)
        : ids;

      for (const commanderName of commanderNames) {
        const id = this.makeCardObject(commanderName, player, {
          zone: "command",
          isCommander: true,
        });
        this.state.zones.shared.command.push(id);
      }
    }
    this.state.rngState = this.rng.seed;

    this.emit({
      type: "game-started",
      players: [...this.state.turnOrder],
      startingPlayer: this.state.startingPlayer,
      seed: this.state.seed,
    });

    if (mulligans) {
      this.beginMulligans();
      return;
    }
    for (const player of this.state.turnOrder) {
      for (let i = 0; i < this.state.rules.openingHandSize; i += 1) {
        this.drawCard(player);
      }
    }

    this.beginTurn();
  }

  /**
   * Deals opening hands, then runs the London mulligan phase. Every player is
   * asked to keep-or-mulligan **at the same time** — they act in parallel, in
   * whatever order they choose, not turn order (rule 103.4 — a player never
   * waits on another to make their own mulligan decision). Each player loops
   * their own decide → (mulligan → decide)* → keep → (bottom `taken` cards)
   * independently; turn 1 begins once every player has finished.
   */
  private beginMulligans(): void {
    const hands: Record<string, MulliganHandState> = {};
    for (const player of this.state.turnOrder) {
      for (let i = 0; i < this.state.rules.openingHandSize; i += 1) {
        this.drawCard(player);
      }
      hands[player] = { taken: 0, step: "decide" };
    }
    this.state.awaiting = { kind: "mulligan", player: this.state.turnOrder[0], hands };
    this.prepareForPriority(this.state.turnOrder[0]);
  }

  /** After a mulligan-phase action: if anyone is still to act, keep the phase
   * open (repointing `awaiting.player` at the lowest-turn-order such player);
   * otherwise begin turn 1. */
  private advanceMulliganPhase(hands: Record<string, MulliganHandState>): void {
    const next = this.state.turnOrder.find((p) => hands[p] !== undefined);
    if (next === undefined) {
      this.state.awaiting = null;
      this.beginTurn();
      return;
    }
    this.state.awaiting = { kind: "mulligan", player: next, hands };
    this.prepareForPriority(next);
  }

  private applyMulligan(player: PlayerId, keep: boolean): void {
    const why = this.whyCannotMulligan(player);
    if (why !== null) throw new Error(why);

    const awaiting = this.state.awaiting;
    if (awaiting === null || awaiting.kind !== "mulligan") {
      throw new Error("unreachable: whyCannotMulligan should have caught this");
    }
    const hands = { ...awaiting.hands };
    const taken = hands[player].taken;

    if (!keep) {
      const hand = [...this.state.zones.perPlayer[player].hand];
      for (const id of hand) this.moveObject(id, "library");
      this.state.zones.perPlayer[player].library = shuffle(
        this.state.zones.perPlayer[player].library,
        this.rng,
      );
      this.state.rngState = this.rng.seed;
      for (let i = 0; i < this.state.rules.openingHandSize; i += 1) {
        this.drawCard(player);
      }
      this.emit({ type: "mulligan-taken", player, count: taken + 1 });
      hands[player] = { taken: taken + 1, step: "decide" };
      this.advanceMulliganPhase(hands);
      return;
    }

    this.emit({ type: "hand-kept", player, mulligans: taken });
    if (this.mulliganCardsOwed(taken) > 0) {
      hands[player] = { taken, step: "bottom" };
    } else {
      delete hands[player];
    }
    this.advanceMulliganPhase(hands);
  }

  /** How many cards a player who has taken `taken` mulligans owes to the
   * bottom of their library on keeping (rule 103.4, or the traditional
   * Commander waiver on the first one — `GameRules.freeFirstMulligan`). */
  private mulliganCardsOwed(taken: number): number {
    return mulliganCardsOwed(taken, this.state.rules.freeFirstMulligan);
  }

  /** Kept because the matching apply validates before applying and throws;
   * the rules live in `decisions/mulligan.ts`. */
  private whyCannotMulligan(player: PlayerId): string | null {
    return mulligan.whyCannot(this.decisionCtx, { type: "mulligan", player, keep: false }, player);
  }

  private applyPutOnBottom(player: PlayerId, cards: readonly ObjectId[]): void {
    const why = this.whyCannotPutOnBottom(player, cards);
    if (why !== null) throw new Error(why);
    const awaiting = this.state.awaiting;
    if (awaiting === null || awaiting.kind !== "mulligan") {
      throw new Error("unreachable: whyCannotPutOnBottom should have caught this");
    }

    for (const id of cards) this.moveObject(id, "library");
    this.emit({ type: "cards-put-on-bottom", player, objects: [...cards] });
    const hands = { ...awaiting.hands };
    delete hands[player];
    this.advanceMulliganPhase(hands);
  }

  /** Kept because the matching apply validates before applying and throws;
   * the rules live in `decisions/mulligan.ts`. */
  private whyCannotPutOnBottom(
    player: PlayerId,
    cards: readonly ObjectId[],
  ): string | null {
    return mulligan.whyCannot(this.decisionCtx, { type: "put-on-bottom", player, cards }, player);
  }

  /**
   * Answers a pending `commander-replacement` decision (rule 903.9a) and
   * *then* performs the move that was deferred — straight to the command zone
   * if the owner chose that, otherwise to the zone it was headed for. Because
   * the move happens here (not before the decision), a "dies" trigger fires
   * only when the commander actually lands in a graveyard.
   */
  private applyCommanderChoice(player: PlayerId, toCommandZone: boolean): void {
    const why = this.whyCannotCommanderChoice(player);
    if (why !== null) throw new Error(why);
    const deferred = this.state.deferredCommanderMove;
    if (deferred === null) {
      throw new Error("unreachable: whyCannotCommanderChoice should have caught this");
    }

    const { commander, intendedZone, exiledBy, leftWith } = deferred;
    this.state.awaiting = null;
    const destination = toCommandZone ? "command" : intendedZone;
    // The move completes the simultaneous event that deferred it (a wrath,
    // a state-based sweep), so what left in that event sees it go, and it
    // them (rule 603.10a).
    this.withLeaveBatch(() => {
      // This is the move the choice was about, so `moveObject` mustn't defer
      // it again.
      this.completingCommanderMove = commander;
      try {
        this.moveObject(commander, destination);
      } finally {
        this.completingCommanderMove = null;
      }
      this.state.deferredCommanderMove = null;
      // Banishing Light's link, which couldn't be set while the move waited.
      if (exiledBy !== undefined && this.state.objects[commander]?.zone === "exile") {
        this.state.objects[commander].exiledBy = exiledBy;
      }

      if (!toCommandZone && intendedZone === "graveyard") {
        // It really was put into a graveyard from the battlefield — a "dies"
        // event (rule 700.4). Emitting it here (not in `moveObject`) keeps
        // the non-commander death path untouched.
        this.emit({
          type: "permanent-destroyed",
          object: commander,
          reason: "put into its owner's graveyard",
        });
      }
    }, leftWith);
    this.emit({
      type: "commander-zone-decision",
      object: commander,
      toCommandZone,
      from: intendedZone,
    });

    // A blink (Essence Flux) whose exile half raised this choice: finish it if
    // the card really did end up in exile. Choosing the command zone instead
    // takes the card somewhere the blink can't reach, so it just stays there.
    const blink = this.state.pendingFlickerReturns.find((b) => b.object === commander);
    if (blink !== undefined) {
      this.state.pendingFlickerReturns = this.state.pendingFlickerReturns.filter(
        (b) => b !== blink,
      );
      if (this.state.objects[commander]?.zone === "exile") {
        this.emit({ type: "permanent-exiled", object: commander });
        if (blink.link !== undefined) {
          // A delayed return (Norin): the card waits in exile for it.
          this.state.objects[commander].flickerLink = blink.link;
        } else {
          this.completeFlickerReturn([commander], blink.counters, blink.returnUnder);
        }
      }
    }

    this.prepareForPriority(this.activePlayer);
  }

  /**
   * Puts the next owed 903.9a choice on `awaiting`, if nothing else is there.
   *
   * First a deferred choice whose question was overwritten: Path to Exile
   * defers its commander's exile, then carries straight on into "its
   * controller may search", whose own decision replaces the question. The
   * move is still owed once the search is answered, and asking again is what
   * stops it being lost — before this, the commander never left and
   * `deferredCommanderMove` stayed set for the rest of the game, so every
   * later commander moved without its owner being asked at all.
   *
   * Then whatever queued behind it in `pendingCommanderMoves`. An entry whose
   * commander has since left the battlefield some other way is dropped, so a
   * stale one can never wedge the queue.
   */
  private raiseNextCommanderChoice(): void {
    const state = this.state;
    if (state.awaiting !== null) return;
    // Where it waits: the battlefield, or for a return to hand from anywhere
    // else (rule 903.9b) the zone it's still in.
    const stillHere = (id: ObjectId, zone: ZoneType): boolean => state.objects[id]?.zone === zone;
    for (;;) {
      if (state.deferredCommanderMove === null) {
        const next = state.pendingCommanderMoves.shift();
        if (next === undefined) return;
        state.deferredCommanderMove = next;
      }
      const { commander, intendedZone, from } = state.deferredCommanderMove;
      if (stillHere(commander, from ?? "battlefield")) {
        state.awaiting = {
          kind: "commander-replacement",
          player: state.objects[commander].owner,
          commander,
          intendedZone,
        };
        return;
      }
      state.deferredCommanderMove = null;
    }
  }

  /**
   * Offer the next shock land in `pendingPayLifeForUntapped` its "pay N life
   * to untap it" choice, if nothing else is being asked. A land that has left
   * the battlefield, changed control or been untapped since it entered has
   * nothing left to offer, and neither does one whose controller can no
   * longer afford the life, so those are dropped.
   */
  private raiseNextPayLifeOffer(): void {
    const state = this.state;
    if (state.awaiting !== null) return;
    for (;;) {
      const offer = state.pendingPayLifeForUntapped.shift();
      if (offer === undefined) return;
      const land = state.objects[offer.source];
      if (land?.zone !== "battlefield" || land.controller !== offer.player || !land.tapped) {
        continue;
      }
      if (state.players[offer.player].life < offer.life) continue;
      state.awaiting = { kind: "pay-life-for-untapped", ...offer };
      return;
    }
  }

  /** Kept because `applyCommanderChoice` validates before applying and
   * throws; the rule lives in `decisions/commander-replacement.ts`. */
  private whyCannotCommanderChoice(player: PlayerId): string | null {
    return commanderReplacement.whyCannot(
      this.decisionCtx,
      { type: "commander-replacement", player, toCommandZone: false },
      player,
    );
  }

  /** Kept because `applyPayLifeForUntapped` validates before applying and
   * throws; the rule itself lives in `decisions/pay-life-for-untapped.ts`. */
  private whyCannotPayLifeForUntapped(player: PlayerId): string | null {
    return payLifeForUntapped.whyCannot(
      this.decisionCtx,
      { type: "pay-life-for-untapped", player, pay: false },
      player,
    );
  }

  /** Answer a `pay-life-for-untapped` decision (a shock land — rule 614.13). */
  private applyPayLifeForUntapped(player: PlayerId, pay: boolean): void {
    const why = this.whyCannotPayLifeForUntapped(player);
    if (why !== null) throw new Error(why);
    const awaiting = this.state.awaiting;
    if (awaiting === null || awaiting.kind !== "pay-life-for-untapped") {
      throw new Error("no shock-land decision pending");
    }
    const { source, life } = awaiting;
    this.state.awaiting = null;
    const object = this.state.objects[source];
    if (pay && object !== undefined && object.zone === "battlefield") {
      object.tapped = false;
      this.emit({ type: "permanent-untapped", object: source });
      this.changeLife(player, -life);
    }
    this.prepareForPriority(this.activePlayer);
  }

  /** A Clone-style permanent just entered — ask its controller what to copy
   * (rule 707). With nothing legal to copy this doesn't pause: the permanent
   * stays itself (a 0/0 Clone, which then dies to an SBA). */
  private beginCopyChoice(cloneId: ObjectId, controller: PlayerId): void {
    const options = this.state.zones.shared.battlefield.filter((id) => {
      if (id === cloneId) return false;
      const object = this.state.objects[id];
      return this.registry.get(printedCardName(object)).types.includes("creature");
    });
    if (options.length === 0) return;
    this.state.awaiting = { kind: "choose-copy", player: controller, source: cloneId, options };
  }

  /** Answers a pending `choose-copy` decision (rule 707). */
  private applyCopyChoice(player: PlayerId, copy: ObjectId | null): void {
    const why = this.whyCannotCopyChoice(player, copy);
    if (why !== null) throw new Error(why);
    const awaiting = this.state.awaiting;
    if (awaiting === null || awaiting.kind !== "choose-copy") {
      throw new Error("unreachable: whyCannotCopyChoice should have caught this");
    }

    const clone = this.state.objects[awaiting.source];
    if (copy !== null) {
      // Copy the *copiable* values — for our model, the copied card's printed
      // name, which every characteristic read resolves through.
      clone.copyOf = printedCardName(this.state.objects[copy]);
    }
    this.emit({ type: "permanent-copied", object: awaiting.source, copyOf: clone.copyOf });
    this.state.awaiting = null;
    this.prepareForPriority(this.activePlayer);
  }

  /** Kept because `applyCopyChoice` validates before applying and throws;
   * the rule itself lives in `decisions/choose-copy.ts`. */
  private whyCannotCopyChoice(player: PlayerId, copy: ObjectId | null): string | null {
    return chooseCopy.whyCannot(this.decisionCtx, { type: "choose-copy", player, copy }, player);
  }

  /**
   * Raise a `choose-creature-type` decision. With no `options` it's a real
   * creature-type choice over the whole catalog (rule 205.3m); with `options`
   * it's a short fixed menu (Heraldic Banner's colours). `resume` carries a
   * resolving spell's `then`, targets and X — see the
   * `"choose-creature-type"` effect.
   */
  private beginCreatureTypeChoice(
    sourceId: ObjectId,
    controller: PlayerId,
    options?: readonly string[],
    resume?: { then: EffectSpec; targets: ResolvedTargets; x: number },
  ): void {
    this.state.awaiting = {
      kind: "choose-creature-type",
      player: controller,
      source: sourceId,
      options: options ?? CREATURE_TYPES,
      catalog: options === undefined,
      ...(resume !== undefined ? resume : {}),
    };
  }


  /** Answers a pending `choose-creature-type` decision. */
  private applyCreatureTypeChoice(player: PlayerId, creatureType: string): void {
    const why = this.whyCannotCreatureTypeChoice(player, creatureType);
    if (why !== null) throw new Error(why);
    const awaiting = this.state.awaiting;
    if (awaiting === null || awaiting.kind !== "choose-creature-type") {
      throw new Error("unreachable: whyCannotCreatureTypeChoice should have caught this");
    }
    this.emit({
      type: "creature-type-chosen",
      object: awaiting.source,
      creatureType,
    });
    this.state.awaiting = null;

    if (awaiting.then !== undefined) {
      // A resolving spell or ability ("choose a creature type, then …"):
      // finish its resolution with the answer substituted in.
      applyEffectSpec(
        substituteChosenCreatureType(awaiting.then, creatureType),
        this.makeResolutionContext(
          awaiting.source,
          player,
          awaiting.targets ?? [],
          awaiting.x ?? 0,
        ),
      );
    } else {
      // A permanent entering. The same decision serves both "choose a
      // creature type" (Urza's Incubator, which feeds a cost check) and the
      // general "as this enters, choose …" (Heraldic Banner, Frontier
      // Siege). Record it in both places so each reader finds it where it
      // expects.
      const source = this.state.objects[awaiting.source];
      source.chosenCreatureType = creatureType;
      source.chosenOnEnter = creatureType;
    }
    if (this.state.awaiting === null) this.prepareForPriority(this.activePlayer);
  }

  /** Kept because `applyCreatureTypeChoice` validates before applying and
   * throws; the rule lives in `decisions/choose-creature-type.ts`. */
  private whyCannotCreatureTypeChoice(player: PlayerId, creatureType: string): string | null {
    return chooseCreatureType.whyCannot(
      this.decisionCtx,
      { type: "choose-creature-type", player, creatureType },
      player,
    );
  }

  /** Raise a `choose-modes` decision (a modal spell/ability, or a "you may"
   * clause — rule 700.2 / 601.3e). The chosen modes' effects apply in
   * `applyModesChoice` once the controller answers. */
  private beginModesChoice(
    source: ObjectId,
    controller: PlayerId,
    x: number,
    minModes: number,
    maxModes: number,
    modes: readonly ModeOption[],
    onDecline?: EffectSpec,
    targets: ResolvedTargets = [],
    cost?: string,
    triggerValue = 0,
    triggerObject?: ObjectId,
    /** Whose effect `onDecline` is, if not the chooser's — see the
     * `choose-modes` decision's `declineController`. */
    declineController?: PlayerId,
    /** The resolving spell's or ability's last-known references and target
     * zones, carried to the modes — see `choose-modes`' `lastKnownRefs`. */
    lastKnownRefs?: LastKnownRefs,
    targetZones?: readonly (ZoneType | null)[],
    /** The ability choosing (`ResolutionContext.abilityKey`); whether only
     * modes it hasn't had chosen this turn are offered — `modal`'s
     * `notChosenThisTurn`, `may`'s `oncePerTurn`; and the life and energy
     * parts of a `may`'s cost. */
    ability: {
      readonly key?: string;
      readonly notChosenThisTurn?: boolean;
      readonly costLife?: number;
      readonly costEnergy?: number;
    } = {},
  ): void {
    const key = ability.key;
    const decline = (): void => {
      if (onDecline === undefined) return;
      applyEffectSpec(
        onDecline,
        this.makeResolutionContext(
          source,
          declineController ?? controller,
          targets,
          x,
          triggerValue,
          triggerObject,
          1,
          0,
          targetZones ?? [],
          lastKnownRefs,
          key !== undefined ? { abilityKey: key } : {},
        ),
      );
    };
    // "Choose one that hasn't been chosen this turn" / "do this only once
    // each turn": the modes this ability already had chosen are gone, and
    // with none left there is nothing to choose — a `may` falls to its "if
    // you don't".
    const onlyUnchosen = ability.notChosenThisTurn === true && key !== undefined;
    const chosenBefore = onlyUnchosen ? (this.state.modesChosenThisTurn?.[key] ?? []) : [];
    const offered = modes.map((_mode, i) => i).filter((i) => !chosenBefore.includes(i));
    if (offered.length === 0 && modes.length > 0) {
      decline();
      return;
    }
    // "You may pay {B}" — an unpayable cost isn't a choice at all, so skip
    // straight to the decline branch rather than offering something the
    // player can't take (rule 601.2h / 608.2).
    const costParsed = cost !== undefined ? parseManaCost(cost) : null;
    // With `{X}` the cost is affordable whenever X=0 is, so check that
    // baseline rather than the literal string.
    const baseline =
      costParsed === null
        ? null
        : { ...costParsed, generic: costParsed.generic, x: 0 };
    if (baseline !== null && this.payMana(controller, baseline) === null) {
      decline();
      return;
    }
    const costLife = Math.max(0, ability.costLife ?? 0);
    const costEnergy = Math.max(0, ability.costEnergy ?? 0);
    if (!this.canPayLifeAndEnergy(controller, costLife, costEnergy)) {
      decline();
      return;
    }
    this.state.awaiting = {
      kind: "choose-modes",
      player: controller,
      source,
      minModes: Math.min(minModes, offered.length),
      maxModes: Math.min(maxModes, offered.length),
      modes: offered.map((i) => ({ text: modes[i].text, effect: modes[i].effect })),
      x,
      targets,
      ...(triggerValue !== 0 ? { triggerValue } : {}),
      ...(triggerObject !== undefined ? { triggerObject } : {}),
      ...(lastKnownRefs !== undefined && Object.keys(lastKnownRefs).length > 0
        ? { lastKnownRefs }
        : {}),
      ...(targetZones !== undefined && targetZones.length > 0 ? { targetZones } : {}),
      ...(onDecline !== undefined ? { onDecline } : {}),
      ...(declineController !== undefined && declineController !== controller
        ? { declineController }
        : {}),
      ...(cost !== undefined ? { cost } : {}),
      ...(key !== undefined ? { abilityKey: key } : {}),
      ...(onlyUnchosen ? { notChosenThisTurn: offered } : {}),
      ...(costLife > 0 ? { costLife } : {}),
      ...(costEnergy > 0 ? { costEnergy } : {}),
    };
  }

  /** Can `player` pay `life` life (rule 119.4: only with at least that much;
   * paying 0 always) and `energy` energy? */
  private canPayLifeAndEnergy(player: PlayerId, life: number, energy: number): boolean {
    const ps = this.state.players[player];
    return (life <= 0 || ps.life >= life) && (energy <= 0 || ps.energy >= energy);
  }

  /** Answers a pending `choose-modes` decision. Applies the chosen modes'
   * effects, in listed order, against a fresh context for the source. */
  private applyModesChoice(
    player: PlayerId,
    modeIndices: readonly number[],
    xValue?: number,
  ): void {
    const why = this.whyCannotChooseModes(player, modeIndices);
    if (why !== null) throw new Error(why);
    const awaiting = this.state.awaiting;
    if (awaiting === null || awaiting.kind !== "choose-modes") {
      throw new Error("unreachable: whyCannotChooseModes should have caught this");
    }

    const { source, modes, x, onDecline, targets, cost, triggerValue, triggerObject, ward } =
      awaiting;
    const lastKnownRefs = awaiting.lastKnownRefs;
    const targetZones = awaiting.targetZones ?? [];
    this.state.awaiting = null;

    // Pay for the choice before applying it. The cost was checked as
    // affordable when the decision was raised, but the board can have moved
    // on in between (a mana source sacrificed in response), so a failed
    // payment falls back to the decline branch rather than giving it away.
    let chosen = [...modeIndices];
    let chosenX = 0;
    // A `may`'s life and energy are part of the same cost: all of it is paid,
    // or none (a board that moved since the question was asked declines).
    const costLife = awaiting.costLife ?? 0;
    const costEnergy = awaiting.costEnergy ?? 0;
    if (chosen.length > 0 && !this.canPayLifeAndEnergy(player, costLife, costEnergy)) chosen = [];
    if (cost !== undefined && chosen.length > 0) {
      const parsed = parseManaCost(cost);
      chosenX = parsed.x > 0 ? Math.max(0, Math.floor(xValue ?? 0)) : 0;
      const concrete = {
        ...parsed,
        generic: parsed.generic + parsed.x * chosenX,
        x: 0,
      };
      const payment = this.payMana(player, concrete);
      if (payment === null) chosen = [];
      else this.executePayment(player, payment);
    }
    if (chosen.length > 0) {
      if (costLife > 0) this.changeLife(player, -costLife);
      if (costEnergy > 0) this.changeEnergy(player, -costEnergy);
    }
    // Listed order, not the order the player named them (rule 700.2b).
    const ordered = chosen.sort((a, b) => a - b);
    // Offered out of fewer than all of them ("that hasn't been chosen this
    // turn"): which of the ability's own modes these are, recorded as used.
    const unchosen = awaiting.notChosenThisTurn;
    const own = unchosen === undefined ? ordered : ordered.map((i) => unchosen[i]);
    const abilityKey = awaiting.abilityKey;
    if (unchosen !== undefined && abilityKey !== undefined && own.length > 0) {
      const record = (this.state.modesChosenThisTurn ??= {});
      record[abilityKey] = [...(record[abilityKey] ?? []), ...own];
    }
    this.emit({ type: "modes-chosen", source, modes: own });
    // The X paid for the choice is what the mode's effect reads (Flameblast
    // Dragon's "it deals X damage"), overriding the ability's own X, which is
    // 0 on a trigger.
    const context = this.makeResolutionContext(
      source,
      player,
      targets,
      chosenX > 0 ? chosenX : x,
      triggerValue ?? 0,
      triggerObject,
      1,
      0,
      targetZones,
      lastKnownRefs,
      abilityKey !== undefined ? { abilityKey } : {},
    );
    for (const i of ordered) applyEffectSpec(modes[i].effect, context);
    // Logged once the payment has been made, and ahead of the counter.
    if (ward !== undefined) {
      this.emit(
        ordered.length > 0
          ? { type: "ward-paid", object: ward.warded, player }
          : { type: "ward-unpaid", object: ward.warded, player, spell: ward.spell },
      );
    }
    if (ordered.length === 0 && onDecline !== undefined) {
      const declinedBy = awaiting.declineController;
      applyEffectSpec(
        onDecline,
        declinedBy === undefined
          ? context
          : this.makeResolutionContext(
              source,
              declinedBy,
              targets,
              chosenX > 0 ? chosenX : x,
              triggerValue ?? 0,
              triggerObject,
              1,
              0,
              targetZones,
              lastKnownRefs,
              abilityKey !== undefined ? { abilityKey } : {},
            ),
      );
    }

    // A mode's effect may itself raise a decision (rare); otherwise resume.
    if (this.state.awaiting === null) this.prepareForPriority(this.activePlayer);
  }

  /** Kept because `applyModesChoice` validates before applying and throws;
   * the rules live in `decisions/choose-modes.ts`. */
  private whyCannotChooseModes(
    player: PlayerId,
    modeIndices: readonly number[],
  ): string | null {
    return chooseModes.whyCannot(
      this.decisionCtx,
      { type: "choose-modes", player, modes: modeIndices },
      player,
    );
  }

  /** Answers a pending `choose-targets` decision (ROADMAP Phase 11 EG-1) — a
   * triggered ability, or a suspended spell coming off suspend. Mints the
   * ability / commits the free cast with the chosen targets, then resumes. */
  private applyChooseTargets(player: PlayerId, chosen: ResolvedTargets): void {
    const why = this.whyCannotChooseTargets(player, chosen);
    if (why !== null) throw new Error(why);
    this.state.awaiting = null;

    const trig = this.state.pendingTargetedTrigger;
    const cast = this.state.pendingTargetedCast;
    if (trig !== null) {
      this.state.pendingTargetedTrigger = null;
      const queue = [...chosen];
      const targets = trig.slots.map((s) =>
        "auto" in s ? s.auto : (queue.shift() as TargetRef),
      );
      this.mintTriggerAbility(
        trig.sourceObjectId,
        trig.cardName,
        trig.controller,
        trig.abilityKind,
        trig.abilityIndex,
        targets,
        trig.triggerValue,
        trig.triggerObject,
        undefined,
        trig.grantedAbility,
        autoSlotsOf(trig.slots),
        trig.x,
        trig.lastKnownRefs,
        trig.targetedBy,
        trig.reflexive,
      );
    } else if (cast !== null) {
      this.state.pendingTargetedCast = null;
      if (!this.commitFreeCast(cast.cardId, cast.via, cast.grantHaste, [...chosen])) {
        this.abandonSuspendedCast(cast.cardId, "cost increase can't be paid");
      }
      // Other suspended cards owed a free cast this upkeep (rule 702.62e).
      while (this.state.pendingSuspendedCasts.length > 0 && this.state.awaiting === null) {
        const next = this.state.pendingSuspendedCasts.shift();
        if (next !== undefined) this.castSuspendedCard(next);
      }
    }
    if (this.state.awaiting === null) this.prepareForPriority(this.activePlayer);
  }

  /**
   * Why `chosen` isn't a valid filling of `specs`, or `null` if it is.
   *
   * The one place that decides a **hole** is allowed: a slot declared
   * `{ kind: "optional" }` ("up to one target creature") may be left empty,
   * every other slot must be filled with a currently-legal target, and the
   * arity must match either way — "up to two" is two optional slots, not a
   * variable count, so the shape of `targets` always mirrors the spec list
   * and each effect's `target:` index stays a fixed position.
   */
  private whyTargetsInvalid(
    specs: readonly TargetSpec[],
    chosen: ResolvedTargets,
    player: PlayerId,
    name: string,
    source?: TargetSource,
  ): string | null {
    return invalidTargetReason(
      this.state,
      this.registry,
      specs,
      chosen,
      player,
      name,
      source,
    );
  }


  /** Kept because `applyChooseTargets` validates before applying and
   * throws; the rules live in `decisions/choose-targets.ts`. */
  private whyCannotChooseTargets(
    player: PlayerId,
    chosen: ResolvedTargets,
  ): string | null {
    return chooseTargets.whyCannot(
      this.decisionCtx,
      // `chosen` is already normalised; `normalizeTargets` is idempotent, so
      // handing the module the action shape it expects costs nothing.
      { type: "choose-targets", player, targets: chosen.map((ref) => ref ?? null) },
      player,
    );
  }

  private mintObjectId(): ObjectId {
    const n = this.state.nextObjectSeq;
    this.state.nextObjectSeq += 1;
    return asObjectId(`obj-${n}`);
  }

  /** Mint a fresh card {@link GameObject} in the given hidden zone (default
   * `"library"`), registered in `state.objects` but not yet added to any zone
   * list. The single canonical "new card object" shape — `setup` and
   * {@link debugSpawn} both build cards through here. */
  private makeCardObject(
    name: string,
    player: PlayerId,
    opts: { zone?: ZoneType; isCommander?: boolean } = {},
  ): ObjectId {
    const def = this.registry.get(name); // validates the name up front
    const id = this.mintObjectId();
    this.state.objects[id] = {
      id,
      cardName: name,
      ...(def.faces !== null ? { faces: def.faces, face: 0 } : {}),
      owner: player,
      controller: player,
      zone: opts.zone ?? "library",
      tapped: false,
      damageMarked: 0,
      markedByDeathtouch: false,
      enteredBattlefieldOnTurn: null,
      summoningSick: false,
      loyaltyActivatedThisTurn: false,
      targets: null,
      attacking: null,
      blocking: null,
      blockedBy: [],
      blocked: false,
      kind: "card",
      abilityKind: null,
      sourceObjectId: null,
      abilityIndex: null,
      counters: {},
      modifiers: [],
      timestamp: 0,
      isToken: false,
      attachedTo: null,
      isCommander: opts.isCommander ?? false,
      xValue: null,
      controlEndsAtCleanup: false,
      copyOf: null,
    };
    return id;
  }

  /**
   * **Debug / sandbox only** — put a card straight into a zone, bypassing
   * drawing and casting. Used by `engine/src/sandbox.ts` (the card lab) and
   * ad-hoc scripts; never part of normal play. A move to `"battlefield"` /
   * `"graveyard"` / `"exile"` / `"hand"` goes through the real `moveObject`,
   * so enters-battlefield *replacements* (enters tapped, enters with
   * counters) and Aura attachment apply as usual.
   *
   * The entry is **not announced** unless `opts.announceEntry` is set, so no
   * enters-battlefield *trigger* fires — that's what keeps the helper usable
   * for setting up a board. Pass the flag when the entry is the thing under
   * test. Returns the new object's id.
   */
  debugSpawn(
    name: string,
    player: PlayerId,
    zone: ZoneType = "battlefield",
    opts: { tapped?: boolean; summoningSick?: boolean; announceEntry?: boolean } = {},
  ): ObjectId {
    const id = this.makeCardObject(name, player);
    this.state.zones.perPlayer[player].library.unshift(id);
    if (zone === "library") return id;
    this.moveObject(id, zone);
    const object = this.state.objects[id];
    // The library is only a staging point here, not where the card came
    // from: a card spawned into a graveyard wasn't milled.
    if (object !== undefined) object.putIntoGraveyardFromLibraryOnTurn = undefined;
    if (object !== undefined && object.zone === "battlefield") {
      if (opts.tapped) object.tapped = true;
      if (opts.summoningSick === false) object.summoningSick = false;
      // `moveObject` applies enters-battlefield *replacements* but does not
      // announce the entry — every ordinary caller emits that itself. So a
      // spawn is silent by default, which is what makes it usable for board
      // setup: spawning six lands shouldn't fire six landfall triggers.
      // `announceEntry` opts in when the entry itself is what's under test.
      if (opts.announceEntry === true) {
        this.emit({ type: "permanent-entered-battlefield", object: id });
      }
    }
    return id;
  }

  /**
   * **Debug / sandbox only** — resolve a bare {@link EffectSpec} as though
   * `player` controlled a source that produced it, with no card, no stack and
   * no cost. The sibling of {@link debugSpawn} for the *effect* vocabulary:
   * it lets a test exercise one effect kind directly instead of building a
   * card, casting it, and settling the stack around it.
   *
   * `source` defaults to a throwaway object id, which is fine for any effect
   * that doesn't read its own source; pass a real one for effects that do.
   */
  debugApplyEffect(
    player: PlayerId,
    effect: EffectSpec,
    targets: readonly TargetRef[] = [],
    opts: { source?: ObjectId; x?: number } = {},
  ): void {
    applyEffectSpec(
      effect,
      this.makeResolutionContext(
        opts.source ?? asObjectId("debug-effect-source"),
        player,
        targets,
        opts.x ?? 0,
      ),
    );
  }

  // --- turn / step progression --------------------------------------

  private beginTurn(): void {
    this.state.turn.number += 1;
    // Day/Night (rule 726.3/726.4) is checked as a turn begins, against the
    // spells the *previous* turn's active player cast that turn — captured now,
    // before the per-player counts are reset below. `null` on turn 1.
    const prevActive =
      this.state.turn.number > 1 ? this.activePlayer : null;
    const prevActiveSpells =
      prevActive !== null ? this.state.players[prevActive].spellsCastThisTurn : 0;
    // Fog's "prevent all combat damage this turn" shield and any one-shot
    // prevention shields lapse; a fresh turn owes no extra combats yet.
    this.state.preventAllCombatDamage = false;
    this.state.hexproofPlayers = [];
    this.state.creaturesDiedThisTurn = 0;
    // A reveal is public knowledge for as long as anyone could have acted on
    // it; past the turn it stops being rendered rather than lingering as a
    // permanent window into a hand.
    this.state.revealedThisTurn = [];
    delete this.state.ceasedTokens;
    this.state.abilityResolutionsThisTurn = {};
    delete this.state.modesChosenThisTurn;
    this.state.preventionShields = [];
    this.state.extraCombats = 0;
    this.state.spellsCastThisTurn = 0;
    // An extra turn (Time Warp — rule 500.7) is taken by the player at the
    // front of the queue instead of advancing the normal rotation.
    const extraFor = this.state.extraTurns.length > 0 ? this.state.extraTurns.shift() ?? null : null;
    if (extraFor !== null && this.state.turnOrder.includes(extraFor)) {
      this.state.turn.activePlayerIndex = this.state.turnOrder.indexOf(extraFor);
      this.state.turn.isExtra = true;
    } else {
      this.state.turn.isExtra = false;
      if (this.state.turn.number > 1) {
        // Skip anyone who has left the game (rule 800.4). Without this an
        // eliminated player kept taking turns: untapping, drawing and holding
        // priority in a game they are no longer in.
        const order = this.state.turnOrder;
        let index = this.state.turn.activePlayerIndex;
        for (let step = 1; step <= order.length; step += 1) {
          const candidate = (this.state.turn.activePlayerIndex + step) % order.length;
          if (!this.state.players[order[candidate]].hasLost) {
            index = candidate;
            break;
          }
        }
        this.state.turn.activePlayerIndex = index;
      }
    }
    for (const player of this.state.turnOrder) {
      this.state.players[player].landsPlayedThisTurn = 0;
      this.state.players[player].extraLandsThisTurn = 0;
      this.state.players[player].spellsCastThisTurn = 0;
      this.state.players[player].lifeLostThisTurn = 0;
      this.state.players[player].lifeGainedThisTurn = 0;
      this.state.players[player].cardsDrawnThisTurn = 0;
      this.state.players[player].drewInDrawStepThisTurn = false;
      this.state.players[player].spellsCastThisTurnIds = [];
      this.state.players[player].creaturesDiedThisTurn = 0;
      this.state.players[player].createdTokenThisTurn = false;
      this.state.players[player].usedGraveyardThisTurn = false;
    }
    // Day → night if the previous turn's player cast no spells (726.3);
    // night → day if they cast two or more (726.4). Only once it's day or night.
    if (prevActive !== null) {
      if (this.state.dayNight === "day" && prevActiveSpells === 0) {
        this.setDayNight("night");
      } else if (this.state.dayNight === "night" && prevActiveSpells >= 2) {
        this.setDayNight("day");
      }
    }
    this.emit({
      type: "turn-began",
      turn: this.state.turn.number,
      activePlayer: this.activePlayer,
      ...(this.state.turn.isExtra ? { extra: true } : {}),
    });
    this.enterStep("untap");
  }

  private enterStep(step: Step): void {
    this.state.turn.step = step;
    // Mana empties as each step and phase ends (rule 500.4), except units
    // whose source said otherwise — Savage Ventmaw's "you don't lose this
    // mana as steps and phases end". That permission is for the turn only, so
    // cleanup takes it away with everything else.
    const keepPersistent = step !== "cleanup";
    for (const player of this.state.turnOrder) {
      const pool = this.state.players[player].manaPool;
      const kept = keepPersistent ? pool.filter((unit) => unit.persists === true) : [];
      if (kept.length !== pool.length) {
        this.state.players[player].manaPool = kept;
      }
    }
    this.state.priority.active = false;
    this.state.priority.holder = null;
    this.state.priority.passed = [];
    this.emit({ type: "step-began", step, phase: PHASE_OF_STEP[step] });

    // Delayed triggered abilities waiting on this step (rule 603.7). Before
    // the turn-based actions, so an "at the beginning of the end step" ability
    // is on the stack when that step's priority window opens.
    this.fireDelayedTriggers(step);

    this.performTurnBasedActions(step);

    // A turn-based action may have asked a player for a declaration; that
    // player gets priority so they can dispatch it.
    if (this.state.awaiting !== null) {
      this.prepareForPriority(this.state.awaiting.player);
      return;
    }
    // A turn-based action already granted priority itself (the combat-damage
    // step, whose sub-passes grant their own windows — rule 510.4).
    if (this.state.priority.active) return;
    if (stepUsesPriority(step)) {
      this.prepareForPriority(this.activePlayer);
    } else {
      this.runStateBasedActions();
    }
  }

  /**
   * Repeatedly: perform state-based actions, then put any waiting triggered
   * abilities on the stack — until nothing more happens. Then grant priority.
   * A replacement (903.9a commander redirect) or an SBA (cleanup discard) may
   * raise a decision along the way; that player gets priority to answer it.
   */
  private prepareForPriority(player: PlayerId): void {
    let guard = 0;
    for (;;) {
      guard += 1;
      if (guard > 1000) {
        throw new Error("prepareForPriority did not settle; likely an engine bug");
      }
      // Before the SBAs, so a commander still waiting on the battlefield for
      // its 903.9a choice is asked about rather than swept up by them.
      this.raiseNextCommanderChoice();
      // Not partway through a resolution (rule 704.3): a spell that paused
      // to ask for a discard is still resolving until its last step is done.
      if (this.state.suspendedResolutions.length === 0) this.runStateBasedActions();
      if (this.state.result.over) return;
      // After the SBAs rather than before: several of them read a pending
      // decision as "my move was deferred".
      this.raiseNextPayLifeOffer();
      // An SBA / replacement raised a decision (e.g. a commander about to
      // leave the battlefield owes its owner a 903.9a choice) — hand that
      // player priority to answer it. `apply…Choice` calls back into here.
      if (this.state.awaiting !== null) {
        this.grantPriority(this.state.awaiting.player);
        return;
      }
      // Carry out a mass-destroy (Wrath of God) that began while another
      // decision was being answered.
      if (this.state.pendingDestruction.length > 0) {
        this.drainPendingDestruction();
        continue;
      }
      // "Each opponent discards a card": the next player owed a choice.
      if (this.state.pendingDiscards.length > 0) {
        this.promptNextDiscard();
        continue;
      }
      // Work through a sacrifice effect (Diabolic Edict / Fleshbag Marauder):
      // ask each player who has a choice in turn, then sacrifice everything
      // chosen at once (rule 101.4) — so an aristocrat sacrificed to one
      // player's edict still sees the others' victims die.
      if (this.state.pendingSacrifices.length > 0) {
        this.promptNextSacrifice();
        continue;
      }
      if (this.state.pendingSacrificeVictims.length > 0) {
        this.drainPendingSacrificeVictims();
        continue;
      }
      // Everything a suspended resolution was waiting on has been answered:
      // carry on with the rest of it, before any trigger goes on the stack.
      if (this.state.suspendedResolutions.length > 0) {
        this.resumeSuspendedResolution();
        continue;
      }
      if (!this.placePendingTriggers()) break;
    }
    // Nothing is waiting on anyone, so whatever resolved last is no longer
    // the reason for anything — see `GameState.decisionSource`.
    this.state.decisionSource = null;
    this.grantPriority(player);
  }

  private endStep(): void {
    // Between the first-strike and regular combat-damage sub-passes (rule
    // 510.4/510.5): the priority window after the first sub-pass just closed —
    // run the regular one (which may itself raise assignment decisions or
    // grant its own priority window) instead of leaving the combat-damage step.
    if (
      this.state.turn.step === "combat-damage" &&
      this.state.combatDamage !== null &&
      this.state.combatDamage.pass === "first"
    ) {
      this.state.combatDamage = {
        pass: "regular",
        regularOwed: false,
        pendingAssignments: [],
        assigned: {},
        firstStepStrikers: this.state.combatDamage.firstStepStrikers,
      };
      this.runCombatDamageSubPass();
      this.prepareForPriority(this.state.awaiting?.player ?? this.activePlayer);
      return;
    }
    // Additional combat (Aggravated Assault — rule 500.8): when the postcombat
    // main phase ends with combats still owed, loop back to begin-combat (a
    // combat phase then another main phase) instead of moving to the end step.
    if (this.state.turn.step === "postcombat-main" && this.state.extraCombats > 0) {
      this.state.extraCombats -= 1;
      this.emit({ type: "additional-combat-phase" });
      this.enterStep("begin-combat");
      return;
    }
    const next = nextStep(this.state.turn.step);
    if (next === null) {
      this.beginTurn();
    } else {
      this.enterStep(next);
    }
  }

  private performTurnBasedActions(step: Step): void {
    if (step === "untap") {
      this.untapStep();
    } else if (step === "upkeep") {
      this.upkeepStep();
    } else if (step === "draw") {
      this.drawStep();
    } else if (step === "precombat-main") {
      this.sagaChapterStep();
    } else if (step === "declare-attackers") {
      this.declareAttackersStep();
    } else if (step === "declare-blockers") {
      this.declareBlockersStep();
    } else if (step === "combat-damage") {
      this.combatDamageStep();
    } else if (step === "end-combat") {
      this.endCombatStep();
    } else if (step === "end") {
      this.endStepActions();
    } else if (step === "cleanup") {
      this.cleanupStep();
    }
  }

  /** Turn-based-ish end-step housekeeping. The monarch draws a card at the
   * beginning of their end step (rule 720.6 — a triggered ability; folded in
   * here without the stack, like the draw step). */
  private endStepActions(): void {
    const monarch = this.state.monarch;
    if (
      monarch !== null &&
      monarch === this.activePlayer &&
      !this.state.players[monarch].hasLost
    ) {
      this.drawCard(monarch);
    }
    // Token copies made by Miirym-style effects are exiled at the beginning of
    // the next end step (rule 707 / needed-cards P5b). They're tokens, so the
    // move to exile also has an SBA delete them.
    for (const id of [...this.state.zones.shared.battlefield]) {
      if (this.state.objects[id]?.exileAtEndStep === true) {
        this.moveObject(id, "exile");
      }
    }
    // Encore's tokens are *sacrificed* rather than exiled, so dies-triggers
    // see them go (rule 702.140).
    for (const id of [...this.state.zones.shared.battlefield]) {
      const object = this.state.objects[id];
      if (object?.sacrificeAtEndStep !== true) continue;
      const player = object.controller;
      this.moveObject(id, "graveyard");
      this.emit({ type: "permanent-sacrificed", object: id, player });
    }
  }

  private untapStep(): void {
    const active = this.activePlayer;
    // A goad lasts "until your next turn" (rule 701.38), so the active
    // player's own goads lapse now — on every creature, not just theirs.
    for (const id of this.state.zones.shared.battlefield) {
      const goaded = this.state.objects[id]?.goadedBy;
      if (goaded === undefined || !goaded.includes(active)) continue;
      const left = goaded.filter((p) => p !== active);
      if (left.length === 0) delete this.state.objects[id].goadedBy;
      else this.state.objects[id].goadedBy = left;
    }
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      if (object.controller !== active) continue;
      // Summoning sickness wears off as the controller's turn begins.
      object.summoningSick = false;
      // A loyalty ability may be activated again (rule 606.3), and so may a
      // once-each-turn ability (602.5g).
      object.loyaltyActivatedThisTurn = false;
      object.abilitiesUsedThisTurn = [];
      object.graveyardCastUsedThisTurn = false;
      object.graveyardCastTypesUsedThisTurn = undefined;
      object.combatDamagedPlayersThisTurn = [];
      object.attackedThisTurn = false;
      if (object.tapped && !this.hasOwnStatic(object, (a) => a.doesntUntap === true)) {
        object.tapped = false;
        this.emit({ type: "permanent-untapped", object: id });
      }
    }
    // Seedborn Muse, Unwinding Clock, Bender's Waterskin: other players'
    // permanents that untap during this player's untap step too.
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      if (object === undefined || object.controller === active || !object.tapped) continue;
      if (this.state.players[object.controller]?.hasLost === true) continue;
      if (this.untapsDuringOthersUntap(object)) {
        object.tapped = false;
        this.emit({ type: "permanent-untapped", object: id });
      }
    }
  }

  /** Does `object` carry an active static of its own matching `test`? */
  private hasOwnStatic(object: GameObject, test: (ability: StaticAbility) => boolean): boolean {
    if (hasLostAbilities(object)) return false;
    return this.registry
      .get(printedCardName(object))
      .static.some((ability) => test(ability) && this.staticActive(object, ability));
  }

  /** Whether a permanent untaps during a player's untap step other than its
   * controller's — a `untapsDuringOthersUntap` static on itself (`"self"`) or
   * on any permanent its controller controls whose filter it matches. */
  private untapsDuringOthersUntap(object: GameObject): boolean {
    if (this.hasOwnStatic(object, (a) => a.untapsDuringOthersUntap === "self")) return true;
    return this.state.zones.shared.battlefield.some((id) => {
      const granter = this.state.objects[id];
      if (granter === undefined || granter.controller !== object.controller) return false;
      if (hasLostAbilities(granter)) return false;
      return this.registry.get(printedCardName(granter)).static.some((ability) => {
        const filter = ability.untapsDuringOthersUntap;
        return (
          filter !== undefined &&
          filter !== "self" &&
          this.staticActive(granter, ability) &&
          matchesFilter(this.state, this.registry, object.id, filter, { you: granter.controller })
        );
      });
    });
  }

  private drawStep(): void {
    const active = this.activePlayer;
    const firstTurnForStarter =
      this.state.turn.number === 1 && active === this.state.startingPlayer;
    if (this.state.rules.skipFirstDraw && firstTurnForStarter) return;
    this.drawCard(active);
  }

  /** Does `player` control something saying they have no maximum hand size
   * (Thought Vessel)? Read directly off the battlefield: it's a fact about the
   * player, so there's no affected object for the layer system to hang it on. */
  private hasNoMaxHandSize(player: PlayerId): boolean {
    return this.state.zones.shared.battlefield.some((id) => {
      const object = this.state.objects[id];
      if (object.controller !== player || hasLostAbilities(object)) return false;
      return this.registry
        .get(printedCardName(object))
        .static.some((ability) => ability.noMaxHandSize === true);
    });
  }

  private cleanupStep(): void {
    const active = this.activePlayer;
    const hand = this.state.zones.perPlayer[active].hand;
    const excess = this.hasNoMaxHandSize(active)
      ? 0
      : hand.length - this.state.players[active].maxHandSize;
    if (excess > 0) {
      // Ask for the discard; finishCleanup runs once it is dispatched.
      this.state.awaiting = { kind: "discard", player: active, count: excess };
      return;
    }
    this.finishCleanup();
  }

  private applyDiscard(player: PlayerId, cards: readonly ObjectId[]): void {
    const why = this.whyCannotDiscard(player, cards);
    if (why !== null) throw new Error(why);

    const fromEffect = this.state.awaiting?.kind === "discard" && this.state.awaiting.fromEffect === true;

    for (const id of cards) this.moveObject(id, "graveyard");
    this.emit({ type: "cards-discarded", player, objects: [...cards] });
    this.state.awaiting = null;

    if (fromEffect) {
      // A spell/ability caused this (Mind Rot) — just resume the game.
      this.prepareForPriority(this.activePlayer);
      return;
    }

    this.finishCleanup();
    // The cleanup step normally grants no priority; move straight on.
    this.state.priority.active = false;
    this.state.priority.holder = null;
    this.state.priority.passed = [];
    this.runStateBasedActions();
    if (this.state.result.over) return;
    // An SBA can raise a decision here: a commander left at 0 toughness once
    // its Giant Growth wears off owes its owner the 903.9a choice. It's asked
    // now, and the active player then gets priority in this cleanup step
    // (rule 514.3a), as the normal path through `tick` does. Moving on would
    // ask it in the next player's untap step, where nobody may hold priority
    // (rule 502.4). (The cast: TS keeps the `= null` narrowing from above
    // across the call that may have set it.)
    const raised = this.state.awaiting as AwaitingDecision | null;
    if (raised !== null) {
      this.grantPriority(raised.player);
      return;
    }
    this.endStep();
  }

  /** Kept because `applyDiscard` validates before applying and throws; the
   * rules live in `decisions/discard.ts`. */
  private whyCannotDiscard(
    player: PlayerId,
    cards: readonly ObjectId[],
  ): string | null {
    return discard.whyCannot(this.decisionCtx, { type: "discard", player, cards }, player);
  }

  /** Answers a pending `"choose-from-zone"` decision (see `beginZoneChoice`). */
  private applyChooseFromZone(player: PlayerId, chosen: readonly ObjectId[]): void {
    const why = this.whyCannotChooseFromZone(player, chosen);
    if (why !== null) throw new Error(why);

    const awaiting = this.state.awaiting;
    if (awaiting === null || awaiting.kind !== "choose-from-zone") {
      throw new Error("unreachable: whyCannotChooseFromZone should have caught this");
    }

    const chosenSet = new Set(chosen);
    const leftover = awaiting.ids.filter((id) => !chosenSet.has(id));

    // "…, reveal it, …" — before anything moves, so the event names the cards
    // where every player just saw them.
    if (awaiting.reveal === true && chosen.length > 0) {
      this.revealCards(player, chosen, "library");
    }

    // The chosen cards move together, so the ones a choice takes out of a
    // graveyard leave it as one move ("return up to two cards").
    this.withGraveyardLeaveBatch(() => this.moveChosenFromZone(awaiting, player, chosen, leftover));

    this.emit({ type: "cards-chosen-from-zone", player, objects: [...chosen] });
    this.state.awaiting = null;
    this.finishChooseFromZone(awaiting, player, chosen);
  }

  /** The moves half of {@link applyChooseFromZone}: the chosen cards to where
   * the choice sends them, and the ones left over. */
  private moveChosenFromZone(
    awaiting: Extract<AwaitingDecision, { kind: "choose-from-zone" }>,
    player: PlayerId,
    chosen: readonly ObjectId[],
    leftover: readonly ObjectId[],
  ): void {
    // A split tutor (Cultivate) sends the first find to `destination` and the
    // rest to `restDestination`; with no `restDestination` they all go to the
    // same place, which is every other tutor. Whatever goes onto the
    // battlefield goes there at once.
    this.withEnterBatch(() => chosen.forEach((id, index) => {
      // "Exile the top two, choose one of them" — the chosen cards don't
      // move at all, they just gain the impulse permission.
      if (awaiting.destination === "exile-playable") {
        const object = this.state.objects[id];
        if (object !== undefined && awaiting.impulseGrant !== undefined) {
          object.impulse = { ...awaiting.impulseGrant };
        }
        return;
      }
      const to =
        index === 0 || awaiting.restDestination === undefined
          ? awaiting.destination
          : awaiting.restDestination;
      // A tutor-to-top's find is put on top *after* the search's shuffle
      // (below) — moving it now would only have it shuffled back in.
      if (to === "library-top") return;
      this.moveObject(id, to, { tapped: awaiting.enterTapped === true });
      if (to === "battlefield") {
        this.emit({ type: "permanent-entered-battlefield", object: id });
      }
    }));

    if (awaiting.leftover === "bottom-random") {
      // `moveObject` always appends to a zone's array, and the library's
      // array is drawn from index 0 (the top) — so pushing here lands each
      // card on the bottom, in shuffle order.
      for (const id of shuffle(leftover, this.rng)) this.moveObject(id, "library");
      this.state.rngState = this.rng.seed;
    } else if (awaiting.leftover === "shuffle") {
      // A library search — shuffle the whole library afterwards (rule 701.19j).
      this.shuffleLibraryOf(player);
    } else if (awaiting.leftover === "hand") {
      // Genesis Ultimatum: "… and the rest into your hand." needed-cards P19.
      for (const id of leftover) this.moveObject(id, "hand");
    }
    // leftover === "stay": nothing to do — those cards were only ever looked
    // at, never removed from wherever they already were.

    // Now the shuffle has happened, the tutor's find goes on top (rule
    // 701.19j — "shuffle, *then* put that card on top"). Last chosen first,
    // so a multi-card find ends up in the order it was chosen.
    if (awaiting.destination === "library-top") {
      for (const id of [...chosen].reverse()) this.putOnLibrary(id, "top");
    }
  }

  /** The rest of {@link applyChooseFromZone}, once the cards have moved and
   * the decision is answered: the choice's `then`, and priority. */
  private finishChooseFromZone(
    awaiting: Extract<AwaitingDecision, { kind: "choose-from-zone" }>,
    player: PlayerId,
    chosen: readonly ObjectId[],
  ): void {
    // "…, then that creature gains haste" — applied with the chosen cards as
    // its targets, since they were never targets of the spell itself. Nothing
    // chosen means nothing to say it about.
    const then = awaiting.then;
    if (then !== undefined && chosen.length > 0) {
      applyEffectSpec(
        then,
        this.makeResolutionContext(
          awaiting.thenSource ?? asObjectId("choose-from-zone-source"),
          player,
          chosen.map((id) => ({ kind: "object", object: id }) as const),
          awaiting.thenX ?? 0,
        ),
      );
    }

    this.prepareForPriority(this.activePlayer);
  }

  /** Kept because `applyChooseFromZone` validates before applying and
   * throws; the rules live in `decisions/choose-from-zone.ts`. */
  private whyCannotChooseFromZone(
    player: PlayerId,
    chosen: readonly ObjectId[],
  ): string | null {
    return chooseFromZone.whyCannot(
      this.decisionCtx,
      { type: "choose-from-zone", player, chosen },
      player,
    );
  }

  private finishCleanup(): void {
    // Impulse-draw permissions age here, alongside every other
    // "until end of turn" effect — see `GameObject.impulse`.
    this.expireImpulsePermissions();
    // "Until end of turn" control effects (Act of Treason) end — control
    // falls to whichever control effect is now the latest (rule 613.7), else
    // the owner, and the creature is summoning-sick for them again.
    let controlEffectEnded = false;
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      if (!object.controlEndsAtCleanup) continue;
      object.controlEndsAtCleanup = false;
      const lasting = (object.controlEffects ?? []).filter((e) => !e.untilEndOfTurn);
      if (lasting.length > 0) object.controlEffects = lasting;
      else delete object.controlEffects;
      controlEffectEnded = true;
    }
    if (controlEffectEnded) {
      invalidateComputedCache();
      this.recomputeControl();
    }

    // "Until end of turn" flashback grants (Snapcaster Mage) end — these ride
    // on cards in a graveyard, not the battlefield, so scan all objects.
    for (const object of Object.values(this.state.objects)) {
      if (object.grantedFlashback?.untilEndOfTurn) {
        object.grantedFlashback = null;
        this.emit({ type: "flashback-grant-expired", object: object.id });
      }
    }

    const expired: ObjectId[] = [];
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      if (object.modifiers.some((m) => m.untilEndOfTurn)) {
        object.modifiers = object.modifiers.filter((m) => !m.untilEndOfTurn);
        expired.push(id);
      }
    }
    if (expired.length > 0) {
      this.emit({ type: "pt-modifier-expired", objects: expired });
    }

    const cleared: ObjectId[] = [];
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      if (object.damageMarked !== 0 || object.markedByDeathtouch) {
        object.damageMarked = 0;
        object.markedByDeathtouch = false;
        cleared.push(id);
      }
    }
    if (cleared.length > 0) {
      this.emit({ type: "damage-cleared", objects: cleared });
    }

    // Last, once damage and until-EOT modifiers are gone and every token is
    // back to a comparable resting state: fold interchangeable ones together
    // again (engine resource safety — see `recompactTokens`).
    this.recompactTokens();
  }

  // --- combat -----------------------------------------------------

  /** Everything the active player's attackers may be declared against (rule
   * 508.1). Delegates to `combat/eligibility.ts`. */
  private legalDefenders(attacker: PlayerId): (PlayerId | ObjectId)[] {
    return legalDefenders(this.state, this.registry, attacker);
  }

  /** True if an attack target `id` is a planeswalker (an `ObjectId`) rather
   * than a player. */
  private isPlaneswalkerTarget(id: PlayerId | ObjectId): id is ObjectId {
    return isPlaneswalkerTarget(this.state, id);
  }

  /** The player who defends against an attack aimed at `target` — the target
   * itself if it's a player, or the controller of an attacked planeswalker. */
  private defendingPlayerOf(target: PlayerId | ObjectId): PlayerId {
    return defendingPlayerOf(this.state, target);
  }

  /** Battlefield creatures currently declared as attackers. */
  private currentAttackers(): ObjectId[] {
    return currentAttackers(this.state);
  }

  /**
   * An `attacks` trigger's `aloneAgainstDefender` is an intervening-if (rule
   * 603.4), so it's asked again as the ability resolves: still no other
   * creature attacking that player — the one the attacker is attacking now,
   * or the one it was attacking as it triggered if it has left combat since.
   */
  private stillAttackingAlone(ability: StackAbility, object: GameObject): boolean {
    // A delayed or reflexive trigger carries no `trigger` of its own.
    const trigger = (ability as Partial<TriggeredAbility>).trigger;
    if (trigger?.on !== "attacks" || trigger.aloneAgainstDefender !== true) return true;
    const attacker = object.triggerObject;
    if (attacker === undefined) return true;
    const live = this.state.objects[attacker];
    const defender =
      live?.zone === "battlefield" && live.attacking !== null
        ? live.attacking
        : object.lastKnownRefs?.player;
    return defender === undefined || this.attackingAlone(attacker, defender);
  }

  /** Whether no creature but `attacker` is attacking `defender` — "if no
   * other creatures are attacking that player" (`aloneAgainstDefender`). */
  private attackingAlone(attacker: ObjectId, defender: PlayerId | ObjectId): boolean {
    return this.state.zones.shared.battlefield.every(
      (id) => id === attacker || this.state.objects[id].attacking !== defender,
    );
  }

  private creatureDef(id: ObjectId): CardDefinition | null {
    return creatureDef(this.state, this.registry, id);
  }

  private hasSummoningSickness(object: GameObject): boolean {
    return hasSummoningSickness(object);
  }

  /**
   * Ask the active player to declare attackers (rule 508.1) — but only if
   * they have at least one creature that legally could. With nothing
   * eligible there's no real decision to make (declaring zero attackers is
   * the only possible answer anyway), so this falls through to priority
   * exactly as an explicit empty declaration would.
   */
  private declareAttackersStep(): void {
    const defenders = this.legalDefenders(this.activePlayer);
    const hasEligibleAttacker = this.state.zones.shared.battlefield.some((id) =>
      defenders.some((defender) => this.whyCannotAttack(this.activePlayer, id, defender) === null),
    );
    if (!hasEligibleAttacker) return;
    this.state.awaiting = { kind: "attackers", player: this.activePlayer };
  }

  /**
   * Kick off the defending-player queue for this combat (3+ player games can
   * have more than one defender to ask). Each attacked defender gets their
   * own sequential "declare-blockers" turn, drained by
   * `promptNextBlockerDeclaration`.
   */
  private declareBlockersStep(): void {
    const attackers = this.currentAttackers();
    if (attackers.length === 0) return;
    const attackedBy = new Set(
      attackers
        .map((id) => this.state.objects[id].attacking)
        .filter((t): t is PlayerId | ObjectId => t !== null)
        .map((t) => this.defendingPlayerOf(t)),
    );
    // Ask in turn order starting after the active player — an arbitrary but
    // consistent choice for this engine's one-decision-at-a-time model; real
    // tournament rules poll every defender simultaneously.
    const activeIndex = this.state.turnOrder.indexOf(this.activePlayer);
    const rotated = [
      ...this.state.turnOrder.slice(activeIndex + 1),
      ...this.state.turnOrder.slice(0, activeIndex + 1),
    ];
    this.state.pendingBlockerDeclarations = rotated.filter((p) => attackedBy.has(p));
    this.promptNextBlockerDeclaration();
  }

  /**
   * Set `awaiting` for the next queued defender who actually has an eligible
   * blocker, skipping any who don't (same "no real decision" reasoning
   * `declareAttackersStep` documents). Leaves `awaiting` untouched (still
   * whatever the caller set it to before) if the queue drains with nobody
   * left to ask. The current head stays in the queue until
   * `applyBlockerDeclarations` actually answers it and pops it off; this only
   * peeks/skips ahead of that.
   */
  private promptNextBlockerDeclaration(): void {
    const attackers = this.currentAttackers();
    while (this.state.pendingBlockerDeclarations.length > 0) {
      const defender = this.state.pendingBlockerDeclarations[0];
      const hasEligibleBlocker = this.state.zones.shared.battlefield.some(
        (id) =>
          this.state.objects[id].controller === defender &&
          attackers.some((attacker) => this.whyCannotBlock(defender, id, attacker) === null),
      );
      if (hasEligibleBlocker) {
        this.state.awaiting = { kind: "blockers", player: defender };
        return;
      }
      this.state.pendingBlockerDeclarations = this.state.pendingBlockerDeclarations.slice(1);
    }
  }

  /** Why `creatureId` may not be declared attacking `target`, or `null`.
   * Delegates to `combat/eligibility.ts`. */
  private whyCannotAttack(
    player: PlayerId,
    creatureId: ObjectId,
    target: PlayerId | ObjectId,
  ): string | null {
    return whyCannotAttack(this.state, this.registry, player, creatureId, target);
  }

  /** Why `blockerId` may not block `attackerId`, or `null`. Delegates to
   * `combat/eligibility.ts`. */
  private whyCannotBlock(
    player: PlayerId,
    blockerId: ObjectId,
    attackerId: ObjectId,
  ): string | null {
    return whyCannotBlock(this.state, this.registry, player, blockerId, attackerId);
  }

  /** Kept because the matching apply validates before applying and throws;
   * the rules live in `decisions/`. */
  private whyCannotDeclareAttackers(
    player: PlayerId,
    declarations: readonly AttackerDeclaration[],
  ): string | null {
    return attackers.whyCannot(this.decisionCtx, { type: "declare-attackers", player, attackers: declarations }, player);
  }


  /** Kept because the matching apply validates before applying and throws;
   * the rules live in `decisions/`. */
  private whyCannotDeclareBlockers(
    player: PlayerId,
    blocks: readonly BlockerDeclaration[],
  ): string | null {
    return blockers.whyCannot(this.decisionCtx, { type: "declare-blockers", player, blocks }, player);
  }

  private applyAttackerDeclarations(
    player: PlayerId,
    declarations: readonly AttackerDeclaration[],
  ): void {
    const why = this.whyCannotDeclareAttackers(player, declarations);
    if (why !== null) throw new Error(why);

    // "Attacks each combat if able" (Juggernaut): auto-declare any must-attack
    // creature the player left out but that could legally attack. It's sent at
    // the first legal opponent (the player doesn't get to choose the target of
    // a forced attacker here — a small simplification).
    const declared = new Set(declarations.map((d) => d.attacker));
    const forced: AttackerDeclaration[] = [];
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      if (declared.has(id) || object.controller !== player) continue;
      const goadedBy = object.goadedBy ?? [];
      // Goad (701.38) and Encore's "attacks that opponent if able" are both
      // attack *requirements*, so they force a declaration exactly the way
      // `must-attack` does.
      const required =
        this.restrictionsOf(id).has("must-attack") ||
        goadedBy.length > 0 ||
        object.mustAttackPlayer !== undefined;
      if (!required) continue;
      const legal = this.legalDefenders(player).filter(
        (d) => this.whyCannotAttack(player, id, d) === null,
      );
      // "…attacks that opponent if able" beats everything; otherwise a goaded
      // creature must avoid its goaders if it can (701.38b).
      const defender =
        (object.mustAttackPlayer !== undefined
          ? legal.find((d) => d === object.mustAttackPlayer)
          : undefined) ??
        legal.find((d) => !goadedBy.includes(this.defendingPlayerOf(d))) ??
        legal[0];
      if (defender !== undefined) forced.push({ attacker: id, defender });
    }

    // The whole declaration is made before any of it is announced: it is one
    // action (rule 508.1), and abilities that trigger on it trigger once it's
    // complete (508.3), so an attack trigger's "if no other creatures are
    // attacking that player" sees every attacker, not just the ones declared
    // before its own.
    const declaredNow: { readonly id: ObjectId; readonly defender: PlayerId | ObjectId; readonly taps: boolean }[] = [];
    for (const { attacker, defender } of [...declarations, ...forced]) {
      // A compacted stack materializes into real individual attackers here —
      // see `materializeStack`.
      for (const id of this.materializeStack(attacker)) {
        const object = this.state.objects[id];
        object.attacking = defender;
        object.blockedBy = [];
        object.blocked = false;
        // Boast (702.135) asks whether this creature attacked this turn —
        // recorded here, and reset in the controller's untap step.
        object.attackedThisTurn = true;
        const taps = !this.objHasKeyword(id, "vigilance");
        if (taps) object.tapped = true;
        declaredNow.push({ id, defender, taps });
      }
    }
    const allAttackers = declaredNow.map((d) => d.id);
    for (const { id, defender, taps } of declaredNow) {
      // Attacking *taps* the creature, so a "becomes tapped" trigger (rule
      // 701.21a) fires here exactly as it would for a cost or for convoke —
      // Emmara, Soul of the Accord makes its Soldier when it attacks. This was
      // setting the flag without announcing it, so those triggers silently
      // never fired on the commonest way a creature gets tapped.
      if (taps) this.emit({ type: "permanent-tapped", object: id });
      this.emit({ type: "attacker-declared", attacker: id, defender });
    }
    // Exalted (rule 702.111a — needed-cards P15): a single dedicated event
    // once the whole declaration is known, rather than checking "how many
    // attackers so far" per `attacker-declared` (which would wrongly read as
    // "alone" for the first of several attackers declared in the same action).
    if (allAttackers.length === 1) {
      this.emit({ type: "attacked-alone", attacker: allAttackers[0] });
    }
    if (allAttackers.length > 0) {
      this.emit({
        type: "attackers-declared",
        player: this.activePlayer,
        attackers: [...allAttackers],
      });
      // Each player attacked (rule 508.3d), in turn order — "whenever a
      // player attacks one of your opponents". Creatures attacking a
      // planeswalker attack it, not its controller.
      for (const defender of this.state.turnOrder) {
        const attackers = declaredNow.filter((d) => d.defender === defender).map((d) => d.id);
        if (attackers.length > 0) {
          this.emit({ type: "player-attacked", player: this.activePlayer, defender, attackers });
        }
      }
    }

    this.state.awaiting = null;
    this.prepareForPriority(this.activePlayer);
  }

  private applyBlockerDeclarations(
    player: PlayerId,
    blocks: readonly BlockerDeclaration[],
  ): void {
    const why = this.whyCannotDeclareBlockers(player, blocks);
    if (why !== null) throw new Error(why);

    // Every block is made before any is announced, as with attackers: the
    // declaration is one action (rule 509.1) and its triggers see all of it.
    const blockedNow: { readonly blocker: ObjectId; readonly attacker: ObjectId }[] = [];
    for (const { blocker: blockerId, attacker: attackerId } of blocks) {
      // A compacted stack materializes into real individual blockers here —
      // the attacker is never a stack itself by this point (it already
      // materialized when declared, above).
      for (const bId of this.materializeStack(blockerId)) {
        const blocker = this.state.objects[bId];
        const attacker = this.state.objects[attackerId];
        blocker.blocking = attackerId;
        attacker.blockedBy.push(bId);
        attacker.blocked = true;
        blockedNow.push({ blocker: bId, attacker: attackerId });
      }
    }
    for (const { blocker, attacker } of blockedNow) {
      this.emit({ type: "blocker-declared", blocker, attacker });
    }
    // Each attacker this declaration blocked becomes blocked once, however
    // many creatures block it (rules 509.1h, 509.3c).
    for (const attacker of new Set(blockedNow.map((b) => b.attacker))) {
      this.emit({
        type: "attacker-blocked",
        attacker,
        blockers: [...this.state.objects[attacker].blockedBy],
      });
    }

    // This defender is done; move to the next queued one if there is one
    // (3+ player games can have several defenders to ask this combat).
    this.state.awaiting = null;
    this.state.pendingBlockerDeclarations = this.state.pendingBlockerDeclarations.slice(1);
    this.promptNextBlockerDeclaration();
    // TS's narrowing of `this.state.awaiting` from the `= null` assignment
    // above incorrectly persists across the call that may have just
    // reassigned it; the cast reflects its real declared type.
    const nextAwaiting = this.state.awaiting as AwaitingDecision | null;
    if (nextAwaiting !== null) {
      this.grantPriority(nextAwaiting.player);
      return;
    }

    // Every defender has declared (or been skipped), so the active player
    // gets priority (rule 509.2). There is no damage assignment order to ask
    // for any more: a multi-blocked attacker's controller divides its damage
    // freely in the combat-damage step (510.1c).
    this.prepareForPriority(this.activePlayer);
  }

  /** Turn-based action for the combat-damage step (rule 510). Sets up the
   * sub-pass state (first strike splits it — 510.5) and runs the first one.
   * A blocked attacker's controller may owe a damage-assignment choice
   * (`assign-combat-damage`) before damage is dealt (510.1c). */
  private combatDamageStep(): void {
    if (this.currentAttackers().length === 0) {
      this.state.combatDamage = null;
      return;
    }
    const firstStrike = this.combatFirstStrikeInPlay();
    this.state.combatDamage = {
      pass: firstStrike ? "first" : "single",
      regularOwed: firstStrike,
      pendingAssignments: [],
      assigned: {},
      firstStepStrikers: firstStrike ? this.recordFirstStepStrikers() : {},
    };
    this.runCombatDamageSubPass();
  }

  private subPassKind(pass: CombatDamageState["pass"]): "first" | "regular" | "all" {
    return pass === "first" ? "first" : pass === "regular" ? "regular" : "all";
  }

  /** Begin one combat-damage sub-pass: collect any blocked attackers whose
   * controller owes an assignment choice; if none, deal the damage. Leaves
   * `awaiting` set (via `promptNextDamageAssignment`) when a choice is owed. */
  private runCombatDamageSubPass(): void {
    const cd = this.state.combatDamage;
    if (cd === null) return;
    const kind = this.subPassKind(cd.pass);
    const pending = this.currentAttackers().filter(
      (id) =>
        this.state.objects[id].blocked &&
        this.dealsInPass(id, kind) &&
        this.needsDamageAssignmentChoice(id),
    );
    this.state.combatDamage = { ...cd, pendingAssignments: pending };
    this.promptNextDamageAssignment();
  }

  /** The blockers of `attackerId` still on the battlefield, in declaration order. */
  private liveBlockersOf(attackerId: ObjectId): ObjectId[] {
    return liveBlockersOf(this.state, attackerId);
  }

  private lethalFor(attackerId: ObjectId, blockerId: ObjectId): number {
    return lethalFor(this.state, this.registry, attackerId, blockerId);
  }

  /** Whether the attacking player has a real choice in how `attackerId` (a
   * blocked attacker) divides its combat damage — 2+ live blockers, or a lone
   * one with trample and room past its lethal. */
  private needsDamageAssignmentChoice(attackerId: ObjectId): boolean {
    return needsDamageAssignmentChoice(this.state, this.registry, attackerId);
  }

  /** The standard auto-assignment for `attackerId`'s combat damage this
   * sub-pass (`standardAssignment`: kill as many blockers as possible). One
   * entry per live blocker. */
  private autoAssignForAttacker(attackerId: ObjectId): number[] {
    return autoAssignForAttacker(this.state, this.registry, attackerId);
  }

  private promptNextDamageAssignment(): void {
    const cd = this.state.combatDamage;
    if (cd === null) return;
    if (cd.pendingAssignments.length > 0) {
      const attackerId = cd.pendingAssignments[0];
      const blockers = this.liveBlockersOf(attackerId);
      this.state.awaiting = {
        kind: "assign-combat-damage",
        player: this.state.objects[attackerId].controller,
        attacker: attackerId,
        blockers,
        power: assignedCombatDamage(this.state, this.registry, attackerId),
        lethal: blockers.map((b) => this.lethalFor(attackerId, b)),
        trample: this.objHasKeyword(attackerId, "trample"),
        indestructible: blockers.map((b) => this.objHasKeyword(b, "indestructible")),
      };
      return;
    }
    this.applyCombatDamageSubPass();
  }

  /** Kept because the matching apply validates before applying and throws;
   * the rules live in `decisions/`. */
  private whyCannotAssignCombatDamage(
    player: PlayerId,
    assignment: readonly number[],
  ): string | null {
    return assignCombatDamage.whyCannot(this.decisionCtx, { type: "assign-combat-damage", player, assignment }, player);
  }

  private applyAssignCombatDamage(
    player: PlayerId,
    assignment: readonly number[],
  ): void {
    const why = this.whyCannotAssignCombatDamage(player, assignment);
    if (why !== null) throw new Error(why);
    const awaiting = this.state.awaiting as Extract<
      AwaitingDecision,
      { kind: "assign-combat-damage" }
    >;
    const cd = this.state.combatDamage;
    if (cd === null) throw new Error("unreachable: no combat-damage step in progress");

    this.state.combatDamage = {
      ...cd,
      assigned: { ...cd.assigned, [awaiting.attacker]: [...assignment] },
      pendingAssignments: cd.pendingAssignments.slice(1),
    };
    this.state.awaiting = null;
    this.promptNextDamageAssignment();
    // `promptNextDamageAssignment` may have set `awaiting` for the next
    // attacker; TS's narrowing from the `= null` above doesn't see that.
    const next = this.state.awaiting as AwaitingDecision | null;
    this.prepareForPriority(next?.player ?? this.activePlayer);
  }

  /** Deal all combat damage for the current sub-pass, run SBAs, then either
   * hold for the between-passes priority window (a regular sub-pass is still
   * owed) or clear the combat-damage state. Priority is granted by the
   * caller. */
  private applyCombatDamageSubPass(): void {
    const cd = this.state.combatDamage;
    if (cd === null) return;
    this.withDamageBatch(() => this.dealCombatDamage(this.subPassKind(cd.pass), cd.assigned));
    this.runStateBasedActions();
    if (this.state.result.over) {
      this.state.combatDamage = null;
      return;
    }
    if (cd.pass === "first" && cd.regularOwed) {
      // Rule 510.4 — players get priority between the first-strike and regular
      // combat-damage sub-passes. `endStep` starts the regular one once they
      // all pass. Keep `pass: "first"` as the marker for that.
      this.state.combatDamage = { ...cd, pendingAssignments: [], assigned: {} };
      return;
    }
    this.state.combatDamage = null;
  }

  /** Any attacker or blocker in the current combat with first or double strike. */
  private combatFirstStrikeInPlay(): boolean {
    for (const attackerId of this.currentAttackers()) {
      if (this.striker(attackerId)) return true;
      // Only blockers still in combat (rule 506.4): one that has left the
      // battlefield doesn't earn a first-strike step, and a token one no
      // longer exists at all.
      for (const blockerId of this.liveBlockersOf(attackerId)) {
        if (this.striker(blockerId)) return true;
      }
    }
    return false;
  }

  /** Rule 510.4: which combatants had first strike or double strike as the
   * first combat-damage step began. The second step is dealt by the ones that
   * had neither *then* plus the ones that have double strike *now*, so this
   * has to be written down before anything can change it — gaining first
   * strike in between doesn't stop a creature dealing damage in the second
   * step, and losing it doesn't let a first striker deal damage twice
   * (702.7c). Keyed id → battlefield timestamp, so a creature that left and
   * came back attacking (a new object, rule 400.7) isn't mistaken for the one
   * that struck. */
  private recordFirstStepStrikers(): Record<string, number> {
    const out: Record<string, number> = {};
    const note = (id: ObjectId): void => {
      if (this.striker(id)) out[id] = this.state.objects[id].timestamp;
    };
    for (const attackerId of this.currentAttackers()) {
      note(attackerId);
      for (const blockerId of this.liveBlockersOf(attackerId)) note(blockerId);
    }
    return out;
  }

  private hadStrikeAsFirstStepBegan(id: ObjectId): boolean {
    const recorded = this.state.combatDamage?.firstStepStrikers[id];
    return recorded !== undefined && recorded === this.state.objects[id]?.timestamp;
  }

  private striker(id: ObjectId): boolean {
    return (
      this.objHasKeyword(id, "first-strike") ||
      this.objHasKeyword(id, "double-strike")
    );
  }

  /** Does `id` deal combat damage in this pass? */
  private dealsInPass(id: ObjectId, pass: "first" | "regular" | "all"): boolean {
    if (pass === "all") return true;
    const ds = this.objHasKeyword(id, "double-strike");
    if (pass === "first") return ds || this.objHasKeyword(id, "first-strike");
    // Regular pass (rule 510.4): whoever had neither first strike nor double
    // strike as the first step began, plus whoever has double strike now —
    // not whoever lacks first strike now.
    return ds || !this.hadStrikeAsFirstStepBegan(id);
  }

  /** The `TargetRef` combat damage goes to for a creature attacking `attacking`
   * — the player, or the planeswalker (an `ObjectId`). */
  private attackTargetRef(attacking: PlayerId | ObjectId): TargetRef {
    return this.isPlaneswalkerTarget(attacking)
      ? { kind: "object", object: attacking }
      : { kind: "player", player: attacking as PlayerId };
  }

  private dealCombatDamage(
    pass: "first" | "regular" | "all",
    assigned: Readonly<Record<string, readonly number[]>> = {},
  ): void {
    const assignments: {
      source: ObjectId;
      target: TargetRef;
      amount: number;
    }[] = [];
    // Rule 510.1a: power — or toughness, under a `combatDamageByToughness`
    // static (Doran, the Siege Tower) — for attackers and blockers alike.
    const powerOf = (id: ObjectId): number =>
      assignedCombatDamage(this.state, this.registry, id);

    for (const attackerId of this.currentAttackers()) {
      const attacker = this.state.objects[attackerId];
      const liveBlockers = attacker.blockedBy.filter(
        (id) => this.state.objects[id]?.zone === "battlefield",
      );

      if (this.dealsInPass(attackerId, pass)) {
        const power = powerOf(attackerId);
        if (power > 0) {
          if (!attacker.blocked) {
            if (attacker.attacking !== null) {
              assignments.push({
                source: attackerId,
                target: this.attackTargetRef(attacker.attacking),
                amount: power,
              });
            }
          } else {
            const trample = this.objHasKeyword(attackerId, "trample");
            // A player-chosen distribution (rule 510.1c — ROADMAP Phase 11
            // EG-4a) overrides the standard split; otherwise auto-assign
            // (deathtouch already folded into `autoAssignForAttacker`).
            const override = assigned[attackerId];
            const perBlocker =
              override !== undefined && override.length === liveBlockers.length
                ? override
                : this.autoAssignForAttacker(attackerId);
            let assignedTotal = 0;
            liveBlockers.forEach((blockerId, index) => {
              const amount = perBlocker[index] ?? 0;
              assignedTotal += amount;
              if (amount > 0) {
                assignments.push({
                  source: attackerId,
                  target: { kind: "object", object: blockerId },
                  amount,
                });
              }
            });
            const over = power - assignedTotal;
            if (trample && over > 0 && attacker.attacking !== null) {
              assignments.push({
                source: attackerId,
                target: this.attackTargetRef(attacker.attacking),
                amount: over,
              });
            }
          }
        }
      }

      for (const blockerId of liveBlockers) {
        if (!this.dealsInPass(blockerId, pass)) continue;
        const blockerPower = powerOf(blockerId);
        if (blockerPower > 0) {
          assignments.push({
            source: blockerId,
            target: { kind: "object", object: attackerId },
            amount: blockerPower,
          });
        }
      }
    }

    // All combat damage in a pass is dealt simultaneously.
    for (const { source, target, amount } of assignments) {
      const dealt = this.dealDamage(source, target, amount, true);
      if (dealt > 0 && target.kind === "player") {
        const attacker = this.state.objects[source];
        if (attacker.isCommander) {
          const taken = this.state.players[target.player].commanderDamageTaken;
          taken[attacker.id] = (taken[attacker.id] ?? 0) + dealt;
        }
        // Steel Hellkite's "whose controller was dealt combat damage by this
        // creature this turn" — recorded per source, not globally, since the
        // question is about one specific permanent.
        const damaged = attacker.combatDamagedPlayersThisTurn ?? [];
        if (!damaged.includes(target.player)) {
          attacker.combatDamagedPlayersThisTurn = [...damaged, target.player];
        }
      }
    }
  }

  private endCombatStep(): void {
    this.state.pendingBlockerDeclarations = [];
    this.state.combatDamage = null;
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      object.attacking = null;
      object.blocking = null;
      object.blockedBy = [];
      object.blocked = false;
    }
  }

  // --- player actions ----------------------------------------------

  private whyCannotAct(player: PlayerId): string | null {
    if (this.state.awaiting !== null) return "a declaration is pending";
    if (this.state.priority.holder !== player) {
      return `${player} does not have priority`;
    }
    return null;
  }

  private whyNotSorcerySpeed(player: PlayerId, what: string): string | null {
    if (this.activePlayer !== player) {
      return `can only ${what} on your own turn`;
    }
    if (!isMainPhase(this.state.turn.step)) {
      return `can only ${what} during a main phase`;
    }
    if (this.state.zones.shared.stack.length > 0) {
      return `can only ${what} while the stack is empty`;
    }
    return null;
  }

  /** The `CardDefinition` for face `face` of `cardId` — its own def for a
   * single-faced card, or `faces[face]`'s def for a multi-face card (rule
   * 712). */
  private faceDef(cardId: ObjectId, face = 0): CardDefinition {
    const own = this.registry.get(this.state.objects[cardId].cardName);
    const faceName = own.faces?.[face];
    return faceName !== undefined ? this.registry.get(faceName) : own;
  }

  /**
   * Run `fn` with `cardId`'s `GameObject.face` temporarily set to `face`, so a
   * computation that reads the object's *current* characteristics
   * (`costModificationFor` → `matchesFilter` → `printedCardName`) sees the face
   * being cast/played, not whichever face happens to be up. Restored on the way
   * out — a query, not a mutation. No-op for a single-faced card.
   */
  private withFace<T>(cardId: ObjectId, face: number, fn: () => T): T {
    const object = this.state.objects[cardId];
    if (object === undefined || object.faces === undefined || object.face === face) {
      return fn();
    }
    const saved = object.face;
    object.face = face;
    invalidateComputedCache();
    try {
      return fn();
    } finally {
      object.face = saved;
      invalidateComputedCache();
    }
  }

  private whyCannotPlayLand(
    player: PlayerId,
    cardId: ObjectId,
    face = 0,
    graveyardGrant?: GraveyardGrant,
  ): string | null {
    return (
      this.whyCannotAct(player) ??
      this.whyNotSorcerySpeed(player, "play a land") ??
      this.landDropReason(player) ??
      this.landPlayableReason(player, cardId, face, graveyardGrant)
    );
  }

  /** While a `playFromGraveyard` static (Ramunap Excavator) is on the
   * battlefield under `player`'s control, they may play a matching card from
   * their graveyard (rule 118.9 / 305.9). */
  private mayPlayFromGraveyard(player: PlayerId, cardId: ObjectId): boolean {
    for (const id of this.state.zones.shared.battlefield) {
      const source = this.state.objects[id];
      if (source.controller !== player || hasLostAbilities(source)) continue;
      for (const ability of this.registry.get(printedCardName(source)).static) {
        const filter = ability.playFromGraveyard;
        if (filter === undefined || !this.staticActive(source, ability)) continue;
        if (matchesFilter(this.state, this.registry, cardId, filter, { you: player })) {
          return true;
        }
      }
    }
    return false;
  }

  /** While a `playFromLibraryTop` static (Oracle of Mul Daya) is on the
   * battlefield under `player`'s control, they may play the top card of
   * their library if it matches (rule 118.9-adjacent). */
  private mayPlayFromLibraryTop(player: PlayerId, cardId: ObjectId): boolean {
    for (const id of this.state.zones.shared.battlefield) {
      const source = this.state.objects[id];
      if (source.controller !== player || hasLostAbilities(source)) continue;
      for (const ability of this.registry.get(printedCardName(source)).static) {
        const filter = ability.playFromLibraryTop;
        if (filter === undefined || !this.staticActive(source, ability)) continue;
        if (matchesFilter(this.state, this.registry, cardId, filter, { you: player })) {
          return true;
        }
      }
    }
    return false;
  }

  /** The base land-drop limit plus any `extraLandsPerTurn` statics `player`
   * controls (Azusa, Lost but Seeking, Icetill Explorer — needed-cards P16). */
  private maxLandsFor(player: PlayerId): number {
    let extra = 0;
    for (const id of this.state.zones.shared.battlefield) {
      const source = this.state.objects[id];
      if (source.controller !== player || hasLostAbilities(source)) continue;
      for (const ability of this.registry.get(printedCardName(source)).static) {
        if (ability.extraLandsPerTurn !== undefined && this.staticActive(source, ability)) {
          extra += ability.extraLandsPerTurn;
        }
      }
    }
    return (
      this.state.rules.maxLandsPerTurn + extra + (this.state.players[player].extraLandsThisTurn ?? 0)
    );
  }

  private landDropReason(player: PlayerId): string | null {
    const playerState = this.state.players[player];
    return playerState.landsPlayedThisTurn >= this.maxLandsFor(player)
      ? `${player} has already played a land this turn`
      : null;
  }

  private landPlayableReason(
    player: PlayerId,
    cardId: ObjectId,
    face = 0,
    graveyardGrant?: GraveyardGrant,
  ): string | null {
    const zones = this.state.zones.perPlayer[player];
    if (graveyardGrant !== undefined) {
      // A named graveyard permission (Muldrotha's land allowance) must be one
      // that applies to this card right now.
      if (this.findGraveyardGrant(player, cardId, face, graveyardGrant) === null) {
        return `${player} has no such permission to play that card from their graveyard`;
      }
    }
    const playable =
      zones.hand.includes(cardId) ||
      (zones.graveyard.includes(cardId) &&
        (this.mayPlayFromGraveyard(player, cardId) ||
          this.graveyardGrantsFor(player, cardId, face).length > 0)) ||
      (zones.library[0] === cardId && this.mayPlayFromLibraryTop(player, cardId)) ||
      // "Impulse draw" that says *play* rather than *cast* includes lands
      // (Tectonic Giant, Theater of Horrors).
      (this.impulsePlayable(player, cardId) &&
        this.state.objects[cardId]?.impulse?.castOnly !== true);
    if (!playable) {
      return `${player} cannot play that card as a land`;
    }
    const def = this.faceDef(cardId, face);
    return def.types.includes("land") ? null : `${def.name} is not a land`;
  }

  private playLand(
    player: PlayerId,
    cardId: ObjectId,
    face = 0,
    graveyardGrant?: GraveyardGrant,
  ): void {
    const why = this.whyCannotPlayLand(player, cardId, face, graveyardGrant);
    if (why !== null) throw new Error(why);
    const playerState = this.state.players[player];
    // From a graveyard under a limited permission (Muldrotha), spend it while
    // the card is still there. An unnamed one prefers an unlimited permission
    // (Ramunap Excavator), which spends nothing.
    if (
      this.state.objects[cardId].zone === "graveyard" &&
      (graveyardGrant !== undefined || !this.mayPlayFromGraveyard(player, cardId))
    ) {
      const found = this.findGraveyardGrant(player, cardId, face, graveyardGrant);
      if (found !== null) this.spendGraveyardGrant(found);
    }

    const from = this.state.objects[cardId].zone;
    this.state.objects[cardId].face = face;
    this.moveObject(cardId, "battlefield");
    playerState.landsPlayedThisTurn += 1;
    this.emit({ type: "land-played", player, object: cardId, from });
    this.emit({ type: "permanent-entered-battlefield", object: cardId });
    // A land is *played*, not cast, so it never went through the spell
    // resolution path where this used to live — and every "as this land
    // enters, choose a creature type" card (Cavern of Souls, Unclaimed
    // Territory, Secluded Courtyard) is a land. Without this they entered
    // with no type chosen and their restricted mana could pay for nothing.
    this.applyEnterChoices(cardId, player, this.registry.get(printedCardName(this.state.objects[cardId])));
    this.afterPlayerAction(player);
  }

  /**
   * Raise an "as this enters, choose …" decision (rule 614.1c), shared by the
   * two ways a permanent can arrive under its own steam: a permanent spell
   * resolving, and a land being played.
   *
   * Still not reached by a permanent that arrives some *other* way — a copy,
   * a reanimation, `debugSpawn` — which stays an AUTHORING §15 limitation.
   * Nothing in the pool needs that yet; every card with this clause is either
   * cast or played.
   */
  private applyEnterChoices(id: ObjectId, controller: PlayerId, def: CardDefinition): void {
    if (def.chooseCreatureTypeOnEnter) this.beginCreatureTypeChoice(id, controller);
    else if (def.chooseOnEnter !== null) {
      this.beginCreatureTypeChoice(id, controller, def.chooseOnEnter);
    }
  }

  /** Why `player` cannot suspend `cardId` from hand right now (rule 702.62 —
   * ROADMAP Phase 6b). Suspend is a special action usable whenever the card
   * could be cast — sorcery speed unless it's an instant / has flash. */
  private whyCannotSuspend(player: PlayerId, cardId: ObjectId): string | null {
    const blocked = this.whyCannotAct(player);
    if (blocked !== null) return blocked;
    if (!this.state.zones.perPlayer[player].hand.includes(cardId)) {
      return `${player} does not have that card in hand`;
    }
    const def = this.registry.get(this.state.objects[cardId].cardName);
    if (def.suspend === null) return `${def.name} does not have suspend`;
    if (!def.types.includes("instant") && !def.keywords.includes("flash")) {
      const timing = this.whyNotSorcerySpeed(player, `suspend ${def.name}`);
      if (timing !== null) return timing;
    }
    if (this.payMana(player, parseManaCost(def.suspend.cost)) === null) {
      return `${player} cannot pay the suspend cost of ${def.name}`;
    }
    return null;
  }

  private whyCannotCycle(player: PlayerId, cardId: ObjectId): string | null {
    const blocked = this.whyCannotAct(player);
    if (blocked !== null) return blocked;
    if (!this.state.zones.perPlayer[player].hand.includes(cardId)) {
      return `${player} does not have that card in hand`;
    }
    const def = this.registry.get(this.state.objects[cardId].cardName);
    if (def.cycling === null) return `${def.name} does not have cycling`;
    if (this.payMana(player, parseManaCost(def.cycling.cost)) === null) {
      return `${player} cannot pay the cycling cost of ${def.name}`;
    }
    return null;
  }

  /** Cycling (rule 702.29) — modeled as an immediate special action: pay the
   * cost, discard the card, draw one. No stack, no "when you cycle" window. */
  private cycleCard(player: PlayerId, cardId: ObjectId): void {
    const why = this.whyCannotCycle(player, cardId);
    if (why !== null) throw new Error(why);
    const def = this.registry.get(this.state.objects[cardId].cardName);
    const cycling = def.cycling;
    if (cycling === null) throw new Error(`${def.name} does not have cycling`);

    const payment = this.payMana(player, parseManaCost(cycling.cost));
    if (payment === null) throw new Error(`${player} cannot pay the cycling cost of ${def.name}`);
    this.executePayment(player, payment);
    this.moveObject(cardId, "graveyard");
    this.emit({ type: "card-cycled", player, object: cardId });
    const cyclingSearch = cycling.search;
    if (cyclingSearch !== undefined) {
      // Landcycling / typecycling (702.29f): a library search instead of the
      // draw. `min: 0` so an empty library isn't a hard failure, matching
      // every other tutor in the pool.
      //
      // Attributed to the cycled card, which is already in the graveyard by
      // now — `withDecisionSource` still resolves its name from the object,
      // which is exactly why `DecisionSource` carries `cardName` rather than
      // leaving the client to look the object up.
      // Typecycling reveals what it finds (rule 702.29e: "search your library
      // for a [type] card, reveal it, put it into your hand").
      this.withDecisionSource(cardId, () => {
        this.beginLibrarySearch(player, cyclingSearch, "hand", 0, 1, false, undefined, true);
      });
    } else {
      this.drawCard(player);
    }
    this.afterPlayerAction(player);
  }

  private suspendCard(player: PlayerId, cardId: ObjectId): void {
    const why = this.whyCannotSuspend(player, cardId);
    if (why !== null) throw new Error(why);
    const object = this.state.objects[cardId];
    const def = this.registry.get(object.cardName);
    const suspend = def.suspend;
    if (suspend === null) throw new Error(`${def.name} does not have suspend`);

    const payment = this.payMana(player, parseManaCost(suspend.cost));
    if (payment === null) throw new Error(`${player} cannot pay the suspend cost of ${def.name}`);

    this.moveObject(cardId, "exile");
    this.executePayment(player, payment);
    object.suspended = true;
    object.counters.time = suspend.n;
    this.emit({
      type: "card-suspended",
      player,
      object: cardId,
      timeCounters: suspend.n,
    });
    this.afterPlayerAction(player);
  }

  /** Beginning of the active player's upkeep (rule 702.62d/e): remove one time
   * counter from each of their suspended cards; cast (for free) any that hit
   * zero. */
  private upkeepStep(): void {
    const active = this.activePlayer;
    const ready: ObjectId[] = [];
    for (const id of [...this.state.zones.shared.exile]) {
      const object = this.state.objects[id];
      if (object === undefined || !object.suspended || object.owner !== active) continue;
      const remaining = Math.max(0, (object.counters.time ?? 0) - 1);
      object.counters.time = remaining;
      this.emit({ type: "time-counter-removed", object: id, remaining });
      if (remaining === 0) ready.push(id);
    }
    for (let i = 0; i < ready.length; i += 1) {
      this.castSuspendedCard(ready[i]);
      if (this.state.awaiting !== null) {
        // A suspended spell paused on a `choose-targets` decision — the rest
        // are cast after `applyChooseTargets` drains this queue.
        this.state.pendingSuspendedCasts = ready.slice(i + 1);
        return;
      }
    }
  }

  /** Beginning of the active player's precombat main phase (rule 714.4): add a
   * lore counter to each Saga they control. */
  private sagaChapterStep(): void {
    const active = this.activePlayer;
    for (const id of [...this.state.zones.shared.battlefield]) {
      const object = this.state.objects[id];
      if (
        object.controller !== active ||
        this.registry.get(printedCardName(object)).chapters === null
      ) {
        continue;
      }
      this.addLoreCounter(id);
    }
  }

  /** Put one lore counter on the Saga `sagaId` and queue any chapter ability
   * whose `at` includes the new count (rule 714.2c). */
  private addLoreCounter(sagaId: ObjectId): void {
    const object = this.state.objects[sagaId];
    if (object === undefined) return;
    const chapters = this.registry.get(printedCardName(object)).chapters;
    if (chapters === null) return;
    object.counters.lore = (object.counters.lore ?? 0) + 1;
    const n = object.counters.lore;
    this.emit({ type: "lore-counter-added", object: sagaId, lore: n });
    chapters.forEach((chapter, index) => {
      if (!chapter.at.includes(n)) return;
      this.state.pendingTriggers.push({
        sourceObjectId: sagaId,
        cardName: printedCardName(object),
        abilityIndex: index,
        controller: object.controller,
        chapter: true,
      });
    });
  }

  /**
   * Put `cardId` (from exile or library) onto the stack without paying its mana
   * cost — the shared core of suspend / cascade free casts (rules 702.62e /
   * 702.85e). Returns `false` if a target slot has no legal option (the caller
   * decides what happens then); `true` if the spell was committed *or* a
   * `choose-targets` decision was raised (a suspend cast with a real choice —
   * ROADMAP Phase 11 EG-1). A cascade cast's targets stay auto-picked (deferring
   * cascade's "then put the rest on the bottom" tail is more churn than it's
   * worth for a rare edge).
   */
  private castCardWithoutPaying(
    cardId: ObjectId,
    opts: { via: CastVia; grantHaste?: boolean },
  ): boolean {
    const object = this.state.objects[cardId];
    if (object === undefined) return false;
    const owner = object.owner;
    const def = this.registry.get(object.cardName);
    const grantHaste = opts.grantHaste ?? false;

    const optionsPerSlot: TargetRef[][] = [];
    for (const spec of def.targets) {
      const options = legalTargets(this.state, this.registry, spec, owner, this.cardSource(def, cardId));
      if (options.length === 0) return false;
      optionsPerSlot.push([...options]);
    }

    // An "up to one" slot is never forced: leaving it empty is a choice.
    const forced = optionsPerSlot.every(
      (o, i) => o.length === 1 && !isOptionalSpec(def.targets[i]),
    );
    if (def.targets.length === 0 || forced || opts.via === "cascade") {
      return this.commitFreeCast(cardId, opts.via, grantHaste, optionsPerSlot.map((o) => o[0]));
    }

    // A suspend cast with a real choice — park a `choose-targets` decision.
    this.state.pendingTargetedCast = { cardId, via: opts.via, grantHaste };
    this.state.awaiting = {
      kind: "choose-targets",
      player: owner,
      source: cardId,
      cardName: def.name,
      specs: [...def.targets],
      options: optionsPerSlot,
    };
    return true;
  }

  /** Move `cardId` to the stack as a free cast with the given targets (rule
   * 702.62e / 702.85e) — the commit half of {@link castCardWithoutPaying}.
   * `false`, with nothing moved, when a cost increase can't be paid. */
  private commitFreeCast(
    cardId: ObjectId,
    via: CastVia,
    grantHaste: boolean,
    chosen: ResolvedTargets,
  ): boolean {
    const object = this.state.objects[cardId];
    const owner = object.owner;
    const stormCount = this.state.spellsCastThisTurn;
    const castFrom = object.zone;
    // "Without paying its mana cost" is an alternative cost of nothing, and
    // cost increases still apply on top of it (rule 601.2f): Thalia's {1},
    // or Hinata's {1} for each target. Worked out once the targets are
    // chosen; a spell whose increase can't be paid isn't cast at all.
    const increase = this.castingCostOf(
      owner,
      cardId,
      this.registry.get(object.cardName),
      0,
      null,
      distinctTargetCount(chosen, this.targetCopies(chosen)),
    );
    const payment = this.payMana(owner, increase, undefined, undefined, { kind: "cast", card: cardId });
    if (payment === null) return false;
    this.moveObject(cardId, "stack");
    this.executePayment(owner, payment);
    // Nothing to pay, so a target in a token stack is peeled off at once.
    const targets = this.lockInTargets(chosen);
    object.targets = targets.length > 0 ? [...targets] : null;
    // Where each target is as the spell is cast, for last-known information.
    object.targetZones = targets.length > 0 ? this.zonesOfTargets(targets) : undefined;
    object.castVia = via;
    object.stormCount = stormCount;
    // Cast without paying its mana cost: only what a cost increase took was
    // spent (rule 118.9).
    object.manaSpent = manaValue(payment.resolved);
    if (grantHaste) object.hastyUntilItLeaves = true;
    this.state.players[owner].spellsCastThisTurn += 1;
    (this.state.players[owner].spellsCastThisTurnIds ??= []).push(cardId);
    this.state.spellsCastThisTurn += 1;
    this.emit({
      type: "spell-cast",
      player: owner,
      object: cardId,
      targets: targets.filter((t): t is TargetRef => t !== undefined),
      x: object.xValue ?? null,
      spellsThisTurn: this.state.players[owner].spellsCastThisTurn,
      via,
      from: castFrom,
    });
    // A free cast (cascade, suspend) targets like any other — the trigger
    // is about being targeted, not about how the spell was paid for.
    this.announceTargeted(targets, owner, cardId, true);
    return true;
  }

  /** Cast a suspended card whose last time counter just came off (rule
   * 702.62e). If it can't be cast now it stays exiled, no longer suspended. */
  private castSuspendedCard(cardId: ObjectId): void {
    const object = this.state.objects[cardId];
    if (object === undefined || object.zone !== "exile") return;
    if (!this.castCardWithoutPaying(cardId, { via: "suspend", grantHaste: true })) {
      this.abandonSuspendedCast(cardId, "couldn't be cast");
    }
  }

  /** A suspended card whose free cast didn't happen stays exiled, no longer
   * suspended (rule 702.62e). */
  private abandonSuspendedCast(cardId: ObjectId, reason: string): void {
    const object = this.state.objects[cardId];
    if (object === undefined) return;
    object.suspended = false;
    this.emit({ type: "spell-fizzled", object: cardId, reason });
  }

  /** The fixed cost to foretell any card (rule 702.144c). */
  private static readonly FORETELL_COST = "{2}";

  /** Why `player` cannot foretell `cardId` from hand right now (rule 702.144 —
   * ROADMAP Phase 6b). A special action on your own turn whenever you have
   * priority; pay `{2}`. */
  private whyCannotForetell(player: PlayerId, cardId: ObjectId): string | null {
    const blocked = this.whyCannotAct(player);
    if (blocked !== null) return blocked;
    if (this.activePlayer !== player) return "can only foretell on your own turn";
    if (!this.state.zones.perPlayer[player].hand.includes(cardId)) {
      return `${player} does not have that card in hand`;
    }
    const def = this.registry.get(this.state.objects[cardId].cardName);
    if (def.foretell === null) return `${def.name} does not have foretell`;
    if (this.payMana(player, parseManaCost(Game.FORETELL_COST)) === null) {
      return `${player} cannot pay the foretell cost`;
    }
    return null;
  }

  private foretellCard(player: PlayerId, cardId: ObjectId): void {
    const why = this.whyCannotForetell(player, cardId);
    if (why !== null) throw new Error(why);
    const object = this.state.objects[cardId];

    const payment = this.payMana(player, parseManaCost(Game.FORETELL_COST));
    if (payment === null) throw new Error(`${player} cannot pay the foretell cost`);

    this.moveObject(cardId, "exile");
    this.executePayment(player, payment);
    object.foretold = true;
    object.foretoldOnTurn = this.state.turn.number;
    this.emit({ type: "card-foretold", player, object: cardId });
    this.afterPlayerAction(player);
  }

  /**
   * Why `player` cannot cast `cardId` at all right now — ignoring which targets
   * they would pick, but requiring that every target slot has a legal option.
   */
  /** Is `cardId` `player`'s own commander, currently sitting in the command
   * zone (and so castable from there, rule 903.4)? */
  private isCastableCommander(player: PlayerId, cardId: ObjectId): boolean {
    const object = this.state.objects[cardId];
    return (
      object.isCommander &&
      object.owner === player &&
      this.state.zones.shared.command.includes(cardId)
    );
  }

  /** {2} more for each previous time *this* commander (by name) was cast from
   * the command zone this game (rule 903.8, "commander tax") — or nothing,
   * for a commander that pays its tax in life instead (see
   * {@link commanderTaxLife}). */
  private commanderTax(player: PlayerId, cardId: ObjectId): number {
    if (this.taxPaidInLife(cardId)) return 0;
    return 2 * this.previousCommanderCasts(player, cardId);
  }

  /** The life `player` pays as the commander tax when casting `cardId` from
   * the command zone: 2 for each previous cast, for a card whose
   * `commanderTaxAsLife` replaces the {2} (Liesa, Shroud of Dusk — "pay 2
   * life that many times"). 0 for any other card, and for any cast from
   * elsewhere — the tax is only ever owed on a cast from the command zone. */
  private commanderTaxLife(player: PlayerId, cardId: ObjectId): number {
    if (!this.isCastableCommander(player, cardId) || !this.taxPaidInLife(cardId)) return 0;
    return 2 * this.previousCommanderCasts(player, cardId);
  }

  private previousCommanderCasts(player: PlayerId, cardId: ObjectId): number {
    const name = this.state.objects[cardId].cardName;
    return this.state.players[player].commanderCastCounts[name] ?? 0;
  }

  private taxPaidInLife(cardId: ObjectId): boolean {
    return this.registry.get(this.state.objects[cardId].cardName).commanderTaxAsLife;
  }

  /** `def.manaCost`, plus the commander tax if `cardId` is being cast from
   * the command zone, with `{X}` resolved to `xValue` (folded into generic),
   * and battlefield `costModification` statics (Foundry Inspector, Thalia)
   * applied (rule 601.2f — can't go below 0; see `reduceManaCost` for where
   * a reduction lands). `targetCount` is how many distinct targets the spell
   * has, for a "for each target" modification (Hinata, Dawn-Crowned) — the
   * targets are chosen before the cost is determined (601.2c, then 601.2f). */
  private castingCostOf(
    player: PlayerId,
    cardId: ObjectId,
    def: CardDefinition,
    xValue = 0,
    costString: string | null = def.manaCost,
    targetCount = 0,
  ): ManaCost {
    const base = parseManaCost(costString);
    const tax = this.isCastableCommander(player, cardId) ? this.commanderTax(player, cardId) : 0;
    const mods = this.costModificationFor(player, cardId, targetCount);
    let reduction = mods.reduceGeneric;
    if (
      def.selfCostReduction !== null &&
      staticConditionMet(this.state, this.registry, this.state.objects[cardId], def.selfCostReduction.condition)
    ) {
      reduction += this.costReductionAmount(def.selfCostReduction.reduceGeneric, player, cardId);
    }
    return reduceManaCost(
      {
        ...base,
        generic: base.generic + tax + base.x * Math.max(0, xValue) + mods.increaseGeneric,
        x: 0,
      },
      reduction,
      mods.colored,
    );
  }

  /** Whether what `player` would pay for `cardId` depends on how many
   * targets it's cast with — a "for each target" `costModification` reaches
   * it (Hinata, Dawn-Crowned) and actually changes something. Linear in the
   * count, so comparing none against one is enough. */
  private costDependsOnTargets(
    player: PlayerId,
    cardId: ObjectId,
    def: CardDefinition,
    costString: string | null,
  ): boolean {
    const anyPerTarget = [...this.state.zones.shared.battlefield, ...this.state.zones.shared.command].some(
      (id) => {
        const source = this.state.objects[id];
        return (
          source !== undefined &&
          this.registry.get(printedCardName(source)).static.some((a) => a.costModification?.perTarget === true)
        );
      },
    );
    if (!anyPerTarget) return false;
    const at = (k: number) => JSON.stringify(this.castingCostOf(player, cardId, def, 0, costString, k));
    return at(0) !== at(1);
  }

  /** The fewest and most distinct targets `cardId` could be cast with, over
   * every legal choice of targets — and, for a targeted modal spell, of
   * modes. `null` when no legal choice exists. */
  private targetCountBoundsFor(
    def: CardDefinition,
    player: PlayerId,
    card: ObjectId,
    kicked: boolean,
    overload: boolean,
  ): TargetCountRange | null {
    const source = this.cardSource(def, card);
    const copies: Record<string, number> = {};
    const boundsOf = (modes: readonly number[] | undefined) => {
      const specs = this.effectiveTargetSpecs(def, modes, kicked, overload);
      const options = this.targetOptionsFor(specs, player, source);
      const here = this.targetCopies(options.flat());
      Object.assign(copies, here);
      return targetCountBounds(options, specs, here);
    };
    const withCopies = (range: TargetCountRange): TargetCountRange =>
      Object.keys(copies).length > 0 ? { ...range, copies } : range;
    const modal = def.castModal;
    if (modal === null) {
      const bounds = boundsOf(undefined);
      return bounds === null ? null : withCopies(bounds);
    }
    let min = Number.POSITIVE_INFINITY;
    let max = -1;
    for (let mask = 0; mask < 1 << modal.modes.length; mask += 1) {
      const modes = modal.modes.map((_m, i) => i).filter((i) => (mask & (1 << i)) !== 0);
      if (modes.length < modal.minModes || modes.length > modal.maxModes) continue;
      const bounds = boundsOf(modes);
      if (bounds === null) continue;
      min = Math.min(min, bounds.min);
      max = Math.max(max, bounds.max);
    }
    return max < 0 ? null : withCopies({ min, max });
  }

  /** The size of each compacted token stack among `refs` — a stack named in
   * several target slots is that many targets, one token per slot
   * (`lockInTargets`), which is how "for each target" counts it. */
  private targetCopies(refs: readonly (TargetRef | null | undefined)[]): TargetCopies {
    const out: Record<string, number> = {};
    for (const ref of refs) {
      if (ref === null || ref === undefined || ref.kind !== "object") continue;
      const object = this.state.objects[ref.object];
      if (object?.zone === "battlefield" && (object.stackCount ?? 1) > 1) {
        out[ref.object] = object.stackCount ?? 1;
      }
    }
    return out;
  }

  /** Whether static `ability` on `source` is currently active — its `condition`
   * gate (rule 604.3 — "as long as …"), if any, is met. ROADMAP Phase 11 EG-3. */
  private staticActive(source: GameObject, ability: StaticAbility): boolean {
    return (
      ability.condition === undefined ||
      staticConditionMet(this.state, this.registry, source, ability.condition)
    );
  }

  /**
   * `cardId`'s printed mana cost with its generic portion rewritten to what
   * `player` would actually pay, or `null` when nothing has changed it.
   *
   * Only the generic number is rewritten, and that is exact rather than a
   * simplification: commander tax, `costModification` and
   * `selfCostReduction` all adjust the generic portion and nothing else, so
   * re-serialising a parsed `ManaCost` would risk getting a hybrid or
   * Phyrexian pip wrong for no gain.
   *
   * `{0}` is dropped when the cost has other pips, because "{R}" is how a
   * fully-reduced Blasphemous Act reads -- but kept when it is the whole
   * cost, since a free spell still has to show something.
   */
  private displayCostOf(player: PlayerId, cardId: ObjectId): string | null {
    const object = this.state.objects[cardId];
    if (object === undefined) return null;
    const def = this.registry.get(printedCardName(object));
    const printed = def.manaCost;
    if (printed === null) return null;
    const base = parseManaCost(printed);
    // An {X} cost's generic is chosen at cast time, so there is no single
    // number to show and the printed cost is already the honest answer.
    if (base.x > 0) return null;
    // Commander tax is deliberately **excluded**: the client already draws
    // it as its own "+N" badge beside the cost, and folding it in here would
    // show the same mana twice.
    const tax = this.isCastableCommander(player, cardId)
      ? this.commanderTax(player, cardId)
      : 0;
    const withTax = this.castingCostOf(player, cardId, def, 0, printed);
    const actualGeneric = Math.max(0, withTax.generic - tax);
    if (actualGeneric === base.generic) return null;
    const actual = { generic: actualGeneric };

    const GENERIC = /\{(\d+)\}/;
    if (actual.generic === 0) {
      const withoutGeneric = printed.replace(GENERIC, "");
      return withoutGeneric.length > 0 ? withoutGeneric : "{0}";
    }
    return base.generic > 0
      ? printed.replace(GENERIC, "{" + String(actual.generic) + "}")
      : "{" + String(actual.generic) + "}" + printed;
  }

  /** What `costModification` statics on the battlefield (and Eminence's in
   * the command zone) do to `cardId`'s cost as `player` casts it with
   * `targetCount` distinct targets: the generic mana they add, the generic
   * mana they take off, and the coloured reductions (rule 601.2f). */
  private costModificationFor(
    player: PlayerId,
    cardId: ObjectId,
    targetCount = 0,
  ): { increaseGeneric: number; reduceGeneric: number; colored: ColoredReduction[] } {
    let increaseGeneric = 0;
    let reduceGeneric = 0;
    const colored: ColoredReduction[] = [];
    // The command zone joins the scan for Eminence's static form (The
    // Ur-Dragon), and contributes only the abilities marked for it.
    const sources = [
      ...this.state.zones.shared.battlefield,
      ...this.state.zones.shared.command,
    ];
    for (const id of sources) {
      const source = this.state.objects[id];
      if (source === undefined || hasLostAbilities(source)) continue;
      const onlyEminence = source.zone === "command";
      for (const ability of this.registry.get(printedCardName(source)).static) {
        const mod = ability.costModification;
        if (mod === undefined) continue;
        if (onlyEminence && ability.fromCommandZone !== true) continue;
        // "Other … spells": never discount the source's own card.
        if (mod.otherOnly === true && cardId === id) continue;
        if (!this.staticActive(source, ability)) continue;
        // Urza's Incubator (needed-cards P14): the filter also requires the
        // spell's subtype to match this permanent's own ETB choice — nothing
        // matches before that choice is made.
        if (mod.matchesChosenCreatureType && source.chosenCreatureType == null) continue;
        const applies = mod.matchesChosenCreatureType
          ? { ...mod.applies, subtype: source.chosenCreatureType ?? undefined }
          : mod.applies;
        // The filter is evaluated from *this static's controller's*
        // perspective, so `controlledBy: "you"` means "a spell its
        // controller casts" (Foundry Inspector reducing only its own
        // controller's artifact spells, not anyone's) — fixed alongside
        // needed-cards P16's Temur Battlecrier, which needs the same
        // scoping for its live count.
        if (!matchesFilter(this.state, this.registry, cardId, applies, { you: source.controller })) {
          continue;
        }
        // "Spells you cast" / "spells your opponents cast" (Hinata): the
        // caster, whoever the card belongs to.
        if (mod.caster === "you" && player !== source.controller) continue;
        if (mod.caster === "opponent" && player === source.controller) continue;
        // "The first … spell you cast each turn": any matching spell this
        // player has already cast this turn has had it.
        if (
          mod.firstEachTurn === true &&
          (this.state.players[player].spellsCastThisTurnIds ?? []).some(
            (id) =>
              this.state.objects[id] !== undefined &&
              matchesFilter(this.state, this.registry, id, applies, { you: source.controller }),
          )
        ) {
          continue;
        }
        const times = mod.perTarget === true ? targetCount : 1;
        if (mod.reduceGeneric !== undefined) {
          reduceGeneric += times * this.costReductionAmount(mod.reduceGeneric, source.controller, source.id);
        }
        increaseGeneric += times * (mod.increaseGeneric ?? 0);
        if (mod.reduceColored !== undefined) {
          colored.push(coloredReductionOf(mod.reduceColored, mod.coloredOnly === true));
        }
      }
    }
    return { increaseGeneric, reduceGeneric, colored };
  }

  /** How many active `doubleEntryTriggers` statics `controller` has that
   * apply to `enteringId` entering (Panharmonicon-style — needed-cards P15).
   * Two such statics make an ETB trigger fire three times total (1 + 2). */
  /** How many `doubleTriggers` statics `controller` has whose cause is
   * `event` — each makes a trigger that event causes fire once more. */
  private causeTriggerDoublers(controller: PlayerId, event: GameEvent): number {
    const subject = (cause: "enters" | "attacks" | "combat-damage-to-player"): ObjectId | null | undefined => {
      if (cause === "enters") {
        return event.type === "permanent-entered-battlefield" ? event.object : undefined;
      }
      if (cause === "attacks") {
        if (event.type === "attacker-declared" || event.type === "attacked-alone") return event.attacker;
        return event.type === "attackers-declared" ? null : undefined;
      }
      return event.type === "damage-dealt" && event.combat && event.target.kind === "player"
        ? event.source
        : undefined;
    };
    let count = 0;
    for (const id of this.state.zones.shared.battlefield) {
      const source = this.state.objects[id];
      if (source.controller !== controller || hasLostAbilities(source)) continue;
      for (const ability of this.registry.get(printedCardName(source)).static) {
        const d = ability.doubleTriggers;
        if (d === undefined || !this.staticActive(source, ability)) continue;
        const who = subject(d.cause);
        if (who === undefined) continue;
        if (d.filter !== undefined) {
          if (who === null) continue;
          if (!matchesFilter(this.state, this.registry, who, d.filter, { you: controller })) continue;
        }
        count += 1;
      }
    }
    return count;
  }

  /** Whether an entering permanent is barred from causing `controller`'s
   * triggers (Elesh Norn, Mother of Machines; Torpor Orb). */
  private entryTriggersSuppressed(controller: PlayerId): boolean {
    for (const id of this.state.zones.shared.battlefield) {
      const source = this.state.objects[id];
      if (hasLostAbilities(source)) continue;
      for (const ability of this.registry.get(printedCardName(source)).static) {
        const s = ability.suppressEntryTriggers;
        if (s === undefined || !this.staticActive(source, ability)) continue;
        if (s === "everyone" || source.controller !== controller) return true;
      }
    }
    return false;
  }

  private entryTriggerDoublers(controller: PlayerId, enteringId: ObjectId): number {
    let count = 0;
    for (const id of this.state.zones.shared.battlefield) {
      const source = this.state.objects[id];
      if (source.controller !== controller || hasLostAbilities(source)) continue;
      for (const ability of this.registry.get(printedCardName(source)).static) {
        const d = ability.doubleEntryTriggers;
        if (d === undefined) continue;
        if (!this.staticActive(source, ability)) continue;
        if (
          d.filter !== undefined &&
          !matchesFilter(this.state, this.registry, enteringId, d.filter, { you: controller })
        ) {
          continue;
        }
        count += 1;
      }
    }
    return count;
  }

  /**
   * The largest `{X}` `player` could cast `cardId` for, and a convoke
   * payment that gets there (`[]` when mana alone does, and always for a
   * spell without convoke).
   *
   * Each creature convoking pays one generic or one pip of its colour (rule
   * 702.51a), so convoke raises X as far as mana does. Three ways of paying
   * are tried: mana alone, then convoking the creatures that don't make mana
   * (so those that do still can), then convoking everything — a creature
   * that taps for two mana pays more tapped for mana than convoking. Each
   * gets more expensive monotonically in X, so each is binary-searched, and
   * the cheapest to reach the best X wins, tapping the fewest creatures.
   */
  private xPlanFor(
    player: PlayerId,
    cardId: ObjectId,
    def: CardDefinition,
    costString: string | null,
    face: number,
    targetCount = 0,
  ): { maxX: number; convoke: PaidConvoke[] } {
    const manaOnly = this.maxAffordableX(player, cardId, def, costString, face, targetCount);
    if (!def.convoke) return { maxX: manaOnly, convoke: [] };
    return this.withFace(cardId, face, () => {
      const purpose: ManaPurpose = { kind: "cast", card: cardId };
      const payable = (k: number, pool: readonly ObjectId[]): PaidConvoke[] | null => {
        const cost = this.castingCostOf(player, cardId, def, k, costString, targetCount);
        const proof = this.maxConvokeFor(pool, cost);
        const arrangement =
          proof.length > 0 ? { withheld: new Set(proof.map((p) => p.creature)) } : undefined;
        const rest = proof.length > 0 ? this.reduceCostByConvoke(cost, proof) : cost;
        return this.payMana(player, rest, undefined, undefined, purpose, arrangement) === null
          ? null
          : proof;
      };
      // `maxAffordableX` reports 0 even when X=0 itself isn't affordable.
      let best: { maxX: number; convoke: PaidConvoke[] } =
        payable(0, []) !== null ? { maxX: manaOnly, convoke: [] } : { maxX: -1, convoke: [] };
      const candidates = this.convokeCandidates(player);
      const sources = this.manaSources(player);
      const makesMana = new Set(sources.map((s) => s.id));
      const spare = candidates.filter((id) => !makesMana.has(id));
      const manaCap =
        sources.reduce((n, s) => n + Game.sourceCapacity(s), 0) +
        this.state.players[player].manaPool.length;
      for (const pool of spare.length < candidates.length ? [spare, candidates] : [candidates]) {
        if (pool.length === 0) continue;
        let lo = best.maxX + 1;
        let proof = payable(lo, pool);
        if (proof === null) continue;
        // A stack convokes once per token.
        const hi0 = manaCap + pool.reduce((n, id) => n + (this.state.objects[id].stackCount ?? 1), 0);
        let hi = Math.max(lo, hi0);
        while (lo < hi) {
          const mid = Math.ceil((lo + hi) / 2);
          const found = payable(mid, pool);
          if (found === null) {
            hi = mid - 1;
          } else {
            lo = mid;
            proof = found;
          }
        }
        best = { maxX: lo, convoke: proof };
      }
      return best.maxX < 0 ? { maxX: 0, convoke: [] } : best;
    });
  }

  /** Largest value of `{X}` this player could currently pay for when casting
   * `cardId` with mana alone (0 if only X=0 is affordable). */
  private maxAffordableX(
    player: PlayerId,
    cardId: ObjectId,
    def: CardDefinition,
    costString: string | null = def.manaCost,
    face = 0,
    targetCount = 0,
  ): number {
    const parsed = parseManaCost(costString);
    if (parsed.x === 0) return 0;
    // Upper bound: every mana source plus everything already floating — X can't
    // exceed that no matter what.
    const pool = this.state.players[player].manaPool;
    const cap =
      this.manaSources(player).reduce(
        (n, s) => n + Game.sourceCapacity(s),
        0,
      ) + pool.length;
    return this.withFace(cardId, face, () => {
      let best = 0;
      for (let k = 1; k <= cap; k += 1) {
        if (
          this.payMana(
            player,
            this.castingCostOf(player, cardId, def, k, costString, targetCount),
            undefined,
            undefined,
            { kind: "cast", card: cardId },
          ) === null
        ) {
          break;
        }
        best = k;
      }
      return best;
    });
  }

  /** Largest value of `{X}` this player could currently pay for in an
   * activated-ability mana cost (`manaString`), not tapping `avoid` (the
   * source, when the cost has no `{T}`). 0 if the cost has no `{X}`. */
  /**
   * The largest `{X}` `player` could currently pay for an activated ability.
   *
   * `avoid` and `exclude` must be passed exactly as `activateAbility` passes
   * them to {@link payMana} — a preference versus a rule (rule 602.2a). They
   * used to diverge: this took only `avoid`, so for a `{X}…{T}` ability the
   * source counted as an available mana source here and was excluded at
   * payment time, and `legalActions` advertised an X one higher than the
   * player could actually pay. The 4-player fuzzer found it on Kessig Wolf
   * Run, which is `{X}{1}{R}, {T}` off a land that taps for mana itself.
   */
  private maxAffordableAbilityX(
    player: PlayerId,
    costAt: (x: number) => ManaCost,
    avoid?: ObjectId,
    exclude?: ObjectId,
  ): number {
    const pool = this.state.players[player].manaPool;
    const cap =
      this.manaSources(player).reduce((n, s) => n + Game.sourceCapacity(s), 0) +
      pool.length;
    let best = 0;
    for (let k = 1; k <= cap; k += 1) {
      if (this.payMana(player, costAt(k), avoid, exclude) === null) break;
      best = k;
    }
    return best;
  }

  /** The mana-cost string `player` would pay to cast `cardId` under `via`
   * (the flashback cost from the graveyard, the foretell cost from exile, else
   * the printed cost). */
  private castCostString(
    cardId: ObjectId,
    via: CastVia | undefined,
    face = 0,
    kicked = false,
    overload = false,
    free = false,
    altCost = false,
    costOption?: number,
  ): string | null {
    const def = this.faceDef(cardId, face);
    // An alternative cost (Sephara) replaces the mana cost entirely, like
    // overload and a free-cast permission — the creature-tapping half is
    // paid separately in `castSpell`.
    if (altCost && def.alternativeCost !== null) return def.alternativeCost.mana;
    // A conditional free-cast permission (Fierce Guardianship) also replaces
    // the mana cost entirely, same as overload.
    if (free && def.freeCastIf !== null) return "{0}";
    // Overload (rule 702.126b) *replaces* the mana cost entirely, unlike
    // kicker's additive cost.
    if (overload && def.overload !== null) return def.overload.cost;
    const base =
      via === "flashback"
        ? this.flashbackCostOf(cardId)
        : via === "escape"
          ? (def.escape?.cost ?? null)
          : via === "foretell"
            ? (def.foretell?.cost ?? null)
            : // Disturb (rule 702.150) — the disturb cost is on the front face.
              via === "disturb"
              ? (this.frontFaceDef(cardId).disturb?.cost ?? null)
              : // Adventure (rule 715) — the creature is cast for its own cost.
                def.manaCost;
    // A chosen additional-cost branch that is paid in mana (Redirect
    // Lightning's "or pay {2}") concatenates the same way kicker does, and
    // for the same reason — an additional cost adds to what's being paid.
    // Applied before kicker only because the concatenation is commutative;
    // `parseManaCost` is order-independent.
    const optionMana =
      costOption === undefined
        ? undefined
        : def.additionalCost?.options?.[costOption]?.mana;
    const withOption = base === null || optionMana === undefined ? base : base + optionMana;
    // Kicker (rule 702.33) is an additional cost, so it just concatenates onto
    // whatever cost is being paid — `parseManaCost` is order-independent.
    if (!kicked || def.kicker === null || withOption === null) return withOption;
    return withOption + def.kicker.cost;
  }

  /** The concrete target specs of a spell — its own, the kicked ones if it was
   * kicked into a different target (Tear Asunder), or (for a targeted modal
   * spell) the concatenation of the chosen modes' specs, in mode order. */
  private effectiveTargetSpecs(
    def: CardDefinition,
    modes: readonly number[] | undefined,
    kicked = false,
    overload = false,
  ): readonly TargetSpec[] {
    // Overload (rule 702.126a): "you can't choose targets for it".
    if (overload) return [];
    if (kicked && def.kicker?.targets !== undefined) return def.kicker.targets;
    if (def.castModal === null || modes === undefined) return def.targets;
    return [...modes]
      .sort((a, b) => a - b)
      .flatMap((i) => def.castModal?.modes[i]?.targets ?? []);
  }

  /**
   * Permanents `player` could sacrifice to pay a card's
   * {@link CardDefinition.additionalCost} (rule 601.2f — Harrow "sacrifice a
   * land"). `[]` when the card has no such cost. needed-cards P8.
   */
  /** What may pay a spell's additional sacrifice: its fixed "as an additional
   * cost, sacrifice …", or the sacrifice in the branch `costOption` names of
   * a choice of additional costs (Demand Answers' "sacrifice an artifact").
   * Offered to the driver either way — which permanent goes is the player's
   * call, never the first one found. */
  private additionalCostSacrifices(
    player: PlayerId,
    def: CardDefinition,
    costOption?: number,
  ): ObjectId[] {
    const filter =
      def.additionalCost?.sacrifice ??
      (costOption === undefined ? undefined : def.additionalCost?.options?.[costOption]?.sacrifice);
    if (filter === undefined) return [];
    return this.state.zones.shared.battlefield.filter(
      (id) =>
        this.state.objects[id].controller === player &&
        matchesFilter(this.state, this.registry, id, filter, { you: player }),
    );
  }

  /** Why the chosen `modes` are illegal for a `castModal` card (or `null`). */
  private whyCannotChooseCastModes(
    castModal: NonNullable<CardDefinition["castModal"]>,
    modes: readonly number[],
  ): string | null {
    if (new Set(modes).size !== modes.length) return "the same mode was chosen twice";
    if (modes.length < castModal.minModes || modes.length > castModal.maxModes) {
      return `choose between ${castModal.minModes} and ${castModal.maxModes} mode(s)`;
    }
    if (modes.some((i) => !Number.isInteger(i) || i < 0 || i >= castModal.modes.length)) {
      return "invalid mode index";
    }
    return null;
  }

  private whyCannotCastSpell(
    player: PlayerId,
    cardId: ObjectId,
    via?: CastVia,
    face = 0,
    modes?: readonly number[],
    kicked = false,
    sacrifice?: ObjectId,
    overload = false,
    free = false,
    convoke?: readonly ConvokePayment[],
    altCost = false,
    costOption?: number,
    tap?: readonly ObjectId[],
    graveyardGrant?: GraveyardGrant,
    xValue = 0,
    targetCount = 0,
    escapeExile?: readonly ObjectId[],
  ): string | null {
    const blocked = this.whyCannotAct(player);
    if (blocked !== null) return blocked;
    const def = this.faceDef(cardId, face);
    if (via === "flashback") {
      if (this.flashbackCostOf(cardId) === null) return `${def.name} does not have flashback`;
      if (!this.state.zones.perPlayer[player].graveyard.includes(cardId)) {
        return `${def.name} is not in ${player}'s graveyard`;
      }
      // "Flashback—{1}{U}, Pay 3 life" (Deep Analysis) — part of the cost, so
      // it gates castability the same way the mana does.
      const life = def.flashback?.payLife;
      if (life !== undefined && this.state.players[player].life <= life) {
        return `${player} cannot pay ${life} life for ${def.name}'s flashback`;
      }
    } else if (via === "escape") {
      if (def.escape === null) return `${def.name} does not have escape`;
      if (!this.state.zones.perPlayer[player].graveyard.includes(cardId)) {
        return `${def.name} is not in ${player}'s graveyard`;
      }
      const others = this.state.zones.perPlayer[player].graveyard.filter((id) => id !== cardId);
      if (others.length < def.escape.exileCount) {
        return `${def.name}'s escape needs ${def.escape.exileCount} other cards in the graveyard`;
      }
      if (escapeExile !== undefined) {
        const wrong = this.whyEscapeExileIsWrong(player, cardId, def.name, def.escape.exileCount, escapeExile);
        if (wrong !== null) return wrong;
      }
    } else if (via === "foretell") {
      const object = this.state.objects[cardId];
      if (def.foretell === null || !object.foretold) return `${def.name} is not foretold`;
      if (object.owner !== player || object.zone !== "exile") {
        return `${def.name} is not ${player}'s foretold card`;
      }
      if (object.foretoldOnTurn === this.state.turn.number) {
        return `${def.name} was foretold this turn`;
      }
    } else if (via === "disturb") {
      // Rule 702.150 — cast the back face (face 1) from the graveyard.
      if (this.frontFaceDef(cardId).disturb === null) return `${def.name} does not have disturb`;
      if (face !== 1) return `disturb casts ${def.name}'s back face`;
      if (!this.state.zones.perPlayer[player].graveyard.includes(cardId)) {
        return `${def.name} is not in ${player}'s graveyard`;
      }
    } else if (via === "adventure") {
      // Rule 715.3 — cast the creature (face 0) from exile after its adventure.
      const object = this.state.objects[cardId];
      if (!object.onAdventure || object.owner !== player || object.zone !== "exile") {
        return `${def.name} is not on an adventure in ${player}'s exile`;
      }
      if (face !== 0) return `an adventure card is cast as its creature half`;
    } else if (via === "impulse") {
      // "Impulse draw" — exiled face-up with permission to play it, for its
      // ordinary cost.
      if (!this.impulsePlayable(player, cardId)) {
        return `${def.name} is not playable from exile by ${player}`;
      }
    } else if (via === "graveyard-permission") {
      if (this.findGraveyardGrant(player, cardId, face, graveyardGrant) === null) {
        return `${player} has no permission to cast ${def.name} from their graveyard`;
      }
    } else if (
      !this.state.zones.perPlayer[player].hand.includes(cardId) &&
      !this.isCastableCommander(player, cardId)
    ) {
      return `${player} does not have that card in hand`;
    }
    if (altCost) {
      const alt = def.alternativeCost;
      if (alt === null) return `${def.name} has no alternative cost`;
      if (
        this.tapCapacity(
          this.tapOthersCandidates(player, cardId, { ...alt.tapCreatures, includeSelf: false }),
        ) < alt.tapCreatures.count
      ) {
        return `${def.name}'s alternative cost needs ${alt.tapCreatures.count} untapped creatures`;
      }
    }
    if (graveyardGrant !== undefined && via !== "graveyard-permission") {
      return "a graveyard permission is only spent on a graveyard-permission cast";
    }
    if (escapeExile !== undefined && via !== "escape") {
      return "only an escape cast exiles cards from the graveyard to pay for it";
    }
    if (def.types.includes("land")) return "lands are played, not cast";
    // Instant-speed if it's an instant or has flash (rule 702.8); otherwise
    // sorcery timing applies.
    if (!def.types.includes("instant") && !def.keywords.includes("flash")) {
      const timing = this.whyNotSorcerySpeed(player, `cast ${def.name}`);
      if (timing !== null) return timing;
    }
    if (def.castModal !== null && modes !== undefined) {
      const bad = this.whyCannotChooseCastModes(def.castModal, modes);
      if (bad !== null) return `${def.name}: ${bad}`;
    }
    // A choice of additional costs: the driver must name a branch, and the
    // branch it named has to be one this player could actually pay. Checked
    // before the fixed additional costs below, which are paid on top of it.
    const options = def.additionalCost?.options;
    if (options !== undefined && options.length > 0) {
      if (costOption === undefined) {
        return `${def.name} needs one of its additional costs chosen`;
      }
      const option = options[costOption];
      if (option === undefined) return `${def.name} has no such additional cost`;
      const unpayable = this.whyCostOptionUnpayable(player, cardId, def, option);
      if (unpayable !== null) return unpayable;
    } else if (costOption !== undefined) {
      return `${def.name} has no choice of additional cost`;
    }
    if (kicked && def.kicker === null) return `${def.name} has no kicker`;
    if (overload && def.overload === null) return `${def.name} has no overload cost`;
    if (free) {
      if (def.freeCastIf === null) return `${def.name} has no free-cast permission`;
      if (!staticConditionMet(this.state, this.registry, this.state.objects[cardId], def.freeCastIf.condition)) {
        return `${def.name}'s free-cast condition isn't met`;
      }
    }
    // An additional sacrifice cost (rule 601.2f) must be payable, and — once
    // the driver has named one — that permanent must actually qualify.
    if (def.additionalCost !== null) {
      const sacrificesInCost =
        def.additionalCost.sacrifice !== undefined ||
        (costOption !== undefined && def.additionalCost.options?.[costOption]?.sacrifice !== undefined);
      if (sacrificesInCost) {
        const candidates = this.additionalCostSacrifices(player, def, costOption);
        if (candidates.length === 0) {
          return `${player} has nothing to sacrifice to cast ${def.name}`;
        }
        if (sacrifice !== undefined && !candidates.includes(sacrifice)) {
          return `that permanent cannot pay ${def.name}'s additional cost`;
        }
      }
      const discard = def.additionalCost.discard;
      if (discard !== undefined) {
        // The spell itself is still in hand while this is checked, and it
        // can't discard itself to pay its own cost (rule 601.2h).
        const others = this.state.zones.perPlayer[player].hand.filter((id) => id !== cardId);
        if (others.length < discard) {
          return `${player} has too few cards in hand to cast ${def.name}`;
        }
      }
      const payLife = def.additionalCost.payLife;
      // Rule 118.4 — a player may pay any life they have, down to 0.
      if (payLife !== undefined && this.state.players[player].life < payLife) {
        return `${player} has too little life to cast ${def.name}`;
      }
    }
    // A non-modal spell's target legality is checked up front; a modal spell's
    // is checked per chosen mode (only once `modes` is known — at enumeration
    // time the driver hasn't picked yet).
    for (const spec of this.effectiveTargetSpecs(def, modes, kicked, overload)) {
      // An *optional* slot with nothing to point at is simply left empty, so
      // it never blocks the cast (rule 601.2c only demands a legal target for
      // the slots that require one).
      if (isOptionalSpec(spec)) continue;
      if (
        legalTargets(this.state, this.registry, spec, player, this.cardSource(def, cardId))
          .length === 0
      ) {
        return `${def.name} has no legal ${describeTargetSpec(spec)} target`;
      }
    }
    // Liesa's life-paid commander tax. Rule 119.4: life can be paid only
    // while the total is at least the payment — down to exactly 0 is fine.
    if (this.state.players[player].life < this.commanderTaxLife(player, cardId)) {
      return `${player} has too little life to pay ${def.name}'s commander tax`;
    }
    // At the X being cast for: convoking creatures can pay for X (Chord of
    // Calling), so a convoke can't be judged against the cost at X=0.
    const baseCost = this.withFace(cardId, face, () =>
      this.castingCostOf(
        player,
        cardId,
        def,
        Math.max(0, Math.floor(xValue)),
        this.castCostString(cardId, via, face, kicked, overload, free, altCost),
        targetCount,
      ),
    );
    let convoked: PaidConvoke[] = [];
    if (convoke !== undefined && convoke.length > 0) {
      if (!def.convoke) return `${def.name} does not have convoke`;
      const resolved = this.resolveConvoke(convoke, baseCost);
      if (typeof resolved === "string") return resolved;
      const convokeError = this.whyCannotConvoke(player, resolved, baseCost);
      if (convokeError !== null) return convokeError;
      convoked = resolved;
    }
    const cost = convoked.length > 0 ? this.reduceCostByConvoke(baseCost, convoked) : baseCost;
    const purpose: ManaPurpose = { kind: "cast", card: cardId };
    if (altCost && def.alternativeCost !== null) {
      // The tap half is checked against the same mana — see `tapCostOffer`.
      const offer = this.tapCostOffer(
        player,
        cardId,
        { ...def.alternativeCost.tapCreatures, includeSelf: false },
        cost,
        undefined,
        undefined,
        purpose,
      );
      if (offer === null) return `${player} cannot pay the cost of ${def.name}`;
      if (this.tapCapacity(offer.choices) < offer.count) {
        return `${def.name}'s alternative cost needs ${offer.count} untapped creatures`;
      }
      return tap === undefined ? null : this.whyTapChoiceIsWrong(def.name, offer, tap);
    }
    // A creature tapped to convoke is no longer untapped to tap for mana.
    const convokers =
      convoked.length > 0 ? { withheld: new Set(convoked.map((p) => p.creature)) } : undefined;
    if (this.payMana(player, cost, undefined, undefined, purpose, convokers) === null) {
      return `${player} cannot pay the cost of ${def.name}`;
    }
    return null;
  }

  /** Why `convoke` (rule 702.51a) is illegal against `cost` — each entry
   * must be an untapped creature `player` controls, tapped only once, paying
   * either `"generic"` or one of its own current colors, and never more
   * generic/colored payers than `cost` actually has of that kind (tapping a
   * creature "for" a pip the spell doesn't need isn't a legal choice). */
  private whyCannotConvoke(
    player: PlayerId,
    convoke: readonly PaidConvoke[],
    cost: ManaCost,
  ): string | null {
    const seen = new Map<ObjectId, number>();
    let genericPay = 0;
    const colorPay: Record<Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
    for (const { creature, pays } of convoke) {
      const object = this.state.objects[creature];
      if (object === undefined || object.zone !== "battlefield" || object.controller !== player) {
        return `${player} does not control that creature`;
      }
      // A compacted token stack convokes once per token.
      const times = (seen.get(creature) ?? 0) + 1;
      if (times > (object.stackCount ?? 1)) return "the same creature can't convoke twice";
      seen.set(creature, times);
      if (object.tapped) return "that creature is already tapped";
      const c = computeCharacteristics(this.state, this.registry, creature);
      if (!c.types.includes("creature")) return "only a creature can convoke";
      if (pays === "generic") {
        genericPay += 1;
      } else {
        if (!c.colors.has(pays)) return `that creature isn't ${pays}`;
        colorPay[pays] += 1;
      }
    }
    if (genericPay > cost.generic) return "convoke can't pay more generic mana than the cost has left";
    for (const color of COLORS) {
      if (colorPay[color] > cost.colored[color]) {
        return `convoke can't pay more {${color}} than the cost has left`;
      }
    }
    return null;
  }

  /**
   * `convoke` with every `pays` filled in. An entry that names one is taken
   * as it stands; one that doesn't pays one of `cost`'s coloured pips that
   * creature can and that nothing else has paid yet, else a generic one. A
   * reason instead when an entry has nothing left to pay.
   */
  private resolveConvoke(
    convoke: readonly ConvokePayment[],
    cost: ManaCost,
  ): PaidConvoke[] | string {
    const colorLeft = { ...cost.colored };
    let genericLeft = cost.generic;
    for (const { pays } of convoke) {
      if (pays === "generic") genericLeft -= 1;
      else if (pays !== undefined) colorLeft[pays] -= 1;
    }
    const out: PaidConvoke[] = [];
    for (const { creature, pays } of convoke) {
      if (pays !== undefined) {
        out.push({ creature, pays });
        continue;
      }
      const object = this.state.objects[creature];
      if (object === undefined) return "that creature does not exist";
      const colors = computeCharacteristics(this.state, this.registry, creature).colors;
      const color = COLORS.find((c) => colors.has(c) && colorLeft[c] > 0);
      if (color !== undefined) {
        colorLeft[color] -= 1;
        out.push({ creature, pays: color });
      } else if (genericLeft > 0) {
        genericLeft -= 1;
        out.push({ creature, pays: "generic" });
      } else {
        return `${printedCardName(object)} has nothing left to pay for by convoking`;
      }
    }
    return out;
  }

  /** `cost`, minus what `convoke` pays for (already validated by
   * `whyCannotConvoke`) — the remainder is paid with mana as usual. */
  private reduceCostByConvoke(cost: ManaCost, convoke: readonly PaidConvoke[]): ManaCost {
    let generic = cost.generic;
    const colored = { ...cost.colored };
    for (const { pays } of convoke) {
      if (pays === "generic") generic -= 1;
      else colored[pays] -= 1;
    }
    return { ...cost, generic, colored };
  }

  private castSpell(
    player: PlayerId,
    cardId: ObjectId,
    targets: ResolvedTargets,
    xValue = 0,
    via?: CastVia,
    face = 0,
    modes?: readonly number[],
    kicked = false,
    sacrifice?: ObjectId,
    overload = false,
    free = false,
    convoke?: readonly ConvokePayment[],
    altCost = false,
    costOption?: number,
    tap?: readonly ObjectId[],
    graveyardGrant?: GraveyardGrant,
    escapeExile?: readonly ObjectId[],
  ): void {
    // "For each target" cost modifications (Hinata) count these: the targets
    // are chosen before the total cost is determined (rule 601.2c, 601.2f).
    const targetCount = distinctTargetCount(targets, this.targetCopies(targets));
    const why = this.whyCannotCastSpell(
      player,
      cardId,
      via,
      face,
      modes,
      kicked,
      sacrifice,
      overload,
      free,
      convoke,
      altCost,
      costOption,
      tap,
      graveyardGrant,
      xValue,
      targetCount,
      escapeExile,
    );
    if (why !== null) throw new Error(why);

    const object = this.state.objects[cardId];
    // Where it's cast from, before anything moves it (601.2a) — see the
    // `spell-cast` event's `from`.
    const castFrom = object.zone;
    // Set the face up front so `printedCardName` / characteristics resolve to
    // the chosen face for the rest of this method and while on the stack.
    if (object.faces !== undefined) object.face = face;
    const def = this.registry.get(printedCardName(object));
    const costString = this.castCostString(
      cardId,
      via,
      face,
      kicked,
      overload,
      free,
      altCost,
      costOption,
    );
    const hasX =
      parseManaCost(costString).x > 0 || def.additionalCost?.payLifeX === true;
    const chosenX = hasX ? Math.max(0, Math.floor(xValue)) : 0;

    if (def.castModal !== null && modes === undefined) {
      throw new Error(`${def.name} is a modal spell — choose modes to cast it`);
    }
    const sortedModes =
      def.castModal !== null ? [...(modes ?? [])].sort((a, b) => a - b) : undefined;
    const targetSpecs = this.effectiveTargetSpecs(def, sortedModes, kicked, overload);
    // An additional sacrifice cost the driver didn't name (only one candidate,
    // or a driver that doesn't care): take the first eligible permanent.
    const sacrificeCandidates = this.additionalCostSacrifices(player, def, costOption);
    const sacrificeVictim =
      sacrificeCandidates.length === 0 ? undefined : (sacrifice ?? sacrificeCandidates[0]);

    const badTarget = this.whyTargetsInvalid(
      targetSpecs,
      targets,
      player,
      def.name,
      this.cardSource(def, cardId),
    );
    if (badTarget !== null) throw new Error(badTarget);

    const castingFromCommand = this.isCastableCommander(player, cardId);
    const taxLife = this.commanderTaxLife(player, cardId);
    if (this.state.players[player].life < taxLife) {
      throw new Error(`${player} has too little life to pay ${def.name}'s commander tax`);
    }
    const fullCost = this.castingCostOf(player, cardId, def, chosenX, costString, targetCount);
    let convoked: PaidConvoke[] = [];
    if (convoke !== undefined && convoke.length > 0) {
      const resolved = this.resolveConvoke(convoke, fullCost);
      if (typeof resolved === "string") throw new Error(resolved);
      convoked = resolved;
    }
    const cost = convoked.length > 0 ? this.reduceCostByConvoke(fullCost, convoked) : fullCost;
    // Sephara's alternative cost taps creatures as well: picked (or checked)
    // here, before anything is paid, and kept out of the mana plan — see
    // `tapCostOffer`.
    let tapPicked: ObjectId[] = [];
    // Convoking creatures are tapped for the cost, so none of them can also
    // tap for mana.
    let manaArrangement: ManaSourceArrangement | undefined =
      convoked.length > 0 ? { withheld: new Set(convoked.map((p) => p.creature)) } : undefined;
    if (altCost && def.alternativeCost !== null) {
      const spec = { ...def.alternativeCost.tapCreatures, includeSelf: false };
      const offer = this.tapCostOffer(player, cardId, spec, cost, undefined, undefined, {
        kind: "cast",
        card: cardId,
      });
      if (offer === null) throw new Error(`${player} cannot pay the cost of ${def.name}`);
      tapPicked = this.tapCostPicks(def.name, offer, tap);
      manaArrangement = {
        last: new Set(this.tapOthersCandidates(player, cardId, spec)),
        withheld: new Set(tapPicked),
      };
    }
    const payment = this.payMana(
      player,
      cost,
      undefined,
      undefined,
      { kind: "cast", card: cardId },
      manaArrangement,
    );
    if (payment === null) {
      throw new Error(`${player} cannot pay the cost of ${def.name}`);
    }
    // Convoke (rule 702.51a): tap the chosen creatures as part of the cost,
    // alongside the mana payment above — a token peeled off a stack for each
    // time the stack is named.
    for (const { creature } of convoked) {
      if (this.state.objects[creature] === undefined) continue;
      const id = this.splitOneFromStack(creature);
      this.state.objects[id].tapped = true;
      this.emit({ type: "permanent-tapped", object: id });
    }

    // Escape (rule 702.139a): exile N other cards from the graveyard as part
    // of the cost — the ones the caster chose (validated above), or for a
    // driver that doesn't choose, the front (oldest) of the graveyard.
    if (via === "escape" && def.escape !== null) {
      const others = this.state.zones.perPlayer[player].graveyard.filter((id) => id !== cardId);
      const exiled = escapeExile !== undefined ? [...escapeExile] : others.slice(0, def.escape.exileCount);
      // One cost, paid at once — and a separate move from the card's own to
      // the stack below (rules 601.2a / 601.2h), so each is its own
      // "cards leave your graveyard" event.
      this.withGraveyardLeaveBatch(() => {
        for (const id of exiled) this.moveObject(id, "exile");
      });
      this.emit({ type: "escape-cost-paid", object: cardId, exiled: [...exiled] });
    }

    // Storm (rule 702.40a) counts spells cast *before* this one, by any player.
    const stormCount = this.state.spellsCastThisTurn;

    // Laboratory Drudge: every route that casts a spell out of a graveyard.
    if (
      via === "flashback" ||
      via === "escape" ||
      via === "disturb" ||
      via === "graveyard-permission"
    ) {
      this.state.players[player].usedGraveyardThisTurn = true;
    }

    // Spend the graveyard permission *before* the card leaves the graveyard,
    // while the grant lookup can still see it there.
    let graveyardPermission: GraveyardGrantOption["permission"] = null;
    if (via === "graveyard-permission") {
      const found = this.findGraveyardGrant(player, cardId, face, graveyardGrant);
      if (found !== null) {
        this.spendGraveyardGrant(found);
        graveyardPermission = found.permission;
      }
    }

    // Commit: move to the stack, pay, announce. The targets are recorded
    // once the costs are paid, below.
    this.moveObject(cardId, "stack");
    object.xValue = hasX ? chosenX : null;
    object.castVia = via ?? null;
    // Kess's "if a spell cast this way would be put into your graveyard,
    // exile it instead" — set after the move to the stack, which clears it.
    if (graveyardPermission?.exileAfterwards === true) object.exileIfWouldGoToGraveyard = true;
    object.stormCount = stormCount;
    if (sortedModes !== undefined) object.chosenModes = sortedModes;
    if (kicked) object.kicked = true;
    if (overload) object.overloaded = true;
    this.executePayment(player, payment);
    // `resolved` is the concrete cost after hybrid and Phyrexian choices, so
    // life paid for a Phyrexian pip isn't counted as mana.
    object.manaSpent = manaValue(payment.resolved);
    // The commander tax, paid in life rather than mana (Liesa). Part of the
    // total cost, so paid alongside the mana; it isn't mana spent.
    if (taxLife > 0) this.changeLife(player, -taxLife);
    // Sephara's "tap four untapped creatures you control with flying" — the
    // other half of its alternative cost, paid as the spell is cast.
    this.payTapCost(tapPicked);
    // "Flashback—{cost}, Pay N life" (Deep Analysis) — part of the cost, paid
    // as the spell is cast.
    if (via === "flashback" && def.flashback?.payLife !== undefined) {
      this.changeLife(player, -def.flashback.payLife);
    }
    // A graveyard permission's own extra cost ("by paying 3 life in addition
    // to paying their other costs").
    if (graveyardPermission?.payLife !== undefined) {
      this.changeLife(player, -graveyardPermission.payLife);
    }
    // The additional sacrifice (rule 601.2f/h) is paid *after* mana, so the
    // land being sacrificed can still be tapped for the spell's own cost first
    // (601.2g — mana abilities are activated before costs are paid; Crop
    // Rotation off a single Forest). It happens as the spell is cast, so it
    // stands even if the spell is later countered.
    if (sacrificeVictim !== undefined && this.state.objects[sacrificeVictim] !== undefined) {
      const victim = this.splitOneFromStack(sacrificeVictim);
      // Its controller sacrifices it (rule 701.21a) — read before the move
      // hands it back to its owner.
      const sacrificer = this.state.objects[victim].controller;
      const stint = this.state.objects[victim].zoneChangeCount ?? 0;
      this.moveObject(victim, "graveyard");
      this.emit({ type: "permanent-sacrificed", object: victim, player: sacrificer });
      // What the spell's "the sacrificed creature" reads (rule 608.2h).
      object.lastKnownRefs = { sacrificed: { object: victim, zoneChangeCount: stint } };
    }
    // The costs are paid, so a target in a token stack can be peeled off it
    // (`lockInTargets`) without taking a token a cost above had named.
    const chosen = this.lockInTargets(targets);
    object.targets = chosen.length > 0 ? [...chosen] : null;
    // Where each target is as the spell is cast, for last-known information.
    object.targetZones = chosen.length > 0 ? this.zonesOfTargets(chosen) : undefined;
    if (castingFromCommand) {
      const name = object.cardName;
      const counts = this.state.players[player].commanderCastCounts;
      counts[name] = (counts[name] ?? 0) + 1;
    }
    this.state.players[player].spellsCastThisTurn += 1;
    (this.state.players[player].spellsCastThisTurnIds ??= []).push(cardId);
    this.state.spellsCastThisTurn += 1;

    this.emit({
      type: "spell-cast",
      player,
      object: cardId,
      targets: chosen.filter((t): t is TargetRef => t !== undefined),
      x: hasX ? chosenX : null,
      spellsThisTurn: this.state.players[player].spellsCastThisTurn,
      ...(via !== undefined ? { via } : {}),
      from: castFrom,
    });
    this.announceTargeted(chosen, player, cardId, true);
    if (sortedModes !== undefined) {
      this.emit({ type: "modes-chosen", source: cardId, modes: [...sortedModes] });
    }
    // The rest of the additional cost (rule 601.2f-h). Paid as the spell is
    // cast, so — like the sacrifice above — it stands even if the spell is
    // later countered, and after the announcement so the log reads "casts X,
    // discards Y" and the spell is already on the stack rather than in the
    // hand it is discarding from.
    if (def.additionalCost?.payLife !== undefined) {
      this.changeLife(player, -def.additionalCost.payLife);
    }
    if (def.additionalCost?.payLifeX === true && chosenX > 0) {
      this.changeLife(player, -chosenX);
    }
    // The chosen branch of a choice of additional costs, paid here with the
    // fixed ones — after the announcement, so the log reads "casts X,
    // discards Y", and at cast time, so it stands even if X is countered.
    // A `mana` branch needs nothing: it was folded into `costString` and is
    // already paid.
    const chosenOption =
      costOption === undefined ? undefined : def.additionalCost?.options?.[costOption];
    if (chosenOption?.payLife !== undefined) {
      this.changeLife(player, -chosenOption.payLife);
    }
    // A branch's sacrifice was paid above with the fixed one: it's the same
    // cost paid the same way, one member peeled off a token stack rather than
    // the whole stack, and the victim the driver named.
    if (chosenOption?.discard !== undefined) {
      this.withDecisionSource(cardId, () => {
        this.discardByEffect({ kind: "player", player }, chosenOption.discard as number);
      });
    }
    const costDiscard = def.additionalCost?.discard;
    if (costDiscard !== undefined) {
      // Attributed to the spell being cast. A `discard` decision carries no
      // `source` of its own, so it reads `state.decisionSource` — which only
      // `withDecisionSource` sets, and only around a *resolution*. Without
      // this wrap the prompt named whatever resolved last.
      this.withDecisionSource(cardId, () => {
        this.discardByEffect({ kind: "player", player }, costDiscard);
      });
    }
    this.afterPlayerAction(player);
  }

  /**
   * Why `player` can't pay this branch of a choice of additional costs, or
   * `null`.
   *
   * The `mana` branch isn't checked here: it was folded onto the cast's mana
   * cost by `castCostString`, so the ordinary affordability check has
   * already covered it. What's left are the branches paid out of something
   * other than the mana pool.
   */
  private whyCostOptionUnpayable(
    player: PlayerId,
    cardId: ObjectId,
    def: CardDefinition,
    option: AdditionalCostOption,
  ): string | null {
    if (option.discard !== undefined) {
      // Rule 601.2h — the spell is still in hand while this is checked and
      // can't discard itself to pay its own cost.
      const others = this.state.zones.perPlayer[player].hand.filter((id) => id !== cardId);
      if (others.length < option.discard) {
        return `${player} has too few cards in hand to ${option.text.toLowerCase()} for ${def.name}`;
      }
    }
    // Rule 118.4 — a player may pay any life they have, down to 0, so this
    // only refuses paying *more* life than they hold.
    if (option.payLife !== undefined && this.state.players[player].life < option.payLife) {
      return `${player} has too little life to ${option.text.toLowerCase()} for ${def.name}`;
    }
    if (option.sacrifice !== undefined) {
      const filter = option.sacrifice;
      const candidates = this.state.zones.shared.battlefield.filter(
        (id) =>
          this.state.objects[id]?.controller === player &&
          matchesFilter(this.state, this.registry, id, filter, { you: player }),
      );
      if (candidates.length === 0) {
        return `${player} has nothing to sacrifice to cast ${def.name}`;
      }
    }
    return null;
  }

  /** Permanents `player` could sacrifice to pay `ability`'s sacrifice cost.
   * `[]` when the ability has no sacrifice cost. For a `"self"` cost it's just
   * the source (so a caller can still show/confirm it). */
  private sacrificeCandidates(
    player: PlayerId,
    sourceId: ObjectId,
    ability: {
      readonly cost: { readonly sacrifice?: SacrificeCost };
      readonly otherOnly?: boolean;
    },
  ): ObjectId[] {
    const sac = ability.cost.sacrifice;
    if (sac === undefined) return [];
    if (sac === "self") return [sourceId];
    return this.state.zones.shared.battlefield.filter((id) => {
      const object = this.state.objects[id];
      if (object.controller !== player) return false;
      // "Sacrifice **another** black creature" (Ayara) — `otherOnly` keeps the
      // source out of its own sacrifice cost, the same way it keeps it out of
      // its own target slots.
      if (ability.otherOnly === true && id === sourceId) return false;
      if (sac === "creature-you-control") {
        // What's a creature *now*: an animated land can be sacrificed, a
        // creature that stopped being one can't.
        return effectiveTypes(this.state, this.registry, object).includes("creature");
      }
      // { filter } — Zuran Orb "a land", Orcish Lumberjack "a Forest".
      return matchesFilter(this.state, this.registry, id, sac.filter, { you: player });
    });
  }

  /**
   * Every `grantsActivated` static currently on the battlefield (Chromatic
   * Lantern, Cryptolith Rite) — usually none at all.
   *
   * Hoisted out of {@link grantedActivated} because the callers that matter
   * loop over the battlefield calling it *per permanent* (`manaSources` on
   * every affordability check, `legalActions`' ability enumeration), which
   * made the scan quadratic. Computing it once per loop and passing it down
   * makes those callers linear.
   */
  /**
   * Static abilities currently granting *triggered* abilities — the
   * `grantsTriggered` mirror of {@link activatedGrantSources}.
   */
  private triggeredGrantSources(): TriggeredGrantSource[] {
    const out: TriggeredGrantSource[] = [];
    for (const id of this.state.zones.shared.battlefield) {
      const source = this.state.objects[id];
      if (source === undefined || hasLostAbilities(source)) continue;
      this.registry.get(printedCardName(source)).static.forEach((ability, staticIndex) => {
        if (ability.grantsTriggered !== undefined) {
          out.push({ source, ability, staticIndex, abilities: ability.grantsTriggered });
        }
      });
    }
    return out;
  }

  /**
   * `objectId`'s printed `triggered` abilities plus any currently granted to
   * it — by a `grantsTriggered` static (Tyrant's Familiar's Lieutenant
   * clause) or by a one-shot `PtModifier.grantsTriggered` (Hunter's Prowess).
   *
   * Printed first, then granted, so `PendingTrigger.abilityIndex` into a
   * printed ability never shifts. Everything that reads a triggered ability
   * by index — `detectTriggers`, `stackAbilityOf`, the intervening-if
   * recheck, `placeTrigger` — must go through here, or a granted ability
   * fires and then resolves as the wrong (or a missing) ability.
   */
  private effectiveTriggered(
    objectId: ObjectId,
    grantors?: readonly TriggeredGrantSource[],
  ): readonly TriggeredAbility[] {
    return this.effectiveTriggeredEntries(objectId, grantors).map((e) => e.ability);
  }

  /** {@link effectiveTriggered}, with each granted ability's
   * {@link GrantedAbilityRef} alongside it (absent for a printed one). */
  private effectiveTriggeredEntries(
    objectId: ObjectId,
    grantors?: readonly TriggeredGrantSource[],
  ): readonly { readonly ability: TriggeredAbility; readonly ref?: GrantedAbilityRef }[] {
    const target = this.state.objects[objectId];
    if (target === undefined) return EMPTY_TRIGGERED_ENTRIES;
    if (hasLostAbilities(target)) return EMPTY_TRIGGERED_ENTRIES;
    const printedAbilities = this.registry.get(printedCardName(target)).triggered;
    // The common case — a land, a vanilla creature — has nothing printed, no
    // modifiers and no grantors to consult: skip the allocations below. This
    // runs for every battlefield permanent on every emitted event.
    if (
      printedAbilities.length === 0 &&
      target.modifiers.length === 0 &&
      (grantors !== undefined && grantors.length === 0)
    ) {
      return EMPTY_TRIGGERED_ENTRIES;
    }
    const printed = printedAbilities.map((ability) => ({ ability }));
    const granted: { ability: TriggeredAbility; ref: GrantedAbilityRef }[] = [];
    // A one-shot grant rides on the object's own modifiers, so it works off
    // the battlefield too (a creature that died still has the modifier until
    // `moveObject` clears it).
    for (const modifier of target.modifiers) {
      for (const ability of modifier.grantsTriggered ?? []) {
        granted.push({ ability, ref: { kind: "modifier", ability } });
      }
    }
    if (target.zone === "battlefield") {
      const sources = grantors ?? this.triggeredGrantSources();
      const grants: {
        ts: number;
        entries: { ability: TriggeredAbility; ref: GrantedAbilityRef }[];
      }[] = [];
      for (const { source, ability, staticIndex, abilities } of sources) {
        const keywords = (): ReadonlySet<Keyword> => this.characteristics(target.id).keywords;
        if (!staticReaches(this.state, this.registry, source, ability, target, { keywords })) continue;
        if (!this.staticActive(source, ability)) continue;
        const cardName = printedCardName(source);
        grants.push({
          ts: source.timestamp,
          entries: abilities.map((grantedAbility, index) => ({
            ability: grantedAbility,
            ref: { kind: "static", cardName, staticIndex, list: "triggered", index },
          })),
        });
      }
      grants.sort((a, b) => a.ts - b.ts);
      for (const g of grants) granted.push(...g.entries);
    }
    return granted.length === 0 ? printed : [...printed, ...granted];
  }

  private activatedGrantSources(): GrantSource[] {
    const out: GrantSource[] = [];
    for (const id of this.state.zones.shared.battlefield) {
      const source = this.state.objects[id];
      if (source === undefined || hasLostAbilities(source)) continue;
      this.registry.get(printedCardName(source)).static.forEach((ability, staticIndex) => {
        if (ability.grantsActivated !== undefined) {
          out.push({ source, ability, staticIndex, abilities: ability.grantsActivated });
        }
      });
    }
    return out;
  }

  /**
   * Activated abilities `objectId` has right now on top of its printed ones —
   * granted by `grantsActivated` statics on the battlefield (Chromatic
   * Lantern, Cryptolith Rite). Ordered by the granting permanent's timestamp
   * so the index is stable for a given game state.
   *
   * Pass `grantors` (from {@link activatedGrantSources}) when calling this in
   * a loop over many objects; it defaults to computing them per call.
   */
  private grantedActivated(
    objectId: ObjectId,
    grantors?: readonly GrantSource[],
  ): readonly ActivatedAbility[] {
    return this.grantedActivatedEntries(objectId, grantors).map((e) => e.ability);
  }

  /** {@link grantedActivated}, with each ability's {@link GrantedAbilityRef}. */
  private grantedActivatedEntries(
    objectId: ObjectId,
    grantors?: readonly GrantSource[],
  ): readonly { readonly ability: ActivatedAbility; readonly ref: GrantedAbilityRef }[] {
    const target = this.state.objects[objectId];
    if (target === undefined || target.zone !== "battlefield") return [];
    if (hasLostAbilities(target)) return [];
    const sources = grantors ?? this.activatedGrantSources();
    if (sources.length === 0) return []; // nothing grants anything — the norm
    const grants: {
      ts: number;
      entries: { ability: ActivatedAbility; ref: GrantedAbilityRef }[];
    }[] = [];
    for (const { source, ability, staticIndex, abilities } of sources) {
      const keywords = (): ReadonlySet<Keyword> => this.characteristics(target.id).keywords;
      if (!staticReaches(this.state, this.registry, source, ability, target, { keywords })) continue;
      if (!this.staticActive(source, ability)) continue;
      const cardName = printedCardName(source);
      grants.push({
        ts: source.timestamp,
        entries: abilities.map((grantedAbility, index) => ({
          ability: grantedAbility,
          ref: { kind: "static", cardName, staticIndex, list: "activated", index },
        })),
      });
    }
    grants.sort((a, b) => a.ts - b.ts);
    return grants.flatMap((g) => g.entries);
  }

  /** Where `sourceId`'s activated ability at `abilityIndex` was granted from,
   * or `undefined` for a printed one. Read *before* paying costs, which may
   * move the source and end the grant. */
  private activatedRefFor(sourceId: ObjectId, abilityIndex: number): GrantedAbilityRef | undefined {
    const printed = this.registry.get(printedCardName(this.state.objects[sourceId])).activated.length;
    if (abilityIndex < printed) return undefined;
    return this.grantedActivatedEntries(sourceId)[abilityIndex - printed]?.ref;
  }

  /** The ability a {@link GrantedAbilityRef} names — plain registry data, so it
   * doesn't matter whether the grant still exists. */
  private abilityFromRef(
    ref: GrantedAbilityRef,
  ): ActivatedAbility | TriggeredAbility | undefined {
    if (ref.kind === "modifier") return ref.ability;
    if (!this.registry.has(ref.cardName)) return undefined;
    const granting = this.registry.get(ref.cardName).static[ref.staticIndex];
    return ref.list === "activated"
      ? granting?.grantsActivated?.[ref.index]
      : granting?.grantsTriggered?.[ref.index];
  }

  /** `objectId`'s printed `activated` abilities plus any currently granted to
   * it — printed first, then granted, so an `abilityIndex` into a printed
   * ability never shifts. */
  private effectiveActivated(
    objectId: ObjectId,
    grantors?: readonly GrantSource[],
  ): readonly ActivatedAbility[] {
    const printed = this.registry.get(
      printedCardName(this.state.objects[objectId]),
    ).activated;
    const granted = this.grantedActivated(objectId, grantors);
    return granted.length === 0 ? printed : [...printed, ...granted];
  }

  /** `ability.cost.mana`, with `{X}` resolved to `xValue` (folded into
   * generic), `ability.costReduction` and any `abilityCostModification`
   * statics applied to the generic portion (rules 601.2f, 602.2b — can't go
   * below 0). Mirrors `castingCostOf`'s `selfCostReduction` handling, but
   * for an ability of `sourceId` rather than a spell. Returns the resolved
   * cost alongside the chosen X, since `activateAbility` needs to stamp the
   * latter on the stack object. */
  private activatedAbilityManaCost(
    player: PlayerId,
    sourceId: ObjectId,
    ability: ActivatedAbility,
    xValue = 0,
  ): { cost: ManaCost; chosenX: number } {
    const parsed = parseManaCost(ability.cost.mana);
    const hasX = parsed.x > 0;
    const chosenX = hasX ? Math.max(0, Math.floor(xValue)) : 0;
    let generic = parsed.generic + parsed.x * chosenX;
    if (ability.costReduction !== undefined) {
      generic -= this.costReductionAmount(ability.costReduction.reduceGeneric, player);
    }
    if (!isManaAbility(ability)) {
      const mod = this.abilityCostModificationFor(sourceId);
      generic += mod.increaseGeneric - mod.reduceGeneric;
    }
    return {
      cost: {
        colored: parsed.colored,
        colorless: parsed.colorless,
        generic: Math.max(0, generic),
        x: 0,
        hybrid: parsed.hybrid,
      },
      chosenX,
    };
  }

  /** What `abilityCostModification` statics on the battlefield do to the
   * activation cost of an ability of `sourceId`: the generic mana they add
   * and take off (rule 602.2b). */
  private abilityCostModificationFor(sourceId: ObjectId): {
    increaseGeneric: number;
    reduceGeneric: number;
  } {
    let increaseGeneric = 0;
    let reduceGeneric = 0;
    for (const id of this.state.zones.shared.battlefield) {
      const source = this.state.objects[id];
      if (source === undefined || hasLostAbilities(source)) continue;
      for (const ability of this.registry.get(printedCardName(source)).static) {
        const mod = ability.abilityCostModification;
        if (mod === undefined || !this.staticActive(source, ability)) continue;
        if (!matchesFilter(this.state, this.registry, sourceId, mod.applies, { you: source.controller })) {
          continue;
        }
        increaseGeneric += mod.increaseGeneric ?? 0;
        reduceGeneric += mod.reduceGeneric ?? 0;
      }
    }
    return { increaseGeneric, reduceGeneric };
  }

  private whyCannotActivateAbility(
    player: PlayerId,
    sourceId: ObjectId,
    abilityIndex: number,
    tap?: readonly ObjectId[],
  ): string | null {
    const blocked = this.whyCannotAct(player);
    if (blocked !== null) return blocked;
    const source = this.state.objects[sourceId];
    if (source === undefined) return "that object does not exist";
    const def = this.registry.get(printedCardName(source));
    const ability = this.effectiveActivated(sourceId)[abilityIndex];
    if (ability === undefined) {
      return `${def.name} has no ability #${abilityIndex}`;
    }
    if (ability.zone !== undefined) {
      // Channel (702.51a) from hand, a graveyard ability or a command-zone
      // one (Derevi) — activatable only from that zone, never as a
      // permanent's.
      if (source.zone !== ability.zone) {
        return `that card is not in ${ability.zone === "command" ? "the command zone" : ability.zone}`;
      }
      if (source.owner !== player) return `${player} does not own that card`;
    } else {
      if (source.zone !== "battlefield") {
        return "that permanent is not on the battlefield";
      }
      if (source.controller !== player) {
        return `${player} does not control that permanent`;
      }
      if (hasLostAbilities(source)) {
        return `${def.name} has lost its abilities`;
      }
    }
    if (
      ability.condition !== undefined &&
      // Rule 602.5: "Activate only if …" is a check against the game state as
      // it stands, and the source permanent is part of that state — Bloodline
      // Keeper is one of the five Vampires its own transform ability counts.
      // (A *static* ability's condition is the one that skips itself, to keep
      // "as long as you control another …" from reading itself.)
      !staticConditionMet(this.state, this.registry, source, ability.condition, {
        includeSelf: true,
      })
    ) {
      return `${def.name}'s ability's activation condition isn't met`;
    }
    // Boast (rule 702.135) — only if this creature attacked this turn.
    if (ability.boast === true && source.attackedThisTurn !== true) {
      return `${def.name} hasn't attacked this turn`;
    }
    // "Activate only once each turn" (rule 602.5g) — applies to any ability,
    // not just a loyalty one, so it is checked before the loyalty block.
    // Boast implies it.
    if (
      (ability.oncePerTurn === true || ability.boast === true) &&
      (source.abilitiesUsedThisTurn ?? []).includes(abilityIndex)
    ) {
      return `${def.name}'s ability has already been activated this turn`;
    }
    if (ability.loyaltyCost !== undefined) {
      // Loyalty ability (rule 606): sorcery-speed, once per permanent per turn,
      // and a "minus" ability needs that many loyalty counters to spend.
      const timing = this.whyNotSorcerySpeed(player, `activate ${def.name}'s loyalty ability`);
      if (timing !== null) return timing;
      if (source.loyaltyActivatedThisTurn) {
        return `a loyalty ability of ${def.name} has already been activated this turn`;
      }
      const loyalty = source.counters.loyalty ?? 0;
      if (loyalty + ability.loyaltyCost < 0) {
        return `${def.name} does not have ${-ability.loyaltyCost} loyalty to remove`;
      }
    }
    if (ability.cost.tap) {
      if (source.tapped) return `${def.name} is already tapped`;
      if (this.tapAbilityBlockedBySickness(source)) {
        return `${def.name} has summoning sickness`;
      }
    }
    if (ability.sorcerySpeed) {
      const timing = this.whyNotSorcerySpeed(player, `activate ${def.name}'s ability`);
      if (timing !== null) return timing;
    }
    for (const spec of ability.targets) {
      if (isOptionalSpec(spec)) continue;
      const options = legalTargets(this.state, this.registry, spec, player, this.permanentSource(sourceId));
      const eligible = ability.otherOnly
        ? options.filter((ref) => ref.kind !== "object" || ref.object !== sourceId)
        : options;
      if (eligible.length === 0) {
        return `${def.name}'s ability has no legal ${describeTargetSpec(spec)} target`;
      }
    }
    if (ability.cost.tapOthers !== undefined) {
      // The tap half is checked against the same mana — see `tapCostOffer`.
      const offer = this.abilityTapCostOffer(player, sourceId, ability);
      if (offer === null) return `${player} cannot pay for ${def.name}'s ability`;
      if (this.tapCapacity(offer.choices) < offer.count) {
        return `${def.name}'s ability needs ${offer.count} untapped permanents to tap`;
      }
      if (tap !== undefined) {
        const wrong = this.whyTapChoiceIsWrong(`${def.name}'s ability`, offer, tap);
        if (wrong !== null) return wrong;
      }
    } else if (
      this.payMana(
        player,
        this.activatedAbilityManaCost(player, sourceId, ability).cost,
        undefined,
        // Matches `activateAbility`'s own payment below: a source being tapped
        // to pay `{T}` isn't available to pay the mana half as well.
        ability.cost.tap ? sourceId : undefined,
        { kind: "ability", source: sourceId },
      ) === null
    ) {
      return `${player} cannot pay for ${def.name}'s ability`;
    }
    if (
      ability.cost.sacrifice !== undefined &&
      this.sacrificeCandidates(player, sourceId, ability).length === 0
    ) {
      return `${player} has nothing to sacrifice for ${def.name}'s ability`;
    }
    if (
      ability.cost.payLife !== undefined &&
      this.state.players[player].life < ability.cost.payLife
    ) {
      return `${player} does not have ${ability.cost.payLife} life to pay`;
    }
    if (ability.cost.removeCounter !== undefined) {
      const { kind, count } = ability.cost.removeCounter;
      if ((source.counters[kind] ?? 0) < count) {
        return `${def.name} does not have ${count} ${kind} counter(s) to remove`;
      }
    }
    if (
      ability.cost.payEnergy !== undefined &&
      this.state.players[player].energy < ability.cost.payEnergy
    ) {
      return `${player} does not have {E}×${ability.cost.payEnergy} to pay`;
    }
    return null;
  }

  private activateAbility(
    player: PlayerId,
    sourceId: ObjectId,
    abilityIndex: number,
    targets: ResolvedTargets,
    sacrifice?: ObjectId,
    xValue = 0,
    manaColors?: readonly ManaType[],
    tap?: readonly ObjectId[],
  ): void {
    const why = this.whyCannotActivateAbility(player, sourceId, abilityIndex, tap);
    if (why !== null) throw new Error(why);

    const source = this.state.objects[sourceId];
    const def = this.registry.get(printedCardName(source));
    const ability = this.effectiveActivated(sourceId)[abilityIndex];
    // Captured now: a cost below (sacrificing the creature an Aura grants
    // this to) can end the grant before the ability is on the stack.
    const grantedAbility = this.activatedRefFor(sourceId, abilityIndex);
    // Likewise which permanent the source is, before a "Sacrifice ~" cost
    // takes it away: "it" in the effect is that permanent as it last existed
    // (rule 608.2h). A hand, graveyard or command-zone source is no
    // permanent, and is read wherever it is.
    const sourceStint =
      source.zone === "battlefield" ? (source.zoneChangeCount ?? 0) : undefined;
    let sacrificedRef: LastKnownRefs["sacrificed"];

    const badTarget = this.whyTargetsInvalid(
      ability.targets,
      targets,
      player,
      `${def.name}'s ability`,
      this.permanentSource(sourceId),
    );
    if (badTarget !== null) throw new Error(badTarget);

    // Resolve which permanent the sacrifice cost (if any) will consume.
    let sacrificeVictim: ObjectId | null = null;
    if (ability.cost.sacrifice !== undefined) {
      const candidates = this.sacrificeCandidates(player, sourceId, ability);
      if (ability.cost.sacrifice === "self") {
        sacrificeVictim = sourceId;
      } else {
        if (sacrifice === undefined || !candidates.includes(sacrifice)) {
          throw new Error(
            `${def.name}'s ability requires sacrificing a permanent you control`,
          );
        }
        sacrificeVictim = sacrifice;
      }
    }

    // `{X}` in the cost (rule 107.3 — ROADMAP Phase 11 EG-3): fold the chosen
    // value into the generic portion before paying, and stamp it on the
    // ability object below so `ctx.x` reads it at resolution. Also folds in
    // `ability.costReduction` (the Kamigawa Channel lands' per-legendary
    // discount).
    const { cost: manaCost, chosenX } = this.activatedAbilityManaCost(player, sourceId, ability, xValue);
    // A `{T}` in the cost taps the source as part of paying, so it can't also
    // be tapped for mana toward the same activation (rule 602.2a) — that's an
    // exclusion, not a preference. Otherwise merely prefer to leave the source
    // alone unless there's no other way to pay (it may want to attack, or hold
    // up its own `{T}` ability). A hand-zone (Channel) source is never a mana
    // source to begin with.
    // "Tap five untapped Zombies you control": picked (or checked) before
    // anything is paid, and kept out of the mana plan — see `tapCostOffer`.
    let tapPicked: ObjectId[] = [];
    let manaArrangement: ManaSourceArrangement | undefined;
    if (ability.cost.tapOthers !== undefined) {
      const offer = this.tapCostOffer(
        player,
        sourceId,
        ability.cost.tapOthers,
        manaCost,
        ability.cost.tap || ability.zone !== undefined ? undefined : sourceId,
        ability.cost.tap ? sourceId : undefined,
        { kind: "ability", source: sourceId },
      );
      if (offer === null) throw new Error(`${player} cannot pay for ${def.name}'s ability`);
      tapPicked = this.tapCostPicks(`${def.name}'s ability`, offer, tap);
      manaArrangement = {
        last: new Set(this.tapOthersCandidates(player, sourceId, ability.cost.tapOthers)),
        withheld: new Set(tapPicked),
      };
    }
    const payment = this.payMana(
      player,
      manaCost,
      ability.cost.tap || ability.zone !== undefined ? undefined : sourceId,
      ability.cost.tap ? sourceId : undefined,
      { kind: "ability", source: sourceId },
      manaArrangement,
    );
    if (payment === null) {
      throw new Error(`${player} cannot pay for ${def.name}'s ability`);
    }

    // Pay the cost.
    if (ability.cost.tap) {
      source.tapped = true;
      this.emit({ type: "permanent-tapped", object: sourceId });
    }
    // "Tap five untapped Zombies you control" — see `AbilityCost.tapOthers`.
    this.payTapCost(tapPicked);
    this.executePayment(player, payment);
    if (ability.cost.payLife !== undefined) {
      this.changeLife(player, -ability.cost.payLife);
    }
    if (ability.cost.removeCounter !== undefined) {
      const { kind, count } = ability.cost.removeCounter;
      source.counters[kind] = (source.counters[kind] ?? 0) - count;
      if (source.counters[kind] <= 0) delete source.counters[kind];
      this.emit({ type: "counter-removed", object: sourceId, counter: kind, amount: count });
    }
    if (ability.cost.payEnergy !== undefined) {
      this.changeEnergy(player, -ability.cost.payEnergy);
    }
    // Paid *before* the ability resolves, which is what makes Slate of
    // Ancestry's "discard your hand, then draw a card for each creature"
    // work out as a refill rather than a discard of what it drew.
    if (ability.cost.discardHand === true) this.discardWholeHand(player);
    if (ability.cost.exileSelf === true) {
      // Not a sacrifice: the source never touches a graveyard, so a
      // dies-trigger elsewhere doesn't fire.
      this.moveObject(sourceId, "exile");
      this.emit({ type: "permanent-exiled", object: sourceId });
    }
    if (ability.oncePerTurn === true || ability.boast === true) {
      // Rule 602.5g — recorded per ability index, so a permanent with two
      // once-each-turn abilities limits each of them separately.
      source.abilitiesUsedThisTurn = [
        ...(source.abilitiesUsedThisTurn ?? []),
        abilityIndex,
      ];
    }
    if (ability.loyaltyCost !== undefined) {
      source.counters.loyalty = (source.counters.loyalty ?? 0) + ability.loyaltyCost;
      source.loyaltyActivatedThisTurn = true;
      this.emit({
        type: "loyalty-changed",
        object: sourceId,
        delta: ability.loyaltyCost,
        loyalty: source.counters.loyalty,
      });
    }
    if (sacrificeVictim !== null) {
      // The chosen victim singles out one — split it off a compacted stack
      // first (a "self" cost's source is never a stack: only ability-less
      // tokens are ever stackable).
      const victim = this.splitOneFromStack(sacrificeVictim);
      const stint = this.state.objects[victim].zoneChangeCount ?? 0;
      this.moveObject(victim, "graveyard");
      this.emit({ type: "permanent-sacrificed", object: victim, player });
      // "The sacrificed creature", as it last existed (Dina, Soul Steeper).
      sacrificedRef = { object: victim, zoneChangeCount: stint };
    }

    if (ability.zone === "hand") {
      // Channel (rule 702.51a): discarding the source card is an implicit,
      // unconditional part of the cost, paid alongside the mana above.
      this.moveObject(sourceId, "graveyard");
      this.emit({ type: "cards-discarded", player, objects: [sourceId] });
    } else if (ability.zone === "graveyard") {
      this.state.players[player].usedGraveyardThisTurn = true;
      // The graveyard equivalent — "Exile this card from your graveyard" is
      // likewise part of the cost, so it happens now rather than on
      // resolution, and stands even if the ability is countered. A
      // `staysInZone` ability (Reassembling Skeleton) has no such cost: the
      // card waits in the graveyard for its own effect to move it.
      if (ability.staysInZone !== true) this.moveObject(sourceId, "exile");
    }
    // A command-zone ability (Derevi) costs no zone change either — putting
    // the card onto the battlefield is its *effect*, which is why it isn't
    // cast: no commander tax, no cast trigger.

    if (isManaAbility(ability)) {
      // Mana abilities resolve immediately and never use the stack.
      const base = this.makeResolutionContext(sourceId, player, [], chosenX);
      // The colour(s) the activating player picked for an "any color" / "any
      // combination of" ability — see `standaloneManaChoices`. Only the
      // unfixed part of the output is redirected, so a source that makes a
      // concrete mana alongside a choice still makes its concrete mana.
      const context: ResolutionContext =
        manaColors === undefined
          ? base
          : {
              ...base,
              addMana: (p, mana, amount, spec): void => {
                if (mana !== "any-color" && typeof mana !== "object") {
                  base.addMana(p, mana, amount, spec);
                  return;
                }
                // The effect's own amount is what gets made, one unit per
                // pick; a pick the ability can't make (or a missing one —
                // the action is a client's word) falls back to the default
                // colour, so a hand-built `manaColors` can't mint extra
                // mana or a colour the card doesn't offer. `spec` rides
                // along so a restricted source (Cavern of Souls) still
                // stamps its restriction on mana floated by hand.
                const allowed: readonly ManaType[] =
                  mana === "any-color"
                    ? COLORS
                    : "oneOf" in mana
                      ? mana.oneOf
                      : this.manaOneOf(mana, player);
                const units = Math.min(amount, Game.MAX_EFFECT_INSTANCES);
                for (let i = 0; i < units; i += 1) {
                  const pick = manaColors[i];
                  base.addMana(
                    p,
                    pick !== undefined && allowed.includes(pick) ? pick : mana,
                    1,
                    spec,
                  );
                }
              },
            };
      if (ability.effect !== null) applyEffectSpec(ability.effect, context);
      this.emit({
        type: "ability-activated",
        source: sourceId,
        player,
        onStack: false,
      });
      return;
    }

    // The costs are paid: a target in a token stack is peeled off it now.
    const chosen = this.lockInTargets(targets);
    const abilityId = this.mintAbilityObject(
      sourceId,
      // `def.name`, captured above — not `printedCardName(source)` now, since a
      // "Sacrifice this" cost may have moved the source (clearing a Clone's
      // `copyOf`) between then and here (rule 608.2g — the ability resolves
      // using its source's last-known information).
      def.name,
      player,
      "activated",
      abilityIndex,
      chosen,
    );
    if (chosenX > 0) this.state.objects[abilityId].xValue = chosenX;
    if (grantedAbility !== undefined) this.state.objects[abilityId].grantedAbility = grantedAbility;
    if (sourceStint !== undefined || sacrificedRef !== undefined) {
      this.state.objects[abilityId].lastKnownRefs = {
        ...(sourceStint !== undefined ? { source: sourceStint } : {}),
        ...(sacrificedRef !== undefined ? { sacrificed: sacrificedRef } : {}),
      };
    }
    if (ability.zone === "command" || ability.staysInZone === true) {
      // The source is still sitting in that zone — remember which object it
      // is, so a round trip before this resolves reads as a new one (rule
      // 400.7). See `resolveAbility`.
      this.state.objects[abilityId].sourceZoneChangeCount = source.zoneChangeCount ?? 0;
    }
    this.emit({
      type: "ability-activated",
      source: sourceId,
      player,
      onStack: true,
    });
    this.announceTargeted(chosen, player, sourceId, false, abilityId);
    this.afterPlayerAction(player);
  }

  /**
   * Announce each *object* a spell or ability just targeted, for a
   * "becomes the target of" trigger (rule 115.7 — Thunderbreak Regent).
   *
   * Emitted as the spell or ability goes on the stack, which is when targets
   * are chosen and locked in (601.2c / 602.2b / 603.3d), not when it
   * resolves — the trigger fires even if the spell is later countered or
   * fizzles. A triggered ability announces too (`mintTriggerAbility`), so
   * ward and Thunderbreak Regent see one. Player targets aren't announced:
   * nothing in the pool triggers on a *player* being targeted, and the
   * events would be pure noise in the log.
   *
   * Once per *object*, not per target slot: a spell that names the same
   * creature in two slots makes it "become the target" once (rule 115.7 /
   * 603.2 speak of the object becoming a target, not of each instance of
   * the word "target").
   */
  private announceTargeted(
    targets: ResolvedTargets,
    by: PlayerId,
    source: ObjectId,
    bySpell: boolean,
    /** The ability object on the stack, for an ability; a spell is its own. */
    stackObject: ObjectId = source,
    /** Slots the triggering event filled rather than anyone choosing — not
     * targets (rule 115.1), so not announced. */
    autoSlots: readonly number[] = [],
  ): void {
    const announced = new Set<ObjectId>();
    let slot = -1;
    for (const target of targets) {
      slot += 1;
      if (autoSlots.includes(slot)) continue;
      if (target === undefined || target.kind !== "object") continue;
      if (announced.has(target.object)) continue;
      announced.add(target.object);
      const object = this.state.objects[target.object];
      if (object === undefined || object.zone !== "battlefield") continue;
      this.emit({
        type: "object-targeted",
        object: target.object,
        by,
        source,
        stackObject,
        bySpell,
      });
    }
  }

  private mintAbilityObject(
    sourceId: ObjectId,
    cardName: string,
    controller: PlayerId,
    abilityKind: "activated" | "triggered" | "chapter",
    abilityIndex: number,
    targets: ResolvedTargets,
    triggerValue?: number,
    triggerObject?: ObjectId,
    multiplier?: number,
  ): ObjectId {
    const abilityId = this.mintObjectId();
    this.state.objects[abilityId] = {
      id: abilityId,
      cardName,
      owner: controller,
      controller,
      zone: "stack",
      tapped: false,
      damageMarked: 0,
      markedByDeathtouch: false,
      enteredBattlefieldOnTurn: null,
      summoningSick: false,
      loyaltyActivatedThisTurn: false,
      targets: targets.length > 0 ? [...targets] : null,
      attacking: null,
      blocking: null,
      blockedBy: [],
      blocked: false,
      kind: "ability",
      abilityKind,
      sourceObjectId: sourceId,
      abilityIndex,
      sourceTimestamp: this.state.objects[sourceId]?.timestamp ?? 0,
      ...(targets.length > 0 ? { targetZones: this.zonesOfTargets(targets) } : {}),
      counters: {},
      modifiers: [],
      timestamp: 0,
      isToken: false,
      attachedTo: null,
      isCommander: false,
      xValue: null,
      ...(triggerValue !== undefined ? { triggerValue } : {}),
      ...(triggerObject !== undefined ? { triggerObject } : {}),
      ...(multiplier !== undefined ? { stackMultiplier: multiplier } : {}),
      controlEndsAtCleanup: false,
      copyOf: null,
    };
    this.state.zones.shared.stack.push(abilityId);
    return abilityId;
  }

  private afterPlayerAction(player: PlayerId): void {
    this.prepareForPriority(player);
  }

  // --- mana ------------------------------------------------------

  /**
   * `player`'s untapped permanents with a `{T}: Add ...` mana ability, and the
   * mana each can make (see {@link ManaSource}). A `{T}` mana ability of a
   * creature is unavailable while that creature is summoning-sick (rule 302.6).
   *
   * Ordered by which source `planManaPayment` should reach for first: lands
   * before non-lands (so paying a cost doesn't tap down a creature that could
   * otherwise attack or block); a Treasure-style one-shot source last of all;
   * and within that, sources that make fewer distinct colors before more
   * flexible ("any colour") ones, so a narrow source gets used while a source
   * that could cover more needs stays open longer. Ties keep battlefield order
   * (`Array.prototype.sort` is stable), so the choice is deterministic.
   *
   * A permanent with more than one `{T}: Add` ability (a dual land, a basic
   * under Chromatic Lantern, a creature under Cryptolith Rite) reports each as
   * an alternative `ManaOption` — one tap picks one of them (rule 605.1a) and
   * `planManaPayment` makes that choice per cost.
   */
  private manaSources(player: PlayerId): ManaSource[] {
    // Recomputed for every `planManaPayment` call — which `legalActions` makes
    // once per castable-candidate variant (and several times per hybrid pip).
    // The list is a pure function of the state and the planner treats it
    // read-only, so within a cache region it's computed once per player.
    return computedCacheMemo(`manaSources:${player}`, () =>
      this.manaSourcesUncached(player),
    );
  }

  private manaSourcesUncached(player: PlayerId): ManaSource[] {
    const out: ManaSource[] = [];
    // Computed once for the whole scan — see `activatedGrantSources`.
    const grantors = this.activatedGrantSources();
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      if (object.controller !== player) continue;
      if (hasLostAbilities(object)) continue; // layer 6 — no mana ability
      // A `{T}` ability needs the permanent untapped and not summoning sick;
      // an untapped one (Vivi Ornitier's "{0}: Add …") needs neither.
      const canTap = !object.tapped && !this.tapAbilityBlockedBySickness(object);

      const def = this.registry.get(printedCardName(object));
      const options: ManaOption[] = [];
      // `sacrificeSelf` is tracked per source, not per option: no real card
      // mixes a tap-only and a sacrifice mana ability on one permanent.
      let sacrificeSelf = false;
      const key = (o: ManaOption): string =>
        `${[...o.fixed].sort().join(",")}|${o.anyColor}|${o.anyColorOf?.join(",") ?? ""}` +
        `|${o.pain}|${o.lifeCost}|${o.genericCost}|${o.untapped ?? ""}|${o.oncePerTurn ?? ""}` +
        // Two options that make the same mana are still different options if
        // one of them is restricted.
        `|${o.tag === undefined ? "" : JSON.stringify(o.tag)}`;
      this.effectiveActivated(id, grantors).forEach((ability, abilityIndex) => {
        if (
          !isManaAbility(ability) ||
          ability.effect === null ||
          ability.effect.kind !== "add-mana"
        ) {
          return;
        }
        // Rule 602.5g — spent for this turn, whether by hand or by an
        // earlier payment.
        if (
          ability.oncePerTurn === true &&
          (object.abilitiesUsedThisTurn ?? []).includes(abilityIndex)
        ) {
          return;
        }
        if (ability.cost.tap) {
          if (!canTap) return;
        } else if (ability.oncePerTurn !== true) {
          // Without `{T}` or a once-a-turn limit an ability could be
          // activated any number of times in one payment, which the planner
          // (one activation per source) can't represent. Nothing in the pool
          // prints a free, unlimited mana ability; one with a mana cost is a
          // converter the tap-based sources already cover when it taps.
          return;
        }
        // "Tap an untapped creature you control" as part of the cost
        // (Jaspera Sentinel, Holdout Settlement). `useManaSource` taps only
        // the source, so offering these to the auto-payer would hand out the
        // mana without paying for it — strictly better than the printed card.
        // They stay activatable by hand; see AUTHORING §15.
        if (ability.cost.tapOthers !== undefined) return;
        // A mana ability whose own activation cost contains mana is a
        // "converter" (a Signet, a filter land). Only a purely *generic* cost
        // is admitted: a coloured one would be circular, needing the colour to
        // make the colour. `{X}` is out for the same reason it is everywhere
        // else here — nothing is resolving, so there's no X to read.
        let genericCost = 0;
        if (ability.cost.mana !== null) {
          const parsed = parseManaCost(ability.cost.mana);
          const colouredPips =
            COLORS.reduce((n, c) => n + parsed.colored[c], 0) + parsed.colorless;
          if (colouredPips > 0 || parsed.x > 0 || parsed.hybrid.length > 0) return;
          genericCost = parsed.generic;
          // A printed `{0}` is a cost of nothing (Vivi Ornitier) — only an
          // untapped once-a-turn ability can get here with one, since a
          // `{0}, {T}` ability is written as a plain tap.
          if (genericCost <= 0 && ability.cost.tap) return;
        }
        if (
          ability.condition !== undefined &&
          // Same rule 602.5 reading as `whyCannotActivateAbility` — the gated
          // mana ability's own permanent counts toward its condition.
          !staticConditionMet(this.state, this.registry, object, ability.condition, {
            includeSelf: true,
          })
        ) {
          return;
        }
        const pain = ability.effect.painToController ?? 0;
        const lifeCost = ability.cost.payLife ?? 0;
        // "Add one mana of the chosen color" resolves to whatever this
        // permanent's controller named as it entered; before that choice is
        // answered it produces nothing.
        const chosen = object.chosenOnEnter;
        const mana =
          ability.effect.mana === "chosen"
            ? (MANA_TYPES.includes(chosen as ManaType) ? (chosen as ManaType) : null)
            : ability.effect.mana;
        if (mana === null) return;
        // A live amount (Marwyn's power, Kydele's cards drawn this turn) is
        // sized now, against the board as it stands — see `liveManaAmount`.
        // It is what the ability would make if activated this instant, and
        // nothing changes between planning a payment and carrying it out.
        const manaAmount =
          typeof ability.effect.amount === "number"
            ? ability.effect.amount
            : this.liveManaAmount(id, player, ability.effect.amount);
        // A converter that doesn't produce more than it costs is never worth
        // offering, and admitting one would let the planner loop — and a
        // live amount of 0 makes nothing at all.
        if (manaAmount <= 0 || genericCost >= manaAmount) return;
        const tagOf = this.manaTagFor(object, ability.effect);
        const tag = {
          ...(tagOf === undefined ? {} : { tag: tagOf }),
          ...(ability.cost.tap ? {} : { untapped: true as const }),
          ...(ability.oncePerTurn === true ? { oncePerTurn: abilityIndex } : {}),
        };
        const oneOf = typeof mana === "object" ? this.manaOneOf(mana, player) : [];
        const candidates: ManaOption[] =
          mana === "any-color"
            ? [{ fixed: [], anyColor: manaAmount, pain, lifeCost, genericCost, ...tag }]
            : typeof mana === "object"
              ? typeof ability.effect.amount !== "number"
                ? // "X mana in any combination of …" with a live X: one
                  // compressed option rather than X+1 enumerated splits.
                  oneOf.length === 0
                  ? []
                  : [
                      {
                        fixed: [],
                        anyColor: manaAmount,
                        anyColorOf: oneOf,
                        pain,
                        lifeCost,
                        genericCost,
                        ...tag,
                      },
                    ]
                : manaCombinations(oneOf, manaAmount).map((fixed) => ({
                    fixed,
                    anyColor: 0,
                    pain,
                    lifeCost,
                    genericCost,
                    ...tag,
                  }))
              : [
                  {
                    fixed: Array<ManaType>(manaAmount).fill(mana),
                    anyColor: 0,
                    pain,
                    lifeCost,
                    genericCost,
                    ...tag,
                  },
                ];
        for (const option of candidates) {
          if (!options.some((o) => key(o) === key(option))) options.push(option);
        }
        if (ability.cost.sacrifice === "self") sacrificeSelf = true;
      });
      if (options.length === 0) continue;
      out.push({ id, isLand: def.types.includes("land"), options, sacrificeSelf });
    }
    const flexibility = (s: ManaSource): number =>
      new Set(s.options.flatMap((o) => [...o.fixed])).size +
      (s.options.some((o) => o.anyColor > 0) ? 5 : 0);
    // A source that can only make a colour by costing its controller life (a
    // painland — every option that isn't `{C}` deals damage; a trikeland —
    // every option costs life) is reached for after a free one of the same
    // flexibility.
    const costsLife = (o: ManaOption): boolean => o.pain > 0 || o.lifeCost > 0;
    const onlyCostlyColour = (s: ManaSource): boolean =>
      s.options.some(costsLife) &&
      s.options.every((o) => costsLife(o) || o.fixed.every((m) => m === "C"));
    // Sort keys computed once per source, not once per comparison — both
    // predicates allocate, and this list is re-sorted on every affordability
    // check (`payMana` → `manaSources`).
    const keys = new Map<ObjectId, { costly: boolean; flex: number }>(
      out.map((s) => [s.id, { costly: onlyCostlyColour(s), flex: flexibility(s) }]),
    );
    out.sort((a, b) => {
      if (a.isLand !== b.isLand) return a.isLand ? -1 : 1;
      if (a.sacrificeSelf !== b.sacrificeSelf) return a.sacrificeSelf ? 1 : -1;
      const ka = keys.get(a.id);
      const kb = keys.get(b.id);
      if (ka === undefined || kb === undefined) return 0;
      if (ka.costly !== kb.costly) return ka.costly ? 1 : -1;
      return ka.flex - kb.flex;
    });
    return out;
  }

  /**
   * What a mana ability's live `amount` comes to right now, read without
   * anything resolving: Marwyn's power, Kydele's cards drawn this turn,
   * devotion, a count. Evaluated through an ordinary resolution context for
   * `source` so every `EffectAmount` means exactly what it does when the
   * ability actually resolves (rule 605.3a — a mana ability resolves the
   * moment it's activated, so the two can't disagree). `"x"` and a trigger
   * value read 0: a mana ability has neither.
   *
   * Pure — `amountValue` only reads — which is what lets `manaSources` stay
   * memoized inside a computed-cache region. Capped where `addMana` caps
   * what it will actually put in the pool.
   */
  private liveManaAmount(source: ObjectId, player: PlayerId, amount: EffectAmount): number {
    const n = amountValue(amount, this.makeResolutionContext(source, player, []));
    return Math.max(0, Math.min(n, Game.MAX_EFFECT_INSTANCES));
  }

  /** The most mana one activation of `s` can put in the pool (used only as a
   * loose upper bound for `{X}` affordability). */
  private static sourceCapacity(s: ManaSource): number {
    return s.options.reduce((m, o) => Math.max(m, o.fixed.length + o.anyColor), 0);
  }

  /** True if `object` is a summoning-sick creature (so its `{T}` costs can't be paid). */
  /** Rule 302.6: a creature's own {T}/{Q} abilities wait until it has been
   * under its controller's control since their most recent turn began — unless
   * it has haste (702.10c), exactly as for attacking. "Creature" is what it is
   * *now*: an animated man-land is one, a Vehicle that isn't crewed isn't.
   * Haste used to be ignored here, so Krenko, Mob Boss under Lightning
   * Greaves could attack the turn he arrived but not tap for Goblins. */
  private tapAbilityBlockedBySickness(object: GameObject): boolean {
    return (
      effectiveTypes(this.state, this.registry, object).includes("creature") &&
      this.hasSummoningSickness(object) &&
      !this.objHasKeyword(object.id, "haste")
    );
  }

  /**
   * The full worked-out payment for `cost` — hybrid pips resolved, sources
   * chosen, life counted — or `null` if `player` can't pay. This is the entry
   * point every caster / activator / ward check goes through; feed the result
   * to {@link executePayment}.
   *
   * `avoid` is a preference: that source is tried last, so a permanent isn't
   * casually tapped for its own ability's mana cost when something else could
   * pay. `exclude` is a fact: that source cannot be used at all, because it is
   * already being tapped to pay a `{T}` cost and rule 602.2a doesn't let one
   * permanent pay two tap costs at once.
   */
  private payMana(
    player: PlayerId,
    cost: ManaCost,
    avoid?: ObjectId,
    exclude?: ObjectId,
    purpose: ManaPurpose = null,
    arrange?: ManaSourceArrangement,
  ): ManaPayment | null {
    return planPayment(
      this.manaPlanningView(player, purpose, arrange),
      cost,
      purpose,
      avoid,
      exclude,
    );
  }

  /** The four facts {@link planPayment} may read off the board (see
   * {@link ManaPlanningView}). `sources` is resolved here, once per payment,
   * rather than inside the planner, where a hybrid cost used to re-ask for it
   * once per pip it tried. */
  private manaPlanningView(
    player: PlayerId,
    purpose: ManaPurpose,
    arrange?: ManaSourceArrangement,
  ): ManaPlanningView {
    const sources = this.manaSources(player);
    // Life a spell's cost already spends outside the mana (Liesa's commander
    // tax) isn't there for a painland or a Phyrexian pip to spend as well.
    const reserved = purpose?.kind === "cast" ? this.commanderTaxLife(player, purpose.card) : 0;
    return {
      pool: this.state.players[player].manaPool,
      life: this.state.players[player].life - reserved,
      sources: arrange === undefined ? sources : arrangeManaSources(sources, arrange),
      canPay: (unit) => this.manaUnitCanPay(player, unit, purpose),
    };
  }

  /** Carry out a {@link payMana} result: tap/sacrifice each planned source and
   * add its mana, spend the resolved cost from the pool, then pay any
   * Phyrexian life. */
  private executePayment(player: PlayerId, payment: ManaPayment): void {
    for (const step of payment.steps) this.useManaSource(step);
    this.spendFromPool(player, payment.resolved, payment.purpose);
    if (payment.life > 0) this.changeLife(player, -payment.life);
  }

  /** Carry out one {@link ManaPlanStep}: tap (or sacrifice) the source, add its
   * mana to the controller's pool, and deal any painland damage. */
  private useManaSource(step: ManaPlanStep): void {
    const object = this.state.objects[step.source];
    const player = object.controller;
    // A converter's own cost comes out of the pool before its output goes in
    // — the plan orders its funding sources ahead of it, and names the exact
    // units they contributed.
    for (const m of step.spends) this.removeMana(player, m);
    for (const m of step.mana) this.addMana(player, m, 1, step.tag);
    if (step.oncePerTurn !== undefined) {
      object.abilitiesUsedThisTurn = [...(object.abilitiesUsedThisTurn ?? []), step.oncePerTurn];
      // Not an event of its own, so nothing else is going to tell a cache
      // region that this source has stopped being one.
      invalidateComputedCache();
    }
    if (step.sacrifice) {
      this.moveObject(step.source, "graveyard");
      // `player`, read before the move: its controller sacrificed it (701.21a).
      this.emit({ type: "permanent-sacrificed", object: step.source, player });
    } else if (step.untapped === undefined) {
      object.tapped = true;
      this.emit({ type: "permanent-tapped", object: step.source });
    }
    if (step.lifeCost > 0) this.changeLife(player, -step.lifeCost);
    if (step.pain > 0) {
      this.dealDamage(step.source, { kind: "player", player }, step.pain);
    }
  }

  /** Take one specific unit of mana back out of `player`'s pool — the other
   * half of `addMana`, used by a converter paying its own activation cost.
   * Takes an *unrestricted* unit: a converter's cost isn't the spell the
   * restriction was about, and `planManaPayment` funds converters from plain
   * sources anyway. */
  private removeMana(player: PlayerId, mana: ManaType): void {
    const pool = this.state.players[player].manaPool;
    const index = pool.findIndex(
      (unit) => unit.type === mana && unit.restriction === undefined,
    );
    if (index < 0) {
      throw new Error(`mana pool underflow paying a converter's own cost (${mana})`);
    }
    pool.splice(index, 1);
  }

  /**
   * Devotion to `color` (rule 700.5): every mana symbol of that colour in the
   * mana costs of permanents `player` controls. A hybrid pip counts for each
   * colour it contains, and `{X}` / generic count for nothing.
   *
   * Read off the *printed* mana cost — that's what the rule says, and a
   * permanent on the battlefield has no cost to modify anyway.
   */
  private devotionTo(player: PlayerId, color: Color): number {
    let total = 0;
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      if (object.controller !== player) continue;
      const def = this.registry.get(printedCardName(object));
      if (def.manaCost === null) continue;
      const cost = parseManaCost(def.manaCost);
      total += cost.colored[color];
      for (const pip of cost.hybrid) {
        if (pip.some((o) => o.kind === "color" && o.color === color)) total += 1;
      }
    }
    return total;
  }

  private addMana(
    player: PlayerId,
    mana: ManaType | "any-color" | { readonly oneOf: readonly ManaType[] },
    amount: number,
    /** The provenance the producing ability stamps on every unit it makes —
     * a spend restriction, a rider, a "doesn't empty" permission. */
    tag?: Omit<ManaUnit, "type">,
  ): void {
    // A standalone "add one mana of any colour"/"any combination of [...]"
    // (not paying a cost) just makes white / all of the first listed colour —
    // the planner resolves the colour(s) itself when it's a payment (P20).
    const concrete: ManaType =
      mana === "any-color" ? "W" : typeof mana === "object" ? mana.oneOf[0] : mana;
    const pool = this.state.players[player].manaPool;
    const units = Math.min(amount, Game.MAX_EFFECT_INSTANCES);
    for (let i = 0; i < units; i += 1) pool.push({ type: concrete, ...tag });
    this.emit({ type: "mana-added", player, mana: concrete, amount: units });
  }

  /**
   * Deduct `cost` from `player`'s pool, choosing *which* units pay it.
   *
   * With every unit interchangeable this was subtraction. Restricted mana
   * makes it a small matching: a unit may only pay if its restriction admits
   * `purpose`, and among the units that can, the **restricted ones go
   * first**. That ordering is the whole trick and it is use-it-or-lose-it
   * reasoning, not a preference — an unrestricted unit can pay for anything
   * later in the same cost, so spending it on a pip a restricted unit could
   * have covered can strand the restricted one and fail a payment that was
   * affordable. Greedy is enough here because legality is a per-unit
   * predicate against a single purpose and same-type pips are
   * interchangeable, so there is nothing for a smarter search to find.
   *
   * Each unit spent fires its `onSpend` rider (Path of Ancestry).
   */
  private spendFromPool(player: PlayerId, cost: ManaCost, purpose: ManaPurpose = null): void {
    const pool = this.state.players[player].manaPool;
    const spent: ManaUnit[] = [];

    /** Whether a restricted unit of `type` may pay for `purpose` right now. */
    const hasUsableRestricted = (type: ManaType): boolean =>
      pool.some(
        (unit) =>
          unit.type === type &&
          unit.restriction !== undefined &&
          this.manaUnitCanPay(player, unit, purpose),
      );

    /** Index of a unit of `type` this payment may spend, restricted first, or
     * `-1`. Restricted mana that can't pay for `purpose` is not a candidate
     * at all — it is simply not available to this payment. */
    const indexOf = (type: ManaType): number => {
      const restricted = pool.findIndex(
        (unit) =>
          unit.type === type &&
          unit.restriction !== undefined &&
          this.manaUnitCanPay(player, unit, purpose),
      );
      if (restricted >= 0) return restricted;
      return pool.findIndex((unit) => unit.type === type && unit.restriction === undefined);
    };

    const take = (type: ManaType, what: string): void => {
      const index = indexOf(type);
      if (index < 0) throw new Error(`mana pool underflow paying ${what}`);
      spent.push(pool[index]);
      pool.splice(index, 1);
    };

    for (let i = 0; i < cost.colorless; i += 1) take("C", "a {C} cost");
    for (const color of COLORS) {
      for (let i = 0; i < cost.colored[color]; i += 1) take(color, "a colored cost");
    }
    for (let i = 0; i < cost.generic; i += 1) {
      // Generic is the flexible half, so it's where a restricted unit is most
      // likely to find a home — look for one first, then fall back to any
      // type this payment can actually take.
      //
      // The fallback has to ask `indexOf`, not merely "is there a unit of
      // this type". Asking the weaker question picks a colour whose only
      // units are restricted and unusable, and then `take` throws on mana
      // that was never available — which is exactly what the fuzzer hit on a
      // board with a hand-activated Unclaimed Territory floating.
      const type =
        GENERIC_SPEND_ORDER.find(hasUsableRestricted) ??
        GENERIC_SPEND_ORDER.find((t) => indexOf(t) >= 0);
      if (type === undefined) throw new Error("mana pool underflow paying a generic cost");
      take(type, "a generic cost");
    }

    // "…and that spell can't be countered" (Cavern of Souls) — a property the
    // *spell* picks up from the mana that paid for it, so it is stamped on
    // the object here rather than living on the land's definition.
    if (purpose !== null && purpose.kind === "cast" && spent.some((u) => u.uncounterable)) {
      const spell = this.state.objects[purpose.card];
      if (spell !== undefined) spell.uncounterable = true;
    }
    for (const unit of spent) this.fireManaSpendRider(player, unit, purpose);
  }

  /**
   * Whether one floating unit of mana may pay for `purpose` (rule 106.6b).
   *
   * Unrestricted mana always may. Restricted mana never pays for a purpose
   * the engine can't name: a nameless payment satisfies no printed
   * restriction, and the alternative — treating unknown as permitted — is
   * the failure mode where the restriction silently does nothing.
   */
  /**
   * The provenance a mana ability stamps on the units it makes, or
   * `undefined` for the ordinary unrestricted case.
   *
   * Built here, against the live board, because the parts that matter most
   * aren't printed: `chosenType` reads the creature type named as the
   * permanent entered (Cavern of Souls), and `shares-type-with-commander`
   * reads the controller's commanders (Path of Ancestry). Both are fixed as
   * the ability is activated, which is when this runs.
   */
  private manaTagFor(
    object: GameObject,
    effect: Extract<EffectSpec, { kind: "add-mana" }>,
  ): Omit<ManaUnit, "type"> | undefined {
    const { spendOnly, whenSpent, persists } = effect;
    if (spendOnly === undefined && whenSpent === undefined && persists !== true) return undefined;

    const tag: {
      restriction?: ManaRestriction;
      onSpend?: ManaSpendRider;
      persists?: boolean;
      uncounterable?: boolean;
    } = {};

    if (spendOnly !== undefined) {
      let { spell, abilityOf } = spendOnly;
      if (spendOnly.chosenType === true) {
        // No type named yet (the permanent is mid-entry, or the choice was
        // never answered) — the mana can pay for nothing, which is the safe
        // reading and matches a Cavern with no type chosen. The sentinel is a
        // subtype no card has.
        const chosen = object.chosenCreatureType ?? " none";
        if (spell !== undefined) spell = { ...spell, subtype: chosen };
        if (abilityOf !== undefined) abilityOf = { ...abilityOf, subtype: chosen };
      }
      tag.restriction = {
        ...(spell !== undefined ? { spell } : {}),
        ...(abilityOf !== undefined ? { abilityOf } : {}),
        text: spendOnly.text,
      };
      if (spendOnly.uncounterable === true) tag.uncounterable = true;
    }

    if (whenSpent !== undefined) {
      const spell =
        whenSpent.spell === "shares-type-with-commander"
          ? { type: "creature" as const, subtypes: this.commanderCreatureTypes(object.controller) }
          : whenSpent.spell;
      tag.onSpend = {
        source: object.id,
        sourceName: printedCardName(object),
        ...(spell !== undefined ? { spell } : {}),
        effect: whenSpent.effect,
        text: whenSpent.text,
      };
    }

    if (persists === true) tag.persists = true;
    return tag;
  }

  /** Every creature type across `player`'s commanders, wherever they are —
   * Path of Ancestry's "shares a creature type with your commander". */
  private commanderCreatureTypes(player: PlayerId): string[] {
    const types = new Set<string>();
    for (const id of Object.keys(this.state.objects) as ObjectId[]) {
      const object = this.state.objects[id];
      if (!object.isCommander || object.owner !== player) continue;
      for (const subtype of this.registry.get(printedCardName(object)).subtypes) {
        types.add(subtype);
      }
    }
    // An empty list would match nothing, which is right: no commander, no
    // shared type. A sentinel isn't needed — `subtypes: []` fails every card.
    return [...types];
  }

  private manaUnitCanPay(player: PlayerId, unit: ManaUnit, purpose: ManaPurpose): boolean {
    const restriction = unit.restriction;
    if (restriction === undefined) return true;
    if (purpose === null) return false;
    const [filter, subject] =
      purpose.kind === "cast"
        ? [restriction.spell, purpose.card]
        : [restriction.abilityOf, purpose.source];
    if (filter === undefined) return false;
    return matchesFilter(this.state, this.registry, subject, filter, { you: player });
  }

  /**
   * Put a unit's `onSpend` rider on the stack (Path of Ancestry's "When that
   * mana is spent to cast a creature spell that shares a creature type with
   * your commander, scry 1").
   *
   * It is a triggered ability, so it goes on the stack above the spell it
   * paid for and resolves first (rule 603.2) — which is right, and is why
   * this can't just apply the effect inline.
   */
  private fireManaSpendRider(player: PlayerId, unit: ManaUnit, purpose: ManaPurpose): void {
    const rider = unit.onSpend;
    if (rider === undefined || purpose === null || purpose.kind !== "cast") return;
    // The permanent that made the mana may be gone by now — tapped for mana,
    // then sacrificed or bounced with the mana still floating — and the
    // rider triggers all the same: it belongs to the mana, not to anything on
    // the battlefield. Only the player whose pool the unit sat in can spend
    // it, and that is who controlled the ability that made it.
    const controller = player;
    if (
      rider.spell !== undefined &&
      !matchesFilter(this.state, this.registry, purpose.card, rider.spell, { you: controller })
    ) {
      return;
    }
    this.state.pendingTriggers.push({
      sourceObjectId: rider.source,
      cardName: rider.sourceName,
      abilityIndex: 0,
      controller,
      delayed: {
        id: `mana-rider-${this.state.nextObjectSeq}`,
        controller,
        // Never actually consulted — this record goes on the stack directly
        // rather than waiting on a step — but the shape is shared with real
        // delayed triggers, so it gets honest values.
        at: "next-end-step",
        createdOnTurn: this.state.turn.number,
        createdDuringEndStep: false,
        source: rider.source,
        sourceName: rider.sourceName,
        // The spell the mana paid for, so an effect can refer to it as
        // `target: 0` (Arena of Glory's "that creature gains haste"). It is
        // on the stack by the time this resolves, which is why the rider
        // can't be placed until then.
        targets: [{ kind: "object", object: purpose.card }],
        effect: rider.effect,
        text: rider.text,
      },
    });
  }

  // --- priority -------------------------------------------------

  private grantPriority(player: PlayerId): void {
    this.state.priority.active = true;
    this.state.priority.holder = player;
    this.state.priority.passed = [];
    this.emit({ type: "priority-received", player });
  }

  private passPriority(player: PlayerId): void {
    const priority = this.state.priority;
    if (this.state.awaiting !== null) {
      throw new Error("a declaration is pending");
    }
    if (!priority.active || priority.holder === null) {
      throw new Error("no player currently has priority");
    }
    if (priority.holder !== player) {
      throw new Error(`${player} does not have priority`);
    }
    this.emit({ type: "priority-passed", player });
    priority.passed.push(player);

    const eligible = this.state.turnOrder.filter(
      (candidate) => !this.state.players[candidate].hasLost,
    );
    const everyonePassed = eligible.every((candidate) =>
      priority.passed.includes(candidate),
    );
    if (!everyonePassed) {
      priority.holder = this.nextEligibleAfter(player);
      this.emit({ type: "priority-received", player: priority.holder });
      return;
    }

    priority.passed = [];
    if (this.state.zones.shared.stack.length > 0) {
      this.resolveTopOfStack();
      if (this.state.suspendedResolutions.length === 0) this.runStateBasedActions();
      if (this.state.result.over) {
        priority.active = false;
        priority.holder = null;
        return;
      }
      // A resolution may have paused the game on a decision owed by a player
      // other than the active one (Mind Rot targeting an opponent) — that
      // player gets priority to answer it. (The cast reflects that
      // `resolveTopOfStack` above may have set `awaiting`, which TS's
      // narrowing from the `!== null` guard at the top doesn't see.)
      const pendingAfterResolve = this.state.awaiting as AwaitingDecision | null;
      this.prepareForPriority(pendingAfterResolve?.player ?? this.activePlayer);
    } else {
      priority.active = false;
      priority.holder = null;
      this.endStep();
    }
  }

  private nextEligibleAfter(player: PlayerId): PlayerId {
    const order = this.state.turnOrder;
    const start = order.indexOf(player);
    for (let offset = 1; offset <= order.length; offset += 1) {
      const candidate = order[(start + offset) % order.length];
      if (!this.state.players[candidate].hasLost) return candidate;
    }
    return player;
  }

  // --- the stack -----------------------------------------------

  /**
   * Run `resolve` with `state.decisionSource` pointing at whatever is
   * resolving, so a decision raised anywhere inside it can say what caused it
   * (see {@link GameState.decisionSource}). A resolution that ends with
   * nothing awaiting leaves no source behind.
   */
  private withDecisionSource(source: ObjectId, resolve: () => void): void {
    const object = this.state.objects[source];
    this.state.decisionSource =
      object === undefined ? null : { object: source, cardName: printedCardName(object) };
    try {
      resolve();
    } finally {
      if (this.state.awaiting === null) this.state.decisionSource = null;
    }
  }

  private resolveTopOfStack(): void {
    const parked = this.state.suspendedResolutions.length;
    this.resolveTopObject();
    this.holdResolutionOpen(parked);
  }

  /**
   * A resolution that ended — or resumed and ended — with a decision still
   * unanswered isn't over until it is (see `GameState.suspendedResolutions`).
   * Unless it parked steps of its own, which already hold it open, note it
   * with an empty remainder. `parked` is how many were parked before it began.
   */
  private holdResolutionOpen(parked: number): void {
    if (this.state.suspendedResolutions.length > parked) return;
    if (this.decisionOutstanding()) this.state.suspendedResolutions.push({ effect: null });
  }

  /** See `ResolutionContext.decisionPending`. */
  private decisionOutstanding(): boolean {
    const s = this.state;
    return (
      s.awaiting !== null ||
      s.pendingDiscards.length > 0 ||
      s.pendingSacrifices.length > 0 ||
      s.pendingSacrificeVictims.length > 0 ||
      s.pendingDestruction.length > 0 ||
      s.deferredCommanderMove !== null ||
      s.pendingCommanderMoves.length > 0 ||
      s.pendingPayLifeForUntapped.length > 0
    );
  }

  /**
   * Carry on with the most recently suspended resolution, now that every
   * decision it was waiting on has been answered — see
   * `GameState.suspendedResolutions`. Its steps run as the same spell or
   * ability, and may suspend it again.
   */
  private resumeSuspendedResolution(): void {
    const next = this.state.suspendedResolutions.pop();
    if (next === undefined || next.effect === null) return;
    const parked = this.state.suspendedResolutions.length;
    const outerSourceTimestamp = this.resolvingSourceTimestamp;
    this.resolvingSourceTimestamp = next.sourceTimestamp ?? null;
    this.state.decisionSource = next.decisionSource;
    try {
      applyEffectSpec(
        next.effect,
        this.makeResolutionContext(
          next.source,
          next.controller,
          next.targets,
          next.x,
          next.triggerValue,
          next.triggerObject,
          next.stackMultiplier,
          next.resolutionCount,
          next.targetZones,
          next.lastKnownRefs,
          {
            ...(next.sourceLost === true ? { sourceLost: true } : {}),
            ...(next.abilityKey !== undefined ? { abilityKey: next.abilityKey } : {}),
          },
        ),
      );
    } finally {
      this.resolvingSourceTimestamp = outerSourceTimestamp;
      // As `withDecisionSource` leaves it: a queued prompt carries its own.
      if (this.state.awaiting === null) this.state.decisionSource = null;
    }
    this.holdResolutionOpen(parked);
  }

  private resolveTopObject(): void {
    const stack = this.state.zones.shared.stack;
    const id = stack[stack.length - 1];
    const object = this.state.objects[id];

    if (object.kind === "ability") {
      this.resolveAbility(object);
      return;
    }

    const def = this.registry.get(printedCardName(object));
    const targets = object.targets ?? [];

    // A kicked spell may target something its unkicked specs wouldn't allow
    // (Tear Asunder), so the fizzle check uses the specs it was actually cast
    // with — `chosenModes` handles the modal case below, on its own.
    const castSpecs = this.effectiveTargetSpecs(
      def,
      undefined,
      object.kicked === true,
      object.overloaded === true,
    );
    if (
      castSpecs.length > 0 &&
      !this.anyTargetLegal(castSpecs, targets, object.controller, this.cardSource(def, id))
    ) {
      object.targets = null;
      this.emit({
        type: "spell-fizzled",
        object: id,
        reason: "all targets are illegal",
      });
      // A copy that fizzles ceases to exist (707.10c); a real spell goes to the
      // graveyard.
      if (object.isCopy) {
        const idx = stack.indexOf(id);
        if (idx >= 0) stack.splice(idx, 1);
        delete this.state.objects[id];
      } else {
        this.moveObject(id, "graveyard");
      }
      return;
    }

    this.withDecisionSource(id, () => {
      if (object.chosenModes !== undefined && def.castModal !== null) {
        // A targeted modal spell (rule 700.2 — ROADMAP Phase 11 EG-2): apply each
        // chosen mode with its own slice of `targets`; skip a mode whose targets
        // are now illegal (608.2b); the spell "fizzles" only if every mode does.
        let offset = 0;
        let anyApplied = false;
        for (const mi of object.chosenModes) {
          const mode = def.castModal.modes[mi];
          const specs = mode?.targets ?? [];
          const slice = targets.slice(offset, offset + specs.length);
          const zoneSlice = (object.targetZones ?? []).slice(offset, offset + specs.length);
          offset += specs.length;
          const ok =
            mode !== undefined &&
            specs.every(
              (spec, i) =>
                slice[i] !== undefined &&
                isLegalTarget(this.state, this.registry, spec, slice[i], object.controller, this.cardSource(def, id)),
            );
          if (!ok || mode === undefined) continue;
          applyEffectSpec(
            mode.effect,
            this.makeResolutionContext(
              id,
              object.controller,
              slice,
              object.xValue ?? 0,
              0,
              undefined,
              1,
              0,
              zoneSlice,
              object.lastKnownRefs,
            ),
          );
          anyApplied = true;
        }
        if (!anyApplied) {
          this.emit({ type: "spell-fizzled", object: id, reason: "all chosen modes have illegal targets" });
        }
      } else {
        const context = this.makeResolutionContext(
          id,
          object.controller,
          targets,
          object.xValue ?? 0,
          0,
          undefined,
          1,
          0,
          object.targetZones,
          object.lastKnownRefs,
        );
        // Overload (rule 702.126) and kicker (rule 702.33) each replace the
        // ordinary effect "instead" when chosen; overload takes priority since
        // no card has both.
        const altEffect =
          object.overloaded === true
            ? (def.overload?.effect ?? null)
            : object.kicked === true
              ? (def.kicker?.effect ?? null)
              : null;
        if (altEffect !== null) {
          applyEffectSpec(altEffect, context);
        } else if (def.resolve !== null) {
          def.resolve(context);
        } else if (def.effect !== null) {
          applyEffectSpec(def.effect, context);
        }
      }
    });
    this.emit({ type: "spell-resolved", object: id });

    // A copy of a spell (rule 707.10c) ceases to exist instead of moving to
    // any zone other than the stack.
    if (object.isCopy) {
      const stack = this.state.zones.shared.stack;
      const stackIndex = stack.indexOf(id);
      if (stackIndex >= 0) stack.splice(stackIndex, 1);
      delete this.state.objects[id];
      return;
    }

    if (this.isPermanentSpell(def)) {
      const escapedWith = object.castVia === "escape" ? def.escape?.counters : undefined;
      this.moveObject(id, "battlefield");
      object.targets = null;
      // "This creature escapes with a +1/+1 counter on it" — before the
      // enters-battlefield event, so an ETB trigger reads the counter the
      // permanent genuinely arrived with (rule 614.1c).
      if (escapedWith !== undefined && this.state.objects[id]?.zone === "battlefield") {
        this.addCounter({ kind: "object", object: id }, escapedWith.kind, escapedWith.amount);
      }
      this.emit({ type: "permanent-entered-battlefield", object: id });
      if (def.subtypes.includes("Aura")) {
        const enchantTarget = targets[0];
        if (enchantTarget?.kind === "object") {
          object.attachedTo = enchantTarget.object;
          this.emit({
            type: "permanent-attached",
            source: id,
            target: enchantTarget.object,
          });
        }
      }
      if (def.copyOnEnter !== null) this.beginCopyChoice(id, object.controller);
      this.applyEnterChoices(id, object.controller, def);
    } else if (
      // Adventure (rule 715.3) — the adventure half (face 1) resolving exiles
      // the card with a "you may cast the creature later" permission, instead
      // of going to the graveyard.
      this.frontFaceDef(id).adventure &&
      (object.face ?? 0) === 1
    ) {
      object.targets = null;
      this.moveObject(id, "exile");
      object.onAdventure = true;
      this.emit({ type: "card-on-adventure", object: id, player: object.owner });
    } else {
      // "Exile ~" printed on the spell's own resolution text (Genesis
      // Ultimatum — needed-cards P19), unconditional and independent of how
      // it was cast (unlike flashback/disturb/adventure above).
      if (def.shuffleIntoLibraryOnResolve) {
        this.moveObject(id, "library");
        this.shuffleLibraryOf(object.owner);
      } else {
        this.moveObject(id, def.exileOnResolve ? "exile" : "graveyard");
      }
      object.targets = null;
    }
  }

  /**
   * The concrete colours an `add-mana` `oneOf` names. A `{ producedBy }` list
   * is read off the board instead of being printed (Exotic Orchard, Fellwar
   * Stone: "any color that a land an opponent controls could produce"), so it
   * has to be resolved wherever the spec is read — the payment planner, the
   * standalone-activation menu and `addMana` itself.
   */
  private manaOneOf(
    mana: { readonly oneOf: readonly ManaType[] } | { readonly producedBy: "opponents-lands" },
    player: PlayerId,
  ): readonly ManaType[] {
    if ("oneOf" in mana) return mana.oneOf;
    const colors = new Set<ManaType>();
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      if (object === undefined || object.controller === player) continue;
      const def = this.registry.get(printedCardName(object));
      if (!def.types.includes("land")) continue;
      // What it could produce, read off its own mana abilities — so a dual
      // land offers both of its colours and a Wastes offers none.
      for (const ability of def.activated) {
        const effect = ability.effect;
        if (effect === null || effect.kind !== "add-mana") continue;
        const m = effect.mana;
        if (m === "any-color") for (const c of COLORS) colors.add(c);
        else if (typeof m === "string" && m !== "chosen" && m !== "C") colors.add(m);
        else if (typeof m === "object" && "oneOf" in m) for (const c of m.oneOf) colors.add(c);
      }
    }
    return [...colors];
  }

  /**
   * The triggered abilities `sourceId` has as the ability referring to it
   * knows it (`stint`, see {@link LastKnownRefs}): once the permanent it was
   * then has left the battlefield, the ones its snapshot recorded — a
   * Clone's copied ones, a granted one — else whatever it has now.
   * `undefined` when the object no longer exists and left nothing behind.
   */
  private triggeredOfSource(
    sourceId: ObjectId,
    stint: number | undefined,
  ): readonly TriggeredAbility[] | undefined {
    const departed = stint === undefined ? undefined : this.lastKnownOfStint(sourceId, stint);
    if (departed !== undefined) return this.departedTriggeredEntries(departed).map((e) => e.ability);
    if (this.state.objects[sourceId] === undefined) return undefined;
    return this.effectiveTriggered(sourceId);
  }

  private stackAbilityOf(object: GameObject): StackAbility {
    // A delayed triggered ability isn't an ability of any card, so there is
    // nothing to look up by index — it carries its own effect (rule 603.7).
    const delayed = object.delayedTrigger;
    if (delayed !== undefined) {
      return { targets: [], effect: delayed.effect, resolve: null };
    }
    // Nor is a reflexive one (rule 603.12), which also chose its own targets.
    const reflexive = object.reflexiveTrigger;
    if (reflexive !== undefined) {
      return { targets: reflexive.targets, effect: reflexive.effect, resolve: null };
    }
    // A granted ability resolves as what was granted, whether or not the
    // grant (or its source) is still around — rule 113.7a.
    if (object.grantedAbility !== undefined) {
      const granted = this.abilityFromRef(object.grantedAbility);
      if (granted !== undefined) return granted;
    }
    const def = this.registry.get(printedCardName(object));
    const index = object.abilityIndex ?? 0;
    if (object.abilityKind === "triggered") {
      // The source may still be around with a granted ability at this index —
      // or have left with it, when its snapshot still knows (603.10a).
      const src = object.sourceObjectId;
      if (src !== null) {
        const eff = this.triggeredOfSource(src, object.lastKnownRefs?.source)?.[index];
        if (eff !== undefined) return eff;
      }
      return def.triggered[index];
    }
    if (object.abilityKind === "chapter") return (def.chapters ?? [])[index];
    // An activated ability's source may still be on the battlefield with a
    // granted ability at this index (rule 608.2b — last-known info); fall back
    // to the printed list if it's gone (a self-sacrifice cost, Evolving Wilds).
    const src = object.sourceObjectId;
    if (src !== null && this.state.objects[src] !== undefined) {
      const eff = this.effectiveActivated(src)[index];
      if (eff !== undefined) return eff;
    }
    return def.activated[index];
  }

  private resolveAbility(object: GameObject): void {
    const id = object.id;
    const ability = this.stackAbilityOf(object);
    const targets = object.targets ?? [];
    const source = object.sourceObjectId ?? id;

    // Intervening-if, second check (rule 603.4): a triggered ability whose
    // condition is no longer true is removed from the stack and does nothing.
    // A source that has left since is asked about as it last existed on the
    // battlefield (Undying's "if it had no +1/+1 counters on it").
    if (object.abilityKind === "triggered") {
      const condition = (ability as TriggeredAbility).condition;
      const sourceObject = this.state.objects[source] ?? object;
      const stint = object.lastKnownRefs?.source;
      const sourceLastKnown =
        stint === undefined ? undefined : this.lastKnownOfStint(source, stint);
      if (
        !this.interveningIfMet(condition, sourceObject, object.sourceTimestamp, sourceLastKnown) ||
        !this.stillAttackingAlone(ability, object)
      ) {
        this.removeAbilityFromStack(id);
        this.emit({
          type: "spell-fizzled",
          object: id,
          reason: "its intervening-if condition is no longer met",
        });
        return;
      }
    }

    if (
      ability.targets.length > 0 &&
      !this.anyTargetLegal(
        ability.targets,
        targets,
        object.controller,
        // Target filters re-read their dynamic operands now (rule 608.2b):
        // the triggering object may have changed or left since.
        this.abilityTargetSource({
          sourceObjectId: source,
          controller: object.controller,
          targets,
          x: object.xValue ?? 0,
          triggerValue: object.triggerValue ?? 0,
          ...(object.triggerObject !== undefined ? { triggerObject: object.triggerObject } : {}),
          ...(object.targetZones !== undefined ? { targetZones: object.targetZones } : {}),
          ...(object.lastKnownRefs !== undefined ? { lastKnownRefs: object.lastKnownRefs } : {}),
        }),
        object.autoTargetSlots,
      )
    ) {
      this.removeAbilityFromStack(id);
      this.emit({
        type: "spell-fizzled",
        object: id,
        reason: "all targets are illegal",
      });
      return;
    }

    // An ability activated from a zone its source stayed in (Derevi from the
    // command zone): if the card has changed zones since, it's a new object
    // (rule 400.7) and "put Derevi onto the battlefield" finds nothing.
    const recorded = object.sourceZoneChangeCount;
    const sourceLost =
      recorded !== undefined && (this.state.objects[source]?.zoneChangeCount ?? 0) !== recorded;
    const abilityKey = this.abilityTurnKey(object);
    const base = this.makeResolutionContext(
      source,
      object.controller,
      targets,
      object.xValue ?? 0,
      object.triggerValue ?? 0,
      object.triggerObject,
      object.stackMultiplier ?? 1,
      this.recordAbilityResolution(object),
      object.targetZones,
      object.lastKnownRefs,
      {
        ...(sourceLost ? { sourceLost: true } : {}),
        ...(abilityKey !== undefined ? { abilityKey } : {}),
      },
    );
    const targetedBy = object.targetedBy;
    const context = {
      ...base,
      ...(targetedBy !== undefined
        ? { ward: (cost: WardCost) => this.beginWard(source, object.controller, targetedBy, cost) }
        : {}),
    };
    const outerSourceTimestamp = this.resolvingSourceTimestamp;
    this.resolvingSourceTimestamp = object.sourceTimestamp ?? null;
    try {
      this.withDecisionSource(source, () => {
        if (ability.resolve !== null) {
          ability.resolve(context);
        } else if (ability.effect !== null) {
          applyEffectSpec(ability.effect, context);
        }
      });
    } finally {
      this.resolvingSourceTimestamp = outerSourceTimestamp;
    }
    this.emit({ type: "ability-resolved", source });
    this.removeAbilityFromStack(id);
  }

  /**
   * Count one more resolution of the ability `object` stands for this turn,
   * and return the new count ("if this is the second time this ability has
   * resolved this turn" reads `2` during the second). Called only once an
   * ability is actually resolving: one that fizzled or was countered by ward
   * never resolved, and doesn't count.
   *
   * The key is the source object, the timestamp it had when the ability went
   * on the stack, and which of its abilities this is — a granted one by where
   * it was granted from, since its index among the source's abilities can
   * shift as grants come and go.
   */
  private recordAbilityResolution(object: GameObject): number {
    const key = this.abilityTurnKey(object);
    if (key === undefined) return 0;
    const counts = (this.state.abilityResolutionsThisTurn ??= {});
    counts[key] = (counts[key] ?? 0) + 1;
    return counts[key];
  }

  /** Which ability of which object `object` (an ability on the stack) is, as
   * the per-turn records key it — see `ResolutionContext.abilityKey`. A
   * delayed trigger is no object's ability, and has none. */
  private abilityTurnKey(object: GameObject): string | undefined {
    if (object.delayedTrigger !== undefined || object.reflexiveTrigger !== undefined) return undefined;
    const granted = object.grantedAbility;
    const which =
      granted?.kind === "static"
        ? `static:${granted.cardName}:${granted.staticIndex}:${granted.list}:${granted.index}`
        : `${object.abilityKind}:${object.abilityIndex ?? 0}`;
    return `${object.sourceObjectId ?? object.id}@${object.sourceTimestamp ?? 0}#${which}`;
  }

  private removeAbilityFromStack(id: ObjectId): void {
    const stack = this.state.zones.shared.stack;
    const index = stack.indexOf(id);
    if (index >= 0) stack.splice(index, 1);
    delete this.state.objects[id];
  }

  // --- triggered abilities ------------------------------------

  /** Scan for triggered abilities that just fired and queue them. */
  private detectTriggers(event: GameEvent): void {
    // Pure scan over one event (the only write is pushing pending triggers,
    // which nothing cached reads) — worth a region of its own because it runs
    // on *every* emitted event, right after `emit` invalidated whatever a
    // surrounding region held.
    withComputedCache(() => this.detectTriggersUncached(event));
  }

  private detectTriggersUncached(event: GameEvent): void {
    // Computed once per event rather than per candidate — `effectiveTriggered`
    // would otherwise rescan the battlefield for every permanent on it.
    const triggerGrantors = this.triggeredGrantSources();
    const candidates = new Set<ObjectId>(this.state.zones.shared.battlefield);
    // Eminence (rule 702.106): a card in the command zone whose triggered
    // ability says it functions there. Added to the same scan rather than
    // given one of its own, so ordering, APNAP and the intervening-if check
    // are the battlefield's and cannot drift from it.
    //
    // Tracked separately from `candidates` because "is in the command zone"
    // is not the same question as "may only contribute Eminence". A commander
    // that just went to the command zone under 903.9a is *also* the subject
    // of a `permanent-left-battlefield` event, and its own
    // leaves-battlefield trigger must still fire — keying the restriction on
    // the object's current zone silently suppressed that, which
    // `commander.test.ts` caught.
    const eminenceOnly = new Set<ObjectId>();
    for (const id of this.state.zones.shared.command) {
      candidates.add(id);
      eminenceOnly.add(id);
    }
    // The object an event is *about* contributes all of its abilities,
    // wherever it has ended up.
    const subject =
      event.type === "permanent-destroyed" ||
      event.type === "permanent-left-battlefield" ||
      // A spell's own `this-cast` trigger (cascade, storm) lives on the card
      // on the stack, not a permanent.
      event.type === "spell-cast"
        ? event.object
        : null;
    if (subject !== null) {
      candidates.add(subject);
      eminenceOnly.delete(subject);
    }
    // Rule 603.10a: a leaves-the-battlefield ability looks back to just
    // before the event, so the permanents that left *together* with this one
    // — earlier in the same wrath or state-based sweep — still see it go,
    // though the engine has already moved them. They contribute only their
    // leaves-the-battlefield abilities: nothing else of theirs is watching.
    const lookBack = this.lookBackSources(event);
    for (const id of lookBack) {
      candidates.add(id);
      eminenceOnly.delete(id);
    }
    const leaving = isLeaveEvent(event);
    for (const id of candidates) {
      const live = this.state.objects[id];
      if (live === undefined) continue;
      // A source that has just left the battlefield is read as it last
      // existed there (rules 603.3a, 603.10a), from the snapshot the move
      // took. Its abilities are the ones it had then: none if it had lost
      // them (Turn to Frog), a copied card's rather than the Clone's own,
      // and a dies trigger an Aura or a lord granted it even though the
      // grant is gone. And its ability is controlled by whoever controlled
      // it then, not by the owner `moveObject` has since reverted it to — a
      // stolen Blood Artist's drain is the thief's.
      const lastSeen =
        leaving && (id === subject || lookBack.has(id)) && live.zone !== "battlefield"
          ? live.lastKnown
          : undefined;
      // Layer 6 — a permanent that lost its abilities has no triggered ones.
      if (lastSeen !== undefined ? lastSeen.lostAbilities : hasLostAbilities(live)) continue;
      const object =
        lastSeen !== undefined && lastSeen.controller !== live.controller
          ? { ...live, controller: lastSeen.controller }
          : live;
      // A command-zone source contributes *only* its `fromCommandZone`
      // abilities — Edgar Markov's attack trigger must not fire from there.
      const onlyEminence = eminenceOnly.has(id);
      const onlyLookBack = lookBack.has(id);
      // The spell just cast is in this scan so its own "when you cast this
      // spell" abilities (cascade, storm, Prossh) can fire — and those are
      // the only ones a spell has working on the stack (rule 113.6). Without
      // this, Jhoira ("whenever you cast a historic spell") drew off its own
      // legendary casting, and Ms. Bumbleflower off hers.
      const onlyThisCast =
        event.type === "spell-cast" && id === event.object && object.zone === "stack";
      // An eliminated player's permanents are left on the board to be seen,
      // not to keep playing: their triggers stop firing. They leave play rather
      // than view — see the note in `matchesFilter`.
      if (this.state.players[object.controller]?.hasLost === true) continue;
      const entries =
        lastSeen !== undefined
          ? this.departedTriggeredEntries(lastSeen)
          : this.effectiveTriggeredEntries(id, triggerGrantors);
      entries.forEach(({ ability, ref }, index) => {
        if (onlyEminence && ability.fromCommandZone !== true) return;
        if (onlyThisCast && ability.trigger.on !== "this-cast") return;
        if (onlyLookBack && !LOOK_BACK_TRIGGERS.has(ability.trigger.on)) return;
        if (
          this.triggerMatches(ability.trigger, event, object) &&
          !(
            ability.oncePerTurn === true &&
            this.triggeredOnceThisTurn(live, index, lastSeen?.zoneChangeCount)
          ) &&
          this.interveningIfMet(ability.condition, object, undefined, lastSeen) &&
          // Elesh Norn, Mother of Machines / Torpor Orb: an entering
          // permanent causes none of this controller's triggers.
          !(
            event.type === "permanent-entered-battlefield" &&
            this.entryTriggersSuppressed(object.controller)
          )
        ) {
          const autoCandidate: TargetRef | undefined =
            ability.trigger.on === "deals-combat-damage-to-player" &&
            event.type === "damage-dealt" &&
            event.target.kind === "player"
              ? event.target
              : // "… deals 3 damage to that player" — the player whose spell
                // or ability did the targeting.
                ability.trigger.on === "becomes-target" &&
                  event.type === "object-targeted"
                ? { kind: "player" as const, player: event.by }
                : undefined;
          // Only hand the event-determined player to slot 0 if that slot can
          // actually hold a player. A saboteur trigger that targets "**target
          // creature** that player controls" (Mordant Dragon) was handed the
          // player instead, and the whole trigger was then dropped for "no
          // legal targets". A slot that would have accepted the auto still
          // gets it, so no card that works today changes. An "another target"
          // slot is a real choice by definition, never the event's to fill.
          const autoTargets =
            autoCandidate === undefined ||
            (ability.targets[0] !== undefined && otherThan(ability.targets[0]) !== undefined) ||
            (ability.targets[0] !== undefined &&
              !isLegalTarget(
                this.state,
                this.registry,
                ability.targets[0],
                autoCandidate,
                object.controller,
                this.permanentSource(id),
                { notTargeted: true },
              ))
              ? undefined
              : [autoCandidate];
          // A numeric quantity the triggering event supplies, snapshotted now —
          // for an `EffectAmount` `{ triggerValue: true }`: the entering /
          // attacking creature's power (Terror of the Peaks), or the combat
          // damage a creature just dealt a player (Old Gnawbone). ROADMAP P4b.
          // The object whose entering / attacking / etc. fired this trigger —
          // for `create-token-copy` `of: "trigger-object"` (Miirym). P5b.
          const triggerObject =
            // A damage trigger's object: the permanent dealt it, for the
            // receiving end; the source that dealt it ("it deals that much
            // damage"), for the dealing end.
            event.type === "damage-dealt"
              ? ability.trigger.on === "dealt-damage"
                ? event.target.kind === "object"
                  ? event.target.object
                  : undefined
                : event.source
              : event.type === "permanent-entered-battlefield" ||
            event.type === "permanent-destroyed" ||
            event.type === "permanent-left-battlefield" ||
            event.type === "permanent-sacrificed" ||
            event.type === "permanent-transformed"
              ? event.object
              : event.type === "attacker-declared" ||
                  event.type === "attacked-alone" ||
                  event.type === "attacker-blocked"
                ? event.attacker
                : // The blocker: "whenever a creature you control blocks, it
                  // gets +X/+X" (Doran, Besieged by Time).
                  event.type === "blocker-declared"
                  ? event.blocker
                  : event.type === "object-targeted"
                  ? event.object
                  : // The spell that was cast, so a cast trigger can read it —
                    // "damage equal to **that spell's** mana value" is a
                    // `{ manaValueOf: "trigger-object" }`, which read 0 without
                    // this.
                    event.type === "spell-cast"
                    ? event.object
                    : // Magecraft's copy: the copy is "that spell".
                      event.type === "spell-copied"
                      ? event.copy
                      : // The card drawn: its controller is who drew it, the
                        // "that player" of a `draws` trigger.
                        event.type === "card-drawn" || event.type === "counter-added"
                        ? event.object
                        : undefined;
          const powerOfId =
            event.type === "permanent-entered-battlefield"
              ? event.object
              : event.type === "attacker-declared"
                ? event.attacker
                : undefined;
          const triggerValue =
            powerOfId !== undefined && this.state.objects[powerOfId] !== undefined
              ? computeCharacteristics(this.state, this.registry, powerOfId).power
              : (ability.trigger.on === "deals-combat-damage-to-player" ||
                    ability.trigger.on === "dealt-damage" ||
                    ability.trigger.on === "deals-damage") &&
                  event.type === "damage-dealt"
                ? event.amount
                : // A batched attack trigger's value is *how many* matched,
                  // which is what "draw that many cards" reads.
                  ability.trigger.on === "attacks-batch" &&
                    event.type === "attackers-declared"
                  ? this.batchedAttackers(ability.trigger, event.attackers, object).length
                  : // How many creatures attack that player.
                    ability.trigger.on === "attacks-player" && event.type === "player-attacked"
                  ? event.attackers.length
                  : // How many cards left the graveyard, for "that many".
                    ability.trigger.on === "leaves-graveyard" &&
                      event.type === "cards-left-graveyard"
                    ? this.graveyardLeavers(ability.trigger, event.objects, object).length
                    : // "Deals that much damage": how many counters were put.
                    ability.trigger.on === "counters-put" && event.type === "counter-added"
                    ? event.amount
                    : // "Loses that much life" (Sanguine Bond, Exquisite Blood):
                      // how much the life total moved.
                      (ability.trigger.on === "gains-life" || ability.trigger.on === "loses-life") &&
                        event.type === "life-changed"
                      ? Math.abs(event.delta)
                      : undefined;
          // Rule 107.3m: an enters-the-battlefield ability of a permanent that
          // was cast with X uses that X. Snapshotted now, off the entering
          // object itself, because the ability is its own object from here on:
          // the permanent dying to state-based actions (a 0/0 that entered with
          // X=0 counters) or being flickered before this resolves doesn't change
          // the X the ability already has. Another permanent's entry trigger
          // reads nothing — it's that object's ETB, not this one's.
          const castX =
            ability.trigger.on === "enters-battlefield" &&
            event.type === "permanent-entered-battlefield" &&
            event.object === id
              ? (object.xValue ?? undefined)
              : undefined;
          // Which stint on the battlefield the source and the triggering
          // object were in — what the ability means by "it" and "that
          // creature" if either has left by the time it resolves (608.2h).
          const lastKnownRefs = this.refsAtTrigger(live, lastSeen, event, triggerObject);
          const base = {
            sourceObjectId: id,
            cardName: lastSeen !== undefined ? lastSeen.name : printedCardName(object),
            abilityIndex: index,
            controller: object.controller,
            ...(autoTargets ? { autoTargets } : {}),
            ...(triggerValue !== undefined ? { triggerValue } : {}),
            ...(triggerObject !== undefined ? { triggerObject } : {}),
            // Ward's "counter that spell or ability unless that player pays".
            ...(ability.trigger.on === "becomes-target" && event.type === "object-targeted"
              ? {
                  targetedBy: {
                    object: event.stackObject,
                    player: event.by,
                    zoneChangeCount: this.state.objects[event.stackObject]?.zoneChangeCount ?? 0,
                  },
                }
              : {}),
            ...(castX !== undefined ? { x: castX } : {}),
            ...(ref !== undefined ? { grantedAbility: ref } : {}),
            ...(lastKnownRefs !== undefined ? { lastKnownRefs } : {}),
          };
          // A stacked source's ability really fires once per creature it
          // stands for (rule 603.3d); likewise a compacted batch-entry event
          // (GameEvent.count). A non-targeted, count-scalable effect can fire
          // once with its amount multiplied instead of materializing every
          // instance — pure engine resource-safety, see
          // `GameObject.stackCount`. Anything else (a target, an unproven
          // effect kind) still fires for real, once per instance, so no other
          // card's observable behaviour ever changes.
          // Panharmonicon-style doubling (needed-cards P15): each active
          // `doubleEntryTriggers` static the ability's controller has makes
          // this ETB trigger fire one additional time (two doublers = fires
          // three times total).
          const entryDoublers =
            (ability.trigger.on === "enters-battlefield" &&
            event.type === "permanent-entered-battlefield"
              ? this.entryTriggerDoublers(object.controller, event.object)
              : 0) + this.causeTriggerDoublers(object.controller, event);
          // A compacted stack that left play is that many permanents leaving,
          // each its own event: Zulaport Cutthroat drains once per Goblin in
          // a stack a wrath kills. The stack's own abilities already scale by
          // `object.stackCount` just below, so it isn't counted twice.
          const departed =
            (event.type === "permanent-left-battlefield" ||
              event.type === "permanent-destroyed" ||
              event.type === "permanent-sacrificed") &&
            event.object !== id
              ? (this.state.objects[event.object]?.stackCount ?? 1)
              : 1;
          // Damage dealt to a token stack was dealt to every token in it, each
          // its own permanent: a watcher fires once per token (a stack's own
          // `dealt-damage` already scales by `object.stackCount` above). Each
          // firing that deals damage to "that permanent" peels one token off
          // (`splitTargetRef`), so ten tokens dealt 1 are each dealt 2 more.
          const recipients =
            (ability.trigger.on === "deals-damage" || ability.trigger.on === "dealt-damage") &&
            event.type === "damage-dealt" &&
            event.target.kind === "object" &&
            event.target.object !== id
              ? (this.state.objects[event.target.object]?.stackCount ?? 1)
              : 1;
          // "Triggers only once each turn": this firing is the one, whatever
          // the stack size or batch count would otherwise multiply it to.
          if (ability.oncePerTurn === true) {
            this.markTriggeredOnce(live, index, lastSeen?.zoneChangeCount);
          }
          const multiplier =
            (object.stackCount ?? 1) *
            (ability.oncePerTurn === true
              ? 1
              : departed *
                recipients *
                (event.type === "permanent-entered-battlefield" ? (event.count ?? 1) : 1)) *
            (1 + entryDoublers);
          // Damage dealt all at once is dealt to a permanent once, however
          // many sources dealt it (rule 510.2 — the two creatures blocking an
          // enraged one): the trigger waits for the batch to finish and
          // fires once per permanent dealt damage, for its total. See
          // `withDamageBatch`.
          const damageBatch = this.damageBatch;
          if (
            ability.trigger.on === "dealt-damage" &&
            event.type === "damage-dealt" &&
            event.target.kind === "object" &&
            damageBatch !== null
          ) {
            const key = `${id}#${index}@${event.target.object}`;
            const owed = damageBatch.dealtDamage.get(key);
            if (owed === undefined) {
              damageBatch.dealtDamage.set(key, { ability, trigger: base, multiplier });
            } else {
              owed.trigger = {
                ...owed.trigger,
                triggerValue: (owed.trigger.triggerValue ?? 0) + event.amount,
              };
            }
            return;
          }
          this.queueTrigger(ability, base, multiplier);
        }
      });
    }
  }

  /** Has `object`'s `oncePerTurn` triggered ability `index` triggered yet
   * this turn, as this object? `stint` is the battlefield `zoneChangeCount`
   * of a source that has just left and is looking back (its dies trigger
   * seeing the rest of a wrath): it is still the object that triggered
   * earlier this turn, though its move has already bumped the count. */
  private triggeredOnceThisTurn(object: GameObject, index: number, stint?: number): boolean {
    const once = object.triggeredOnce;
    return (
      once !== undefined &&
      once.turn === this.state.turn.number &&
      once.zoneChangeCount === (stint ?? object.zoneChangeCount ?? 0) &&
      once.indices.includes(index)
    );
  }

  private markTriggeredOnce(object: GameObject, index: number, stint?: number): void {
    const zoneChangeCount = stint ?? object.zoneChangeCount ?? 0;
    const once = object.triggeredOnce;
    const current =
      once !== undefined &&
      once.turn === this.state.turn.number &&
      once.zoneChangeCount === zoneChangeCount
        ? once.indices
        : [];
    object.triggeredOnce = {
      turn: this.state.turn.number,
      zoneChangeCount,
      indices: [...current, index],
    };
  }

  /**
   * Queue a fired trigger `multiplier` times over (see the stacked-source
   * note in `detectTriggersUncached`): once with its amounts scaled when the
   * effect allows it, else once per real firing up to `MAX_EFFECT_INSTANCES`.
   */
  private queueTrigger(
    ability: TriggeredAbility,
    trigger: PendingTrigger,
    multiplier: number,
  ): void {
    if (multiplier <= 1) {
      this.state.pendingTriggers.push(trigger);
    } else if (
      ability.targets.length === 0 &&
      ability.effect !== null &&
      isCountScalableEffect(ability.effect)
    ) {
      this.state.pendingTriggers.push({ ...trigger, multiplier });
    } else {
      const copies = Math.min(multiplier, Game.MAX_EFFECT_INSTANCES);
      for (let i = 0; i < copies; i += 1) this.state.pendingTriggers.push(trigger);
    }
  }

  /**
   * The triggered abilities a permanent that has just left the battlefield
   * had there, from its snapshot (rule 603.10a): its printed ones — those of
   * the card it was a copy of, if it was one — then the ones it had been
   * granted, in {@link effectiveTriggeredEntries}' order, so an index taken
   * here names the same ability when the trigger is placed and resolved.
   */
  private departedTriggeredEntries(
    departed: LastKnownInfo,
  ): readonly { readonly ability: TriggeredAbility; readonly ref?: GrantedAbilityRef }[] {
    if (departed.lostAbilities) return EMPTY_TRIGGERED_ENTRIES;
    const printed = this.registry.get(departed.name).triggered.map((ability) => ({ ability }));
    const refs = departed.grantedTriggers ?? [];
    if (refs.length === 0) return printed;
    const granted: { ability: TriggeredAbility; ref: GrantedAbilityRef }[] = [];
    for (const ref of refs) {
      const ability = this.abilityFromRef(ref) as TriggeredAbility | undefined;
      if (ability !== undefined) granted.push({ ability, ref });
    }
    return [...printed, ...granted];
  }

  /**
   * What an ability that has just triggered refers to, for last-known
   * information (see {@link LastKnownRefs}): the battlefield stint its source
   * was in — or had just ended, for its own leaves-the-battlefield ability —
   * and the same for the triggering object. `undefined` when neither was a
   * permanent.
   */
  private refsAtTrigger(
    source: GameObject,
    departed: LastKnownInfo | undefined,
    event: GameEvent,
    triggerObject: ObjectId | undefined,
  ): LastKnownRefs | undefined {
    const sourceStint =
      departed !== undefined
        ? departed.zoneChangeCount
        : source.zone === "battlefield"
          ? (source.zoneChangeCount ?? 0)
          : undefined;
    let triggerStint: number | undefined;
    if (triggerObject !== undefined) {
      const t = this.state.objects[triggerObject];
      if (t?.zone === "battlefield") {
        triggerStint = t.zoneChangeCount ?? 0;
      } else if (
        t?.lastKnown !== undefined &&
        isLeaveEvent(event) &&
        event.object === triggerObject
      ) {
        // The permanent whose leaving fired this, just snapshotted.
        triggerStint = t.lastKnown.zoneChangeCount;
      } else if (
        t?.lastKnown !== undefined &&
        t.zone !== "stack" &&
        event.type === "damage-dealt" &&
        event.source === triggerObject
      ) {
        // Damage dealt by a permanent that had already left (a dies
        // trigger's "it deals damage"): "it" is as it last existed there.
        triggerStint = t.lastKnown.zoneChangeCount;
      }
    }
    // What the event was aimed at, and "that player": the recipient of
    // damage, the defending player of an attack.
    let recipient: LastKnownRefs["recipient"];
    let player: PlayerId | undefined;
    if (event.type === "damage-dealt") {
      const target = event.target;
      if (target.kind === "player") {
        recipient = { target };
        player = target.player;
      } else {
        const hit = this.state.objects[target.object];
        if (hit?.zone === "battlefield") {
          recipient = { target, zoneChangeCount: hit.zoneChangeCount ?? 0 };
          player = hit.controller;
        }
      }
    } else if (event.type === "attacker-declared") {
      player = this.defendingPlayerOf(event.defender);
    } else if (event.type === "player-attacked") {
      player = event.defender;
    } else if (event.type === "attacker-blocked") {
      // The defending player — the one whose creatures blocked it.
      const attacking = this.state.objects[event.attacker]?.attacking;
      if (attacking !== null && attacking !== undefined) player = this.defendingPlayerOf(attacking);
    }
    if (
      sourceStint === undefined &&
      triggerStint === undefined &&
      recipient === undefined &&
      player === undefined
    ) {
      return undefined;
    }
    return {
      ...(sourceStint !== undefined ? { source: sourceStint } : {}),
      ...(triggerStint !== undefined ? { triggerObject: triggerStint } : {}),
      ...(recipient !== undefined ? { recipient } : {}),
      ...(player !== undefined ? { player } : {}),
    };
  }

  /**
   * `id` as it last existed on the battlefield during stint `stint` (its
   * `zoneChangeCount` there) — rule 608.2h's last-known information — or
   * `undefined` to read it as it is now: it is still on the battlefield in
   * that stint, or nothing of that stint survives (it came back and left
   * again since, and its snapshot is of the later departure). A token that
   * has ceased to exist is read from `GameState.ceasedTokens`.
   */
  private lastKnownOfStint(id: ObjectId, stint: number): LastKnownInfo | undefined {
    const object = this.state.objects[id];
    if (object?.zone === "battlefield" && (object.zoneChangeCount ?? 0) === stint) {
      return undefined;
    }
    const lki = object !== undefined ? object.lastKnown : this.state.ceasedTokens?.[id];
    return lki?.zoneChangeCount === stint ? lki : undefined;
  }

  /**
   * The last-known information a *target* is read by (rule 608.2h): the
   * permanent it was when targeted (`expectedZone`, from `targetZones`) has
   * left the battlefield since, and its latest snapshot is of that
   * departure. A card targeted anywhere else is read as it is now.
   */
  private lastKnownOfTarget(
    id: ObjectId,
    expectedZone: ZoneType | null,
  ): LastKnownInfo | undefined {
    if (expectedZone !== "battlefield") return undefined;
    const object = this.state.objects[id];
    if (object === undefined) return this.state.ceasedTokens?.[id];
    return object.zone === "battlefield" ? undefined : object.lastKnown;
  }

  /**
   * The permanents a leaves-the-battlefield event should also be shown to
   * because they left *with* the one it announces (rule 603.10a): everything
   * already moved out of the current {@link leaveBatch}, which the
   * battlefield scan can no longer see. The permanents of that batch still to
   * be moved are on the battlefield and see it the ordinary way, so between
   * the two every one of them sees every other one leave — whichever order
   * the engine moves them in.
   *
   * Empty outside a batch, which is what keeps a lone death exactly as it
   * was: its subject is the only departed object that sees it.
   */
  private lookBackSources(event: GameEvent): ReadonlySet<ObjectId> {
    const batch = this.leaveBatch;
    if (batch === null || !isLeaveEvent(event) || !batch.left.includes(event.object)) {
      return EMPTY_ID_SET;
    }
    const out = new Set<ObjectId>();
    for (const id of batch.left) {
      if (id === event.object) continue;
      const object = this.state.objects[id];
      if (object === undefined || object.zone === "battlefield") continue;
      out.add(id);
    }
    return out;
  }

  /**
   * Carry out `fn` as one simultaneous event for rule 603.10a: every
   * permanent it moves off the battlefield sees every other one leave (see
   * {@link lookBackSources}). A wrath, a sweep of state-based actions, an
   * edict each player has answered, an overloaded bounce — each is one
   * event, however many moves the engine makes of it. Nested calls join the
   * outer batch.
   *
   * `seed` is the batch a deferred commander's move belongs to
   * (`leftWith`): `applyCommanderChoice` completes the move later, but it
   * happened at the same time as theirs. Once `fn` is done, every commander
   * whose move this batch deferred is handed the finished list to carry.
   */
  private withLeaveBatch(fn: () => void, seed?: readonly ObjectId[]): void {
    if (this.leaveBatch !== null) {
      fn();
      return;
    }
    const batch = {
      left: (seed ?? []).filter((id) => {
        const object = this.state.objects[id];
        return object !== undefined && object.zone !== "battlefield";
      }),
      deferred: [] as ObjectId[],
      snapshots: new Map<ObjectId, LastKnownInfo>(),
    };
    this.leaveBatch = batch;
    try {
      fn();
    } finally {
      this.leaveBatch = null;
    }
    if (batch.deferred.length === 0 || batch.left.length + batch.deferred.length < 2) return;
    // The other deferred commanders too: whichever of them is answered
    // later still left with the ones answered first (the seed drops any
    // still on the battlefield, which see it the ordinary way).
    const leftWith = [...batch.left, ...batch.deferred];
    const state = this.state;
    const deferred = state.deferredCommanderMove;
    if (deferred !== null && batch.deferred.includes(deferred.commander)) {
      state.deferredCommanderMove = { ...deferred, leftWith };
    }
    state.pendingCommanderMoves = state.pendingCommanderMoves.map((move) =>
      batch.deferred.includes(move.commander) ? { ...move, leftWith } : move,
    );
  }

  /**
   * Carry out `fn` as one simultaneous entry onto the battlefield: every
   * permanent it puts there enters at the same time as the others, so none
   * of them is "already" on the battlefield for another's entry (see
   * {@link enterBatch}). The engine moves them one at a time; without this a
   * second Angel returned beside Giada would get Giada's counters, and count
   * the first as an Angel you already control. Nested calls join the outer
   * batch.
   */
  private withEnterBatch<T>(fn: () => T): T {
    if (this.enterBatch !== null) return fn();
    this.enterBatch = new Set();
    try {
      return fn();
    } finally {
      this.enterBatch = null;
    }
  }

  /**
   * Which of a declaration's attackers count toward a batched attack trigger.
   *
   * Shared by the match and the count so the two can't disagree — a trigger
   * that fired on three Dragons must draw three cards, and computing the two
   * separately is how that kind of bug happens.
   */
  private batchedAttackers(
    spec: Extract<TriggerSpec, { on: "attacks-batch" }>,
    attackers: readonly ObjectId[],
    self: GameObject,
  ): readonly ObjectId[] {
    return attackers.filter(
      (attacker) =>
        this.state.objects[attacker] !== undefined &&
        this.triggerFilterOk(spec.filter, attacker, self),
    );
  }

  private triggerMatches(
    spec: TriggerSpec,
    event: GameEvent,
    self: GameObject,
  ): boolean {
    switch (spec.on) {
      case "predicate":
        return spec.match(event);
      case "enters-battlefield":
        return (
          event.type === "permanent-entered-battlefield" &&
          !(spec.otherOnly === true && event.object === self.id) &&
          this.matchesWho(spec.who, event.object, self) &&
          this.triggerFilterOk(spec.filter, event.object, self)
        );
      case "dies":
        // Rule 700.4: a permanent "dies" when it is put into a graveyard *from
        // the battlefield* — however it got there. Keying this off
        // `permanent-destroyed` missed every sacrifice (Ashnod's Altar,
        // Korvold, a Saga completing) and the legend rule, so an aristocrats
        // drain (Blood Artist, Zulaport Cutthroat) silently did nothing.
        // `permanent-left-battlefield` fires exactly once per exit and carries
        // the destination, so a commander redirected to the command zone by
        // 903.9a correctly does *not* die.
        //
        // The permanent that died is read as it last existed on the
        // battlefield (rule 603.10a) — "a creature you control" is whoever
        // controlled it then, not the owner it has since reverted to.
        return (
          event.type === "permanent-left-battlefield" &&
          event.toZone === "graveyard" &&
          !(spec.otherOnly === true && event.object === self.id) &&
          this.matchesWho(spec.who, event.object, self, true) &&
          this.triggerFilterOk(spec.filter, event.object, self, true)
        );
      case "gains-life":
        return (
          event.type === "life-changed" &&
          event.delta > 0 &&
          this.matchesWhoPlayer(spec.who, event.player, self)
        );
      case "loses-life":
        return (
          event.type === "life-changed" &&
          event.delta < 0 &&
          this.matchesWhoPlayer(spec.who, event.player, self) &&
          (spec.firstDuringTheirTurn !== true ||
            (event.player === this.activePlayer &&
              this.state.players[event.player].lifeLostThisTurn === -event.delta))
        );
      case "counters-put":
        return (
          event.type === "counter-added" &&
          event.amount > 0 &&
          (spec.counter === undefined || event.counter === spec.counter) &&
          this.matchesWho(spec.who, event.object, self) &&
          this.triggerFilterOk(spec.filter, event.object, self) &&
          (spec.byYou !== true || event.by === self.controller)
        );
      case "draws":
        return (
          event.type === "card-drawn" &&
          this.matchesWhoPlayer(spec.who, event.player, self) &&
          (spec.nthEachTurn === undefined || event.nthThisTurn === spec.nthEachTurn) &&
          (spec.exceptFirstInDrawStep !== true || event.firstInDrawStep !== true)
        );
      case "plays-land":
        return event.type === "land-played" && this.matchesWhoPlayer(spec.who, event.player, self);
      case "plays-card": {
        // Playing a card is playing a land or casting a spell (rule 601.2 /
        // 305.1) — both events, each carrying the zone it came from.
        if (event.type !== "land-played" && event.type !== "spell-cast") return false;
        if (!this.matchesWhoPlayer(spec.who, event.player, self)) return false;
        return spec.from === undefined || event.from === spec.from;
      }
      case "leaves-battlefield":
        return (
          event.type === "permanent-left-battlefield" &&
          this.matchesWho(spec.who, event.object, self, true)
        );
      case "becomes-target":
        return (
          event.type === "object-targeted" &&
          this.matchesWho(spec.who, event.object, self) &&
          this.triggerFilterOk(spec.filter, event.object, self) &&
          // "… an opponent controls" — relative to whoever controls the
          // permanent that's watching, not to the targeted object.
          (spec.byOpponentOnly !== true || event.by !== self.controller) &&
          // "… becomes the target of a spell" — not an ability.
          (spec.spellOnly !== true || event.bySpell)
        );
      case "attacks":
        return (
          event.type === "attacker-declared" &&
          this.matchesWho(spec.who, event.attacker, self) &&
          !(spec.otherOnly === true && event.attacker === self.id) &&
          this.triggerFilterOk(spec.filter, event.attacker, self) &&
          (spec.attackingYou !== true ||
            this.defendingPlayerOf(event.defender) === self.controller) &&
          (spec.defender === undefined ||
            (spec.defender === "player") === (this.state.players[event.defender as PlayerId] !== undefined)) &&
          (spec.aloneAgainstDefender !== true || this.attackingAlone(event.attacker, event.defender))
        );
      case "attacks-player":
        return (
          event.type === "player-attacked" &&
          this.matchesWhoPlayer(spec.who, event.player, self) &&
          this.matchesWhoPlayer(spec.defender, event.defender, self)
        );
      case "attacks-batch":
        return (
          event.type === "attackers-declared" &&
          this.matchesWhoPlayer(spec.who, event.player, self) &&
          this.batchedAttackers(spec, event.attackers, self).length > 0
        );
      case "attacks-alone":
        return (
          event.type === "attacked-alone" && this.matchesWho(spec.who, event.attacker, self)
        );
      case "sacrifice":
        // The permanent is read as it last existed on the battlefield: a
        // sacrificed token is still "a token", an animated land "a creature".
        return (
          event.type === "permanent-sacrificed" &&
          this.matchesWhoPlayer(spec.who, event.player, self) &&
          !(spec.otherOnly === true && event.object === self.id) &&
          this.triggerFilterOk(spec.filter, event.object, self, true)
        );
      case "transforms":
        return (
          event.type === "permanent-transformed" &&
          (spec.intoFront === undefined || spec.intoFront === event.front) &&
          this.matchesWho(spec.who, event.object, self) &&
          this.triggerFilterOk(spec.filter, event.object, self)
        );
      case "deals-combat-damage-to-player":
        return (
          event.type === "damage-dealt" &&
          event.combat &&
          event.target.kind === "player" &&
          this.matchesWho(spec.who, event.source, self) &&
          !(spec.otherOnly === true && event.source === self.id) &&
          this.triggerFilterOk(spec.filter, event.source, self)
        );
      case "dealt-damage":
        return (
          event.type === "damage-dealt" &&
          event.target.kind === "object" &&
          (spec.combat === undefined || event.combat === spec.combat) &&
          this.matchesWho(spec.who, event.target.object, self) &&
          this.triggerFilterOk(spec.filter, event.target.object, self)
        );
      case "deals-damage":
        return event.type === "damage-dealt" && this.dealsDamageMatches(spec, event, self);
      case "blocks":
        return (
          event.type === "blocker-declared" &&
          this.matchesWho(spec.who, event.blocker, self) &&
          !(spec.otherOnly === true && event.blocker === self.id) &&
          this.triggerFilterOk(spec.filter, event.blocker, self)
        );
      case "becomes-blocked":
        return (
          event.type === "attacker-blocked" &&
          this.matchesWho(spec.who, event.attacker, self) &&
          !(spec.otherOnly === true && event.attacker === self.id) &&
          this.triggerFilterOk(spec.filter, event.attacker, self)
        );
      case "leaves-graveyard":
        // One of those cards itself — a Teval reanimated along with others —
        // was in the graveyard, not on the battlefield, as they left (rule
        // 603.10a looks back to just before the move).
        return (
          event.type === "cards-left-graveyard" &&
          !event.objects.includes(self.id) &&
          this.graveyardLeavers(spec, event.objects, self).length > 0
        );
      case "discards":
        return (
          event.type === "cards-discarded" &&
          event.objects.length > 0 &&
          (spec.who === "any" ||
            (spec.who === "you" && event.player === self.controller) ||
            (spec.who === "opponent" && event.player !== self.controller))
        );
      case "attack-with": {
        if (event.type !== "attackers-declared") return false;
        if (spec.who === "you" && event.player !== self.controller) return false;
        if (spec.who === "opponent" && event.player === self.controller) return false;
        const counted = event.attackers.filter((id) => {
          if (!this.triggerFilterOk(spec.filter, id, self)) return false;
          if (spec.attackingYou !== true) return true;
          const at = this.state.objects[id]?.attacking;
          if (at === null || at === undefined) return false;
          return (
            at === self.controller ||
            this.state.objects[at as ObjectId]?.controller === self.controller
          );
        });
        return counted.length >= spec.atLeast;
      }
      case "becomes-tapped":
        return (
          event.type === "permanent-tapped" &&
          this.matchesWho(spec.who, event.object, self) &&
          this.triggerFilterOk(spec.filter, event.object, self)
        );
      case "step-begins":
        return (
          event.type === "step-began" &&
          event.step === spec.step &&
          (spec.who === "any" ||
            (spec.who === "you" && this.activePlayer === self.controller) ||
            // "Each opponent's end step" — the step belongs to an opponent,
            // so it fires once on each of their turns.
            (spec.who === "opponent" && this.activePlayer !== self.controller))
        );
      case "cast-spell": {
        if (event.type === "spell-copied" && spec.orCopy === true) {
          const copierMatches =
            spec.who === "any" ||
            (spec.who === "you" && event.controller === self.controller) ||
            (spec.who === "opponent" && event.controller !== self.controller);
          return (
            copierMatches &&
            spec.from === undefined &&
            spec.notFrom === undefined &&
            spec.firstEachTurn !== true &&
            spec.nthEachTurn === undefined &&
            spec.noncreatureOnly !== true &&
            this.triggerFilterOk(spec.filter, event.copy, self)
          );
        }
        if (event.type !== "spell-cast") return false;
        const casterMatches =
          spec.who === "any" ||
          (spec.who === "you" && event.player === self.controller) ||
          // Anyone but this permanent's controller — Kaervek the Merciless's
          // "whenever an opponent casts a spell". `TriggerWho` has always
          // offered `"opponent"` here, but the match never handled it, so a
          // card written that way type-checked and silently never fired.
          (spec.who === "opponent" && event.player !== self.controller);
        if (!casterMatches) return false;
        if (spec.otherOnly === true && event.object === self.id) return false;
        if (spec.from !== undefined && event.from !== spec.from) return false;
        if (spec.notFrom !== undefined && event.from === spec.notFrom) return false;
        if (!this.triggerFilterOk(spec.filter, event.object, self)) return false;
        const nth = spec.firstEachTurn === true ? 1 : spec.nthEachTurn;
        if (nth !== undefined) {
          // With a filter the count is of matching spells: "your first
          // enchantment spell each turn" can be your third spell. Earlier
          // spells are asked the same question as this one.
          const filter = spec.filter;
          const count =
            filter === undefined
              ? event.spellsThisTurn
              : (this.state.players[event.player]?.spellsCastThisTurnIds ?? []).filter((id) =>
                  matchesFilter(this.state, this.registry, id, filter, { you: self.controller }),
                ).length;
          if (count !== nth) return false;
        }
        if (spec.noncreatureOnly) {
          const castObject = this.state.objects[event.object];
          if (
            castObject !== undefined &&
            this.registry.get(printedCardName(castObject)).types.includes("creature")
          ) {
            return false;
          }
        }
        return true;
      }
      case "this-cast":
        return event.type === "spell-cast" && event.object === self.id;
      default:
        return false;
    }
  }

  /**
   * A triggered ability's *intervening-if* clause (rule 603.4): checked both
   * as the event happens (from `detectTriggers` — a false condition means it
   * never triggers at all) and again as the ability resolves (from
   * `resolveAbility`). No condition ⇒ always met. `source` is the permanent
   * the ability is on, or — once it's on the stack and its permanent is gone —
   * the stack ability object itself, whose `controller` is the same. Unlike a
   * *static* ability's condition, the source counts toward its own board scan.
   * needed-cards P7.
   */
  /** `sourceTimestamp` is the one the ability recorded when it triggered,
   * given on resolution so "if ~ is still on the battlefield" can tell the
   * same permanent from one that left and came back (`source-zone`). */
  private interveningIfMet(
    condition: StaticCondition | undefined,
    source: GameObject,
    sourceTimestamp?: number,
    /** The source as it last existed on the battlefield, when the ability
     * is about a permanent that has left (its own dies trigger). */
    sourceLastKnown?: LastKnownInfo,
  ): boolean {
    if (condition === undefined) return true;
    return staticConditionMet(this.state, this.registry, source, condition, {
      includeSelf: true,
      ...(sourceTimestamp !== undefined ? { sourceTimestamp } : {}),
      ...(sourceLastKnown !== undefined ? { sourceLastKnown } : {}),
    });
  }

  /** A trigger's optional `CardFilter` on the object that fired it. Evaluated
   * from the source's controller's perspective. `lastKnown` reads a subject
   * that has just left the battlefield as it last existed there (see
   * `FilterContext.lastKnown`). */
  private triggerFilterOk(
    filter: CardFilter | undefined,
    subject: ObjectId,
    self: GameObject,
    lastKnown = false,
  ): boolean {
    return (
      filter === undefined ||
      matchesFilter(this.state, this.registry, subject, filter, {
        you: self.controller,
        ...(lastKnown ? { lastKnown } : {}),
        // "Whenever a creature with greater power enters": the subject is
        // the would-be trigger object, the source is this permanent.
        amount: this.filterAmounts({
          source: self.id,
          controller: self.controller,
          triggerObject: subject,
        }),
      })
    );
  }

  /**
   * A `deals-damage` trigger against one `damage-dealt` event: the kind and
   * amount, then the source ("another source you control"), then the
   * recipient. The amount is what was actually dealt — `dealDamage` only
   * emits the event for damage that got through.
   */
  private dealsDamageMatches(
    spec: Extract<TriggerSpec, { on: "deals-damage" }>,
    event: Extract<GameEvent, { type: "damage-dealt" }>,
    self: GameObject,
  ): boolean {
    if (spec.combat !== undefined && event.combat !== spec.combat) return false;
    if (spec.exactly !== undefined && event.amount !== spec.exactly) return false;
    if (spec.otherOnly === true && event.source === self.id) return false;
    // The source: a spell on the stack or a permanent is read as it is; one
    // that has left the battlefield since (a dies trigger's damage) as it
    // last existed there, so "a source you control" is who controlled it.
    // A token that has ceased to exist since (rule 111.7 — sacrificed to pay
    // for the ability dealing the damage) is read from its snapshot.
    const source = this.state.objects[event.source];
    const ceased = source === undefined ? this.state.ceasedTokens?.[event.source] : undefined;
    if (source === undefined && ceased === undefined) return false;
    const departed = source === undefined || (source.zone !== "battlefield" && source.zone !== "stack");
    const sourceController =
      source === undefined
        ? (ceased as LastKnownInfo).controller
        : departed
          ? (source.lastKnown?.controller ?? source.controller)
          : source.controller;
    switch (spec.who) {
      case "any":
        break;
      case "self":
        if (event.source !== self.id) return false;
        break;
      case "opponent":
        if (sourceController === self.controller) return false;
        break;
      default:
        if (sourceController !== self.controller) return false;
    }
    if (!this.triggerFilterOk(spec.filter, event.source, self, departed)) return false;
    // The recipient.
    const target = event.target;
    if (target.kind === "player") {
      if (spec.to === "permanent" || spec.to === "creature" || spec.to === "planeswalker") return false;
      if (spec.toFilter !== undefined) return false;
      if (spec.to === "opponent" && target.player === self.controller) return false;
    } else {
      if (spec.to === "player" || spec.to === "opponent") return false;
      if (spec.to === "creature" || spec.to === "planeswalker") {
        if (this.state.objects[target.object] === undefined) return false;
        const types = computeCharacteristics(this.state, this.registry, target.object).types;
        if (!types.includes(spec.to)) return false;
      }
      if (!this.triggerFilterOk(spec.toFilter, target.object, self)) return false;
    }
    if (spec.toItsTarget === true) {
      if (source === undefined || source.zone !== "stack" || source.kind !== "card") return false;
      const aimed = (source.targets ?? []).some(
        (t) =>
          t !== undefined &&
          (t.kind === "player"
            ? target.kind === "player" && t.player === target.player
            : target.kind === "object" && t.object === target.object),
      );
      if (!aimed) return false;
    }
    return true;
  }

  /** Like `matchesWho`, but the subject is a *player* (a life-change trigger).
   * `"any"` matches anyone; `"you"` / `"you-control"` / `"self"` all mean the
   * source's controller. */
  private matchesWhoPlayer(
    who: TriggerWho,
    player: PlayerId,
    self: GameObject,
  ): boolean {
    if (who === "any") return true;
    if (who === "opponent") return self.controller !== player;
    return self.controller === player;
  }

  /** `lastKnown`: the subject has just left the battlefield, and "you
   * control" asks who controlled it as it left (rule 603.10a), which the
   * move has already reset to its owner. */
  private matchesWho(
    who: TriggerWho,
    subject: ObjectId,
    self: GameObject,
    lastKnown = false,
  ): boolean {
    switch (who) {
      case "any":
        return true;
      case "self":
        return subject === self.id;
      case "you":
        return this.activePlayer === self.controller;
      case "you-control": {
        const object = this.state.objects[subject];
        if (object === undefined) return false;
        const controller =
          lastKnown && object.zone !== "battlefield"
            ? (object.lastKnown?.controller ?? object.controller)
            : object.controller;
        return controller === self.controller;
      }
      default:
        return false;
    }
  }

  /** Put every waiting trigger on the stack (APNAP). Returns whether any were. */
  private placePendingTriggers(): boolean {
    if (this.state.pendingTriggers.length === 0) return false;
    const pending = this.state.pendingTriggers;
    this.state.pendingTriggers = [];

    // APNAP (rule 603.3b): active player's triggers first, then each other
    // player's in turn order — not just "everyone else" in arrival order,
    // which only happened to be correct with exactly one other player.
    const activeIndex = this.state.turnOrder.indexOf(this.activePlayer);
    const rotated = [
      ...this.state.turnOrder.slice(activeIndex),
      ...this.state.turnOrder.slice(0, activeIndex),
    ];
    const ordered = rotated.flatMap((player) =>
      pending.filter((t) => t.controller === player),
    );
    for (let i = 0; i < ordered.length; i += 1) {
      if (this.placeTriggerOnStack(ordered[i]) === "paused") {
        // A trigger raised a `choose-targets` decision — put the not-yet-placed
        // triggers back (in front of any newly-detected ones); `applyChooseTargets`
        // resumes the fixpoint.
        this.state.pendingTriggers = [...ordered.slice(i + 1), ...this.state.pendingTriggers];
        return true;
      }
    }
    return true;
  }

  /**
   * Put one fired trigger on the stack (rule 603.3). Returns `"paused"` when the
   * controller has a real target choice to make — a `choose-targets` decision is
   * raised and the trigger parked in `pendingTargetedTrigger`; `"done"` when it
   * was minted (or removed for no legal targets).
   */
  private placeTriggerOnStack(trigger: {
    readonly sourceObjectId: ObjectId;
    readonly cardName: string;
    readonly abilityIndex: number;
    readonly controller: PlayerId;
    readonly autoTargets?: readonly TargetRef[];
    readonly triggerValue?: number;
    readonly triggerObject?: ObjectId;
    readonly multiplier?: number;
    readonly chapter?: boolean;
    readonly grantedAbility?: GrantedAbilityRef;
    readonly x?: number;
    readonly delayed?: DelayedTrigger;
    readonly lastKnownRefs?: LastKnownRefs;
    readonly targetedBy?: TargetedBy;
    readonly reflexive?: ReflexiveTrigger;
  }): "done" | "paused" {
    // A self-contained ability record (a mana-spend rider) has no card
    // ability to look up — mint it carrying its own record, exactly as
    // `fireDelayedTriggers` does for a delayed ability.
    if (trigger.delayed !== undefined) {
      const id = this.mintAbilityObject(
        trigger.delayed.source,
        trigger.delayed.sourceName,
        trigger.controller,
        "triggered",
        0,
        trigger.delayed.targets,
      );
      this.state.objects[id].delayedTrigger = trigger.delayed;
      this.emit({
        type: "ability-triggered",
        source: trigger.delayed.source,
        controller: trigger.controller,
      });
      return "done";
    }
    const reflexive = trigger.reflexive;
    const granted =
      trigger.grantedAbility !== undefined
        ? (this.abilityFromRef(trigger.grantedAbility) as TriggeredAbility | undefined)
        : undefined;
    // An ability that has triggered goes on the stack whatever has become of
    // its source since (rule 113.7a): one that then lost its abilities and
    // left (its snapshot lists none), or turned into a face without this
    // one, is still the card's own ability at this index — the same
    // fallback `stackAbilityOf` resolves it by. A reflexive ability is no
    // card's, and brings its own.
    const ability: { readonly targets: readonly TargetSpec[] } =
      reflexive ??
      granted ??
      (() => {
        const def = this.registry.get(trigger.cardName);
        return trigger.chapter
          ? (def.chapters ?? [])[trigger.abilityIndex]
          : (this.triggeredOfSource(trigger.sourceObjectId, trigger.lastKnownRefs?.source)?.[
              trigger.abilityIndex
            ] ?? def.triggered[trigger.abilityIndex]);
      })();

    const triggerSource = this.abilityTargetSource(trigger);
    const abilityKind: "triggered" | "chapter" = trigger.chapter ? "chapter" : "triggered";

    // Resolve each slot: an event-determined `auto` target (a saboteur's
    // victim), or a `spec` the controller must pick from.
    const auto = trigger.autoTargets ?? [];
    const slots: ({ auto: TargetRef } | { spec: TargetSpec; options: readonly TargetRef[] })[] = [];
    for (let i = 0; i < ability.targets.length; i += 1) {
      const spec = ability.targets[i];
      if (auto[i] !== undefined) {
        if (
          !isLegalTarget(this.state, this.registry, spec, auto[i], trigger.controller, triggerSource, {
            notTargeted: true,
          })
        ) {
          this.emit({ type: "trigger-removed", source: trigger.sourceObjectId, reason: "no legal targets" });
          return "done";
        }
        slots.push({ auto: auto[i] });
        continue;
      }
      const options = legalTargets(this.state, this.registry, spec, trigger.controller, triggerSource);
      if (options.length === 0) {
        this.emit({ type: "trigger-removed", source: trigger.sourceObjectId, reason: "no legal targets" });
        return "done";
      }
      slots.push({ spec, options });
    }

    const chooserSlots = slots.filter(
      (s): s is { spec: TargetSpec; options: readonly TargetRef[] } => "spec" in s,
    );
    // A single forced choice (one slot, one legal option) is no decision —
    // unless the slot is "up to one", where leaving it empty is the other
    // choice (Displacer Kitten needn't blink itself; Sun Titan needn't
    // return the only card it could).
    const forced =
      chooserSlots.length > 0 &&
      chooserSlots.every((s) => s.options.length === 1 && !isOptionalSpec(s.spec));
    if (chooserSlots.length === 0 || forced) {
      const targets = slots.map((s) => ("auto" in s ? s.auto : s.options[0]));
      this.mintTriggerAbility(
        trigger.sourceObjectId,
        trigger.cardName,
        trigger.controller,
        abilityKind,
        trigger.abilityIndex,
        targets,
        trigger.triggerValue,
        trigger.triggerObject,
        trigger.multiplier,
        trigger.grantedAbility,
        autoSlotsOf(slots),
        trigger.x,
        trigger.lastKnownRefs,
        trigger.targetedBy,
        reflexive,
      );
      return "done";
    }

    this.state.pendingTargetedTrigger = {
      sourceObjectId: trigger.sourceObjectId,
      cardName: trigger.cardName,
      abilityKind,
      abilityIndex: trigger.abilityIndex,
      controller: trigger.controller,
      slots: slots.map((s) => ("auto" in s ? { auto: s.auto } : { spec: s.spec })),
      ...(trigger.triggerValue !== undefined
        ? { triggerValue: trigger.triggerValue }
        : {}),
      ...(trigger.triggerObject !== undefined
        ? { triggerObject: trigger.triggerObject }
        : {}),
      ...(trigger.grantedAbility !== undefined
        ? { grantedAbility: trigger.grantedAbility }
        : {}),
      ...(trigger.x !== undefined ? { x: trigger.x } : {}),
      ...(trigger.lastKnownRefs !== undefined ? { lastKnownRefs: trigger.lastKnownRefs } : {}),
      ...(trigger.targetedBy !== undefined ? { targetedBy: trigger.targetedBy } : {}),
      ...(reflexive !== undefined ? { reflexive } : {}),
    };
    this.state.awaiting = {
      kind: "choose-targets",
      player: trigger.controller,
      source: trigger.sourceObjectId,
      cardName: trigger.cardName,
      specs: chooserSlots.map((s) => s.spec),
      options: chooserSlots.map((s) => [...s.options]),
    };
    return "paused";
  }

  /**
   * The {@link TargetSource} an ability targets with: its source permanent's
   * identity (none once it has left — rule 608.2b), plus what a target
   * filter's `{ amount }` operand reads, which for a trigger includes the
   * triggering object and value. Clement, the Worrywort's "with lesser mana
   * value" needs the latter even when Clement itself is gone. Shared by
   * placing a trigger, validating its `choose-targets` answer and the recheck
   * of any ability's targets on resolution, so all three read the operand the
   * same way.
   */
  private abilityTargetSource(trigger: {
    readonly sourceObjectId: ObjectId;
    readonly controller: PlayerId;
    readonly triggerValue?: number;
    readonly triggerObject?: ObjectId;
    readonly targets?: ResolvedTargets;
    readonly x?: number;
    readonly targetZones?: readonly (ZoneType | null)[];
    readonly lastKnownRefs?: LastKnownRefs;
  }): TargetSource {
    const base: TargetSource =
      this.state.objects[trigger.sourceObjectId] !== undefined
        ? permanentSource(this.state, this.registry, trigger.sourceObjectId)
        : { colors: [], types: [] };
    const triggerPlayer = trigger.lastKnownRefs?.player;
    return {
      ...base,
      ...(trigger.triggerObject !== undefined ? { triggerObject: trigger.triggerObject } : {}),
      ...(triggerPlayer !== undefined ? { triggerPlayer } : {}),
      amount: this.filterAmounts({
        source: trigger.sourceObjectId,
        controller: trigger.controller,
        ...(trigger.targets !== undefined ? { targets: trigger.targets } : {}),
        ...(trigger.x !== undefined ? { x: trigger.x } : {}),
        ...(trigger.triggerValue !== undefined ? { triggerValue: trigger.triggerValue } : {}),
        ...(trigger.triggerObject !== undefined ? { triggerObject: trigger.triggerObject } : {}),
        ...(trigger.targetZones !== undefined ? { targetZones: trigger.targetZones } : {}),
        ...(trigger.lastKnownRefs !== undefined ? { lastKnownRefs: trigger.lastKnownRefs } : {}),
      }),
    };
  }

  private mintTriggerAbility(
    sourceId: ObjectId,
    cardName: string,
    controller: PlayerId,
    abilityKind: "triggered" | "chapter",
    abilityIndex: number,
    targets: ResolvedTargets,
    triggerValue?: number,
    triggerObject?: ObjectId,
    multiplier?: number,
    grantedAbility?: GrantedAbilityRef,
    autoTargetSlots: readonly number[] = [],
    /** The X its source was cast with (rule 107.3m) — see `PendingTrigger.x`. */
    x?: number,
    lastKnownRefs?: LastKnownRefs,
    targetedBy?: TargetedBy,
    /** The record of a reflexive ability — see `ReflexiveTrigger`. */
    reflexive?: ReflexiveTrigger,
  ): void {
    const abilityId = this.mintAbilityObject(
      sourceId,
      cardName,
      controller,
      abilityKind,
      abilityIndex,
      // A chosen target in a token stack is one token of it from here on.
      this.lockInTargets(targets, autoTargetSlots),
      triggerValue,
      triggerObject,
      multiplier,
    );
    if (grantedAbility !== undefined) this.state.objects[abilityId].grantedAbility = grantedAbility;
    if (x !== undefined) this.state.objects[abilityId].xValue = x;
    if (lastKnownRefs !== undefined) this.state.objects[abilityId].lastKnownRefs = lastKnownRefs;
    if (autoTargetSlots.length > 0) {
      this.state.objects[abilityId].autoTargetSlots = [...autoTargetSlots];
    }
    if (targetedBy !== undefined) this.state.objects[abilityId].targetedBy = targetedBy;
    if (reflexive !== undefined) this.state.objects[abilityId].reflexiveTrigger = reflexive;
    this.emit({ type: "ability-triggered", source: sourceId, controller });
    // Its targets are locked in as it goes on the stack (rule 603.3d), which
    // is when anything it targets "becomes the target of" an ability.
    this.announceTargeted(
      this.state.objects[abilityId].targets ?? [],
      controller,
      sourceId,
      false,
      abilityId,
      autoTargetSlots,
    );
  }

  /** `autoSlots` are slots the triggering event filled rather than a player
   * choosing (see `GameObject.autoTargetSlots`): still checked for shape, but
   * not as targets. */
  private anyTargetLegal(
    specs: readonly TargetSpec[],
    targets: ResolvedTargets,
    forPlayer: PlayerId,
    source?: TargetSource,
    autoSlots: readonly number[] = [],
  ): boolean {
    return specs.some(
      (spec, i) =>
        targets[i] !== undefined &&
        isLegalTarget(this.state, this.registry, spec, targets[i], forPlayer, source, {
          notTargeted: autoSlots.includes(i),
        }),
    );
  }

  private isPermanentSpell(def: CardDefinition): boolean {
    return def.types.some(
      (type) =>
        type === "creature" ||
        type === "artifact" ||
        type === "enchantment" ||
        type === "planeswalker" ||
        type === "battle",
    );
  }

  private makeResolutionContext(
    source: ObjectId,
    controller: PlayerId,
    targets: ResolvedTargets,
    x = 0,
    triggerValue = 0,
    triggerObject?: ObjectId,
    stackMultiplier = 1,
    resolutionCount = 0,
    /** Where each object target was when it was targeted, for last-known
     * information (rule 608.2h) — see {@link lastKnownOfTarget}. */
    targetZones: readonly (ZoneType | null)[] = [],
    /** Which battlefield stint of its source, triggering object and
     * sacrificed permanent the spell or ability refers to — see
     * {@link LastKnownRefs}. */
    lastKnownRefs: LastKnownRefs = {},
    /** See `ResolutionContext.sourceLost` and `ResolutionContext.abilityKey`. */
    opts: { readonly sourceLost?: boolean; readonly abilityKey?: string } = {},
  ): ResolutionContext {
    const refs = lastKnownRefs;
    const expectedZoneOf = (target: TargetRef): ZoneType | null => {
      if (target.kind !== "object") return null;
      const i = targets.findIndex((t) => t?.kind === "object" && t.object === target.object);
      return i < 0 ? null : (targetZones[i] ?? null);
    };
    // Last-known information (rule 608.2h): a permanent this spell or
    // ability refers to that has left the battlefield since is read as it
    // last existed there. The source, the triggering object and the
    // sacrificed permanent say which stint they mean (`refs`); a target was
    // a permanent if it was on the battlefield when targeted.
    const stintOf = (id: ObjectId): number | undefined =>
      id === source && refs.source !== undefined
        ? refs.source
        : id === triggerObject && refs.triggerObject !== undefined
          ? refs.triggerObject
          : refs.sacrificed?.object === id
            ? refs.sacrificed.zoneChangeCount
            : undefined;
    const lastKnownOf = (target: TargetRef): LastKnownInfo | undefined => {
      if (target.kind !== "object") return undefined;
      const stint = stintOf(target.object);
      return stint !== undefined
        ? this.lastKnownOfStint(target.object, stint)
        : this.lastKnownOfTarget(target.object, expectedZoneOf(target));
    };
    const departedSource = (): LastKnownInfo | undefined =>
      refs.source === undefined ? undefined : this.lastKnownOfStint(source, refs.source);
    const triggerLastKnown = (): LastKnownInfo | undefined =>
      triggerObject === undefined
        ? undefined
        : lastKnownOf({ kind: "object", object: triggerObject });
    const scoped = (who: PlayerScope): PlayerId[] =>
      this.scopedPlayers(controller, who, triggerObject, triggerLastKnown(), refs.player);
    // Who deals an effect's damage: its own source, or — "it deals damage"
    // — the object that fired the trigger, each as it last existed on the
    // battlefield if it has left.
    const damageSource = (
      from: "trigger-object" | undefined,
    ): { readonly id: ObjectId; readonly lastKnown: LastKnownInfo | undefined } =>
      from === "trigger-object" && triggerObject !== undefined
        ? { id: triggerObject, lastKnown: triggerLastKnown() }
        : { id: source, lastKnown: departedSource() };
    const matchesKnown = (id: ObjectId, filter: CardFilter): boolean => {
      const snapshot = lastKnownOf({ kind: "object", object: id });
      return matchesFilter(this.state, this.registry, id, filter, {
        you: controller,
        ...(snapshot !== undefined ? { snapshot } : {}),
      });
    };
    const conditionMet = (condition: StaticCondition): boolean => {
      // "If that land is a Mountain" — a question about the object that
      // fired this trigger, which only the resolution context knows, so it
      // is answered here rather than in `staticConditionMet` (a static
      // ability has no triggering object at all). The same goes for the
      // chosen targets and for which resolution of the ability this is.
      if (condition.kind === "target") {
        const ref = targets[condition.index];
        if (ref === undefined || ref.kind !== "object") return false;
        return matchesKnown(ref.object, condition.filter);
      }
      if (condition.kind === "trigger-object") {
        if (triggerObject === undefined) return false;
        return matchesKnown(triggerObject, condition.filter);
      }
      if (condition.kind === "sacrificed") {
        const sacrificed = refs.sacrificed;
        return sacrificed !== undefined && matchesKnown(sacrificed.object, condition.filter);
      }
      if (condition.kind === "resolved-this-turn") return resolutionCount === condition.n;
      // Recursing keeps the context-only kinds above answerable under a
      // `not`, which `staticConditionMet` alone would read as always false.
      if (condition.kind === "not") return !conditionMet(condition.of);
      // Resolution happens outside the layer fold, so the source can count
      // itself ("if creatures you control have total power 10 or greater"
      // includes the creature asking) without recursing.
      const sourceLastKnown = departedSource();
      // A token that has ceased to exist since it left (rule 111.7) is still
      // asked about as it last existed there, like a card in a graveyard.
      const src =
        this.state.objects[source] ??
        (sourceLastKnown === undefined
          ? undefined
          : ceasedSourceStandIn(source, controller, sourceLastKnown));
      return (
        src !== undefined &&
        staticConditionMet(this.state, this.registry, src, condition, {
          includeSelf: true,
          targets,
          ...(sourceLastKnown !== undefined ? { sourceLastKnown } : {}),
        })
      );
    };
    return {
      controller,
      source,
      targets,
      x,
      triggerValue,
      triggerObject,
      stackMultiplier,
      resolutionCount,
      ...(opts.sourceLost === true ? { sourceLost: true } : {}),
      ...(opts.abilityKey !== undefined ? { abilityKey: opts.abilityKey } : {}),
      ...(refs.sacrificed !== undefined ? { sacrificed: refs.sacrificed.object } : {}),
      decisionPending: () => this.decisionOutstanding(),
      resumeAfterDecisions: (rest) => {
        const timestamp = this.resolvingSourceTimestamp;
        this.state.suspendedResolutions.push({
          effect: rest,
          source,
          controller,
          targets: [...targets],
          targetZones: [...targetZones],
          x,
          triggerValue,
          ...(triggerObject !== undefined ? { triggerObject } : {}),
          stackMultiplier,
          resolutionCount,
          lastKnownRefs: refs,
          ...(opts.sourceLost === true ? { sourceLost: true } : {}),
          ...(opts.abilityKey !== undefined ? { abilityKey: opts.abilityKey } : {}),
          ...(timestamp !== null ? { sourceTimestamp: timestamp } : {}),
          decisionSource: this.state.decisionSource,
        });
      },
      // A source that has left the battlefield deals its damage as it last
      // existed there: its colours, lifelink, deathtouch and controller.
      dealDamage: (target, amount, from) => {
        const by = damageSource(from);
        this.dealDamage(by.id, this.splitTargetRef(target), amount, false, by.lastKnown);
      },
      dealDamageScoped: (who, amountFor, from) => {
        const by = damageSource(from);
        this.withDamageBatch(() => {
          for (const p of scoped(who)) {
            this.dealDamage(by.id, { kind: "player", player: p }, amountFor(p), false, by.lastKnown);
          }
        });
      },
      triggerRecipient: () => {
        const recipient = refs.recipient;
        if (recipient === undefined) return undefined;
        const target = recipient.target;
        if (target.kind === "player") {
          return this.state.players[target.player]?.hasLost === false ? target : undefined;
        }
        // "That permanent" is the one that was dealt the damage: once it has
        // left the battlefield it's a new object (rule 400.7).
        const object = this.state.objects[target.object];
        return object?.zone === "battlefield" &&
          (object.zoneChangeCount ?? 0) === (recipient.zoneChangeCount ?? 0)
          ? target
          : undefined;
      },
      draw: (player, count) => {
        for (let i = 0; i < count; i += 1) {
          // Once a draw finds the library empty, every later one in the same
          // effect is the same failed draw again (rule 704.5b only needs one).
          // Stopping keeps "draw a card for each creature" over a big token
          // stack from emitting millions of identical events.
          const from = this.drawRedirectFor(player) ?? player;
          const empty = this.state.zones.perPlayer[from].library.length === 0;
          this.drawCard(player);
          if (empty) break;
        }
      },
      playersInScope: (who) => scoped(who),
      discardHand: (player) => this.discardWholeHand(player),
      // The object whose entering, dying, attacking… fired a trigger is read
      // as it last existed on the battlefield once it has left (rule 608.2h):
      // Clement, the Worrywort's "lesser mana value" after the entering
      // creature was killed in response. A spell that fired a cast trigger
      // was never a permanent, and is read on the stack.
      manaValueOf: (target) =>
        this.manaValueOfTarget(target, expectedZoneOf(target), lastKnownOf(target)),
      manaSpentOf: (target) => {
        if (target.kind !== "object") return 0;
        const lki = lastKnownOf(target);
        return lki !== undefined
          ? (lki.manaSpent ?? 0)
          : (this.state.objects[target.object]?.manaSpent ?? 0);
      },
      lifeTotalOf: (player) => this.state.players[player]?.life ?? 0,
      turnStatOf: (player, stat) => turnStatOf(this.state, player, stat),
      countInGraveyard: (filter) => {
        let n = 0;
        for (const player of this.state.turnOrder) {
          for (const id of this.state.zones.perPlayer[player].graveyard) {
            if (matchesFilter(this.state, this.registry, id, filter, { you: controller })) n += 1;
          }
        }
        return n;
      },
      gainLife: (player, amount) => this.changeLife(player, amount),
      loseLife: (player, amount) => this.changeLife(player, -amount),
      addMana: (player, mana, amount, spec) =>
        this.addMana(
          player,
          typeof mana === "object" && "producedBy" in mana
            ? { oneOf: this.manaOneOf(mana, player) }
            : mana,
          amount,
          // The source is the permanent whose ability this is, which is what
          // `manaTagFor` reads the chosen creature type and the commander's
          // types off.
          spec === undefined ? undefined : this.manaTagFor(this.state.objects[source], spec),
        ),
      tapPermanent: (target) => this.setTapped(target, true),
      untapPermanent: (target) => this.setTapped(target, false),
      destroyPermanent: (target) => this.destroyByEffect(target),
      destroyAll: (filter, onlyDamaged) =>
        this.destroyAllByEffect(
          controller,
          filter,
          onlyDamaged === true ? source : undefined,
          x,
        ),
      returnToHandAll: (filter) => this.returnToHandAllByEffect(controller, filter),
      exileAll: (filter) => this.exileAllByEffect(controller, filter),
      damageAll: (filter, amount, exceptSource) =>
        this.damageAllByEffect(
          source,
          controller,
          filter,
          amount,
          exceptSource === true,
          departedSource(),
        ),
      creaturesDamageControllers: (filter, amount) =>
        this.creaturesDamageControllersByEffect(controller, filter, amount),
      sacrificePermanents: (who, filter, count, exceptId) => {
        // A scope that names players by the triggering event ("that player
        // sacrifices a creature") is resolved here, where the event is known.
        if (typeof who === "object" || who === "you" || who === "each-player" || who === "each-opponent") {
          this.sacrificeByEffect(controller, who, filter, count, exceptId);
          return;
        }
        for (const player of scoped(who)) {
          this.sacrificeByEffect(controller, { player }, filter, count, exceptId);
        }
      },
      sacrificeSource: () => this.sacrificeSourceByEffect(source),
      withSacrificed: (object) => {
        // It was just sacrificed, so its latest snapshot is that departure.
        const lki = this.state.objects[object]?.lastKnown ?? this.state.ceasedTokens?.[object];
        return this.makeResolutionContext(
          source,
          controller,
          targets,
          x,
          triggerValue,
          triggerObject,
          stackMultiplier,
          resolutionCount,
          targetZones,
          lki === undefined
            ? refs
            : { ...refs, sacrificed: { object, zoneChangeCount: lki.zoneChangeCount } },
          opts,
        );
      },
      cardTypesOf: (target) => {
        if (target.kind !== "object") return [];
        const lki = lastKnownOf(target);
        if (lki !== undefined) return lki.types;
        return this.state.objects[target.object] === undefined
          ? []
          : computeCharacteristics(this.state, this.registry, target.object).types;
      },
      sacrificeTarget: (target) => {
        if (target.kind !== "object") return;
        const id = this.splitOneFromStack(target.object);
        const object = this.state.objects[id];
        if (object === undefined || object.zone !== "battlefield") return;
        // Its controller sacrifices it (rule 701.21a), not its owner.
        const sacrificer = object.controller;
        this.moveObject(id, "graveyard");
        // Sacrificed even if a commander's 903.9a choice deferred the move,
        // and even if it ends up in the command zone (rule 701.21a), just as
        // the cost paths announce it. "Dies" is read off the move itself
        // (`permanent-left-battlefield`), so a commander never falsely dies.
        this.emit({ type: "permanent-sacrificed", object: id, player: sacrificer });
      },
      returnToHand: (target, from) =>
        this.returnToHandByEffect(target, true, from ?? "battlefield", source),
      exileObject: (target, untilSourceLeaves) =>
        this.exileByEffect(target, untilSourceLeaves === true ? source : undefined),
      chooseCreatureType: (then) =>
        this.beginCreatureTypeChoice(source, controller, undefined, { then, targets, x }),
      reflexiveTrigger: (specs, effect, text) => {
        // Rule 603.12: it triggers now and waits, like any trigger, to be put
        // on the stack the next time a player would receive priority.
        const object = this.state.objects[source];
        const cardName =
          object !== undefined
            ? printedCardName(object)
            : (this.state.ceasedTokens?.[source]?.name ?? this.state.decisionSource?.cardName);
        if (cardName === undefined) return;
        this.state.pendingTriggers.push({
          sourceObjectId: source,
          cardName,
          abilityIndex: 0,
          controller,
          ...(x !== 0 ? { x } : {}),
          ...(triggerValue !== 0 ? { triggerValue } : {}),
          ...(triggerObject !== undefined ? { triggerObject } : {}),
          ...(Object.keys(refs).length > 0 ? { lastKnownRefs: refs } : {}),
          reflexive: { targets: [...specs], effect, text },
        });
      },
      returnExiledBySource: () => {
        // A token exiled this way ceased to exist (rule 111.7) and never
        // comes back; anything that moved on from exile in the meantime is
        // no longer linked, because `moveObject` cleared the mark. They all
        // return at once.
        this.withEnterBatch(() => {
          for (const id of [...this.state.zones.shared.exile]) {
            const object = this.state.objects[id];
            if (object?.exiledBy !== source || object.isToken) continue;
            object.exiledBy = undefined;
            this.moveObject(id, "battlefield");
            this.emit({ type: "permanent-entered-battlefield", object: id });
          }
        });
      },
      putOntoBattlefield: (target, underYourControl, enterTapped, withCounters, exileIfLeaves) =>
        this.putOntoBattlefieldByEffect(
          target,
          controller,
          underYourControl,
          enterTapped,
          withCounters,
          exileIfLeaves === true,
        ),
      exileGraveyard: (target) => {
        if (target.kind !== "player") return;
        // Snapshot: `moveObject` mutates the graveyard array as it goes. The
        // whole graveyard goes at once.
        this.withGraveyardLeaveBatch(() => {
          for (const id of [...this.state.zones.perPlayer[target.player].graveyard]) {
            this.moveObject(id, "exile");
          }
        });
      },
      simultaneously: (fn) => this.withLeaveBatch(() => this.withGraveyardLeaveBatch(fn)),
      flicker: (flickered, options) => this.flickerByEffect(source, controller, flickered, options),
      returnFlickered: (link, thenCounters, underYourControl) =>
        this.returnFlickeredByEffect(link, thenCounters, underYourControl ? controller : undefined),
      grantFlashback: (target) => this.grantFlashbackByEffect(target),
      grantGraveyardCast: (target) => this.grantGraveyardCastByEffect(controller, target),
      putOnLibrary: (target, position) => {
        if (target.kind === "object") this.putOnLibrary(target.object, position);
      },
      delayTrigger: (at, effect, text, delayedController) =>
        this.createDelayedTrigger(source, delayedController, at, effect, text, targets, targetZones),
      fight: (a, b, oneSided) => this.fightCreatures(a, b, oneSided),
      counterSpell: (target, into) => this.counterSpellByEffect(target, into),
      gainControl: (target, untilEndOfTurn) =>
        this.gainControlByEffect(controller, target, untilEndOfTurn),
      mill: (target, amount) => this.millByEffect(target, amount),
      countMatching: (filter, except) => this.countBattlefieldMatching(controller, filter, except),
      aggregate: (spec, except) => this.aggregateBattlefield(controller, spec, except),
      returnFromGraveyard: (filter, destination, count, enterTapped) =>
        this.returnFromGraveyardByEffect(controller, filter, destination, count, enterTapped),
      discardCards: (target, amount) => this.discardByEffect(target, amount),
      modifyPt: (target, power, toughness, duration) =>
        this.modifyPt(target, power, toughness, duration),
      modifyPtAll: (filter, power, toughness, duration, exceptSource, scopeTo) =>
        this.modifyPtAll(
          scopeTo ?? controller,
          filter,
          power,
          toughness,
          duration,
          exceptSource === true ? source : undefined,
        ),
      grantKeywordAll: (filter, keyword, duration, exceptSource) =>
        this.grantKeywordAll(
          controller,
          filter,
          keyword,
          duration,
          exceptSource === true ? source : undefined,
        ),
      doublePtAll: (filter, duration) => this.doublePtAll(controller, filter, duration),
      doubleCountersAll: (filter, counterKind) =>
        this.doubleCountersAll(controller, filter, counterKind),
      addCounter: (target, counter, amount) =>
        this.addCounter(target, counter, amount, true, controller),
      amass: (amount, creatureType) => this.amass(controller, amount, creatureType),
      populate: () => this.populate(controller),
      encore: () => this.encore(controller, source),
      chosenColorOfSource: () => {
        const chosen = this.state.objects[source]?.chosenOnEnter;
        return MANA_TYPES.includes(chosen as ManaType) ? (chosen as ManaType) : undefined;
      },
      sacrificeAllBut: (player, keep, filter) => {
        // "Chooses up to N they control, then sacrifices the rest" — the
        // existing sacrifice queue already asks the right player; it just
        // needs the count expressed the other way round.
        const eligible = this.eligibleSacrifices(player, filter);
        const total = eligible.reduce(
          (n, id) => n + (this.state.objects[id].stackCount ?? 1),
          0,
        );
        const give = total - keep;
        if (give > 0) {
          const from = this.state.decisionSource;
          this.state.pendingSacrifices.push({
            player,
            filter,
            count: give,
            ...(from !== null ? { source: from } : {}),
          });
        }
      },
      goadCreaturesOf: (player) => {
        for (const id of this.state.zones.shared.battlefield) {
          const object = this.state.objects[id];
          if (object === undefined || object.controller !== player) continue;
          if (!computeCharacteristics(this.state, this.registry, id).types.includes("creature")) {
            continue;
          }
          const by = object.goadedBy ?? [];
          if (!by.includes(controller)) object.goadedBy = [...by, controller];
        }
      },
      impulseExile: (amount, duration, castOnly, opts) =>
        this.impulseExile(controller, source, amount, duration, castOnly, opts),
      // Only a resolving ward trigger knows what it counters; `resolveAbility`
      // supplies the real one.
      ward: () => {},
      unless: (chooser, options, otherwise) =>
        this.beginUnless(source, controller, x, targets, triggerObject, chooser, options, otherwise, {
          lastKnownRefs: refs,
          targetZones,
          triggerController: triggerLastKnown()?.controller,
        }),
      // "Damage equal to its power" from a dies trigger reads the power it
      // died with (the Juri and Elenda rulings); a target that has left, the
      // power it left with.
      powerOf: (target) => {
        const lki = lastKnownOf(target);
        if (lki !== undefined) return lki.power;
        return target.kind === "object" && this.state.objects[target.object] !== undefined
          ? computeCharacteristics(this.state, this.registry, target.object).power
          : 0;
      },
      toughnessOf: (target) => {
        const lki = lastKnownOf(target);
        if (lki !== undefined) return lki.toughness;
        return target.kind === "object" && this.state.objects[target.object] !== undefined
          ? computeCharacteristics(this.state, this.registry, target.object).toughness
          : 0;
      },
      countersOf: (target, counter) => {
        const lki = lastKnownOf(target);
        if (lki !== undefined) return lki.counters[counter] ?? 0;
        return target.kind === "object"
          ? (this.state.objects[target.object]?.counters[counter] ?? 0)
          : 0;
      },
      putOnBottomOfLibrary: (target) => {
        if (target.kind !== "object") return;
        const id = this.splitOneFromStack(target.object);
        const object = this.state.objects[id];
        if (object === undefined || object.zone !== "battlefield") return;
        // Index 0 is the library *top* (that's what `drawCard` takes), and
        // `moveObject` pushes onto the end — so a plain move already lands on
        // the bottom, which is what `applyPutOnBottom` relies on too. A token
        // ceases to exist either way (rule 111.7).
        this.moveObject(id, "library");
      },
      addCounterAll: (filter, counter, amount, exceptSource) => {
        // Snapshot first — `addCounter` can kill a permanent (a -1/-1 counter)
        // and mutate the battlefield array underneath the loop.
        for (const id of this.battlefieldMatching(controller, filter)) {
          if (exceptSource === true && id === source) continue;
          this.addCounter({ kind: "object", object: id }, counter, amount, false, controller);
        }
      },
      proliferate: (then) => this.beginProliferate(source, controller, x, then),
      grantKeyword: (target, keyword, duration) =>
        this.grantKeyword(target, keyword, duration),
      grantTriggered: (target, ability, duration) =>
        this.grantTriggered(target, ability, duration),
      grantPlayerHexproof: (who) => {
        for (const player of scoped(who)) {
          if (!this.state.hexproofPlayers.includes(player)) {
            this.state.hexproofPlayers.push(player);
          }
        }
      },
      takeExtraTurn: () => {
        this.state.extraTurns.push(controller);
        this.emit({ type: "extra-turn-queued", player: controller });
      },
      storm: (sourceId) => this.stormCopy(sourceId),
      cascade: (player, sourceId) => this.cascade(player, sourceId),
      copySpell: (target) => this.copySpellByEffect(controller, target),
      additionalCombat: () => {
        this.state.extraCombats += 1;
        this.emit({ type: "additional-combat-queued", player: controller });
      },
      additionalLandDrops: (amount) => {
        const seat = this.state.players[controller];
        seat.extraLandsThisTurn = (seat.extraLandsThisTurn ?? 0) + amount;
      },
      untapAll: (filter, scopeTo) => {
        for (const id of this.battlefieldMatching(scopeTo ?? controller, filter)) {
          const object = this.state.objects[id];
          if (object.tapped) {
            object.tapped = false;
            this.emit({ type: "permanent-untapped", object: id });
          }
        }
      },
      tapAll: (filter) => {
        for (const id of this.battlefieldMatching(controller, filter)) {
          const object = this.state.objects[id];
          if (!object.tapped) {
            object.tapped = true;
            this.emit({ type: "permanent-tapped", object: id });
          }
        }
      },
      animate: (target, opts) => this.animate(target, opts),
      addTypes: (target, types, subtypes, duration) => this.addTypes(target, types, subtypes, duration),
      animateAll: (filter, opts) => {
        // Every match is fixed before the first one changes (a Treasure made
        // a creature mustn't change what the filter matches mid-loop), and a
        // token stack is animated whole, like any mass effect's.
        for (const id of this.battlefieldMatching(controller, filter)) {
          this.animate({ kind: "object", object: id }, opts, false);
        }
      },
      changeText: (target) => this.beginTextChoice(controller, source, target),
      createToken: (token, count, who, tapped, sacrificeAtEndStep, gainUntilEndOfTurn) => {
        // "Each opponent creates a Treasure token": each of them, APNAP.
        if (who !== undefined && who !== "you" && who !== "target-controller") {
          for (const p of scoped(who)) {
            this.createTokens(p, token, count, tapped, sacrificeAtEndStep, gainUntilEndOfTurn);
          }
          return;
        }
        let tokenController = controller;
        if (who === "target-controller") {
          const ref = targets[0];
          if (ref?.kind === "player") tokenController = ref.player;
          else if (ref?.kind === "object") {
            // Rule 111.11 — a destroyed/countered target's *last-known*
            // controller: `moveObject` has already reverted `controller` to
            // `owner` for a permanent that left the battlefield, so read the
            // snapshot. For a spell controller === owner anyway.
            const who =
              lastKnownOf(ref)?.controller ?? this.state.objects[ref.object]?.controller;
            if (who !== undefined) tokenController = who;
          }
        }
        this.createTokens(tokenController, token, count, tapped, sacrificeAtEndStep, gainUntilEndOfTurn);
      },
      // "That creature's controller" — who controlled it as it left, if it
      // has (rule 608.2h); `moveObject` has handed it back to its owner.
      controllerOf: (ref) =>
        ref.kind === "player"
          ? ref.player
          : (lastKnownOf(ref)?.controller ?? this.state.objects[ref.object]?.controller),
      devotionTo: (color) => this.devotionTo(controller, color),
      opponentsControllingFewer: (filter) => {
        const mine = this.countBattlefieldMatching(controller, filter);
        return this.state.turnOrder.filter(
          (p) =>
            p !== controller &&
            !this.state.players[p].hasLost &&
            this.countBattlefieldMatching(p, filter) < mine,
        ).length;
      },
      creaturesDiedThisTurn: () =>
        this.state.players[controller]?.creaturesDiedThisTurn ?? 0,
      createTokenCopy: (of, count, opts) => this.createTokenCopy(of, count, opts),
      conditionMet,
      attach: (target) => this.attachPermanent(source, target),
      transform: (target) => {
        const t = this.splitTargetRef(target);
        if (t.kind === "object") this.transformPermanent(t.object);
      },
      setDayNight: (value) => this.setDayNight(value),
      becomeMonarch: (who) => {
        for (const p of scoped(who ?? "you")) {
          this.setMonarch(p, "effect");
        }
      },
      getEnergy: (amount, who) => {
        for (const p of scoped(who ?? "you")) {
          this.changeEnergy(p, amount);
        }
      },
      addPlayerCounters: (player, counter, amount) =>
        this.changePlayerCounters(player, counter, amount),
      playerCountersOf: (player, counter) => this.state.players[player]?.counters[counter] ?? 0,
      createEmblem: (text, staticAbility) =>
        this.createEmblem(controller, text, staticAbility ?? null),
      preventAllCombatDamage: () => {
        this.state.preventAllCombatDamage = true;
        this.emit({ type: "combat-damage-prevention-set" });
      },
      preventDamage: (target, amount, combatOnly) => {
        if (amount <= 0) return;
        this.state.preventionShields.push({ target, amount, combatOnly });
        this.emit({ type: "prevention-shield-created", target, amount });
      },
      chooseModes: (minModes, maxModes, modes, onDecline, cost, notChosenThisTurn, otherCost) =>
        this.beginModesChoice(
          source,
          controller,
          x,
          minModes,
          maxModes,
          modes,
          onDecline,
          targets,
          cost,
          triggerValue,
          triggerObject,
          undefined,
          refs,
          targetZones,
          {
            key: opts.abilityKey,
            notChosenThisTurn: notChosenThisTurn === true,
            ...(otherCost?.life !== undefined ? { costLife: otherCost.life } : {}),
            ...(otherCost?.energy !== undefined ? { costEnergy: otherCost.energy } : {}),
          },
        ),
      changeLifeScoped: (who, delta) =>
        this.changeLifeScoped(controller, who, delta, triggerObject, triggerLastKnown(), refs.player),
      searchLibrary: (
        player,
        filter,
        destination,
        min,
        max,
        enterTapped,
        restDestination,
        reveal,
      ) =>
        this.beginLibrarySearch(
          player ?? controller,
          filter,
          destination,
          min,
          max,
          enterTapped,
          restDestination,
          reveal === true,
          x,
        ),
      scry: (amount, surveil, then) =>
        this.beginScry(source, controller, x, amount, surveil ? "surveil" : "scry", then ?? null),
      revealTop: (then) => {
        const top = this.state.zones.perPlayer[controller].library[0];
        if (top !== undefined) this.revealCards(controller, [top], "library");
        applyEffectSpec(
          then,
          this.makeResolutionContext(
            source,
            controller,
            top === undefined ? [] : [{ kind: "object", object: top }],
            x,
            triggerValue,
            triggerObject,
            stackMultiplier,
            resolutionCount,
          ),
        );
      },
      lookAndChoose: (zone, count, min, max, destination, leftover, filter, enterTapped, then, reveal) =>
        this.beginZoneChoice(
          controller,
          zone,
          count,
          min,
          max,
          destination,
          leftover,
          filter,
          enterTapped === true,
          then === undefined ? undefined : { effect: then, source, x },
          reveal === true,
        ),
    };
  }

  /** Does `id` satisfy a `"look-and-choose"` effect's optional filter? Always
   * true when there's no filter — the effect just doesn't restrict the choice.
   * `you` is the searching player, for the filter's `controlledBy`/`ownedBy`. */
  private matchesZoneChoiceFilter(
    id: ObjectId,
    filter: ZoneChoiceFilter | undefined,
    you: PlayerId,
  ): boolean {
    if (filter === undefined) return true;
    return matchesFilter(this.state, this.registry, id, filter, { you });
  }

  /** See the `"look-and-choose"` {@link EffectSpec}. */
  private beginZoneChoice(
    player: PlayerId,
    zone: "library" | "graveyard" | "hand",
    count: number | undefined,
    min: number,
    max: number,
    destination: "battlefield" | "hand" | "library-top" | "graveyard",
    leftover: "bottom-random" | "stay" | "hand",
    filter: ZoneChoiceFilter | undefined,
    enterTapped = false,
    then?: { effect: EffectSpec; source: ObjectId; x: number },
    reveal = false,
  ): void {
    const zoneCards = this.state.zones.perPlayer[player][zone];
    // Only a library is looked at `count` deep; a graveyard is public and a
    // hand is the chooser's own, so both offer everything in them.
    const ids = zone === "library" ? zoneCards.slice(0, count ?? 0) : [...zoneCards];
    if (reveal && zone === "library") this.revealCards(player, ids, "library");
    // A filter (e.g. "only a Dragon card") narrows what's *choosable*, never
    // what's *revealed* — the player still looks at everything either way,
    // and naturally ends up unable to choose anything if nothing matches
    // (min/max clamp to 0 along with it), same as the real card whiffing.
    const eligible = ids.filter((id) => this.matchesZoneChoiceFilter(id, filter, player));
    this.state.awaiting = {
      kind: "choose-from-zone",
      player,
      ids,
      eligible,
      min: Math.min(min, eligible.length),
      max: Math.min(max, eligible.length),
      destination,
      leftover,
      ...(enterTapped && destination === "battlefield" ? { enterTapped: true } : {}),
      ...(then !== undefined ? { then: then.effect, thenSource: then.source, thenX: then.x } : {}),
    };
  }

  /** See the `"search-library"` {@link EffectSpec}. Lists only the matching
   * cards (a real search reveals the whole library, but the only decision is
   * which matching card to take); `leftover: "shuffle"` shuffles the whole
   * library afterwards, whiff or not (rule 701.19). */
  private beginLibrarySearch(
    player: PlayerId,
    filter: CardFilter,
    destination: "hand" | "battlefield" | "library-top" | "graveyard",
    min: number,
    max: number,
    enterTapped: boolean,
    restDestination?: "hand" | "battlefield",
    reveal = false,
    x = 0,
  ): void {
    // `x` is the searching spell's X, for "mana value X or less" (Chord of
    // Calling).
    const eligible = this.state.zones.perPlayer[player].library.filter((id) =>
      matchesFilter(this.state, this.registry, id, filter, { you: player, x }),
    );
    this.state.awaiting = {
      kind: "choose-from-zone",
      player,
      ids: eligible,
      eligible,
      min: Math.min(min, eligible.length),
      max: Math.min(max, eligible.length),
      destination,
      leftover: "shuffle",
      ...(enterTapped && destination === "battlefield" ? { enterTapped: true } : {}),
      ...(restDestination !== undefined ? { restDestination } : {}),
      ...(reveal ? { reveal: true } : {}),
    };
  }

  /** See the `"scry"` / `"surveil"` {@link EffectSpec}. Looks at the top N of
   * the library and raises a `scry` decision. */
  private beginScry(
    source: ObjectId,
    player: PlayerId,
    x: number,
    amount: number,
    mode: "scry" | "surveil",
    then: EffectSpec | null,
  ): void {
    const cards = this.state.zones.perPlayer[player].library.slice(0, amount);
    if (cards.length === 0) {
      // Nothing to look at — skip straight to the follow-up effect.
      if (then !== null) {
        applyEffectSpec(then, this.makeResolutionContext(source, player, [], x));
      }
      return;
    }
    this.state.awaiting = { kind: "scry", player, cards, mode, then, source, x };
  }

  /** Answers a pending `scry` / `surveil` decision. */
  private applyScry(player: PlayerId, away: readonly ObjectId[]): void {
    const why = this.whyCannotScry(player, away);
    if (why !== null) throw new Error(why);
    const awaiting = this.state.awaiting;
    if (awaiting === null || awaiting.kind !== "scry") {
      throw new Error("unreachable: whyCannotScry should have caught this");
    }
    const { cards, mode, then, source, x } = awaiting;
    const awaySet = new Set(away);
    const stay = cards.filter((id) => !awaySet.has(id));
    const awayOrdered = cards.filter((id) => awaySet.has(id));

    const library = this.state.zones.perPlayer[player].library;
    const rest = library.slice(cards.length);
    // Rebuild: kept cards on top (original order), then the untouched rest,
    // then the moved-away cards at the bottom.
    library.length = 0;
    library.push(...stay, ...rest, ...awayOrdered);
    this.state.awaiting = null;

    if (mode === "surveil") {
      for (const id of awayOrdered) this.moveObject(id, "graveyard");
    }
    this.emit({
      type: "scried",
      player,
      mode,
      looked: cards.length,
      movedAway: awayOrdered.length,
    });

    if (then !== null) {
      applyEffectSpec(then, this.makeResolutionContext(source, player, [], x));
    }
    if (this.state.awaiting === null) this.prepareForPriority(this.activePlayer);
  }

  /** Kept because `applyScry` validates before applying and throws; the
   * rules themselves live in `decisions/scry.ts`. */
  private whyCannotScry(player: PlayerId, away: readonly ObjectId[]): string | null {
    return scry.whyCannot(this.decisionCtx, { type: "scry", player, away }, player);
  }

  /** Create `count` copies of the named token, controlled by `controller` (rule 111). */
  /**
   * Amass N (rule 701.44) — see the `"amass"` {@link EffectSpec}.
   *
   * The Army has to be found (or made) *before* the counters go on, and the
   * same one has to receive them, which is why this is one operation rather
   * than a sequence of smaller effects: repeatedly amassing grows a single
   * creature, and that only works if "an Army you control" resolves to the
   * same object each time.
   *
   * Picks the first Army on the battlefield rather than asking. The rules let
   * the controller choose which Army when they control several; nothing in
   * the precons makes more than one, so the choice would never come up.
   */
  private amass(controller: PlayerId, amount: number, creatureType: string): void {
    if (amount <= 0) return;
    let army = this.state.zones.shared.battlefield.find((id) => {
      const object = this.state.objects[id];
      return (
        object !== undefined &&
        object.controller === controller &&
        effectiveSubtypes(this.state, this.registry, object).includes("Army")
      );
    });
    if (army === undefined) {
      const before = new Set(this.state.zones.shared.battlefield);
      this.createTokens(controller, "Army Token", 1);
      army = this.state.zones.shared.battlefield.find((id) => !before.has(id));
      if (army === undefined) return;
      // An Army entering as a stacked batch would share one object with
      // others; amass always makes exactly one, so peel it off to be safe.
      army = this.splitOneFromStack(army);
    }
    // 701.44b — "It's also a [type]". A permanent subtype grant, so it sticks
    // across turns the way the printed type would.
    const object = this.state.objects[army];
    if (object !== undefined && !effectiveSubtypes(this.state, this.registry, object).includes(creatureType)) {
      object.modifiers.push({
        timestamp: this.state.timestampSeq,
        power: 0,
        toughness: 0,
        keywords: [],
        addSubtypes: [creatureType],
        untilEndOfTurn: false,
      });
    }
    this.addCounter({ kind: "object", object: army }, "+1/+1", amount, true, controller);
  }

  /**
   * Populate (rule 701.32) — copy a creature token you control.
   *
   * Picks the largest by power rather than asking. The rules give the
   * controller the choice, but it only ever matters with two or more creature
   * tokens of different sizes, and no precon produces that; recorded in
   * AUTHORING §15 alongside `proliferate`'s similar simplification.
   */
  /**
   * A punisher clause — see the `"unless"` {@link EffectSpec}.
   *
   * Raised as an ordinary `choose-modes` decision, but belonging to the
   * *chooser* rather than the effect's controller, which is the whole point.
   * Each option becomes one mode; the mode's own effect performs the
   * non-mana payments (a mana one rides on the decision's `cost`), and
   * declining runs `otherwise`.
   *
   * Options the chooser can't take aren't offered at all, so "couldn't" and
   * "wouldn't" both land on `otherwise` — the printed cards make no
   * distinction either.
   */
  private beginUnless(
    source: ObjectId,
    controller: PlayerId,
    x: number,
    targets: ResolvedTargets,
    triggerObject: ObjectId | undefined,
    chooser: number | "trigger-controller",
    options: readonly UnlessOption[],
    otherwise: EffectSpec,
    /** What the resolving ability knew about the objects it refers to: its
     * last-known references and target zones, carried to `otherwise`, and
     * who controlled the triggering object (as it last existed, if it has
     * left the battlefield — rule 608.2h). */
    known: {
      readonly lastKnownRefs: LastKnownRefs;
      readonly targetZones: readonly (ZoneType | null)[];
      readonly triggerController: PlayerId | undefined;
    },
  ): void {
    const decide =
      chooser === "trigger-controller"
        ? (known.triggerController ??
          (triggerObject !== undefined
            ? this.state.objects[triggerObject]?.controller
            : undefined))
        : (() => {
            const ref = targets[chooser];
            return ref?.kind === "player" ? ref.player : undefined;
          })();

    const applyOtherwise = (): void => {
      applyEffectSpec(
        otherwise,
        this.makeResolutionContext(
          source,
          controller,
          targets,
          x,
          0,
          triggerObject,
          1,
          0,
          known.targetZones,
          known.lastKnownRefs,
        ),
      );
    };
    if (decide === undefined || this.state.players[decide]?.hasLost === true) {
      applyOtherwise();
      return;
    }

    // Only offer what they can actually take.
    const available = options.filter((option) => {
      if ("pay" in option) return this.payMana(decide, parseManaCost(option.pay)) !== null;
      if ("payLife" in option) return this.state.players[decide].life > option.payLife;
      return this.eligibleSacrifices(decide, option.sacrifice).length > 0;
    });
    if (available.length === 0) {
      applyOtherwise();
      return;
    }

    const manaOption = available.find((o): o is Extract<UnlessOption, { pay: string }> =>
      "pay" in o,
    );
    const modes = available.map((option) => ({
      text: option.text,
      effect:
        "payLife" in option
          ? ({ kind: "lose-life", amount: option.payLife, who: "you" } as EffectSpec)
          : "sacrifice" in option
            ? ({
                kind: "sacrifice",
                who: "you",
                filter: option.sacrifice,
                count: 1,
              } as EffectSpec)
            // The mana option's payment rides on the decision's own `cost`,
            // so its mode has nothing left to do.
            : ({ kind: "sequence", effects: [] } as EffectSpec),
    }));

    // The chooser decides and pays; `otherwise` stays the punisher's own
    // controller's effect.
    this.beginModesChoice(
      source,
      decide,
      x,
      0,
      1,
      modes,
      otherwise,
      targets,
      manaOption?.pay,
      0,
      triggerObject,
      controller,
      known.lastKnownRefs,
      known.targetZones,
    );
  }

  /**
   * "Impulse draw" — see the `"impulse-exile"` {@link EffectSpec}.
   *
   * The cards are exiled face-up and marked as playable by `controller`.
   * `legalActions` scans exile for those marks, so the permission is carried
   * on the *card* rather than on a list somewhere, which means it survives
   * the source leaving, a `structuredClone`, and anything else that moves
   * state around.
   */
  private impulseExile(
    controller: PlayerId,
    source: ObjectId,
    amount: number,
    duration: "end-of-turn" | "your-next-turn" | "while-source",
    castOnly: boolean,
    opts: {
      readonly choose?: number;
      readonly yourTurnOnly?: boolean;
      readonly gate?: StaticCondition;
    } = {},
  ): void {
    if (amount <= 0) return;
    const taken = this.state.zones.perPlayer[controller].library.slice(0, amount);
    if (taken.length === 0) return;
    for (const id of taken) this.moveObject(id, "exile");

    const grant: GameObject["impulse"] = {
      player: controller,
      expiry:
        duration === "end-of-turn"
          ? { kind: "end-of-turn", turn: this.state.turn.number }
          : duration === "your-next-turn"
            // It lapses as the player's next turn ends. Granted during one of
            // their own turns, that turn has to end first; granted on someone
            // else's turn (Tectonic Giant targeted by an opponent's spell),
            // the next of theirs is already the last one.
            ? { kind: "your-turns", remaining: this.activePlayer === controller ? 1 : 0 }
            : { kind: "while-source", source },
      ...(castOnly ? { castOnly: true } : {}),
      ...(opts.yourTurnOnly ? { yourTurnOnly: true } : {}),
      ...(opts.gate !== undefined ? { gate: opts.gate } : {}),
    };

    // "Choose one of them" — the rest stay exiled with no permission.
    const choose = opts.choose;
    if (choose !== undefined && choose < taken.length) {
      this.state.awaiting = {
        kind: "choose-from-zone",
        player: controller,
        ids: taken,
        eligible: taken,
        min: Math.min(choose, taken.length),
        max: Math.min(choose, taken.length),
        destination: "exile-playable",
        leftover: "stay",
        impulseGrant: grant,
      };
      return;
    }
    for (const id of taken) {
      const object = this.state.objects[id];
      if (object !== undefined) object.impulse = { ...grant };
    }
  }

  /**
   * Age every impulse permission as a turn ends — see `GameObject.impulse`.
   *
   * A `your-turns` expiry counts down only on *that player's* turns, which is
   * how "until the end of your next turn" stays exact through extra turns and
   * however many opponents there are, instead of guessing a turn number when
   * the permission was granted.
   */
  private expireImpulsePermissions(): void {
    const active = this.activePlayer;
    for (const id of this.state.zones.shared.exile) {
      const object = this.state.objects[id];
      const impulse = object?.impulse;
      if (object === undefined || impulse === undefined) continue;
      if (impulse.expiry.kind === "end-of-turn") {
        if (impulse.expiry.turn <= this.state.turn.number) delete object.impulse;
      } else if (impulse.expiry.kind === "your-turns" && impulse.player === active) {
        if (impulse.expiry.remaining <= 0) delete object.impulse;
        else impulse.expiry.remaining -= 1;
      }
    }
  }

  /**
   * May `player` play `card` off an impulse-draw exile right now?
   *
   * `until` is the turn the permission was granted on, so it lapses the
   * moment the turn number moves; `exiledWith` keeps it alive only while that
   * permanent is still on the battlefield (Theater of Horrors).
   */
  /** Shuffle `player`'s whole library with the game's seeded RNG, and
   * announce it. Shared by library searches and "shuffle ~ into its owner's
   * library" (White Sun's Zenith). */
  private shuffleLibraryOf(player: PlayerId): void {
    const library = this.state.zones.perPlayer[player].library;
    const order = shuffle([...library], this.rng);
    library.length = 0;
    library.push(...order);
    this.state.rngState = this.rng.seed;
    this.emit({ type: "library-shuffled", player });
  }

  /** A permanent's `castFromGraveyard` permissions — every printed static
   * carrying one — or none if it has lost its abilities. */
  private graveyardCastAbilities(
    id: ObjectId,
  ): NonNullable<StaticAbility["castFromGraveyard"]>[] {
    const object = this.state.objects[id];
    if (object === undefined || hasLostAbilities(object)) return [];
    const out: NonNullable<StaticAbility["castFromGraveyard"]>[] = [];
    for (const ability of this.registry.get(printedCardName(object)).static) {
      if (ability.castFromGraveyard !== undefined) out.push(ability.castFromGraveyard);
    }
    return out;
  }

  /**
   * Every permission `player` could play `card` (as face `face`) from their
   * graveyard under right now, each with the permission it would spend:
   *
   * - the card's own one-shot permission (Silas Renn, Emry) — casts only;
   * - each permanent `player` controls with a `castFromGraveyard` static
   *   whose gates are open and whose filter the card matches — once, or for
   *   a `perType` grant (Muldrotha) once per permanent type the face has and
   *   the grantor hasn't spent this turn. A land face is only ever offered a
   *   `"land"` allowance, and only a `perType` grant listing it can play one:
   *   every other permission says "cast".
   *
   * The order is the default an action that names no grant is played under:
   * the card's own permission first (it lapses anyway), then the permanents
   * in battlefield order. Ramunap Excavator's unlimited `playFromGraveyard`
   * isn't one of these — it spends nothing — see `landPlayableReason`.
   */
  private graveyardGrantsFor(
    player: PlayerId,
    card: ObjectId,
    face = 0,
  ): GraveyardGrantOption[] {
    const object = this.state.objects[card];
    if (object === undefined || object.zone !== "graveyard" || object.owner !== player) {
      return [];
    }
    const def = this.faceDef(card, face);
    const isLand = def.types.includes("land");
    const out: GraveyardGrantOption[] = [];
    const own = object.graveyardCastPermission;
    if (
      !isLand &&
      own !== undefined &&
      own.player === player &&
      own.turn === this.state.turn.number
    ) {
      out.push({ grant: { source: card }, permission: null });
    }
    for (const id of this.state.zones.shared.battlefield) {
      const grantor = this.state.objects[id];
      if (grantor.controller !== player) continue;
      for (const permission of this.graveyardCastAbilities(id)) {
        if (permission.yourTurnOnly === true && this.activePlayer !== player) continue;
        if (permission.oncePerTurn === true && grantor.graveyardCastUsedThisTurn === true) {
          continue;
        }
        // Rule 119.4: life can be paid only up to what you have.
        if (
          permission.payLife !== undefined &&
          this.state.players[player].life < permission.payLife
        ) {
          continue;
        }
        if (!matchesFilter(this.state, this.registry, card, permission.filter, { you: player })) {
          continue;
        }
        if (permission.perType !== undefined) {
          const spent = grantor.graveyardCastTypesUsedThisTurn ?? [];
          for (const type of permission.perType) {
            if (spent.includes(type) || !def.types.includes(type)) continue;
            // A land is played with the land allowance and nothing else; a
            // spell never uses it.
            if ((type === "land") !== isLand) continue;
            out.push({ grant: { source: id, asType: type }, permission });
          }
        } else if (!isLand) {
          out.push({ grant: { source: id }, permission });
        }
      }
    }
    return out;
  }

  /** The permission `grant` names among `graveyardGrantsFor`, or — for a
   * driver that named none — the first that applies; `null` if none does. */
  private findGraveyardGrant(
    player: PlayerId,
    card: ObjectId,
    face: number,
    grant: GraveyardGrant | undefined,
  ): GraveyardGrantOption | null {
    const grants = this.graveyardGrantsFor(player, card, face);
    if (grant === undefined) return grants[0] ?? null;
    return (
      grants.find((g) => g.grant.source === grant.source && g.grant.asType === grant.asType) ??
      null
    );
  }

  /** Spend a graveyard permission as the card is played — before it leaves
   * the graveyard. The card's own permission needs nothing: the move clears
   * it. */
  private spendGraveyardGrant(found: GraveyardGrantOption): void {
    const { grant, permission } = found;
    if (permission === null) return;
    const grantor = this.state.objects[grant.source];
    if (grantor === undefined) return;
    if (grant.asType !== undefined) {
      (grantor.graveyardCastTypesUsedThisTurn ??= []).push(grant.asType);
    }
    if (permission.oncePerTurn === true) grantor.graveyardCastUsedThisTurn = true;
    invalidateComputedCache();
  }

  /** "Choose target artifact card in your graveyard. You may cast that card
   * this turn" (Silas Renn, Emry) — see `GameObject.graveyardCastPermission`. */
  private grantGraveyardCastByEffect(controller: PlayerId, target: TargetRef): void {
    if (target.kind !== "object") return;
    const object = this.state.objects[target.object];
    if (object === undefined || object.zone !== "graveyard") return;
    object.graveyardCastPermission = { player: controller, turn: this.state.turn.number };
    this.emit({ type: "graveyard-cast-granted", object: target.object, player: controller });
  }

  private impulsePlayable(player: PlayerId, card: ObjectId): boolean {
    const object = this.state.objects[card];
    const impulse = object?.impulse;
    if (object === undefined || impulse === undefined) return false;
    if (object.zone !== "exile" || impulse.player !== player) return false;
    // Gates on *using* it, checked live — Theater of Horrors' cards come and
    // go as the turn and the life-loss condition change.
    if (impulse.yourTurnOnly === true && this.activePlayer !== player) return false;
    if (impulse.gate !== undefined) {
      const gateSource =
        impulse.expiry.kind === "while-source"
          ? this.state.objects[impulse.expiry.source]
          : object;
      if (
        gateSource === undefined ||
        !staticConditionMet(this.state, this.registry, gateSource, impulse.gate)
      ) {
        return false;
      }
    }
    if (impulse.expiry.kind === "end-of-turn") {
      return impulse.expiry.turn === this.state.turn.number;
    }
    if (impulse.expiry.kind === "while-source") {
      const src = this.state.objects[impulse.expiry.source];
      return src !== undefined && src.zone === "battlefield";
    }
    return true;
  }

  /**
   * Encore (rule 702.140) — see the `"encore"` {@link EffectSpec}.
   *
   * The card being copied is in *exile* by now: the Encore ability's cost
   * exiled it (`ActivatedAbility.zone: "graveyard"`). `createTokenCopy` reads
   * the printed name rather than the zone, so that works, but the copies have
   * to be put under `controller` explicitly — the exiled card's own
   * controller is meaningless.
   */
  private encore(controller: PlayerId, source: ObjectId): void {
    for (const opponent of this.scopedPlayers(controller, "each-opponent")) {
      const before = new Set(this.state.zones.shared.battlefield);
      this.createTokenCopy(source, 1, {
        gainsHaste: true,
        exileAtEndStep: false,
        notLegendary: false,
        under: controller,
      });
      for (const id of this.state.zones.shared.battlefield) {
        if (before.has(id)) continue;
        const token = this.state.objects[id];
        if (token === undefined) continue;
        // "…that attacks that opponent this turn if able", and is sacrificed
        // — not exiled — at the beginning of the next end step.
        token.mustAttackPlayer = opponent;
        token.sacrificeAtEndStep = true;
      }
    }
  }

  /** Untapped permanents `player` controls that could pay an
   * `AbilityCost.tapOthers`, excluding the ability's own source. */
  private tapOthersCandidates(
    player: PlayerId,
    sourceId: ObjectId,
    spec: {
      readonly count: number;
      readonly filter: CardFilter;
      readonly includeSelf?: boolean;
    },
  ): ObjectId[] {
    return this.state.zones.shared.battlefield.filter((id) => {
      const object = this.state.objects[id];
      return (
        object !== undefined &&
        (spec.includeSelf === true || id !== sourceId) &&
        object.controller === player &&
        !object.tapped &&
        // No summoning-sickness check: rule 302.6 only covers {T}/{Q} in a
        // creature's *own* activation cost. "Tap an untapped creature you
        // control" can tap one that just arrived, the source included, which
        // is how Heritage Druid taps three Elves cast this turn.
        matchesFilter(this.state, this.registry, id, spec.filter, { you: player })
      );
    });
  }

  /** How many permanents `ids` stand for — a compacted token stack counts as
   * every token in it, so a stack of ten Zombies pays "tap five Zombies". */
  private tapCapacity(ids: readonly ObjectId[]): number {
    let n = 0;
    for (const id of ids) n += this.state.objects[id]?.stackCount ?? 1;
    return n;
  }

  /**
   * The offer for a "tap N untapped … you control" cost, given the mana the
   * same activation or cast pays: see {@link TapCostOffer}. The mana is
   * planned with every candidate tried last, and whatever the plan still taps
   * is left out of `choices`, so any `count` of them leaves the mana payable.
   * `null` when the mana can't be paid at all.
   */
  private tapCostOffer(
    player: PlayerId,
    sourceId: ObjectId,
    spec: { readonly count: number; readonly filter: CardFilter; readonly includeSelf?: boolean },
    manaCost: ManaCost,
    avoid: ObjectId | undefined,
    exclude: ObjectId | undefined,
    purpose: ManaPurpose,
  ): TapCostOffer | null {
    const candidates = this.tapOthersCandidates(player, sourceId, spec);
    const plan = this.payMana(player, manaCost, avoid, exclude, purpose, {
      last: new Set(candidates),
    });
    if (plan === null) return null;
    const used = new Set(plan.steps.map((step) => step.source));
    const choices = candidates.filter((id) => !used.has(id));
    const copies: Record<ObjectId, number> = {};
    for (const id of choices) {
      const n = this.state.objects[id].stackCount ?? 1;
      if (n > 1) copies[id] = n;
    }
    return {
      count: spec.count,
      choices,
      ...(Object.keys(copies).length > 0 ? { copies } : {}),
    };
  }

  /** {@link tapCostOffer} for an activated ability's `tapOthers`, with its
   * mana paid the way `activateAbility` pays it (X at 0). `null` when the
   * ability has no such cost or its mana can't be paid. */
  private abilityTapCostOffer(
    player: PlayerId,
    sourceId: ObjectId,
    ability: ActivatedAbility,
  ): TapCostOffer | null {
    if (ability.cost.tapOthers === undefined) return null;
    return this.tapCostOffer(
      player,
      sourceId,
      ability.cost.tapOthers,
      this.activatedAbilityManaCost(player, sourceId, ability).cost,
      ability.cost.tap || ability.zone !== undefined ? undefined : sourceId,
      ability.cost.tap ? sourceId : undefined,
      { kind: "ability", source: sourceId },
    );
  }

  /** {@link tapCostOffer} for casting `cardId` for its alternative cost
   * (Sephara) — the cost {@link whyCannotCastSpell} checks it against. */
  private altCostTapOffer(
    player: PlayerId,
    cardId: ObjectId,
    via: CastVia | undefined,
    face: number,
  ): TapCostOffer | null {
    const def = this.faceDef(cardId, face);
    if (def.alternativeCost === null) return null;
    const cost = this.withFace(cardId, face, () =>
      this.castingCostOf(
        player,
        cardId,
        def,
        0,
        this.castCostString(cardId, via, face, false, false, false, true),
      ),
    );
    return this.tapCostOffer(
      player,
      cardId,
      { ...def.alternativeCost.tapCreatures, includeSelf: false },
      cost,
      undefined,
      undefined,
      { kind: "cast", card: cardId },
    );
  }

  /** Why `tap` doesn't answer `offer` — exactly `count` picks, each one of
   * `choices`, a stack named no more times than it has tokens — or `null`. */
  private whyTapChoiceIsWrong(
    what: string,
    offer: TapCostOffer,
    tap: readonly ObjectId[],
  ): string | null {
    if (tap.length !== offer.count) {
      return `${what} taps ${offer.count} permanent(s), not ${tap.length}`;
    }
    const named = new Map<ObjectId, number>();
    for (const id of tap) {
      const name = this.state.objects[id]?.cardName ?? id;
      if (!offer.choices.includes(id)) return `${what} can't tap ${name} for its cost`;
      const times = (named.get(id) ?? 0) + 1;
      if (times > (offer.copies?.[id] ?? 1)) {
        return `${what} names ${name} more times than there are to tap`;
      }
      named.set(id, times);
    }
    return null;
  }

  /**
   * Why `chosen` can't pay an escape cost's "exile `count` other cards from
   * your graveyard" (rule 702.139a), or `null` if it can: exactly `count`
   * distinct cards, each in `player`'s graveyard right now, and none of them
   * the escaping card itself.
   */
  private whyEscapeExileIsWrong(
    player: PlayerId,
    cardId: ObjectId,
    name: string,
    count: number,
    chosen: readonly ObjectId[],
  ): string | null {
    if (chosen.length !== count) {
      return `${name}'s escape exiles exactly ${count} other cards, not ${chosen.length}`;
    }
    if (new Set(chosen).size !== chosen.length) {
      return `${name}'s escape can't exile the same card twice`;
    }
    const graveyard = this.state.zones.perPlayer[player].graveyard;
    for (const id of chosen) {
      if (id === cardId) return `${name} can't exile itself to pay its own escape cost`;
      if (!graveyard.includes(id)) {
        const object = this.state.objects[id];
        return object === undefined
          ? `there is no card ${id} to exile for ${name}'s escape`
          : `${printedCardName(object)} is not in ${player}'s graveyard`;
      }
    }
    return null;
  }

  /**
   * What a tap cost taps, one id per permanent (a stack's once per token):
   * `tap` as the driver chose it, or for a driver that didn't choose, the
   * summoning-sick choices first — they couldn't attack this turn anyway —
   * then the rest in battlefield order.
   */
  private tapCostPicks(
    what: string,
    offer: TapCostOffer,
    tap: readonly ObjectId[] | undefined,
  ): ObjectId[] {
    if (tap !== undefined) {
      const wrong = this.whyTapChoiceIsWrong(what, offer, tap);
      if (wrong !== null) throw new Error(wrong);
      return [...tap];
    }
    const sick = (id: ObjectId): boolean => this.state.objects[id]?.summoningSick === true;
    const order = [...offer.choices.filter(sick), ...offer.choices.filter((id) => !sick(id))];
    const picked: ObjectId[] = [];
    for (const id of order) {
      for (let i = 0; i < (offer.copies?.[id] ?? 1) && picked.length < offer.count; i += 1) {
        picked.push(id);
      }
    }
    if (picked.length < offer.count) {
      throw new Error(`${what} needs ${offer.count} untapped permanents to tap`);
    }
    return picked;
  }

  /** Taps what {@link tapCostPicks} chose, peeling one token off a stack for
   * each time its id appears. */
  private payTapCost(picked: readonly ObjectId[]): void {
    for (const chosen of picked) {
      const id = this.splitOneFromStack(chosen);
      this.state.objects[id].tapped = true;
      this.emit({ type: "permanent-tapped", object: id });
    }
  }

  private populate(controller: PlayerId): void {
    let best: ObjectId | undefined;
    let bestPower = -Infinity;
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      if (object === undefined || object.controller !== controller || !object.isToken) continue;
      const c = computeCharacteristics(this.state, this.registry, id);
      if (!c.types.includes("creature")) continue;
      if (c.power > bestPower) {
        bestPower = c.power;
        best = id;
      }
    }
    if (best === undefined) return;
    this.createTokenCopy(best, 1, {
      gainsHaste: false,
      exileAtEndStep: false,
      notLegendary: false,
    });
  }

  private createTokens(
    controller: PlayerId,
    tokenName: string,
    count: number,
    tapped = false,
    sacrificeAtEndStep = false,
    gainUntilEndOfTurn: readonly Keyword[] = [],
  ): void {
    this.registry.get(tokenName); // validate the token is a known definition
    // Doubling Season / Parallel Lives (rule 614): "twice that many instead".
    const total = count * this.tokenCreationMultiplier(controller);
    this.mintTokenBatch(
      controller,
      tokenName,
      null,
      total,
      untilEndOfTurnKeywords(gainUntilEndOfTurn),
      false,
      false,
      false,
      tapped,
      sacrificeAtEndStep,
    );
  }

  /** Create `count` token(s) that are copies of the permanent `ofId` (rule
   * 707.10 — needed-cards P5b). The copies enter under `ofId`'s controller
   * ("its controller creates" / rule 111.11 — its last-known controller for a
   * permanent that has already left). In this engine a copy is a stored card
   * *name* every characteristic read resolves through (`copyOf`), so the token
   * gets the copiable printed values — not counters, other copy effects, or
   * non-copy modifiers on the original. */
  private createTokenCopy(
    ofId: ObjectId,
    count: number,
    opts: {
      gainsHaste: boolean;
      exileAtEndStep: boolean;
      sacrificeAtEndStep?: boolean;
      notLegendary: boolean;
      basePt?: readonly [number, number];
      under?: PlayerId;
      gainUntilEndOfTurn?: readonly Keyword[];
    },
  ): void {
    const of = this.state.objects[ofId];
    if (of === undefined) return;
    const copyName = printedCardName(of);
    this.registry.get(copyName); // validate it's a known definition
    // The copy defaults to the copied permanent's controller (Miirym), but a
    // card that copies something an *opponent* controls means "under your
    // control" (Hate Mirage).
    const controller = opts.under ?? of.controller;
    const total = count * this.tokenCreationMultiplier(controller);
    const modifiers: PtModifier[] = [
      ...(opts.gainsHaste
        ? [{ power: 0, toughness: 0, keywords: ["haste" as const], untilEndOfTurn: false }]
        : []),
      ...(opts.basePt
        ? [
            {
              power: 0,
              toughness: 0,
              keywords: [],
              setPt: [opts.basePt[0], opts.basePt[1]] as [number, number],
              untilEndOfTurn: false,
              // A copy exception is part of the copiable values (rule
              // 707.9b): every other P/T-setting effect applies over it.
              timestamp: -1,
            },
          ]
        : []),
      ...untilEndOfTurnKeywords(opts.gainUntilEndOfTurn ?? []),
    ];
    this.mintTokenBatch(
      controller,
      copyName,
      copyName,
      total,
      modifiers,
      opts.exileAtEndStep,
      opts.notLegendary,
      true,
      false,
      opts.sacrificeAtEndStep === true,
    );
  }

  /** Below this, a *fresh* batch (no existing pristine match to fold into)
   * mints ordinary separate objects, exactly as before this optimization —
   * so an everyday "create two tokens" card (Raise the Alarm, Chandra) is
   * completely unaffected. An *existing* matching object always absorbs a
   * new batch regardless of size, however small — that's what actually
   * stops a self-replicating generator (Scute Swarm): most of its growth
   * comes from many independent single-token firings (one per creature it
   * already has, rule 603.3d), each of which finds and folds into the one
   * growing object instead of ever minting a distinct one. */
  private static readonly STACK_ORIGIN_THRESHOLD = 8;

  /** Mint `total` fresh tokens under `controller` — the shared core of
   * `createTokens` / `createTokenCopy`. When the token is eligible
   * (`isStackableTokenName`), folds them into one `stackCount`-carrying
   * object instead of `total` separate ones — a pure engine resource-safety
   * optimization against a self-replicating token generator (Scute Swarm)
   * blowing up over a long game; not derived from any rule, and every
   * triggered ability on such a token still fires the correct number of
   * times (see `detectTriggers`'s `stackMultiplier`). Any token this can't
   * safely cover (an activated ability, a targeted trigger) is always minted
   * as `total` separate ordinary objects. */
  private mintTokenBatch(
    controller: PlayerId,
    cardName: string,
    copyOf: string | null,
    total: number,
    modifiers: PtModifier[],
    exileAtEndStep: boolean,
    notLegendary: boolean,
    copied: boolean,
    tapped = false,
    sacrificeAtEndStep = false,
  ): void {
    if (total <= 0) return;
    this.state.players[controller].createdTokenThisTurn = true;
    const printedName = copyOf ?? cardName;
    // The whole batch enters at once — one simultaneous entry, however many
    // objects it takes (see `withEnterBatch`).
    const mintIndividually = (): void => this.withEnterBatch(() => {
      for (let i = 0; i < Math.min(total, Game.MAX_EFFECT_INSTANCES); i += 1) {
        const id = this.mintFreshTokenObject(
          controller,
          cardName,
          copyOf,
          modifiers,
          exileAtEndStep,
          notLegendary,
          false,
          tapped,
          sacrificeAtEndStep,
        );
        if (copied) this.emit({ type: "permanent-copied", object: id, copyOf: printedName });
        this.emit({ type: "permanent-entered-battlefield", object: id });
      }
    });
    // Tokens that enter *tapped* are never stacked: `findMergeableStack` has
    // no notion of tapped-ness, so they'd fold into an untapped stack and come
    // out untapped. Thirteen real objects (Army of the Damned) is well inside
    // what the battlefield handles.
    if (tapped || !this.isStackableTokenName(printedName)) {
      mintIndividually();
      return;
    }
    const repId = this.mintFreshTokenObject(
      controller,
      cardName,
      copyOf,
      modifiers,
      exileAtEndStep,
      notLegendary,
      true, // skipBattlefield — the representative is only ever compared
      tapped,
      sacrificeAtEndStep,
    );
    const existing = this.findMergeableStack(repId, controller);
    delete this.state.objects[repId]; // the representative never really "exists" on its own
    if (existing === null && total < Game.STACK_ORIGIN_THRESHOLD) {
      mintIndividually();
      return;
    }
    let finalId: ObjectId;
    if (existing !== null) {
      const stack = this.state.objects[existing];
      stack.stackCount = (stack.stackCount ?? 1) + total;
      finalId = existing;
    } else {
      const id = this.mintFreshTokenObject(
        controller,
        cardName,
        copyOf,
        modifiers,
        exileAtEndStep,
        notLegendary,
        false,
        tapped,
        sacrificeAtEndStep,
      );
      this.state.objects[id].stackCount = total;
      finalId = id;
    }
    if (copied) this.emit({ type: "permanent-copied", object: finalId, copyOf: printedName });
    this.emit({ type: "permanent-entered-battlefield", object: finalId, count: total });
  }

  /** Build one fresh token `GameObject`, apply its enters-tapped /
   * enters-with-counters replacement, and — unless `skipBattlefield` — assign
   * it a timestamp and push it onto the battlefield. The shared literal
   * `createTokens` / `createTokenCopy` / `mintTokenBatch` all build from. */
  private mintFreshTokenObject(
    controller: PlayerId,
    cardName: string,
    copyOf: string | null,
    modifiers: PtModifier[],
    exileAtEndStep: boolean,
    notLegendary: boolean,
    skipBattlefield = false,
    tapped = false,
    sacrificeAtEndStep = false,
  ): ObjectId {
    const id = this.mintObjectId();
    this.state.objects[id] = {
      id,
      cardName,
      owner: controller,
      controller,
      zone: "battlefield",
      tapped,
      damageMarked: 0,
      markedByDeathtouch: false,
      enteredBattlefieldOnTurn: this.state.turn.number,
      summoningSick: true,
      loyaltyActivatedThisTurn: false,
      targets: null,
      attacking: null,
      blocking: null,
      blockedBy: [],
      blocked: false,
      kind: "card",
      abilityKind: null,
      sourceObjectId: null,
      abilityIndex: null,
      counters: {},
      // **Copied, not aliased.** `createTokens` hands one `modifiers` array
      // to a whole batch, so storing the reference made every token of a
      // batch share one `PtModifier[]` — a Giant Growth on one of Raise the
      // Alarm's two Soldiers pumped both of them, and each new modifier
      // pushed onto one was seen by all. Same per-object copy
      // `splitOneFromStack` makes when it peels a token off a stack.
      modifiers: modifiers.map((m) => ({ ...m })),
      timestamp: 0,
      isToken: true,
      ...(sacrificeAtEndStep ? { sacrificeAtEndStep: true } : {}),
      attachedTo: null,
      isCommander: false,
      xValue: null,
      controlEndsAtCleanup: false,
      copyOf,
      ...(exileAtEndStep ? { exileAtEndStep: true } : {}),
      ...(notLegendary ? { notLegendary: true } : {}),
    };
    // Either source of "enters tapped" is enough — the token's own replacement
    // (a Treasure-like) or the effect that created it ("create thirteen
    // **tapped** Zombie tokens") — short of a replacement that has it enter
    // untapped instead.
    const entering = this.entersBattlefieldReplacement(id, tapped);
    this.state.objects[id].tapped = entering.tapped;
    for (const c of entering.counters) {
      this.state.objects[id].counters[c.kind] =
        (this.state.objects[id].counters[c.kind] ?? 0) + c.amount;
    }
    if (!skipBattlefield) {
      this.state.timestampSeq += 1;
      this.state.objects[id].timestamp = this.state.timestampSeq;
      this.state.zones.shared.battlefield.push(id);
      // Entering with counters is putting them on it (rule 122.6).
      for (const c of entering.counters) {
        this.emit({ type: "counter-added", object: id, counter: c.kind, amount: c.amount, by: controller });
      }
    }
    return id;
  }

  // --- copying spells (storm / cascade / Twincast — ROADMAP Phase 8) -------

  /** Put a copy of the instant/sorcery spell `originalId` onto the stack under
   * `controller` (rule 707.10). The copy keeps the original's targets and
   * `{X}`; it ceases to exist rather than moving off the stack. Returns the
   * copy's id, or `null` if `originalId` isn't a copiable spell. */
  private copyStackSpell(originalId: ObjectId, controller: PlayerId): ObjectId | null {
    const original = this.state.objects[originalId];
    if (
      original === undefined ||
      original.zone !== "stack" ||
      original.kind !== "card"
    ) {
      return null;
    }
    // Permanent-spell copies become token permanents (rule 707.10a) — not
    // modeled yet (Phase 10). Copy only instants/sorceries.
    const def = this.registry.get(printedCardName(original));
    if (this.isPermanentSpell(def)) return null;

    const id = this.mintObjectId();
    this.state.objects[id] = {
      id,
      cardName: printedCardName(original),
      owner: controller,
      controller,
      zone: "stack",
      tapped: false,
      damageMarked: 0,
      markedByDeathtouch: false,
      enteredBattlefieldOnTurn: null,
      summoningSick: false,
      loyaltyActivatedThisTurn: false,
      targets: original.targets ? [...original.targets] : null,
      attacking: null,
      blocking: null,
      blockedBy: [],
      blocked: false,
      kind: "card",
      abilityKind: null,
      sourceObjectId: null,
      abilityIndex: null,
      counters: {},
      modifiers: [],
      timestamp: 0,
      isToken: false,
      isCopy: true,
      attachedTo: null,
      isCommander: false,
      xValue: original.xValue ?? null,
      controlEndsAtCleanup: false,
      copyOf: null,
    };
    this.state.zones.shared.stack.push(id);
    this.emit({ type: "spell-copied", original: originalId, copy: id, controller });
    // The copy is a new spell targeting what the original does, so each of
    // those objects becomes the target of a spell again (rule 707.10) --
    // a Twincast on a Giant Growth triggers Gargos a second time.
    this.announceTargeted(original.targets ?? [], controller, id, true);
    return id;
  }

  /** Storm (rule 702.40a): copy `sourceId` for each spell cast before it this
   * turn (by any player) — the count captured on the spell when it was cast. */
  private stormCopy(sourceId: ObjectId): void {
    const source = this.state.objects[sourceId];
    if (source === undefined) return;
    const n = Math.max(0, source.stormCount ?? 0);
    for (let i = 0; i < n; i += 1) this.copyStackSpell(sourceId, source.controller);
  }

  /** Cascade (rule 702.85e): exile off the top of `controller`'s library until
   * a nonland card with mana value less than the cascade spell's is exiled,
   * then cast it without paying its mana cost. The rest go to the bottom in a
   * random order; the trigger card too if nothing castable turned up. */
  private cascade(controller: PlayerId, sourceId: ObjectId): void {
    const source = this.state.objects[sourceId];
    if (source === undefined) return;
    const threshold = manaValue(parseManaCost(this.registry.get(printedCardName(source)).manaCost));
    const library = this.state.zones.perPlayer[controller].library;
    const exiledHere: ObjectId[] = [];
    let hit: ObjectId | null = null;

    while (library.length > 0) {
      const top = library[0];
      this.moveObject(top, "exile");
      exiledHere.push(top);
      const topDef = this.registry.get(this.state.objects[top].cardName);
      const mv = manaValue(parseManaCost(topDef.manaCost));
      if (!topDef.types.includes("land") && mv < threshold) {
        hit = top;
        break;
      }
    }

    this.emit({ type: "cascade-revealed", player: controller, exiled: [...exiledHere], cast: hit });

    if (hit !== null) {
      const cast = this.castCardWithoutPaying(hit, { via: "cascade", grantHaste: false });
      // No legal targets, or a cost increase it can't pay: it goes to the
      // bottom too.
      if (!cast) hit = null;
    }

    // Everything still in exile from this cascade goes to the bottom of the
    // library in a random order (rule 702.85e).
    const toBottom = exiledHere.filter(
      (id) => id !== hit && this.state.objects[id]?.zone === "exile",
    );
    for (const id of shuffle(toBottom, this.rng)) this.moveObject(id, "library");
    this.state.rngState = this.rng.seed;
  }

  /** Twincast (rule 707.10): copy the instant/sorcery spell `target`. */
  private copySpellByEffect(controller: PlayerId, target: TargetRef): void {
    if (target.kind !== "object") return;
    this.copyStackSpell(target.object, controller);
  }

  /** Attach an Aura/Equipment (`source`) to `target` (used by Equip-like effects). */
  private attachPermanent(source: ObjectId, target: TargetRef): void {
    if (target.kind !== "object") return;
    const targetId = this.splitOneFromStack(target.object);
    const sourceObject = this.state.objects[source];
    const targetObject = this.state.objects[targetId];
    if (sourceObject === undefined || sourceObject.zone !== "battlefield") return;
    if (targetObject === undefined || targetObject.zone !== "battlefield") return;
    // Protection (rule 702.16) — can't be enchanted / equipped by a matching
    // Aura / Equipment.
    if (protectionBlocks(this.state, this.registry, targetId, this.permanentSource(source))) {
      return;
    }
    sourceObject.attachedTo = targetId;
    // An Aura or Equipment gets a new timestamp as it becomes attached (rule
    // 613.7e) — which is what a control-granting Aura moved onto a creature
    // is weighed against the other control effects on it by.
    this.state.timestampSeq += 1;
    sourceObject.timestamp = this.state.timestampSeq;
    invalidateComputedCache();
    this.emit({ type: "permanent-attached", source, target: targetId });
  }

  /** `split: false` (`modifyPtAll`'s per-match loop) hits the whole matched
   * permanent uniformly — a compacted stack is buffed as one. `split: true`
   * (the default — a single *targeted* modify-pt effect) singles one member
   * off a stack first. */
  private modifyPt(
    target: TargetRef,
    power: number,
    toughness: number,
    duration: PtDuration,
    split = true,
  ): void {
    if (target.kind !== "object") return;
    const id = split ? this.splitOneFromStack(target.object) : target.object;
    const object = this.state.objects[id];
    if (object === undefined || object.zone !== "battlefield") return;
    object.modifiers.push({
      power,
      toughness,
      keywords: [],
      untilEndOfTurn: duration === "end-of-turn",
    });
    this.emit({
      type: "pt-modified",
      object: id,
      power,
      toughness,
      duration,
    });
  }

  /** `split: false` (`grantKeywordAll`'s per-match loop) hits the whole
   * matched permanent uniformly. `split: true` (the default — a single
   * *targeted* grant-keyword effect) singles one member off a stack first. */
  private grantKeyword(
    target: TargetRef,
    keyword: Keyword,
    duration: PtDuration,
    split = true,
  ): void {
    if (target.kind !== "object") return;
    const id = split ? this.splitOneFromStack(target.object) : target.object;
    const object = this.state.objects[id];
    if (object === undefined || object.zone !== "battlefield") return;
    object.modifiers.push({
      power: 0,
      toughness: 0,
      keywords: [keyword],
      untilEndOfTurn: duration === "end-of-turn",
    });
    this.emit({
      type: "keyword-granted",
      object: id,
      keyword,
      duration,
    });
  }

  /** Which battlefield permanents a mass P/T / keyword effect (Overrun) hits —
   * `matchesFilter` from the effect's controller's perspective. */
  private battlefieldMatching(you: PlayerId, filter: CardFilter): ObjectId[] {
    return this.state.zones.shared.battlefield.filter((id) =>
      matchesFilter(this.state, this.registry, id, filter, { you }),
    );
  }

  /** How many permanents match `filter` — not how many objects: a compacted
   * token stack counts once per token in it (`GameObject.stackCount`). Every
   * "for each Goblin you control" goes through here; counting objects instead
   * had Krenko, Mob Boss making two tokens a turn forever once his first
   * few folded into a stack. */
  private countBattlefieldMatching(
    you: PlayerId,
    filter: CardFilter,
    except: readonly ObjectId[] = [],
  ): number {
    if (except.length === 0) {
      return permanentCount(this.state, this.battlefieldMatching(you, filter));
    }
    return weightedMatches(
      this.state,
      this.state.zones.shared.battlefield,
      (id) => matchesFilter(this.state, this.registry, id, filter, { you }),
      except,
    ).reduce((n, m) => n + m.weight, 0);
  }

  /** A sum or maximum over the permanents matching `spec.filter` from
   * `you`'s perspective — see {@link AggregateSpec}. `except` leaves one
   * permanent apiece out ("other creatures you control"). */
  private aggregateBattlefield(
    you: PlayerId,
    spec: AggregateSpec,
    except: readonly ObjectId[] = [],
  ): number {
    const matches = weightedMatches(
      this.state,
      this.state.zones.shared.battlefield,
      (id) => matchesFilter(this.state, this.registry, id, spec.filter, { you }),
      except,
    );
    return aggregateOver(this.state, this.registry, matches, spec.aggregate, spec.of);
  }

  /** The generic mana a `CostReductionAmount` takes off, for `player`, with
   * `sourceId` the object doing the reducing (for `countersOnSource`). */
  private costReductionAmount(
    amount: CostReductionAmount,
    player: PlayerId,
    sourceId?: ObjectId,
  ): number {
    if (typeof amount === "number") return amount;
    if ("countOf" in amount) return this.countBattlefieldMatching(player, amount.countOf);
    if ("aggregate" in amount) {
      // Ghalta's "X is the total power of creatures you control". Clamped at
      // 0: a negative total doesn't make the spell cost more (rule 107.1b).
      const except = amount.excludeSelf === true && sourceId !== undefined ? [sourceId] : [];
      return Math.max(0, this.aggregateBattlefield(player, amount, except));
    }
    if ("countersOnSource" in amount) {
      if (sourceId === undefined) return 0;
      return this.state.objects[sourceId]?.counters[amount.countersOnSource] ?? 0;
    }
    if ("playerCounters" in amount) {
      return this.state.players[player]?.counters[amount.playerCounters] ?? 0;
    }
    return this.state.zones.perPlayer[player].graveyard.filter((id) =>
      matchesFilter(this.state, this.registry, id, amount.cardsInGraveyard, { you: player }),
    ).length;
  }

  private modifyPtAll(
    you: PlayerId,
    filter: CardFilter,
    power: number,
    toughness: number,
    duration: PtDuration,
    except?: ObjectId,
  ): void {
    for (const id of this.battlefieldMatching(you, filter)) {
      if (id === except) continue;
      this.modifyPt({ kind: "object", object: id }, power, toughness, duration, false);
    }
  }

  private doublePtAll(you: PlayerId, filter: CardFilter, duration: PtDuration): void {
    // Each matching permanent's *own* current P/T, read individually — a 2/2
    // and a 5/5 both matching become a 4/4 and a 10/10, not identical stats
    // (unlike `modifyPtAll`'s single shared amount).
    for (const id of this.battlefieldMatching(you, filter)) {
      const c = computeCharacteristics(this.state, this.registry, id);
      this.modifyPt({ kind: "object", object: id }, c.power, c.toughness, duration, false);
    }
  }

  private doubleCountersAll(you: PlayerId, filter: CardFilter, counterKind: string): void {
    for (const id of this.battlefieldMatching(you, filter)) {
      const current = this.state.objects[id].counters[counterKind] ?? 0;
      if (current > 0) this.addCounter({ kind: "object", object: id }, counterKind, current, false, you);
    }
  }

  /** Attach a triggered ability to one permanent — see the
   * `"grant-triggered"` {@link EffectSpec}. The ability rides on a modifier,
   * so an `"end-of-turn"` grant expires with the rest of them and
   * `effectiveTriggered` picks it up in the meantime. */
  private grantTriggered(
    target: TargetRef,
    ability: TriggeredAbility,
    duration: PtDuration,
  ): void {
    if (target.kind !== "object") return;
    const id = this.splitOneFromStack(target.object);
    const object = this.state.objects[id];
    if (object === undefined || object.zone !== "battlefield") return;
    object.modifiers.push({
      power: 0,
      toughness: 0,
      keywords: [],
      grantsTriggered: [ability],
      untilEndOfTurn: duration === "end-of-turn",
    });
  }

  private grantKeywordAll(
    you: PlayerId,
    filter: CardFilter,
    keyword: Keyword,
    duration: PtDuration,
    except?: ObjectId,
  ): void {
    for (const id of this.battlefieldMatching(you, filter)) {
      if (id === except) continue;
      this.grantKeyword({ kind: "object", object: id }, keyword, duration, false);
    }
  }

  /** A permanent becomes a creature via a single modifier spanning layers 4
   * (types/subtypes), 5 (`setColors`), 6 (`keywords` / `loseAbilities`) and
   * 7b (set P/T). A man-land adds a type and keeps its printed types; Turn to
   * Frog replaces the subtypes, sets the colour, and strips abilities. */
  private animate(
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
    split = true,
  ): void {
    if (target.kind !== "object") return;
    const id = split ? this.splitOneFromStack(target.object) : target.object;
    const object = this.state.objects[id];
    if (object === undefined || object.zone !== "battlefield") return;
    object.modifiers.push({
      // Ordered against type-granting and P/T-setting statics (rule 613.7).
      timestamp: this.state.timestampSeq,
      power: 0,
      toughness: 0,
      keywords: [...opts.keywords],
      addTypes: [...opts.addTypes],
      addSubtypes: [...opts.addSubtypes],
      ...(opts.setSubtypes ? { setSubtypes: [...opts.setSubtypes] } : {}),
      ...(opts.setColors ? { setColors: [...opts.setColors] } : {}),
      ...(opts.loseAbilities ? { loseAbilities: true } : {}),
      setPt: [opts.power, opts.toughness],
      untilEndOfTurn: opts.duration === "end-of-turn",
    });
    this.emit({
      type: "permanent-animated",
      object: id,
      power: opts.power,
      toughness: opts.toughness,
      duration: opts.duration,
    });
  }

  /** See the `"add-types"` {@link EffectSpec}: layer 4 alone. */
  private addTypes(
    target: TargetRef,
    types: readonly CardType[],
    subtypes: readonly string[],
    duration: PtDuration,
  ): void {
    if (target.kind !== "object" || (types.length === 0 && subtypes.length === 0)) return;
    const id = this.splitOneFromStack(target.object);
    const object = this.state.objects[id];
    if (object === undefined || object.zone !== "battlefield") return;
    object.modifiers.push({
      // Ordered against type-granting statics (rule 613.7).
      timestamp: this.state.timestampSeq,
      power: 0,
      toughness: 0,
      keywords: [],
      addTypes: [...types],
      addSubtypes: [...subtypes],
      untilEndOfTurn: duration === "end-of-turn",
    });
    this.emit({ type: "types-added", object: id, types: [...types], subtypes: [...subtypes], duration });
  }

  /** The front face's `CardDefinition` for `id`'s card — resolves through
   * `faces[0]` for a multi-face card. Used to read the shared `transform` flag
   * and daybound/nightbound keywords regardless of which face is up. */
  private frontFaceDef(id: ObjectId): CardDefinition {
    const object = this.state.objects[id];
    const own = this.registry.get(object.cardName);
    return own.faces !== null ? this.registry.get(own.faces[0]) : own;
  }

  /** Is `id` a transforming double-faced permanent (rule 712.4)? — only these
   * can be turned over by a `transform` effect / a day-night change. */
  private isTransformingDfc(id: ObjectId): boolean {
    const object = this.state.objects[id];
    return (
      object.faces !== undefined &&
      object.faces.length >= 2 &&
      this.frontFaceDef(id).transform
    );
  }

  /**
   * Transform `id` (rule 701.28) — turn a transforming DFC permanent over to
   * its other face. Same object, same timestamp, same counters / attachments
   * (rule 712.10); characteristics recompute through `faceName`. A no-op for
   * anything that isn't a transforming DFC on the battlefield.
   */
  private transformPermanent(id: ObjectId): void {
    const object = this.state.objects[id];
    if (object === undefined || object.zone !== "battlefield") return;
    if (!this.isTransformingDfc(id)) return;
    object.face = (object.face ?? 0) === 0 ? 1 : 0;
    this.emit({
      type: "permanent-transformed",
      object: id,
      face: object.face,
      front: object.face === 0,
    });
  }

  /**
   * The game becomes day or night (rule 726). Idempotent. As it changes, every
   * daybound permanent transforms to its nightbound face (→ night) and every
   * nightbound permanent transforms back (→ day) — rule 702.145e.
   */
  private setDayNight(value: "day" | "night"): void {
    if (this.state.dayNight === value) return;
    this.state.dayNight = value;
    this.emit({ type: "day-night-changed", value });
    for (const id of [...this.state.zones.shared.battlefield]) {
      const object = this.state.objects[id];
      if (object === undefined) continue;
      const front = this.frontFaceDef(id);
      if (!front.transform || !front.keywords.includes("daybound")) continue;
      if (value === "night" && (object.face ?? 0) === 0) this.transformPermanent(id);
      else if (value === "day" && (object.face ?? 0) === 1) this.transformPermanent(id);
    }
  }

  /** Begin a text-changing effect (Artificial Evolution — layer 3): raise a
   * `choose-text` decision offering the target's current creature subtypes as
   * the word to replace. Nothing to replace ⇒ the effect does nothing. */
  private beginTextChoice(
    player: PlayerId,
    source: ObjectId,
    target: TargetRef,
  ): void {
    if (target.kind !== "object") return;
    const id = this.splitOneFromStack(target.object);
    const object = this.state.objects[id];
    if (object === undefined || object.zone !== "battlefield") return;
    const fromOptions = effectiveSubtypes(this.state, this.registry, object).filter((s) =>
      CHANGEABLE_CREATURE_TYPES.includes(s),
    );
    if (fromOptions.length === 0) return;
    this.state.awaiting = {
      kind: "choose-text",
      player,
      // The spell asking (Artificial Evolution), not the creature being
      // renamed — that is `target`. These were both `id`, so the prompt named
      // the creature as the reason it was being asked about the creature.
      source,
      target: id,
      fromOptions,
      // The new type can't be Wall (rule text), nor a word already present.
      toOptions: CHANGEABLE_CREATURE_TYPES.filter(
        (t) => t !== "Wall" && !fromOptions.includes(t),
      ),
    };
  }

  /** Answer a pending `choose-text` decision (Artificial Evolution). */
  private applyTextChoice(player: PlayerId, from: string, to: string): void {
    const why = this.whyCannotTextChoice(player, from, to);
    if (why !== null) throw new Error(why);
    const awaiting = this.state.awaiting;
    if (awaiting === null || awaiting.kind !== "choose-text") {
      throw new Error("unreachable: whyCannotTextChoice should have caught this");
    }
    const object = this.state.objects[awaiting.target];
    if (object !== undefined && object.zone === "battlefield") {
      object.modifiers.push({
        power: 0,
        toughness: 0,
        keywords: [],
        textSubstitution: { from, to },
        untilEndOfTurn: false,
      });
      this.emit({ type: "text-changed", object: awaiting.target, from, to });
    }
    this.state.awaiting = null;
    this.prepareForPriority(this.activePlayer);
  }

  /** Kept because `applyTextChoice` validates before applying and throws;
   * the rules live in `decisions/choose-text.ts`. */
  private whyCannotTextChoice(
    player: PlayerId,
    from: string,
    to: string,
  ): string | null {
    return chooseText.whyCannot(
      this.decisionCtx,
      { type: "choose-text", player, from, to },
      player,
    );
  }

  /** `split: false` (a counters-on-*each* effect) changes a compacted token
   * stack uniformly; the default singles one member out, for anything that
   * names one permanent. */
  /** Put `amount` counters on a permanent. `by` is the player putting them
   * (Hapatra's "whenever **you** put one or more -1/-1 counters on a
   * creature") — the controller of the effect doing it, which defaults to
   * the permanent's own controller. */
  private addCounter(
    target: TargetRef,
    counter: string,
    amount: number,
    split = true,
    by?: PlayerId,
  ): void {
    if (target.kind !== "object") return;
    const id = split ? this.splitOneFromStack(target.object) : target.object;
    const object = this.state.objects[id];
    if (object === undefined || object.zone !== "battlefield") return;
    // Doubling Season (rule 614): "twice that many counters instead" — only
    // when counters are being *added*, never a removal.
    const total = amount > 0 ? amount * this.counterMultiplier(id, counter) : amount;
    object.counters[counter] = (object.counters[counter] ?? 0) + total;
    this.emit({ type: "counter-added", object: id, counter, amount: total, by: by ?? object.controller });
  }

  /**
   * Everything that could be proliferated right now (rule 701.27a): every
   * battlefield permanent carrying at least one counter, in battlefield
   * order, then every player still in the game with a counter — energy,
   * poison or experience (rule 122: those are counters a player has, and
   * proliferate reaches them as well as permanents).
   */
  private proliferateTargets(): TargetRef[] {
    const out: TargetRef[] = [];
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      if (Object.values(object.counters).some((n) => n > 0)) {
        out.push({ kind: "object", object: id });
      }
    }
    for (const player of this.state.turnOrder) {
      const ps = this.state.players[player];
      if (ps.hasLost) continue;
      if (ps.energy > 0 || Object.values(ps.counters).some((n) => (n ?? 0) > 0)) {
        out.push({ kind: "player", player });
      }
    }
    return out;
  }

  /**
   * Proliferate (rule 701.27) — see the `"proliferate"` {@link EffectSpec}.
   *
   * Raises a decision rather than acting, because "choose **any number** of
   * permanents and/or players" is the card. This used to add a counter to
   * every permanent on the battlefield, so Atraxa grew the opponents' board
   * and refilled their planeswalkers every end step; that isn't a weaker
   * version of proliferate, it's a sometimes-harmful different one.
   *
   * Nothing eligible means no choice worth asking about, so `then` runs
   * straight away — the same shortcut `beginScry` takes on an empty library.
   */
  private beginProliferate(source: ObjectId, player: PlayerId, x: number, then: EffectSpec | null): void {
    const eligible = this.proliferateTargets();
    if (eligible.length === 0) {
      if (then !== null) {
        applyEffectSpec(then, this.makeResolutionContext(source, player, [], x));
      }
      return;
    }
    this.state.awaiting = { kind: "proliferate", player, eligible, then, source, x };
  }

  /** Answers a pending `proliferate` decision. */
  private applyProliferate(player: PlayerId, chosen: readonly TargetRef[]): void {
    const why = this.whyCannotProliferate(player, chosen);
    if (why !== null) throw new Error(why);
    const awaiting = this.state.awaiting;
    if (awaiting === null || awaiting.kind !== "proliferate") {
      throw new Error("unreachable: whyCannotProliferate should have caught this");
    }
    const { then, source, x } = awaiting;
    this.state.awaiting = null;

    for (const target of chosen) {
      if (target.kind === "player") {
        // One more of each kind the player already has.
        const ps = this.state.players[target.player];
        if (ps === undefined || ps.hasLost) continue;
        if (ps.energy > 0) this.changeEnergy(target.player, 1);
        for (const kind of Object.keys(ps.counters) as PlayerCounterKind[]) {
          if ((ps.counters[kind] ?? 0) > 0) this.changePlayerCounters(target.player, kind, 1);
        }
        continue;
      }
      const object = this.state.objects[target.object];
      // Re-checked rather than trusted: the choice was made against the board
      // as it was when the decision went up, and a permanent can leave in
      // between (a sacrifice the same effect queued, say).
      if (object === undefined || object.zone !== "battlefield") continue;
      for (const kind of Object.keys(object.counters)) {
        if (object.counters[kind] > 0) {
          object.counters[kind] += 1;
          this.emit({ type: "counter-added", object: target.object, counter: kind, amount: 1, by: player });
        }
      }
    }
    this.emit({ type: "proliferated", player, count: chosen.length });

    if (then !== null) {
      applyEffectSpec(then, this.makeResolutionContext(source, player, [], x));
    }
    if (this.state.awaiting === null) this.prepareForPriority(this.activePlayer);
  }

  /** Kept because `applyProliferate` validates before applying and throws;
   * the rules live in `decisions/proliferate.ts`. */
  private whyCannotProliferate(
    player: PlayerId,
    chosen: readonly TargetRef[],
  ): string | null {
    return proliferate.whyCannot(
      this.decisionCtx,
      { type: "proliferate", player, chosen },
      player,
    );
  }

  private setTapped(target: TargetRef, tapped: boolean): void {
    if (target.kind !== "object") return;
    const before = this.state.objects[target.object];
    if (before === undefined || before.zone !== "battlefield") return;
    if (before.tapped === tapped) return;
    // Tapping/untapping just this one (as opposed to a mass "untap all"
    // effect, which mutates a stack directly and never reaches here) singles
    // it out from the rest of a compacted stack.
    const id = this.splitOneFromStack(target.object);
    const object = this.state.objects[id];
    object.tapped = tapped;
    this.emit(
      tapped
        ? { type: "permanent-tapped", object: id }
        : { type: "permanent-untapped", object: id },
    );
  }

  /** `split: false` (destroy-*all* draining `pendingDestruction`) hits the
   * whole matched permanent uniformly — a compacted stack goes wholesale.
   * `split: true` (the default — a single *targeted* destroy effect) singles
   * one member off a stack first. */
  private destroyByEffect(target: TargetRef, split = true): void {
    if (target.kind !== "object") return;
    const id = split ? this.splitOneFromStack(target.object) : target.object;
    const object = this.state.objects[id];
    if (object === undefined || object.zone !== "battlefield") return;
    if (this.objHasKeyword(id, "indestructible")) {
      this.emit({
        type: "permanent-destroy-prevented",
        object: id,
        reason: "indestructible",
      });
      return;
    }
    // A commander's move can be deferred for its owner's 903.9a choice —
    // `applyCommanderChoice` finishes it (and emits `permanent-destroyed`
    // itself if it lands in a graveyard).
    if (!this.moveObject(id, "graveyard")) return;
    this.emit({
      type: "permanent-destroyed",
      object: id,
      reason: "destroyed",
    });
  }

  /** Destroy every battlefield permanent matching `filter` (Wrath of God),
   * all at once (see `drainPendingDestruction`). The victims are queued so
   * that a wipe begun while another decision is being answered waits for it
   * rather than dropping anyone — the `prepareForPriority` fixpoint drains
   * the queue. */
  private destroyAllByEffect(
    you: PlayerId,
    filter: CardFilter,
    damagedBy?: ObjectId,
    x = 0,
  ): void {
    // Steel Hellkite: only permanents controlled by a player this source hit
    // in combat this turn. Read off the source rather than a filter clause,
    // because it's a fact about the source.
    const damagedPlayers =
      damagedBy === undefined
        ? null
        : (this.state.objects[damagedBy]?.combatDamagedPlayersThisTurn ?? []);
    for (const id of [...this.state.zones.shared.battlefield]) {
      if (
        damagedPlayers !== null &&
        !damagedPlayers.includes(this.state.objects[id].controller)
      ) {
        continue;
      }
      if (matchesFilter(this.state, this.registry, id, filter, { you, x })) {
        this.state.pendingDestruction.push(id);
      }
    }
    this.drainPendingDestruction();
  }

  /** `exile-all` — the mass form of `exileByEffect`, as one event (rule
   * 603.10a), a token stack exiled whole rather than one token of it. */
  private exileAllByEffect(you: PlayerId, filter: CardFilter): void {
    this.withLeaveBatch(() => {
      const victims = this.battlefieldMatching(you, filter);
      this.snapshotLeaving(victims);
      for (const id of victims) this.exileByEffect({ kind: "object", object: id }, undefined, false);
    });
  }

  private returnToHandAllByEffect(you: PlayerId, filter: CardFilter): void {
    // One event, so each bounced permanent's leaves-the-battlefield ability
    // sees the rest go too (rule 603.10a). Snapshot: `returnToHandByEffect`
    // mutates the battlefield array as it goes.
    this.withLeaveBatch(() => {
      const victims = this.battlefieldMatching(you, filter);
      this.snapshotLeaving(victims);
      for (const id of victims) {
        this.returnToHandByEffect({ kind: "object", object: id }, false);
      }
    });
  }

  /**
   * Destroy everything queued, as **one** event: the victims of a wrath are
   * destroyed simultaneously, so each one's dies trigger sees all the others
   * die (rule 603.10a — Zulaport Cutthroat and two Bears under one Wrath of
   * God drain three times, whichever the engine moves first).
   *
   * A commander among them doesn't stop the rest. Its owner's 903.9a choice
   * waits in the commander queue, and the move it completes still counts as
   * part of this event (`withLeaveBatch`'s `leftWith`). The queue only waits
   * as a whole for a decision that was already being answered when the wipe
   * began.
   */
  private drainPendingDestruction(): void {
    if (this.state.awaiting !== null) return;
    this.withLeaveBatch(() => {
      this.snapshotLeaving(this.state.pendingDestruction);
      while (this.state.pendingDestruction.length > 0) {
        const id = this.state.pendingDestruction.shift() as ObjectId;
        const object = this.state.objects[id];
        if (object === undefined || object.zone !== "battlefield") continue;
        this.destroyByEffect({ kind: "object", object: id }, false);
      }
    });
  }

  /** Deal `amount` damage to every battlefield permanent matching `filter`
   * (Pyroclasm). SBAs sweep the dead afterwards. */
  private damageAllByEffect(
    source: ObjectId,
    you: PlayerId,
    filter: CardFilter,
    amount: number,
    exceptSource = false,
    sourceLastKnown?: LastKnownInfo,
  ): void {
    if (amount <= 0) return;
    this.withDamageBatch(() => {
      for (const id of [...this.state.zones.shared.battlefield]) {
        if (exceptSource && id === source) continue;
        if (matchesFilter(this.state, this.registry, id, filter, { you })) {
          this.dealDamage(source, { kind: "object", object: id }, amount, false, sourceLastKnown);
        }
      }
    });
  }

  /** Every battlefield permanent matching `filter` deals `amount` damage to
   * its own controller (Rakdos Charm — needed-cards P20). Each permanent is
   * its own damage source; snapshot the battlefield first since dealing
   * damage can trigger SBAs mid-loop. */
  private creaturesDamageControllersByEffect(
    you: PlayerId,
    filter: CardFilter,
    amount: number,
  ): void {
    if (amount <= 0) return;
    for (const id of [...this.state.zones.shared.battlefield]) {
      if (matchesFilter(this.state, this.registry, id, filter, { you })) {
        const controller = this.state.objects[id]?.controller;
        if (controller === undefined) continue;
        // Each creature is its own source (lifelink, prevention), so a token
        // stack deals its damage once per token in it.
        const sources = Math.min(this.state.objects[id].stackCount ?? 1, Game.MAX_EFFECT_INSTANCES);
        for (let i = 0; i < sources; i += 1) {
          this.dealDamage(id, { kind: "player", player: controller }, amount);
        }
      }
    }
  }

  // --- sacrifice as an effect (edicts) -----------------------------

  /** Queue a sacrifice effect (Diabolic Edict / Fleshbag Marauder). Each
   * affected player who controls a matching permanent is owed a decision;
   * `promptNextSacrifice` (run in the `prepareForPriority` fixpoint) resolves
   * them one at a time, APNAP-ordered, auto-resolving where there's no choice. */
  private sacrificeByEffect(
    controller: PlayerId,
    who: PlayerScope | { readonly player: PlayerId },
    filter: CardFilter,
    count: number,
    exceptId?: ObjectId,
  ): void {
    if (count <= 0) return;
    let players: PlayerId[];
    if (typeof who === "object") {
      players = [who.player];
    } else {
      // APNAP: active player first, then the rest in turn order.
      const active = this.state.turnOrder.indexOf(this.activePlayer);
      const rotated = [
        ...this.state.turnOrder.slice(active),
        ...this.state.turnOrder.slice(0, active),
      ];
      players =
        who === "you"
          ? [controller]
          : rotated.filter(
              (p) =>
                !this.state.players[p].hasLost &&
                (who === "each-player" || p !== controller),
            );
    }
    // The prompt is raised a whole fixpoint iteration later, by which time the
    // edict has left the stack — carry what ordered it along so the player
    // being asked can still be told why (see `GameState.decisionSource`).
    const source = this.state.decisionSource;
    for (const player of players) {
      if (this.eligibleSacrifices(player, filter, exceptId).length > 0) {
        this.state.pendingSacrifices.push({
          player,
          filter,
          count,
          ...(exceptId !== undefined ? { exceptId } : {}),
          ...(source !== null ? { source } : {}),
        });
      }
    }
  }

  /**
   * "Sacrifice ~" naming the effect's own source (Defense of the Heart), as
   * opposed to the choice-raising {@link sacrificeByEffect}. Immediate, like a
   * sacrifice paid as a cost — there's nothing to choose (rule 701.17).
   * Returns whether it happened: `false` if the source already left the
   * battlefield, which is what gates an "if you do" tail. needed-cards P7.
   */
  private sacrificeSourceByEffect(source: ObjectId): boolean {
    const object = this.state.objects[source];
    if (object === undefined || object.zone !== "battlefield") return false;
    // Its controller sacrifices it (rule 701.21a) — read before the move
    // hands it back to its owner.
    const sacrificer = object.controller;
    this.moveObject(source, "graveyard");
    // A commander's 903.9a choice defers the move (`moveObject` returns with
    // the permanent still on the battlefield and a decision raised). Nothing
    // has been sacrificed yet, and running an "if you do" tail here would
    // clobber that pending decision — so report "didn't happen". Narrow
    // documented gap: a commander with a `sacrifice-source` ability skips its
    // own tail. No pool card is both.
    if (this.state.awaiting !== null) return false;
    this.emit({ type: "permanent-sacrificed", object: source, player: sacrificer });
    return true;
  }

  /** Permanents `player` controls that match `filter` (they can only ever
   * sacrifice their own — rule 701.16a), excluding `exceptId` ("another"). */
  private eligibleSacrifices(
    player: PlayerId,
    filter: CardFilter,
    exceptId?: ObjectId,
  ): ObjectId[] {
    return this.state.zones.shared.battlefield.filter(
      (id) =>
        id !== exceptId &&
        this.state.objects[id].controller === player &&
        matchesFilter(this.state, this.registry, id, filter, { you: player }),
    );
  }

  /** Drain `pendingSacrifices`: for each player, auto-sacrifice when there's
   * no choice, otherwise raise a `sacrifice` decision and stop. */
  private promptNextSacrifice(): void {
    while (this.state.pendingSacrifices.length > 0) {
      const next = this.state.pendingSacrifices[0];
      const eligible = this.eligibleSacrifices(next.player, next.filter, next.exceptId);
      if (eligible.length === 0) {
        this.state.pendingSacrifices = this.state.pendingSacrifices.slice(1);
        continue;
      }
      // "No real choice" means not enough *creatures* to exceed what's owed —
      // a compacted stack among `eligible` counts for its whole `stackCount`,
      // not as 1 (otherwise a stack of 10 could get wholesale-sacrificed to
      // pay a Diabolic-Edict-style "sacrifice 1").
      const totalEligible = eligible.reduce(
        (sum, id) => sum + (this.state.objects[id].stackCount ?? 1),
        0,
      );
      if (totalEligible <= next.count) {
        for (const id of eligible) {
          this.state.pendingSacrificeVictims.push({ player: next.player, object: id });
        }
        this.state.pendingSacrifices = this.state.pendingSacrifices.slice(1);
        continue;
      }
      this.state.awaiting = {
        kind: "sacrifice",
        player: next.player,
        count: next.count,
        eligible,
      };
      this.state.decisionSource = next.source ?? null;
      this.state.pendingSacrifices = this.state.pendingSacrifices.slice(1);
      return;
    }
  }

  /**
   * Move the queued sacrifice victims to the graveyard — every player's at
   * once, since an edict's players choose in turn and then sacrifice
   * simultaneously (rule 101.4), which is why `prepareForPriority` asks
   * everyone before draining this. One event, so each sacrificed permanent's
   * dies trigger sees the others (rule 603.10a). A commander among them
   * waits for its 903.9a choice without holding up the rest.
   */
  private drainPendingSacrificeVictims(): void {
    if (this.state.awaiting !== null) return;
    this.withLeaveBatch(() => {
      this.snapshotLeaving(this.state.pendingSacrificeVictims.map((v) => v.object));
      while (this.state.pendingSacrificeVictims.length > 0) {
        const next = this.state.pendingSacrificeVictims[0];
        this.state.pendingSacrificeVictims = this.state.pendingSacrificeVictims.slice(1);
        const object = this.state.objects[next.object];
        if (object === undefined || object.zone !== "battlefield") continue;
        this.moveObject(next.object, "graveyard");
        // Sacrificed either way (rule 701.21a) — see `sacrificeTarget`.
        this.emit({ type: "permanent-sacrificed", object: next.object, player: next.player });
      }
    });
  }

  /** Answers a pending `sacrifice` decision. */
  private applySacrifice(player: PlayerId, permanents: readonly ObjectId[]): void {
    const why = this.whyCannotSacrifice(player, permanents);
    if (why !== null) throw new Error(why);
    this.state.awaiting = null;
    for (const id of permanents) {
      // A specific chosen sacrifice singles out one — split it off a
      // compacted stack (the "sacrifice everything eligible, no choice" path
      // in `promptNextSacrifice` sacrifices a whole matched stack directly).
      this.state.pendingSacrificeVictims.push({ player, object: this.splitOneFromStack(id) });
    }
    this.prepareForPriority(this.activePlayer);
  }

  /** Kept because `applySacrifice` validates before applying and throws;
   * the rules live in `decisions/sacrifice.ts`. */
  private whyCannotSacrifice(
    player: PlayerId,
    permanents: readonly ObjectId[],
  ): string | null {
    return sacrifice.whyCannot(
      this.decisionCtx,
      { type: "sacrifice", player, permanents },
      player,
    );
  }

  /** `split: false` (a return-*all*) moves a compacted token stack whole —
   * every token in it goes, not one; the default singles one member out. */
  private returnToHandByEffect(
    target: TargetRef,
    split = true,
    from: ReturnToHandZone = "battlefield",
    resolving?: ObjectId,
  ): void {
    if (target.kind !== "object") return;
    if (from !== "battlefield") {
      this.returnCardToHand(target.object, from, resolving);
      return;
    }
    const id = split ? this.splitOneFromStack(target.object) : target.object;
    const object = this.state.objects[id];
    if (object === undefined || object.zone !== "battlefield") return;
    // A token would just be swept by SBAs; a commander may be redirected to
    // the command zone via a deferred 903.9a choice — both handled downstream.
    const owner = object.owner;
    if (!this.moveObject(id, "hand")) return;
    this.emit({ type: "permanent-returned-to-hand", object: id, owner });
  }

  /**
   * `return-to-hand` from a graveyard, exile or the stack — see the effect's
   * `from`. The object has to be a card still in that zone.
   *
   * From the stack it's a spell going back to its owner's hand
   * (Unsubstantiate, Venser, Shaper Savant), which is not countering it:
   * `counterObject`'s "can't be countered" check deliberately doesn't apply,
   * and no `spell-countered` is emitted. (Remand is a counter instead — the
   * `counter` effect's `into: "hand"`.) The
   * spell that is itself resolving is skipped — it is about to finish
   * resolving and move on its own, and moving it first would leave its
   * resolution to move a card that's already in a hand. A copy of a spell ceases to exist rather
   * than going anywhere (rule 707.10c), the same as a fizzled one.
   */
  private returnCardToHand(
    id: ObjectId,
    from: Exclude<ReturnToHandZone, "battlefield">,
    resolving: ObjectId | undefined,
  ): void {
    const object = this.state.objects[id];
    if (object === undefined || object.zone !== from || object.kind !== "card") return;
    if (from === "stack") {
      // Whatever is resolving sits on top of the stack until it's done. The
      // effect's source on top is a spell returning *itself*; a source lower
      // down is a spell a triggered ability of its own is acting on ("when
      // you cast this spell, …"), which is fair game.
      const stack = this.state.zones.shared.stack;
      if (id === resolving && stack[stack.length - 1] === id) return;
      if (object.isCopy) {
        const index = stack.indexOf(id);
        if (index >= 0) stack.splice(index, 1);
        delete this.state.objects[id];
        return;
      }
      // It will never resolve now, so it has nothing left to aim at — the
      // same thing `counterObject` does on the way to the graveyard.
      object.targets = null;
    }
    const owner = object.owner;
    // A commander may go to the command zone instead (rule 903.9b) — asked
    // by `moveObject`, which returns `false` while that choice is pending.
    if (!this.moveObject(id, "hand")) return;
    // A flashed-back spell is exiled instead (rule 702.34a) — not a return.
    if (this.state.objects[id]?.zone !== "hand") return;
    this.emit({ type: "permanent-returned-to-hand", object: id, owner, from });
  }

  /**
   * Put a targeted card onto the battlefield (Gravespawn Sovereign). Unlike
   * `return-from-graveyard`, which filters over the resolving player's own
   * graveyard, this names one card and may take it from anyone's.
   *
   * `underYourControl` sets `controller` away from `owner` — the card still
   * belongs to whoever owned it, and goes back to *their* graveyard when it
   * dies, which is why owner and controller have to diverge here rather than
   * the object simply changing hands. `runStateBasedActions` recomputes
   * control (layer 2) afterwards, and the control effect recorded here is
   * what keeps it there.
   */
  private putOntoBattlefieldByEffect(
    target: TargetRef,
    controller: PlayerId,
    underYourControl: boolean,
    enterTapped: boolean,
    withCounters?: { readonly kind: string; readonly amount: number },
    exileIfItWouldLeave = false,
  ): void {
    if (target.kind !== "object") return;
    const object = this.state.objects[target.object];
    // Only from a zone a card can be reanimated out of; a permanent already
    // on the battlefield isn't put onto it again.
    if (object === undefined || object.zone === "battlefield") return;
    this.moveObject(target.object, "battlefield", {
      tapped: enterTapped,
      ...(underYourControl ? { under: controller } : {}),
    });
    const entered = this.state.objects[target.object];
    if (entered === undefined || entered.zone !== "battlefield") return;
    if (underYourControl && entered.controller !== controller) {
      // Layer 2 recomputes control every SBA pass and reverts to the owner
      // unless a control *effect* says otherwise, so this has to go through
      // the same path `gain-control` uses rather than just assigning.
      this.gainControlByEffect(controller, { kind: "object", object: target.object }, false);
      entered.summoningSick = true;
    }
    // Set after the move, which clears it: this is the permanent it follows.
    if (exileIfItWouldLeave) entered.exileIfItWouldLeave = true;
    if (withCounters !== undefined) {
      this.addCounter(target, withCounters.kind, withCounters.amount, true, controller);
    }
    this.emit({ type: "permanent-entered-battlefield", object: target.object });
  }

  private exileByEffect(target: TargetRef, exiledBy?: ObjectId, split = true): void {
    if (target.kind !== "object") return;
    const id = split ? this.splitOneFromStack(target.object) : target.object;
    const object = this.state.objects[id];
    // Graveyard as well as battlefield: "Exile target card from a graveyard"
    // (Withered Wretch, Scavenging Ooze) targets a card, not a permanent.
    // Anything already in exile, or on the stack, is left alone.
    if (object === undefined) return;
    if (object.zone !== "battlefield" && object.zone !== "graveyard") return;
    const wasPermanent = object.zone === "battlefield";
    if (!this.moveObject(id, "exile")) {
      // A commander's 903.9a choice deferred the move. The O-Ring's link
      // waits with it, for `applyCommanderChoice` to set if the card really
      // goes to exile — without it, the commander stayed exiled for good once
      // the O-Ring left.
      if (exiledBy !== undefined) this.linkDeferredExile(id, exiledBy);
      return;
    }
    // After the move: `moveObject` clears zone-scoped state on the way out,
    // and this link has to survive until the O-Ring itself leaves.
    if (exiledBy !== undefined && this.state.objects[id]?.zone === "exile") {
      this.state.objects[id].exiledBy = exiledBy;
    }
    // The event is about a permanent leaving the battlefield; a graveyard
    // card being exiled isn't one, and the log formatters read it that way.
    if (wasPermanent) this.emit({ type: "permanent-exiled", object: id });
  }

  /** Carry an O-Ring's "until this leaves" link on a commander's deferred
   * move to exile (`exileByEffect`) — wherever that move is waiting. */
  private linkDeferredExile(commander: ObjectId, exiledBy: ObjectId): void {
    const state = this.state;
    if (state.deferredCommanderMove?.commander === commander) {
      state.deferredCommanderMove = { ...state.deferredCommanderMove, exiledBy };
      return;
    }
    state.pendingCommanderMoves = state.pendingCommanderMoves.map((move) =>
      move.commander === commander ? { ...move, exiledBy } : move,
    );
  }

  /** "Blink": exile permanents, then return them to the battlefield (rule
   * 400.7 — needed-cards P9). Every target is exiled first and they come back
   * together, so each one's enters triggers see the others already there. A
   * token exiled this way ceases to exist (rule 111.7) and is never brought
   * back.
   *
   * With `returnAt` the return is a delayed triggered ability instead (Norin
   * the Wary), linked to this exile by a fresh `flickerLink` stamped on each
   * card (rule 610.3); nothing is set up when nothing was exiled, which is
   * what makes a second Norin trigger in one turn do nothing.
   *
   * A commander's 903.9a choice is raised by the exile half and has to be
   * answered first; its return is parked in `pendingFlickerReturns` and
   * finished by `applyCommanderChoice` — declining the command zone leaves
   * the card in exile, which is exactly where the blink expects to find it.
   */
  private flickerByEffect(
    source: ObjectId,
    controller: PlayerId,
    targets: readonly TargetRef[],
    options: FlickerOptions,
  ): void {
    const returnUnder = options.underYourControl === true ? controller : undefined;
    const delayed = options.returnAt;
    // Minted only once something is actually exiled: a trigger that finds
    // nothing to exile leaves no trace.
    let link: string | undefined;
    const linkNow = (): string | undefined =>
      delayed === undefined ? undefined : (link ??= `flicker-${this.state.nextObjectSeq++}`);
    const exiled: ObjectId[] = [];
    const seen = new Set<ObjectId>();
    for (const target of targets) {
      if (target.kind !== "object" || seen.has(target.object)) continue;
      seen.add(target.object);
      // "Exile Norin": the permanent that put this ability on the stack, not
      // a new object that has the same id because it left and came back.
      if (
        options.fromSource === true &&
        target.object === source &&
        this.resolvingSourceTimestamp !== null &&
        this.state.objects[source]?.timestamp !== this.resolvingSourceTimestamp
      ) {
        continue;
      }
      const id = this.splitOneFromStack(target.object);
      const object = this.state.objects[id];
      if (object === undefined || object.zone !== "battlefield") continue;
      const isToken = object.isToken;
      if (!this.moveObject(id, "exile")) {
        // A commander's 903.9a choice (the only way `moveObject` defers).
        // A token never gets one — it ceases to exist — so nothing to park.
        if (!isToken) {
          // The rest don't wait for it: its return (or its link) is
          // finished by `applyCommanderChoice` once its owner has answered.
          const deferredLink = linkNow();
          this.state.pendingFlickerReturns.push({
            object: id,
            ...(options.thenCounters !== undefined ? { counters: options.thenCounters } : {}),
            ...(returnUnder !== undefined ? { returnUnder } : {}),
            ...(deferredLink !== undefined ? { link: deferredLink } : {}),
          });
        }
        continue;
      }
      if (this.state.objects[id]?.zone !== "exile") continue;
      this.emit({ type: "permanent-exiled", object: id });
      if (isToken) continue;
      // After the move: `moveObject` clears the link on the way.
      const exileLink = linkNow();
      if (exileLink !== undefined) this.state.objects[id].flickerLink = exileLink;
      exiled.push(id);
    }
    if (delayed === undefined) {
      this.completeFlickerReturn(exiled, options.thenCounters, returnUnder);
      return;
    }
    // No link means nothing was exiled (or is waiting to be): no return.
    if (link === undefined) return;
    this.createDelayedTrigger(
      source,
      controller,
      delayed,
      {
        kind: "return-flickered",
        link,
        ...(options.thenCounters !== undefined ? { thenCounters: options.thenCounters } : {}),
        ...(returnUnder !== undefined ? { underYourControl: true } : {}),
      },
      options.returnText ?? "Return the exiled card to the battlefield.",
      [],
    );
  }

  /** The delayed return of a `flicker` with `returnAt`: every card still in
   * exile from that exile (rule 610.3), together. Its link is spent here, so
   * nothing can be returned twice. */
  private returnFlickeredByEffect(
    link: string,
    counters: FlickerCounters | undefined,
    returnUnder: PlayerId | undefined,
  ): void {
    const linked = this.state.zones.shared.exile.filter(
      (id) => this.state.objects[id]?.flickerLink === link,
    );
    for (const id of linked) this.state.objects[id].flickerLink = undefined;
    this.completeFlickerReturn(
      linked.filter((id) => !this.state.objects[id].isToken),
      counters,
      returnUnder,
    );
  }

  /** The return half of a blink: bring `ids` back from exile together,
   * having already confirmed that's where they are. Shared by the immediate
   * path, the delayed one, and the one that had to wait on a commander's
   * 903.9a choice. `returnUnder` is who controls them when it isn't their
   * owners (`underYourControl`). */
  private completeFlickerReturn(
    ids: readonly ObjectId[],
    counters?: FlickerCounters,
    returnUnder?: PlayerId,
  ): void {
    const entered: ObjectId[] = [];
    this.withEnterBatch(() => {
      for (const id of ids) {
        // Rule 400.7: the object returning to the battlefield is brand new, so
        // nothing that was attached to the *old* object stays attached — unlike
        // an ordinary exile, `id` comes straight back here before a state-based
        // action ever gets a chance to notice it left, so its old attachments
        // won't have fallen off on their own (704.5n).
        this.detachFrom(id);
        this.moveObject(id, "battlefield", returnUnder !== undefined ? { under: returnUnder } : {});
        const object = this.state.objects[id];
        if (object?.zone !== "battlefield") continue;
        if (returnUnder !== undefined && object.controller !== returnUnder) {
          // Layer 2 is recomputed every SBA pass, so this goes through the
          // control-effect path, as `putOntoBattlefieldByEffect` does.
          this.gainControlByEffect(returnUnder, { kind: "object", object: id }, false);
          object.summoningSick = true;
        }
        entered.push(id);
      }
    });
    // Announced once every one of them is back: they return simultaneously,
    // so each one's enters triggers see the others (rule 603.6a).
    for (const id of entered) {
      this.emit({ type: "permanent-entered-battlefield", object: id });
    }
    if (counters === undefined) return;
    for (const id of entered) {
      if (this.state.objects[id]?.zone !== "battlefield") continue;
      const matches =
        counters.onlyIf === undefined ||
        matchesFilter(this.state, this.registry, id, counters.onlyIf, {
          you: this.state.objects[id].controller,
        });
      if (matches) {
        this.addCounter({ kind: "object", object: id }, counters.kind, counters.amount);
      }
    }
  }

  /** Detach every Aura/Equipment pointed at `id` (rule 704.5n): an Aura goes
   * to its owner's graveyard, Equipment just becomes unattached. */
  private detachFrom(id: ObjectId): void {
    for (const other of [...this.state.zones.shared.battlefield]) {
      const object = this.state.objects[other];
      if (object.attachedTo !== id) continue;
      if (this.registry.get(printedCardName(object)).subtypes.includes("Aura")) {
        this.moveObject(other, "graveyard");
        this.emit({
          type: "permanent-destroyed",
          object: other,
          reason: "no longer attached to a legal permanent",
        });
      } else {
        object.attachedTo = null;
      }
    }
  }

  /**
   * Show `ids` to every player (rule 701.16) and record that it happened.
   *
   * The record is what makes the reveal real: `viewFor` reads
   * `revealedThisTurn` to put these cards' identities in *every* seat's view,
   * so the `cards-revealed` event names cards each client can actually draw.
   * Without it the event would arrive describing objects only its owner can
   * see, and every other seat would render a face-down back.
   */
  private revealCards(
    player: PlayerId,
    ids: readonly ObjectId[],
    from: "library" | "hand" | "graveyard",
  ): void {
    const real = ids.filter((id) => this.state.objects[id] !== undefined);
    if (real.length === 0) return;
    for (const id of real) {
      if (!this.state.revealedThisTurn.includes(id)) {
        this.state.revealedThisTurn.push(id);
      }
    }
    this.emit({ type: "cards-revealed", player, objects: [...real], from });
  }

  // --- delayed triggered abilities (rule 603.7) ------------------

  /** Record a delayed triggered ability — see the `delayed-trigger` effect. */
  private createDelayedTrigger(
    source: ObjectId,
    controller: PlayerId,
    at: DelayedTriggerTiming,
    effect: EffectSpec,
    text: string,
    targets: ResolvedTargets,
    targetZones: readonly (ZoneType | null)[] = [],
  ): void {
    const object = this.state.objects[source];
    this.state.delayedTriggers.push({
      id: `delayed-${this.state.nextObjectSeq++}`,
      controller,
      at,
      createdOnTurn: this.state.turn.number,
      createdDuringEndStep:
        this.state.turn.step === "end" || this.state.turn.step === "cleanup",
      source,
      sourceName: object === undefined ? "a spell" : printedCardName(object),
      // Captured by value: the ability chooses no new targets when it fires
      // (rule 603.7d), and the effect that set it up is long gone by then.
      targets: [...targets],
      // Where they were when the *creating* spell or ability targeted them:
      // "that spell" still means the spell after it has been countered.
      ...(targetZones.length > 0 ? { targetZones: [...targetZones] } : {}),
      effect,
      text,
    });
    this.emit({ type: "delayed-trigger-created", source, controller, text });
  }

  /**
   * Whether `trigger` fires as `step` begins on the active player's turn.
   *
   * "The next end step" can't mean one already in progress, which is what
   * `createdOnTurn` guards: an effect resolving *during* an end step waits for
   * the following turn's. The "your next ..." timings additionally wait for
   * their own controller's turn.
   */
  private delayedTriggerFires(trigger: DelayedTrigger, step: Step): boolean {
    const active = this.activePlayer;
    const laterTurn = this.state.turn.number > trigger.createdOnTurn;
    // This turn's end step still counts, unless the trigger was created
    // during it (or in cleanup) — then "the next end step" is next turn's.
    const endStepOk = laterTurn || !trigger.createdDuringEndStep;
    switch (trigger.at) {
      case "next-end-step":
        return step === "end" && endStepOk;
      case "your-next-end-step":
        return step === "end" && endStepOk && active === trigger.controller;
      // An upkeep is over by the time anything could create one of these, so
      // the next `enterStep("upkeep")` is always a later turn's.
      case "next-upkeep":
        return step === "upkeep" && laterTurn;
      case "your-next-upkeep":
        return step === "upkeep" && laterTurn && active === trigger.controller;
      case "your-next-main-phase":
        // The first main phase of yours to *begin* after it was created. This
        // only runs as a step begins, and one created during a main phase was
        // created after that phase began, so no turn check is needed: cast
        // during your precombat main or combat, it's this turn's postcombat
        // main; during your upkeep, this turn's precombat main; on someone
        // else's turn, your next precombat main (Mana Drain's 2020-11-10
        // ruling).
        return (
          (step === "precombat-main" || step === "postcombat-main") &&
          active === trigger.controller
        );
    }
  }

  /**
   * Put every delayed trigger that fires at the start of `step` onto the
   * stack, in APNAP order (rule 603.3b). Called from `enterStep`, since a
   * delayed ability belongs to no permanent and so is invisible to
   * `detectTriggers`.
   */
  private fireDelayedTriggers(step: Step): void {
    if (this.state.delayedTriggers.length === 0) return;
    const firing = this.state.delayedTriggers.filter((t) =>
      this.delayedTriggerFires(t, step),
    );
    if (firing.length === 0) return;
    this.state.delayedTriggers = this.state.delayedTriggers.filter(
      (t) => !firing.includes(t),
    );
    const order = this.apnapOrder();
    for (const trigger of [...firing].sort(
      (a, b) => order.indexOf(a.controller) - order.indexOf(b.controller),
    )) {
      const id = this.mintAbilityObject(
        trigger.source,
        trigger.sourceName,
        trigger.controller,
        "triggered",
        0,
        trigger.targets,
      );
      // What `stackAbilityOf` resolves from: the ability has no index into any
      // card's `triggered` list, because it isn't an ability of a card.
      this.state.objects[id].delayedTrigger = trigger;
      if (trigger.targetZones !== undefined) {
        this.state.objects[id].targetZones = [...trigger.targetZones];
      }
      this.emit({
        type: "ability-triggered",
        source: trigger.source,
        controller: trigger.controller,
      });
    }
  }

  /** Active player first, then the rest in turn order (rule 101.4). */
  private apnapOrder(): PlayerId[] {
    const at = this.state.turnOrder.indexOf(this.activePlayer);
    return [...this.state.turnOrder.slice(at), ...this.state.turnOrder.slice(0, at)];
  }

  /**
   * Put `id` on top of / on the bottom of its **owner's** library — the
   * `put-on-library` effect and a tutor-to-top's find.
   *
   * A library's array is drawn from index 0, and `moveObject` always appends,
   * so "bottom" is the plain move and "top" needs the card hoisted to the
   * front afterwards. A card already in that library (a tutor's find never
   * left it) is only reordered, never moved, so nothing treats it as a zone
   * change.
   */
  private putOnLibrary(id: ObjectId, position: "top" | "bottom"): void {
    const object = this.state.objects[id];
    if (object === undefined) return;
    if (object.zone !== "library") this.moveObject(id, "library");
    if (this.state.objects[id]?.zone !== "library") return; // a replacement took it
    if (position === "bottom") return;
    const library = this.state.zones.perPlayer[object.owner].library;
    const index = library.indexOf(id);
    if (index > 0) {
      library.splice(index, 1);
      library.unshift(id);
    }
  }

  /** Snapcaster Mage — grant flashback to a graveyard instant/sorcery until
   * end of turn, at a cost equal to its mana cost. */
  private grantFlashbackByEffect(target: TargetRef): void {
    if (target.kind !== "object") return;
    const object = this.state.objects[target.object];
    if (object === undefined || object.zone !== "graveyard") return;
    const cost = this.registry.get(printedCardName(object)).manaCost;
    if (cost === null) return;
    object.grantedFlashback = { cost, untilEndOfTurn: true };
    this.emit({ type: "flashback-granted", object: target.object, cost });
  }

  /** The flashback cost `cardId` currently has — its printed `flashback.cost`,
   * or a temporary grant (Snapcaster Mage), or `null`. */
  private flashbackCostOf(cardId: ObjectId): string | null {
    const object = this.state.objects[cardId];
    if (object === undefined) return null;
    const printed = this.registry.get(object.cardName).flashback?.cost;
    if (printed !== undefined) return printed;
    return object.grantedFlashback?.cost ?? null;
  }

  /** Recompute every battlefield permanent's controller from its layer-2
   * control effects (rule 613.1b): the resolved ones on
   * `GameObject.controlEffects` and every attached control-granting Aura
   * (timestamped when it became attached, rule 613.7e). They apply in
   * timestamp order, so the latest one wins (rule 613.7); with none, the
   * owner controls it. Returns whether any controller changed. */
  private recomputeControl(): boolean {
    // Cheap early-out for the overwhelmingly common no-control-effects board.
    const anyControlEffect = this.state.zones.shared.battlefield.some((id) => {
      const o = this.state.objects[id];
      return (
        o.controller !== o.owner ||
        o.controlEffects !== undefined ||
        this.registry.get(printedCardName(o)).controlEnchanted
      );
    });
    if (!anyControlEffect) return false;

    let changed = false;
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      let controller = object.owner;
      let bestTimestamp = -1;
      for (const effect of object.controlEffects ?? []) {
        if (effect.timestamp >= bestTimestamp) {
          bestTimestamp = effect.timestamp;
          controller = effect.controller;
        }
      }
      for (const auraId of this.state.zones.shared.battlefield) {
        const aura = this.state.objects[auraId];
        if (
          aura.attachedTo === id &&
          this.registry.get(printedCardName(aura)).controlEnchanted &&
          aura.timestamp >= bestTimestamp
        ) {
          bestTimestamp = aura.timestamp;
          controller = aura.controller;
        }
      }

      if (object.controller !== controller) {
        object.controller = controller;
        object.summoningSick = true;
        object.attacking = null;
        object.blocking = null;
        invalidateComputedCache();
        this.emit({
          type: "control-changed",
          object: id,
          controller,
          untilEndOfTurn: false,
        });
        changed = true;
      }
    }
    return changed;
  }

  /** `player` gains control of `target` (rule 613.1b, layer 2): a new control
   * effect, timestamped now, so it outranks every control effect already on
   * the permanent — Aura or otherwise — until one newer arrives
   * (`recomputeControl`). Recorded even when `player` already controls it, so
   * that control survives the earlier effect ending. The creature is
   * summoning-sick for a new controller (rule 302.6; Act of Treason grants
   * haste to compensate). `untilEndOfTurn` ends the effect in cleanup. */
  private gainControlByEffect(
    player: PlayerId,
    target: TargetRef,
    untilEndOfTurn: boolean,
  ): void {
    if (target.kind !== "object") return;
    const id = this.splitOneFromStack(target.object);
    const object = this.state.objects[id];
    if (object === undefined || object.zone !== "battlefield") return;
    this.state.timestampSeq += 1;
    const effect = { controller: player, timestamp: this.state.timestampSeq, untilEndOfTurn };
    // A lasting effect ends only with the permanent's zone change, which ends
    // every other one too — so nothing older can ever apply again, and
    // dropping it keeps Sliver Overlord's repeatable steal from growing this.
    object.controlEffects = untilEndOfTurn ? [...(object.controlEffects ?? []), effect] : [effect];
    object.controlEndsAtCleanup = untilEndOfTurn;
    invalidateComputedCache();
    if (object.controller === player) return;
    object.controller = player;
    object.summoningSick = true;
    object.attacking = null;
    object.blocking = null;
    this.emit({
      type: "control-changed",
      object: id,
      controller: player,
      untilEndOfTurn,
    });
  }

  /** Counter a spell on the stack (rule 701.5): it's removed from the stack and
   * put into its owner's graveyard without resolving. A countered permanent
   * spell never enters the battlefield; a countered commander is redirected to
   * the command zone by `moveObject` like any other. */
  /**
   * Ward's effect (rule 702.21a) — see the `"ward"` {@link EffectSpec}: the
   * player whose spell or ability targeted `warded` chooses whether to pay
   * `cost`; if they don't, or can't, the ward trigger counters it.
   *
   * Asked as a `choose-modes` decision with one optional mode, "pay", whose
   * mana rides on the decision's `cost` and whose other parts are the mode's
   * effect, and whose decline branch is a `counter` of the targeting spell,
   * held as the decision's target 0. That's the `unless` shape, but a ward
   * cost is one compound cost rather than a choice between options, and the
   * payer is the targeting player rather than a target or triggering
   * object's controller. A cost that can't be paid in full isn't offered.
   */
  private beginWard(
    warded: ObjectId,
    controller: PlayerId,
    targetedBy: TargetedBy,
    cost: WardCost,
  ): void {
    const spell = this.state.objects[targetedBy.object];
    // Already gone — resolved, countered, or left and come back as a new
    // object: there is nothing left to counter.
    if (
      spell === undefined ||
      spell.zone !== "stack" ||
      (spell.zoneChangeCount ?? 0) !== targetedBy.zoneChangeCount
    ) {
      return;
    }
    const payer = targetedBy.player;
    const spellRef: TargetRef = { kind: "object", object: targetedBy.object };
    if (!this.canPayWardCost(payer, cost)) {
      this.emit({ type: "ward-unpaid", object: warded, player: payer, spell: targetedBy.object });
      this.counterObject(targetedBy.object);
      return;
    }
    const parts: EffectSpec[] = [];
    if (cost.payLife !== undefined) {
      parts.push({ kind: "lose-life", amount: cost.payLife, who: "you" });
    }
    if (cost.sacrifice !== undefined) {
      parts.push({
        kind: "sacrifice",
        who: "you",
        filter: cost.sacrifice.filter,
        count: cost.sacrifice.count ?? 1,
      });
    }
    if (cost.discard !== undefined) {
      parts.push({ kind: "discard", target: "you", amount: cost.discard });
    }
    const spellName = printedCardName(spell);
    const what = spell.kind === "card" ? spellName : `${spellName}'s ability`;
    this.beginModesChoice(
      warded,
      payer,
      0,
      0,
      1,
      [
        {
          text: `Pay ward${wardCostText(cost).replace(/\.$/, "")} (or ${what} is countered)`,
          effect: { kind: "sequence", effects: parts },
        },
      ],
      { kind: "counter", target: 0 },
      [spellRef],
      cost.mana,
      0,
      undefined,
      // Countering is the ward ability's own effect, not the payer's.
      controller,
    );
    const awaiting = this.state.awaiting;
    if (awaiting?.kind === "choose-modes" && awaiting.player === payer) {
      this.state.awaiting = { ...awaiting, ward: { warded, spell: targetedBy.object } };
    }
  }

  /**
   * Can `player` pay all of a ward cost right now? Life can be paid down to
   * exactly 0 (rule 119.4); blight isn't built, so a cost naming it can't be.
   *
   * The parts are one cost, so they're checked together: the mana is paid
   * first (it rides on the decision), and the plan for it — the same plan
   * the payment will make, off the same board — may pay life of its own (a
   * painland, a Phyrexian pip) or sacrifice a source (a Treasure) that the
   * other parts were counting on. Those are taken off before the rest is
   * checked, so a cost that can only be paid by spending one thing twice
   * isn't offered.
   */
  private canPayWardCost(player: PlayerId, cost: WardCost): boolean {
    const state = this.state.players[player];
    if (state === undefined || state.hasLost) return false;
    if (cost.blight !== undefined) return false;
    let lifeLeft = state.life;
    const spent = new Map<ObjectId, number>();
    if (cost.mana !== undefined) {
      const plan = this.payMana(player, parseManaCost(cost.mana));
      if (plan === null) return false;
      lifeLeft -= plan.life;
      for (const step of plan.steps) {
        lifeLeft -= step.pain + step.lifeCost;
        if (step.sacrifice) spent.set(step.source, (spent.get(step.source) ?? 0) + 1);
      }
    }
    if (cost.payLife !== undefined && lifeLeft < cost.payLife) return false;
    if (cost.sacrifice !== undefined) {
      const eligible = this.eligibleSacrifices(player, cost.sacrifice.filter).reduce(
        (n, id) =>
          n + Math.max(0, (this.state.objects[id].stackCount ?? 1) - (spent.get(id) ?? 0)),
        0,
      );
      if (eligible < (cost.sacrifice.count ?? 1)) return false;
    }
    if (
      cost.discard !== undefined &&
      this.state.zones.perPlayer[player].hand.length < cost.discard
    ) {
      return false;
    }
    return true;
  }

  private counterSpellByEffect(target: TargetRef, into: "hand" | undefined): void {
    if (target.kind !== "object") return;
    this.counterObject(target.object, into ?? "graveyard");
  }

  /**
   * Counter the spell/ability on the stack (rule 701.5). Returns `false`
   * without countering when it "can't be countered" (`CardDefinition.cantBeCountered`
   * — rule 701.5f), so the caller lets it resolve; `true` when it was countered.
   *
   * A countered spell goes to its owner's graveyard, or with `into: "hand"`
   * to their hand instead (Remand's "if that spell is countered this way,
   * put it into its owner's hand instead"). Either is still `moveObject`'s
   * to redirect: a flashed-back spell is exiled (rule 702.34a), and a
   * commander sent to hand may go to the command zone (rule 903.9b). A copy
   * of a spell goes to neither — it ceases to exist (rule 707.10c).
   */
  private counterObject(id: ObjectId, into: "graveyard" | "hand" = "graveyard"): boolean {
    const object = this.state.objects[id];
    if (object === undefined || object.zone !== "stack") return false;
    if (
      object.uncounterable === true ||
      (object.kind === "card" &&
        this.registry.get(printedCardName(object)).cantBeCountered)
    ) {
      this.emit({ type: "counter-failed", object: id });
      return false;
    }
    object.targets = null;
    // An ability on the stack (ward counters those too) just ceases to exist.
    if (object.kind === "ability") {
      this.removeAbilityFromStack(id);
      this.emit({ type: "spell-countered", object: id });
      return true;
    }
    if (object.isCopy) {
      const stack = this.state.zones.shared.stack;
      const index = stack.indexOf(id);
      if (index >= 0) stack.splice(index, 1);
      delete this.state.objects[id];
      this.emit({ type: "spell-countered", object: id });
      return true;
    }
    // `xValue` is left for `moveObject`, which records the spell's last-known
    // mana value (X included) before clearing it on the way off the stack.
    // A commander headed for a hand waits on the stack for its owner's 903.9b
    // answer (`moveObject` returns `false`); it's countered all the same.
    this.moveObject(id, into);
    this.emit({ type: "spell-countered", object: id });
    return true;
  }

  /** Two creatures fight (rule 701.12): each deals damage equal to its power to
   * the other, unless `oneSided` (Rabid Bite — only `a` deals). Whichever is
   * already gone deals/takes nothing. */
  private fightCreatures(a: TargetRef, b: TargetRef, oneSided: boolean): void {
    if (a.kind !== "object" || b.kind !== "object") return;
    a = { kind: "object", object: this.splitOneFromStack(a.object) };
    b = { kind: "object", object: this.splitOneFromStack(b.object) };
    const liveCreature = (id: ObjectId): boolean => this.creatureDef(id) !== null;
    const powerOf = (id: ObjectId): number =>
      computeCharacteristics(this.state, this.registry, id).power;

    const aLive = liveCreature(a.object);
    const bLive = liveCreature(b.object);
    const aPower = aLive ? powerOf(a.object) : 0;
    const bPower = bLive ? powerOf(b.object) : 0;

    if (aLive && bLive && aPower > 0) this.dealDamage(a.object, b, aPower);
    if (!oneSided && aLive && bLive && bPower > 0) this.dealDamage(b.object, a, bPower);
  }

  private millByEffect(target: TargetRef, amount: number): void {
    if (target.kind !== "player") return;
    const player = target.player;
    if (this.state.players[player] === undefined) return;
    const milled: ObjectId[] = [];
    for (let i = 0; i < amount; i += 1) {
      const library = this.state.zones.perPlayer[player].library;
      const id = library[0];
      if (id === undefined) break;
      this.moveObject(id, "graveyard");
      milled.push(id);
    }
    if (milled.length > 0) {
      this.emit({ type: "cards-milled", player, objects: milled });
    }
  }

  /** See the `"return-from-graveyard"` {@link EffectSpec}. Returns cards from
   * `player`'s graveyard. `count: "all"` (or fewer matches than `count`) moves
   * every match straight away; otherwise it raises a `choose-from-zone`
   * decision, the unchosen matches staying in the graveyard. */
  private returnFromGraveyardByEffect(
    player: PlayerId,
    filter: CardFilter,
    destination: "battlefield" | "hand",
    count: number | "all",
    enterTapped: boolean,
  ): void {
    const eligible = this.state.zones.perPlayer[player].graveyard.filter((id) =>
      matchesFilter(this.state, this.registry, id, filter, { you: player }),
    );
    if (eligible.length === 0) return;
    if (count === "all" || eligible.length <= count) {
      // "Return all land cards from your graveyard" moves them at once: one
      // graveyard departure, and one simultaneous entry.
      this.withGraveyardLeaveBatch(() => {
        this.withEnterBatch(() => {
          for (const id of eligible) {
            this.moveObject(id, destination, { tapped: enterTapped });
            if (destination === "battlefield") {
              this.emit({ type: "permanent-entered-battlefield", object: id });
            }
          }
        });
      });
      return;
    }
    this.state.awaiting = {
      kind: "choose-from-zone",
      player,
      ids: eligible,
      eligible,
      min: count,
      max: count,
      destination,
      leftover: "stay",
      ...(enterTapped && destination === "battlefield" ? { enterTapped: true } : {}),
    };
  }

  /** Target player discards `amount` cards. If their hand is that small or
   * smaller they just discard all of it; otherwise the game waits on their
   * `discard` action (they choose which — same decision shape as the
   * cleanup-step discard, distinguished by `fromEffect`). */
  private discardByEffect(target: TargetRef, amount: number): void {
    if (target.kind !== "player") return;
    const player = target.player;
    if (this.state.players[player] === undefined || amount <= 0) return;
    // Someone is already being asked — "each opponent discards a card"
    // reaching its second opponent. Asking now would overwrite the first
    // player's question, so this one waits its turn — unless there's nothing
    // to ask: a hand no bigger than the count is discarded at once.
    const trivial = this.state.zones.perPlayer[player].hand.length <= amount;
    if (!trivial && (this.state.awaiting !== null || this.state.pendingDiscards.length > 0)) {
      const from = this.state.decisionSource;
      this.state.pendingDiscards.push({
        player,
        count: amount,
        ...(from !== null ? { source: from } : {}),
      });
      return;
    }
    this.discardNow(player, amount);
  }

  /** Ask the next player queued in `pendingDiscards` (see `discardByEffect`).
   * Run from the `prepareForPriority` fixpoint, which only gets here once
   * nothing else is being asked. */
  private promptNextDiscard(): void {
    const next = this.state.pendingDiscards.shift();
    if (next === undefined || this.state.players[next.player]?.hasLost === true) return;
    this.discardNow(next.player, next.count);
    if (this.state.awaiting !== null && next.source !== undefined) {
      this.state.decisionSource = next.source;
    }
  }

  /** Discard `amount` cards from `player`'s hand: the whole hand at once if
   * that's all there is, else ask which. */
  private discardNow(player: PlayerId, amount: number): void {
    const hand = this.state.zones.perPlayer[player].hand;
    if (hand.length <= amount) {
      const all = [...hand];
      for (const id of all) this.moveObject(id, "graveyard");
      if (all.length > 0) {
        this.emit({ type: "cards-discarded", player, objects: all });
      }
      return;
    }
    this.state.awaiting = { kind: "discard", player, count: amount, fromEffect: true };
  }

  /**
   * Discard `player`'s whole hand (rule 701.8 — Dragon Mage, Runehorn
   * Hellkite). There is nothing to choose, so unlike {@link discardByEffect}
   * this never raises a `discard` decision, which is what lets "each player
   * discards their hand, then draws seven" resolve in one pass instead of
   * stalling on each opponent in turn.
   */
  /**
   * The mana value of whatever `target` points at — see the
   * `{ manaValueOf }` {@link EffectAmount}.
   *
   * Deliberately reads the *printed* card (through `printedCardName`, so a
   * copy reports what it copies) rather than anything zone-dependent: every
   * card that asks this destroys the permanent first and then reads it, so
   * by the time this runs the object is in a graveyard. That's rule 608.2h,
   * last known information.
   */
  /**
   * Does `player` hold a card with one of `subtypes`, for the reveal-land
   * cycle's "you may reveal a Plains or Island card from your hand"?
   *
   * Reads the *printed* subtypes off the registry rather than computed
   * characteristics: the card is in hand, where layer effects don't reach,
   * and `computeCharacteristics` degrades to printed values there anyway.
   */
  private canRevealFromHand(player: PlayerId, subtypes: readonly string[]): boolean {
    for (const id of this.state.zones.perPlayer[player].hand) {
      const object = this.state.objects[id];
      if (object === undefined) continue;
      const name = printedCardName(object);
      if (!this.registry.has(name)) continue;
      const def = this.registry.get(name);
      if (def.subtypes.some((subtype) => subtypes.includes(subtype))) return true;
    }
    return false;
  }

  /**
   * The mana value of `target` — on the stack including its chosen {X}
   * (rule 202.3e), everywhere else as printed ({X} is 0).
   *
   * Last-known information (rule 608.2h) for an object that has left the
   * zone it was expected in. A permanent's is its snapshot (`lastKnown`,
   * picked out by the caller — a copy effect the move ended may have
   * changed it, and a token may have ceased to exist). A *spell*'s is as it
   * last existed on the stack (`expectedZone` "stack"): Mana Drain's "that
   * spell's mana value" includes the X of the spell it countered. A card
   * targeted in a graveyard is read as it is now.
   */
  private manaValueOfTarget(
    target: TargetRef,
    expectedZone: ZoneType | null = null,
    lastKnown?: LastKnownInfo,
  ): number {
    if (target.kind !== "object") return 0;
    if (lastKnown !== undefined) return lastKnown.manaValue;
    const object = this.state.objects[target.object];
    if (object === undefined) return 0;
    if (object.zone === "stack") return this.manaValueOnStack(object);
    if (expectedZone === "stack" && object.lastStackManaValue !== undefined) {
      return object.lastStackManaValue;
    }
    if (!this.registry.has(printedCardName(object))) return 0;
    return manaValue(parseManaCost(printedManaCost(this.registry, object)));
  }

  /** A spell's mana value while it's on the stack: printed, plus each {X}
   * at the value chosen for it (rule 202.3e). */
  private manaValueOnStack(object: GameObject): number {
    if (!this.registry.has(printedCardName(object))) return 0;
    const cost = parseManaCost(printedManaCost(this.registry, object));
    return manaValue(cost) + cost.x * Math.max(0, object.xValue ?? 0);
  }

  /** Where each of `targets` is right now, for `GameObject.targetZones` —
   * `null` for a player or an empty optional slot. */
  private zonesOfTargets(targets: ResolvedTargets): (ZoneType | null)[] {
    return Array.from({ length: targets.length }, (_, i) => {
      const t = targets[i];
      return t?.kind === "object" ? (this.state.objects[t.object]?.zone ?? null) : null;
    });
  }

  private discardWholeHand(player: PlayerId): void {
    if (this.state.players[player] === undefined) return;
    const all = [...this.state.zones.perPlayer[player].hand];
    if (all.length === 0) return;
    for (const id of all) this.moveObject(id, "graveyard");
    this.emit({ type: "cards-discarded", player, objects: all });
  }

  /** Deal `amount` damage from `source` to `target`. Returns the amount
   * actually dealt after replacement effects (0 when a Fog-style shield
   * prevented it). */
  /** Whether prevention shield `shield` covers a hit on `target` (combat or not). */
  private shieldCovers(
    shield: PreventionShield,
    target: TargetRef,
    combat: boolean,
  ): boolean {
    if (shield.combatOnly && !combat) return false;
    if (shield.target.kind !== target.kind) return false;
    return shield.target.kind === "player"
      ? shield.target.player === (target as { player: PlayerId }).player
      : shield.target.object === (target as { object: ObjectId }).object;
  }

  /** Run `amount` damage aimed at `target` through the one-shot prevention
   * shields (Healing Salve — rule 614.9 / EG-6), shrinking / removing them,
   * and return the amount that gets through. */
  private consumePreventionShields(
    source: ObjectId,
    target: TargetRef,
    amount: number,
    combat: boolean,
  ): number {
    let through = amount;
    for (const shield of this.state.preventionShields) {
      if (through <= 0) break;
      if (!this.shieldCovers(shield, target, combat)) continue;
      const prevented = Math.min(through, shield.amount);
      if (prevented <= 0) continue;
      shield.amount -= prevented;
      through -= prevented;
      this.emit({ type: "damage-prevented", source, target, amount: prevented });
    }
    this.state.preventionShields = this.state.preventionShields.filter((s) => s.amount > 0);
    return through;
  }

  /**
   * The product of every active `would-deal-damage` replacement on the
   * battlefield (Dictate of the Twin Gods). Global and symmetric — it doubles
   * damage from *anyone* to *anyone*, so it is not filtered by controller.
   * `1` when nothing is doubling, which is the overwhelmingly common case.
   */
  private damageMultiplier(): number {
    let multiplier = 1;
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      if (object === undefined || hasLostAbilities(object)) continue;
      for (const ability of this.registry.get(printedCardName(object)).static) {
        const r = ability.replacement;
        if (r === undefined || r.event !== "would-deal-damage") continue;
        if (!this.staticActive(object, ability)) continue;
        multiplier *= r.multiplier;
      }
    }
    return multiplier;
  }

  private dealDamage(
    source: ObjectId,
    target: TargetRef,
    amount: number,
    combat = false,
    /** The source as it last existed on the battlefield, when it has left
     * since the ability dealing this damage referred to it (rule 608.2h —
     * "When Juri dies, it deals damage …"): its colours for protection, its
     * lifelink and deathtouch, and its controller for the life. */
    sourceLastKnown?: LastKnownInfo,
  ): number {
    if (amount <= 0) return 0;

    // Fog (rule 614): a turn-scoped shield prevents all combat damage.
    if (combat && this.state.preventAllCombatDamage) {
      this.emit({ type: "damage-prevented", source, target, amount });
      return 0;
    }

    // Damage multipliers (Dictate of the Twin Gods — rule 614). Applied
    // before prevention, so a shield eats the *doubled* amount, which is the
    // printed interaction: doubling replaces the damage event, and prevention
    // then applies to what it became.
    amount *= this.damageMultiplier();

    // One-shot prevention shields (Healing Salve — rule 614.9 / EG-6).
    if (this.state.preventionShields.length > 0) {
      amount = this.consumePreventionShields(source, target, amount, combat);
      if (amount <= 0) return 0;
    }

    if (target.kind === "player") {
      if (this.state.players[target.player] === undefined) return 0;
      this.emit({ type: "damage-dealt", source, target, amount, combat });
      this.changeLife(target.player, -amount);
      this.applyLifelink(source, amount, sourceLastKnown);
      // A creature dealing combat damage to the monarch makes its controller
      // the monarch (rule 720.5).
      const src = this.state.objects[source];
      if (
        combat &&
        this.state.monarch === target.player &&
        src !== undefined &&
        src.controller !== target.player
      ) {
        this.setMonarch(src.controller, "combat-damage");
      }
      return amount;
    }
    const object = this.state.objects[target.object];
    if (object === undefined || object.zone !== "battlefield") return 0;
    // Protection (rule 702.16) — prevent damage from a matching source.
    if (
      (sourceLastKnown !== undefined || this.state.objects[source] !== undefined) &&
      protectionBlocks(
        this.state,
        this.registry,
        target.object,
        sourceLastKnown !== undefined
          ? { colors: sourceLastKnown.colors, types: sourceLastKnown.types }
          : this.permanentSource(source),
      )
    ) {
      this.emit({ type: "damage-prevented", source, target, amount });
      return 0;
    }
    // Damage to a planeswalker removes that many loyalty counters (rule
    // 120.3c / 306.7) — it's not "marked" like a creature.
    if (computeCharacteristics(this.state, this.registry, target.object).types.includes("planeswalker")) {
      object.counters.loyalty = (object.counters.loyalty ?? 0) - amount;
      this.emit({ type: "damage-dealt", source, target, amount, combat });
      this.emit({
        type: "loyalty-changed",
        object: target.object,
        delta: -amount,
        loyalty: object.counters.loyalty,
      });
      this.applyLifelink(source, amount, sourceLastKnown);
      return amount;
    }
    object.damageMarked += amount;
    if (this.sourceHasKeyword(source, "deathtouch", sourceLastKnown)) {
      object.markedByDeathtouch = true;
    }
    this.emit({ type: "damage-dealt", source, target, amount, combat });
    this.applyLifelink(source, amount, sourceLastKnown);
    return amount;
  }

  /** True if `source` is a battlefield creature whose current keywords
   * include `keyword` — or, given its last-known information, was one as it
   * left (rule 608.2h: a lifelinker's dies trigger still gains the life). */
  private sourceHasKeyword(
    source: ObjectId,
    keyword: Keyword,
    sourceLastKnown?: LastKnownInfo,
  ): boolean {
    if (sourceLastKnown !== undefined) {
      return sourceLastKnown.types.includes("creature") && sourceLastKnown.keywords.includes(keyword);
    }
    const object = this.state.objects[source];
    if (object === undefined || object.zone !== "battlefield") return false;
    if (this.creatureDef(source) === null) return false;
    return this.objHasKeyword(source, keyword);
  }

  private applyLifelink(source: ObjectId, amount: number, sourceLastKnown?: LastKnownInfo): void {
    if (amount <= 0 || !this.sourceHasKeyword(source, "lifelink", sourceLastKnown)) return;
    // Its controller then: a stolen lifelinker's life is the thief's.
    const controller = sourceLastKnown?.controller ?? this.state.objects[source].controller;
    const batch = this.damageBatch;
    if (batch !== null) {
      const owed = batch.lifelink.get(source);
      if (owed !== undefined) owed.amount += amount;
      else batch.lifelink.set(source, { controller, amount });
      return;
    }
    this.changeLife(controller, amount);
  }

  /**
   * Deal damage that happens all at once, then settle what it owes as one
   * event rather than one per recipient or per source:
   *
   * - Lifelink **once per source**. Damage a single source deals to several
   *   things simultaneously (a trampler hitting a blocker and the player,
   *   "each creature", "each opponent") is one life-gain event, so "whenever
   *   you gain life" triggers once for it, not once per recipient (the
   *   Sanguine Bond / Vito / Oloro rulings; rule 119.9). Two lifelinkers are
   *   two sources, and two gains.
   * - A "whenever this is dealt damage" trigger **once per permanent**. A
   *   creature blocked by two creatures is dealt damage by both at once
   *   (rule 510.2), which is one event: enrage triggers once, and "that much"
   *   is the total. See `detectTriggersUncached`.
   *
   * The damage triggers queue first, then the gains, in the order they were
   * dealt. Nested batches join the outer one.
   */
  private withDamageBatch(fn: () => void): void {
    if (this.damageBatch !== null) {
      fn();
      return;
    }
    const batch = {
      lifelink: new Map<ObjectId, { controller: PlayerId; amount: number }>(),
      dealtDamage: new Map<
        string,
        { ability: TriggeredAbility; trigger: PendingTrigger; multiplier: number }
      >(),
    };
    this.damageBatch = batch;
    try {
      fn();
    } finally {
      this.damageBatch = null;
    }
    for (const { ability, trigger, multiplier } of batch.dealtDamage.values()) {
      this.queueTrigger(ability, trigger, multiplier);
    }
    for (const { controller, amount } of batch.lifelink.values()) this.changeLife(controller, amount);
  }

  private changeLife(player: PlayerId, delta: number): void {
    const playerState = this.state.players[player];
    playerState.life += delta;
    // Recorded here so every path counts — damage, a drain, a cost paid.
    // Amounts rather than flags: "lost life this turn" is `> 0`, but
    // "lost 4 or more life this turn" (Y'shtola) needs the number.
    if (delta < 0) playerState.lifeLostThisTurn += -delta;
    else if (delta > 0) playerState.lifeGainedThisTurn += delta;
    this.emit({
      type: "life-changed",
      player,
      delta,
      life: playerState.life,
    });
  }

  /** The players a `PlayerScope` names, APNAP-ordered (active player first) so
   * any resulting triggers stack in turn order. */
  private scopedPlayers(
    controller: PlayerId,
    who: PlayerScope,
    triggerObject?: ObjectId,
    /** The triggering object as it last existed on the battlefield, if it
     * has left: "that player" is who controlled it then. */
    triggerLastKnown?: LastKnownInfo,
    /** The player the triggering event named — `LastKnownRefs.player`. */
    triggerPlayer?: PlayerId,
  ): PlayerId[] {
    if (who === "you") return [controller];
    if (who === "trigger-player") {
      return triggerPlayer === undefined || this.state.players[triggerPlayer]?.hasLost !== false
        ? []
        : [triggerPlayer];
    }
    if (who === "trigger-controller") {
      const p =
        triggerLastKnown?.controller ??
        (triggerObject === undefined ? undefined : this.state.objects[triggerObject]?.controller);
      return p === undefined || this.state.players[p]?.hasLost === true ? [] : [p];
    }
    // "That player", in a trigger that fires on someone else's step.
    if (who === "active-player") {
      return this.state.players[this.activePlayer]?.hasLost === true
        ? []
        : [this.activePlayer];
    }
    const active = this.state.turnOrder.indexOf(this.activePlayer);
    const rotated = [
      ...this.state.turnOrder.slice(active),
      ...this.state.turnOrder.slice(0, active),
    ];
    return rotated.filter(
      (p) =>
        !this.state.players[p].hasLost &&
        (who === "each-player" || p !== controller) &&
        (who !== "each-other-opponent" || p !== triggerPlayer),
    );
  }

  /** Change life for a whole `PlayerScope` (a `gain-life` / `lose-life` effect
   * with `who`), APNAP-ordered so any resulting triggers stack in turn order. */
  private changeLifeScoped(
    controller: PlayerId,
    who: PlayerScope,
    delta: number,
    triggerObject?: ObjectId,
    triggerLastKnown?: LastKnownInfo,
    triggerPlayer?: PlayerId,
  ): void {
    if (delta === 0) return;
    for (const p of this.scopedPlayers(controller, who, triggerObject, triggerLastKnown, triggerPlayer)) {
      this.changeLife(p, delta);
    }
  }

  /** Give `player` `delta` more counters of `counter` (rule 122.1), or take
   * some away when negative — see `PlayerState.counters`. A player who has
   * left the game gets none. */
  private changePlayerCounters(player: PlayerId, counter: PlayerCounterKind, delta: number): void {
    const ps = this.state.players[player];
    if (ps === undefined || ps.hasLost || delta === 0) return;
    const before = ps.counters[counter] ?? 0;
    const total = Math.max(0, before + delta);
    if (total === before) return;
    if (total === 0) delete ps.counters[counter];
    else ps.counters[counter] = total;
    this.emit({ type: "player-counters-changed", player, counter, delta: total - before, total });
  }

  /** Add (or spend, when negative) energy counters for `player` — rule 122. */
  private changeEnergy(player: PlayerId, delta: number): void {
    if (delta === 0) return;
    const ps = this.state.players[player];
    ps.energy = Math.max(0, ps.energy + delta);
    this.emit({ type: "energy-changed", player, delta, energy: ps.energy });
  }

  /** Make `player` the monarch (rule 720). No-op if they already are. */
  private setMonarch(player: PlayerId, via: "effect" | "combat-damage"): void {
    if (this.state.monarch === player) return;
    this.state.monarch = player;
    this.emit({ type: "monarch-changed", player, via });
  }

  /** Give `owner` an emblem (rule 114 — ROADMAP Phase 10). */
  private createEmblem(
    owner: PlayerId,
    text: string,
    staticAbility: StaticAbility | null,
  ): void {
    this.state.timestampSeq += 1;
    this.state.emblems.push({
      id: `emblem-${this.state.emblems.length + 1}`,
      owner,
      text,
      timestamp: this.state.timestampSeq,
      static: staticAbility,
    });
    this.emit({ type: "emblem-created", player: owner, text });
  }

  // --- state-based actions -----------------------------------

  private runStateBasedActions(): void {
    // Each sweep reads every battlefield permanent's characteristics several
    // times; cache them for the sweep. Mutations along the way keep it
    // honest: `moveObject` suspends the cache, `emit` and `recomputeControl`
    // invalidate, and the direct field writes below invalidate by hand.
    withComputedCache(() => this.runStateBasedActionsUncached());
  }

  private runStateBasedActionsUncached(): void {
    let changed = true;
    while (changed) {
      // A replacement raised a decision mid-sweep (a commander about to leave
      // the battlefield — rule 903.9a). Stop until it's answered; the caller
      // (`prepareForPriority` / `applyCommanderChoice`) resumes the sweep.
      if (this.state.awaiting !== null) return;
      changed = false;

      // Continuous control effects (layer 2), recomputed each pass: a
      // permanent is controlled by its owner unless a control effect
      // (`controlEffects`) or an attached control-granting Aura says
      // otherwise — the latest timestamp wins.
      if (this.recomputeControl()) changed = true;

      for (const player of this.state.turnOrder) {
        const playerState = this.state.players[player];
        if (playerState.hasLost) continue;
        let reason: string | null = null;
        if (playerState.life <= 0) {
          reason = "life total is 0 or less";
        } else if ((playerState.counters.poison ?? 0) >= POISON_LETHAL) {
          reason = `has ${POISON_LETHAL} or more poison counters`;
        } else if (playerState.attemptedDrawFromEmptyLibrary) {
          reason = "attempted to draw from an empty library";
        } else {
          const lethal = Object.entries(playerState.commanderDamageTaken).find(
            ([, amount]) => amount >= COMMANDER_DAMAGE_THRESHOLD,
          );
          if (lethal !== undefined) {
            const commander = this.state.objects[lethal[0] as ObjectId];
            const name = commander === undefined ? "a commander" : printedCardName(commander);
            reason = `took ${COMMANDER_DAMAGE_THRESHOLD}+ combat damage from commander ${name}`;
          }
        }
        if (reason !== null) {
          playerState.hasLost = true;
          playerState.lossReason = reason;
          this.emit({ type: "player-lost", player, reason });
          changed = true;
        }
      }

      // Every state-based action that puts a permanent into a graveyard is
      // found first and then performed at once (rule 704.3), as one event —
      // so each of those permanents' dies triggers sees all the others go
      // (rule 603.10a), and a creature that only dies *because* another one
      // did (its lord) waits for the next check, as it should. A commander
      // among them waits for its 903.9a choice without holding up the rest;
      // `applyCommanderChoice` finishes its move, as part of this event.
      const sweep = this.stateBasedGraveyardMoves();
      if (sweep.length > 0) {
        this.withLeaveBatch(() => {
          this.snapshotLeaving(sweep.map((m) => m.id));
          for (const { id, event } of sweep) {
            if (this.state.objects[id]?.zone !== "battlefield") continue;
            // A commander waiting on its 903.9a choice stays where it is, and
            // isn't a change: it would be found again on every pass.
            if (!this.moveObject(id, "graveyard")) continue;
            this.emit(event);
            changed = true;
          }
        });
        if (this.state.awaiting !== null) return;
      }

      // Not a rule — the other half of token stacking's safety contract: a
      // stack stands in for tokens only while none of them can be activated,
      // since each one's cost has to be paid (tapped) on its own. A static
      // that grants one (Cryptolith Rite's "{T}: Add one mana") wakes the
      // stack up into real objects. Before this, eight Goblins under
      // Cryptolith Rite made one mana, and tapping it tapped all eight.
      // Bounded by MAX_WOKEN_TOKENS: past that a token kind stays stacked
      // (and recompaction folds it back), or a self-copier like Scute Swarm
      // under Cryptolith Rite mints every object stacking exists to avoid.
      for (const id of [...this.state.zones.shared.battlefield]) {
        const count = this.state.objects[id]?.stackCount ?? 1;
        if (count <= 1) continue;
        // Only while this token kind's separate objects stay within
        // MAX_MATERIALIZED, the same bound recompaction folds back past.
        if (this.separateTokenCount(this.state.objects[id]) + count > Game.MAX_WOKEN_TOKENS) continue;
        if (this.effectiveActivated(id).length === 0) continue;
        this.materializeStack(id);
        invalidateComputedCache();
        changed = true;
      }

      // Equipment attached to nothing just becomes unattached and stays on
      // the battlefield (an Aura in the same position goes to the graveyard
      // — `stateBasedGraveyardMoves`).
      for (const id of this.state.zones.shared.battlefield) {
        const object = this.state.objects[id];
        if (object.attachedTo === null) continue;
        const host = this.state.objects[object.attachedTo];
        if (host !== undefined && host.zone === "battlefield") continue;
        if (this.registry.get(printedCardName(object)).subtypes.includes("Aura")) continue;
        object.attachedTo = null;
        invalidateComputedCache();
        changed = true;
      }

      // A token that isn't on the battlefield ceases to exist (rule 111.7/704.5d).
      // `for…in` rather than `Object.keys`: this sweep visits every object in
      // the game on every pass, and deleting the *current* key mid-iteration
      // is well-defined.
      for (const key in this.state.objects) {
        const id = key as ObjectId;
        const object = this.state.objects[id];
        if (!object.isToken || object.zone === "battlefield") continue;
        const zone = this.zoneList(object.zone, object.owner);
        const index = zone.indexOf(id);
        if (index >= 0) zone.splice(index, 1);
        // Kept for the rest of the turn: an ability still on the stack may
        // read this token by last-known information (rule 608.2h) — a token
        // copy of a Craw Wurm entering fired Clement, the Worrywort, and was
        // killed in response; a Saproling's death fired Slimefoot.
        if (object.lastKnown !== undefined) {
          (this.state.ceasedTokens ??= {})[id] = object.lastKnown;
        }
        delete this.state.objects[id];
        // No emit for this one, and a graveyard's length feeds CDAs
        // (`cards-in-all-graveyards`) — invalidate by hand.
        invalidateComputedCache();
        changed = true;
      }
    }

    // The "tried to draw" flag is only relevant until the next SBA check.
    for (const player of this.state.turnOrder) {
      this.state.players[player].attemptedDrawFromEmptyLibrary = false;
    }

    if (this.state.result.over) return;
    const remaining = this.state.turnOrder.filter(
      (player) => !this.state.players[player].hasLost,
    );
    if (remaining.length <= 1) {
      const winner = remaining.length === 1 ? remaining[0] : null;
      const reason =
        winner !== null ? "last player remaining" : "all players have lost";
      this.state.result = { over: true, winner, reason };
      this.emit({ type: "game-ended", winner, reason });
    }
  }

  /**
   * Every permanent a state-based action puts into its owner's graveyard
   * right now, each with the event that announces it — read off the board as
   * it stands, before any of them moves (rule 704.3: they're performed
   * simultaneously). The sweep moves them all as one leave batch.
   *
   * In the order the checks used to run one after another: lethal creatures,
   * then 0-loyalty planeswalkers, Auras attached to nothing, the legend rule,
   * completed Sagas. A permanent two of them apply to is moved once, for the
   * first.
   */
  private stateBasedGraveyardMoves(): { readonly id: ObjectId; readonly event: GameEventInput }[] {
    const moves: { id: ObjectId; event: GameEventInput }[] = [];
    const moving = new Set<ObjectId>();
    const add = (id: ObjectId, event: GameEventInput): void => {
      if (moving.has(id)) return;
      moving.add(id);
      moves.push({ id, event });
    };
    const battlefield = this.state.zones.shared.battlefield;

    for (const id of battlefield) {
      const object = this.state.objects[id];
      const computed = computeCharacteristics(this.state, this.registry, id);
      // Printed creatures and man-lands currently animated to creatures
      // (layer 4) both face the lethal-toughness / lethal-damage SBAs; once
      // an animation wears off the land isn't a creature and is skipped.
      // (A 0/0 Clone still choosing what to copy is protected by the
      // `awaiting !== null` guard in the sweep — SBAs don't run while any
      // decision is pending.)
      if (computed.types.includes("creature")) {
        const toughness = computed.toughness;
        const indestructible = computed.keywords.has("indestructible");
        let reason: string | null = null;
        if (toughness <= 0) {
          // 0 toughness is a state-based *loss*, not destruction —
          // indestructible does not save it (rule 704.5f vs 704.5g).
          reason = "toughness is 0 or less";
        } else if (!indestructible && object.damageMarked >= toughness) {
          reason = "lethal damage";
        } else if (!indestructible && object.markedByDeathtouch && object.damageMarked > 0) {
          reason = "deathtouch";
        }
        if (reason !== null) add(id, { type: "permanent-destroyed", object: id, reason });
      }
    }

    // A planeswalker with 0 loyalty is put into its owner's graveyard
    // (rule 704.5i).
    for (const id of battlefield) {
      if (!computeCharacteristics(this.state, this.registry, id).types.includes("planeswalker")) {
        continue;
      }
      if ((this.state.objects[id].counters.loyalty ?? 0) > 0) continue;
      add(id, { type: "permanent-destroyed", object: id, reason: "0 loyalty" });
    }

    // An Aura attached to no legal permanent goes to the graveyard (704.5n).
    // One whose host dies in this same check is still attached to it now, so
    // it goes in the next check — as it would at a table.
    for (const id of battlefield) {
      const object = this.state.objects[id];
      if (object.attachedTo === null) continue;
      const host = this.state.objects[object.attachedTo];
      if (host !== undefined && host.zone === "battlefield") continue;
      if (!this.registry.get(printedCardName(object)).subtypes.includes("Aura")) continue;
      add(id, {
        type: "permanent-destroyed",
        object: id,
        reason: "no longer attached to a legal permanent",
      });
    }

    // The legend rule (704.5j): a player controlling 2+ legendary permanents
    // with the same name keeps only one. No player choice is modeled — the
    // copy they've controlled longest (lowest timestamp) survives and the
    // rest go to the graveyard. A copy another check is already putting into
    // the graveyard isn't one of the candidates to keep: a player would keep
    // one that's staying. The name is the one the permanent has now: a Clone
    // of Krenko is a second Krenko (rule 707.2), not a Clone, and a
    // transformed card has its back face's name.
    const legendaryGroups = new Map<string, ObjectId[]>();
    for (const id of battlefield) {
      if (moving.has(id)) continue;
      const object = this.state.objects[id];
      if (object.notLegendary === true) continue; // Miirym's copies (P5b)
      const name = printedCardName(object);
      if (!this.registry.get(name).supertypes.includes("legendary")) continue;
      const key = `${object.controller} ${name}`;
      const group = legendaryGroups.get(key);
      if (group) group.push(id);
      else legendaryGroups.set(key, [id]);
    }
    for (const group of legendaryGroups.values()) {
      if (group.length <= 1) continue;
      const survivor = group.reduce((oldest, id) =>
        this.state.objects[id].timestamp < this.state.objects[oldest].timestamp ? id : oldest,
      );
      for (const id of group) {
        if (id !== survivor) {
          add(id, { type: "permanent-destroyed", object: id, reason: "legend rule" });
        }
      }
    }

    // Saga sacrifice (rule 714.4 / SBA 704.5s): a Saga with lore counters at
    // or past its final chapter, and no chapter ability of its still on the
    // stack or waiting to be placed, is sacrificed.
    for (const id of battlefield) {
      const object = this.state.objects[id];
      const chapters = this.registry.get(printedCardName(object)).chapters;
      if (chapters === null) continue;
      const finalChapter = Math.max(...chapters.flatMap((c) => c.at));
      if ((object.counters.lore ?? 0) < finalChapter) continue;
      const busy =
        this.state.zones.shared.stack.some((sid) => this.state.objects[sid]?.sourceObjectId === id) ||
        this.state.pendingTriggers.some((t) => t.sourceObjectId === id);
      if (busy) continue;
      add(id, { type: "saga-completed", object: id });
    }

    return moves;
  }

  // --- zones -------------------------------------------------

  private drawCard(player: PlayerId): void {
    // would-draw replacement (Notion Thief-lite — rule 614 / ROADMAP Phase 11
    // EG-6): an opponent's draw is replaced by the replacement source's
    // controller drawing instead. Applied once — the redirected draw itself
    // isn't re-redirected.
    const redirectTo = this.drawRedirectFor(player);
    if (redirectTo !== null) {
      this.emit({ type: "draw-redirected", from: player, to: redirectTo });
      this.drawCardRaw(redirectTo);
      return;
    }
    this.drawCardRaw(player);
  }

  /** Whose draw replaces `player`'s (a `would-draw` static an opponent
   * controls), or `null`. */
  private drawRedirectFor(player: PlayerId): PlayerId | null {
    for (const id of this.state.zones.shared.battlefield) {
      const source = this.state.objects[id];
      if (hasLostAbilities(source) || source.controller === player) continue;
      for (const ability of this.registry.get(printedCardName(source)).static) {
        const r = ability.replacement;
        if (
          r?.event === "would-draw" &&
          r.who === "opponent" &&
          this.staticActive(source, ability)
        ) {
          return source.controller;
        }
      }
    }
    return null;
  }

  private drawCardRaw(player: PlayerId): void {
    const library = this.state.zones.perPlayer[player].library;
    if (library.length === 0) {
      this.state.players[player].attemptedDrawFromEmptyLibrary = true;
      this.emit({ type: "draw-from-empty-library", player });
      return;
    }
    const id = library[0];
    this.moveObject(id, "hand");
    // Counted on the *raw* draw, so every draw path counts it once and
    // nothing that merely puts a card in hand (a tutor) does.
    const seat = this.state.players[player];
    seat.cardsDrawnThisTurn += 1;
    // The first card a player draws in their own draw step, whether it's the
    // turn-based draw or not (a skipped first draw leaves the next one first).
    const firstInDrawStep =
      this.state.turn.step === "draw" &&
      player === this.activePlayer &&
      seat.drewInDrawStepThisTurn !== true;
    if (firstInDrawStep) seat.drewInDrawStepThisTurn = true;
    this.emit({
      type: "card-drawn",
      player,
      object: id,
      nthThisTurn: seat.cardsDrawnThisTurn,
      ...(firstInDrawStep ? { firstInDrawStep: true } : {}),
    });
  }

  /**
   * The `enters-battlefield` replacements (rule 614.1c) that apply to `id` as
   * it enters — the entering card's own self-replacements ("~ enters tapped",
   * "~ enters with N +1/+1 counters"; `amount: "x"` reads the `{X}` chosen when
   * it was cast), then every other permanent's `others-enter-battlefield`
   * replacement that reaches it (Giada's counters, Thalia's "enter tapped",
   * The Wandering Minstrel's "enter untapped"), with any `would-add-counter`
   * multiplier (Doubling Season) folded into the counter amounts.
   *
   * `effectTapped` is the effect's own "put it onto the battlefield tapped".
   * The permanent is judged as it will exist on the battlefield (rule
   * 614.12), controller included: `moveObject` has already put it under the
   * player it's entering under (a reanimation "under your control").
   *
   * Also records `id` in the current {@link enterBatch}: whatever enters after
   * it in the same event doesn't see it as already here.
   */
  private entersBattlefieldReplacement(id: ObjectId, effectTapped = false): EnteringReplacement {
    const entering = this.enteringReplacementOf(id, effectTapped);
    this.enterBatch?.add(id);
    return entering;
  }

  private enteringReplacementOf(id: ObjectId, effectTapped: boolean): EnteringReplacement {
    const object = this.state.objects[id];
    const def = this.registry.get(printedCardName(object));
    let tapped = effectTapped;
    let untapped = false;
    let transformed = false;
    let painIfUntapped = 0;
    let mayPayLife = 0;
    const counters: { kind: string; amount: number }[] = [];
    const addCounters = (kind: string, base: number): void => {
      const amount = base * this.counterMultiplier(id, kind);
      if (amount <= 0) return;
      // One placement per kind: everything it enters with is put on at once
      // (rule 122.6), so a "whenever counters are put on" trigger fires once.
      const same = counters.find((c) => c.kind === kind);
      if (same !== undefined) same.amount += amount;
      else counters.push({ kind, amount });
    };
    for (const ability of def.static) {
      const r = ability.replacement;
      if (r === undefined || r.event !== "enters-battlefield") continue;
      if (!this.staticActive(object, ability)) continue;
      if (r.tapped) tapped = true;
      if (
        r.tappedUnless !== undefined &&
        !staticConditionMet(this.state, this.registry, object, r.tappedUnless)
      ) {
        tapped = true;
      }
      if (
        r.tappedUnlessRevealFromHand !== undefined &&
        !this.canRevealFromHand(object.controller, r.tappedUnlessRevealFromHand)
      ) {
        tapped = true;
      }
      if (r.painIfUntapped !== undefined) painIfUntapped = r.painIfUntapped;
      if (r.mayPayLife !== undefined) mayPayLife = r.mayPayLife;
      if (r.transformed) transformed = true;
      if (r.counters) {
        addCounters(
          r.counters.kind,
          r.counters.amount === "x" ? (object.xValue ?? 0) : r.counters.amount,
        );
      }
    }
    // Other permanents' replacements (rule 614.12). Never its own — a
    // permanent's ability over a general set of permanents doesn't modify how
    // that permanent itself enters — and never one entering alongside it,
    // which isn't on the battlefield yet.
    for (const sourceId of this.state.zones.shared.battlefield) {
      if (sourceId === id || this.enterBatch?.has(sourceId) === true) continue;
      const source = this.state.objects[sourceId];
      if (source === undefined || hasLostAbilities(source)) continue;
      // An eliminated player's permanents stop affecting the game (see
      // `matchesFilter`).
      if (this.state.players[source.controller]?.hasLost === true) continue;
      for (const ability of this.registry.get(printedCardName(source)).static) {
        const r = ability.replacement;
        if (r?.event !== "others-enter-battlefield") continue;
        if (!this.staticActive(source, ability)) continue;
        if (!matchesFilter(this.state, this.registry, id, r.filter, { you: source.controller })) {
          continue;
        }
        if (r.tapped === true) tapped = true;
        if (r.untapped === true) untapped = true;
        if (r.counters !== undefined) {
          // A compacted stack of such permanents is that many replacements.
          const each = this.enteringCounterAmount(sourceId, source.controller, id, r.counters.amount);
          addCounters(r.counters.kind, each * (source.stackCount ?? 1));
        }
      }
    }
    // "Enters untapped" is applied last: the entering permanent's controller
    // orders the replacements (rule 616.1), and it only ever reaches
    // permanents its own controller controls. With nothing left to pay for,
    // a shock land isn't offered its life payment.
    if (untapped) tapped = false;
    return {
      tapped,
      transformed,
      counters,
      painIfUntapped: tapped ? 0 : painIfUntapped,
      mayPayLife: tapped || untapped ? 0 : mayPayLife,
    };
  }

  /**
   * An `others-enter-battlefield` counter amount, read from its source's
   * perspective as `entering` enters. The count never includes `entering`
   * itself or anything entering with it — "for each Angel you **already**
   * control" (Giada) — and `"trigger-object"` names the entering permanent.
   */
  private enteringCounterAmount(
    source: ObjectId,
    controller: PlayerId,
    entering: ObjectId,
    amount: EffectAmount,
  ): number {
    if (typeof amount === "number") return amount;
    const notYet = [entering, ...(this.enterBatch ?? [])];
    const ctx = this.makeResolutionContext(source, controller, [], 0, 0, entering);
    const n = amountValue(amount, {
      ...ctx,
      countMatching: (filter, except = []) => ctx.countMatching(filter, [...except, ...notYet]),
      aggregate: (spec, except = []) => ctx.aggregate(spec, [...except, ...notYet]),
    });
    return Math.max(0, n);
  }

  /** Product of every `would-create-token` multiplier (rule 614) on a
   * battlefield permanent controlled by `controller` — Doubling Season /
   * Parallel Lives, which stack. `1` when there are none. */
  private tokenCreationMultiplier(controller: PlayerId): number {
    let mult = 1;
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      if (object.controller !== controller || hasLostAbilities(object)) continue;
      for (const ability of this.registry.get(printedCardName(object)).static) {
        const r = ability.replacement;
        if (r?.event === "would-create-token" && this.staticActive(object, ability)) {
          mult *= r.multiplier;
        }
      }
    }
    return mult;
  }

  /** Product of every `would-add-counter` multiplier (rule 614) that applies
   * to putting `kind` counters on `target` — a Doubling Season controlled by
   * `target`'s controller. `1` when there are none. `target` itself is skipped
   * so a hypothetical self-doubler can't compound. */
  private counterMultiplier(target: ObjectId, kind: string): number {
    const targetObject = this.state.objects[target];
    if (targetObject === undefined) return 1;
    let mult = 1;
    for (const id of this.state.zones.shared.battlefield) {
      if (id === target) continue;
      const object = this.state.objects[id];
      if (object.controller !== targetObject.controller || hasLostAbilities(object)) {
        continue;
      }
      for (const ability of this.registry.get(printedCardName(object)).static) {
        const r = ability.replacement;
        if (
          r?.event === "would-add-counter" &&
          (r.counterKind === undefined || r.counterKind === kind) &&
          (r.filter === undefined ||
            matchesFilter(this.state, this.registry, target, r.filter, { you: object.controller })) &&
          this.staticActive(object, ability)
        ) {
          mult *= r.multiplier;
        }
      }
    }
    return mult;
  }

  /** Whether a battlefield permanent replaces "put `cardId` into a graveyard"
   * with "exile it instead" (Rest in Peace unfiltered; Anafenza-style with a
   * `CardFilter` — rule 614 / ROADMAP Phase 11 EG-6). The filter is matched
   * against the card's printed characteristics from the replacement source's
   * controller's perspective. */
  private graveyardIsReplacedWithExile(cardId: ObjectId, fromBattlefield: boolean): boolean {
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      if (hasLostAbilities(object)) continue;
      for (const ability of this.registry.get(printedCardName(object)).static) {
        const r = ability.replacement;
        if (
          r?.event !== "would-be-put-into-graveyard" ||
          r.instead !== "exile" ||
          // The dies-only form (rule 700.4) lets a discard or a mill through.
          (r.from === "battlefield" && !fromBattlefield) ||
          !this.staticActive(object, ability)
        ) {
          continue;
        }
        if (
          r.filter !== undefined &&
          !matchesFilter(this.state, this.registry, cardId, r.filter, { you: object.controller })
        ) {
          continue;
        }
        return true;
      }
    }
    return false;
  }

  /**
   * `id` as it exists on the battlefield right now, as plain data — its
   * {@link LastKnownInfo}. Computed characteristics (copy effects, layers,
   * anthems, counters) plus the state a leaves-the-battlefield trigger or a
   * resolving ability may ask about once it has gone. Runs once per
   * departure, and per victim of a simultaneous event: never over the whole
   * battlefield.
   */
  private takeLastKnown(id: ObjectId): LastKnownInfo {
    const object = this.state.objects[id];
    const name = printedCardName(object);
    const def = this.registry.get(name);
    const c = computeCharacteristics(this.state, this.registry, id);
    const attached = attachmentsOf(this.state, this.registry, id);
    const lostAbilities = hasLostAbilities(object);
    // The granted triggered abilities, in `effectiveTriggered`'s order after
    // the printed ones: a granted dies trigger still fires once its grantor
    // has left too, or its own modifiers have been cleared by the move.
    const granted = lostAbilities
      ? []
      : this.effectiveTriggeredEntries(id).flatMap((e) => (e.ref === undefined ? [] : [e.ref]));
    return {
      zoneChangeCount: object.zoneChangeCount ?? 0,
      name,
      owner: object.owner,
      controller: object.controller,
      power: c.power,
      toughness: c.toughness,
      types: [...c.types],
      subtypes: [...c.subtypes],
      supertypes: [...def.supertypes],
      colors: [...c.colors],
      keywords: [...c.keywords],
      counters: { ...object.counters },
      // Read before the move ends a copy effect (rule 707.2): a Clone that
      // entered as a Craw Wurm and died was a mana value 6 creature.
      manaValue: manaValue(parseManaCost(printedManaCost(this.registry, object))),
      ...(object.manaSpent !== undefined ? { manaSpent: object.manaSpent } : {}),
      isToken: object.isToken,
      isCommander: object.isCommander,
      tapped: object.tapped,
      attacking: object.attacking !== null,
      blocking: object.blocking !== null,
      equipped: attached.equipped,
      enchanted: attached.enchanted,
      enchantedByController: attached.enchantedByController,
      lostAbilities,
      ...(granted.length > 0 ? { grantedTriggers: granted } : {}),
    };
  }

  /**
   * Snapshot every one of `ids` still on the battlefield *before* the
   * simultaneous event carrying them out moves the first of them (rule
   * 603.10a). The engine moves them one at a time, so without this the
   * second victim of a wrath would be read after its lord had already left
   * — a 1/1 that was a 2/2 until then. `moveObject` uses these in place of
   * taking its own. Only the event's own victims, and only for the length of
   * the batch.
   */
  private snapshotLeaving(ids: Iterable<ObjectId>): void {
    const batch = this.leaveBatch;
    if (batch === null) return;
    // A pure read of a board nothing has moved on yet, so one cache region
    // shares the static-ability scan across every victim.
    withComputedCache(() => {
      for (const id of ids) {
        const object = this.state.objects[id];
        if (object === undefined || object.zone !== "battlefield" || batch.snapshots.has(id)) {
          continue;
        }
        batch.snapshots.set(id, this.takeLastKnown(id));
      }
    });
  }

  /**
   * Moves `id` to `to`, and says whether it did: `false` means a commander's
   * 903.9a choice deferred the move (below), so the caller mustn't announce
   * it. That has to come from here, not from `awaiting` — a decision there
   * may be someone else's, and reading it that way dropped the log events of
   * every permanent an overloaded Cyclonic Rift bounced after a commander.
   *
   * `enter` is how a move onto the battlefield says the permanent enters
   * (tapped, under someone other than its owner) — passed in rather than
   * applied afterwards, so the enters-battlefield replacements see it.
   */
  private moveObject(id: ObjectId, to: ZoneType, enter: EnterOptions = {}): boolean {
    // Zone moves interleave reads and writes too finely for point
    // invalidation — run with the computed-value cache off (and cleared on
    // the way out). See `suspendComputedCache`.
    return suspendComputedCache(() => this.moveObjectUncached(id, to, enter));
  }

  private moveObjectUncached(id: ObjectId, to: ZoneType, enter: EnterOptions): boolean {
    const object = this.state.objects[id];
    const leavingBattlefield = object.zone === "battlefield" && to !== "battlefield";
    // Last-known information (rules 603.10a, 608.2h), taken before anything
    // below resets control, counters, modifiers or a copy effect: everything a
    // leaves-the-battlefield trigger or a resolving ability may still ask
    // about the permanent once it has gone. See `GameObject.lastKnown`.
    //
    // Two snapshots of this very stint are kept rather than retaken. One
    // taken before a simultaneous event moved anything (`snapshotLeaving` —
    // the second victim of a wrath is read before its lord left, not after).
    // And the one a commander was given when its 903.9a choice deferred this
    // move: the replacement happened as the event did, however long its
    // owner took to answer, and a second event reaching it while it waits
    // doesn't redirect it.
    if (leavingBattlefield) {
      const stint = object.zoneChangeCount ?? 0;
      const commanderWaiting =
        object.isCommander &&
        (this.state.deferredCommanderMove?.commander === id ||
          this.state.pendingCommanderMoves.some((m) => m.commander === id));
      const kept = commanderWaiting && object.lastKnown?.zoneChangeCount === stint;
      if (!kept) {
        const pre = this.leaveBatch?.snapshots.get(id);
        object.lastKnown = pre?.zoneChangeCount === stint ? pre : this.takeLastKnown(id);
      }
    }

    // Rest in Peace (rule 614): whatever would be put into a graveyard is
    // exiled instead. Whether that includes tokens is the card's wording, so
    // it's the replacement's filter that says: Rest in Peace's "a card or
    // token" has none, Anafenza's "creature card" excludes them. A token
    // exiled this way never dies, which "whenever a creature dies" and the
    // died-this-turn count both see.
    //
    // First the redirects the moving permanent carries on itself rather than
    // on some static. "If it would leave the battlefield, exile it instead of
    // putting it anywhere else" (Whip of Erebos) catches every destination —
    // a bounce and a tuck as well as a death. A finality counter (rule 122)
    // catches only the graveyard: "if a permanent with a finality counter on
    // it would be put into a graveyard from the battlefield, exile it
    // instead". Both are read here, before anything below clears them.
    //
    // The command zone is left out: a commander only goes there by its
    // owner's 903.9a choice, which is asked *after* this redirect (so the
    // question is about an exile) and completes through here again.
    if (
      leavingBattlefield &&
      (to === "graveyard" || to === "hand" || to === "library") &&
      object.exileIfItWouldLeave === true
    ) {
      this.emit({ type: "leave-replaced-with-exile", object: id, intendedZone: to });
      to = "exile";
    }
    if (leavingBattlefield && to === "graveyard" && (object.counters["finality"] ?? 0) > 0) {
      to = "exile";
      this.emit({ type: "graveyard-replaced-with-exile", object: id });
    }
    if (to === "graveyard" && this.graveyardIsReplacedWithExile(id, leavingBattlefield)) {
      to = "exile";
      this.emit({ type: "graveyard-replaced-with-exile", object: id });
    }

    // Flashback (rule 702.34) / disturb (rule 702.150): a card cast this way is
    // exiled instead of ever going to a graveyard — from the stack (fizzle /
    // counter) or, for a disturb permanent, from the battlefield when it dies.
    // `castVia` rides on the object (kept across the stack→battlefield move).
    if (
      (object.castVia === "flashback" || object.castVia === "disturb") &&
      to === "graveyard"
    ) {
      to = "exile";
      this.emit({ type: "graveyard-replaced-with-exile", object: id });
    }
    // The same for a spell cast under an exile-afterwards graveyard
    // permission (Kess). The flag only ever sits on a spell on the stack.
    if (object.exileIfWouldGoToGraveyard === true && to === "graveyard") {
      to = "exile";
      this.emit({ type: "graveyard-replaced-with-exile", object: id });
    }
    // Flashback's "exile this card instead of putting it anywhere else any
    // time it would leave the stack" (rule 702.34a) covers more than a
    // graveyard: a flashed-back spell countered into its owner's hand
    // (Remand) or returned there (Unsubstantiate) is exiled too.
    if (
      object.castVia === "flashback" &&
      object.zone === "stack" &&
      (to === "hand" || to === "library")
    ) {
      this.emit({ type: "leave-replaced-with-exile", object: id, intendedZone: to });
      to = "exile";
    }

    // Commander replacement (rule 903.9a): a commander that would leave the
    // battlefield for a hidden zone — its owner may send it to the command
    // zone instead. Ask *before* moving (this is a replacement effect, rule
    // 614), so a "dies" trigger never fires unless it truly lands in a
    // graveyard. The move is deferred to `applyCommanderChoice`.
    //
    // The choice is never skipped. When it can't be asked right now — another
    // decision is on `awaiting`, or another commander's is already being
    // asked — the commander waits on the battlefield in
    // `pendingCommanderMoves` and `prepareForPriority` asks in turn. Either
    // way the move didn't happen, and this returns `false` to say so.
    //
    // Rule 903.9b extends it to a commander put into its owner's hand from
    // anywhere else too — a spell countered into its owner's hand (Remand) or
    // returned there from the stack (Unsubstantiate), a card from a graveyard
    // or exile — which waits where it is, the same way. A
    // library-to-hand move (a draw, a tutor) isn't asked: a commander is
    // almost never in a library, and a draw has no way to wait.
    const handFromElsewhere =
      to === "hand" &&
      (object.zone === "stack" || object.zone === "graveyard" || object.zone === "exile");
    if (
      object.isCommander &&
      this.completingCommanderMove !== id &&
      ((leavingBattlefield &&
        (to === "graveyard" || to === "exile" || to === "hand" || to === "library")) ||
        handFromElsewhere)
    ) {
      const state = this.state;
      const intendedZone = to as CommanderReplacementZone;
      const origin: { from?: CommanderMoveOrigin } = handFromElsewhere
        ? { from: object.zone as CommanderMoveOrigin }
        : {};
      const alreadyLeaving =
        state.deferredCommanderMove?.commander === id ||
        state.pendingCommanderMoves.some((m) => m.commander === id);
      if (alreadyLeaving) {
        // Already on its way out, and it went wherever its first move sent
        // it; a second event reaching it before it's asked (an SBA, say)
        // doesn't redirect it.
      } else {
        if (state.deferredCommanderMove === null && state.awaiting === null) {
          state.deferredCommanderMove = { commander: id, intendedZone, ...origin };
          state.awaiting = {
            kind: "commander-replacement",
            player: object.owner,
            commander: id,
            intendedZone,
          };
        } else {
          state.pendingCommanderMoves.push({ commander: id, intendedZone, ...origin });
        }
        // Part of whatever simultaneous event is moving it, though its move
        // waits for the answer — see `withLeaveBatch`.
        if (leavingBattlefield) this.leaveBatch?.deferred.push(id);
        // A commander headed from a graveyard to its owner's hand leaves the
        // graveyard whichever way its owner answers: rule 903.9b replaces
        // where it goes (the command zone instead of the hand), not whether
        // it goes, and the replaced move is still part of this event. So it
        // leaves now, together with whatever else this move takes out of a
        // graveyard — "return up to two cards" is one "whenever one or more
        // cards leave your graveyard" trigger, not two — and completing the
        // move once answered doesn't announce it again (below).
        if (handFromElsewhere && object.zone === "graveyard") {
          this.noteGraveyardDeparture(id, this.graveyardSnapshot(id));
        }
      }
      this.raiseNextCommanderChoice();
      return false;
    }

    // "If a creature died this turn" (rule 700.4 — a creature going to a
    // graveyard from the battlefield). Counted here, after every redirect, so
    // only a death that really happens counts: not a Rest in Peace exile, and
    // a commander once, when its owner's answer lets it through — the deferral
    // above used to count it as well. Its types are still readable, and a
    // compacted token stack is that many creatures dying.
    if (
      leavingBattlefield &&
      to === "graveyard" &&
      object.lastKnown?.types.includes("creature") === true
    ) {
      const died = object.stackCount ?? 1;
      this.state.creaturesDiedThisTurn += died;
      // Per-player as well: "under **your** control" reads the controller
      // it had on the way out, before this move reverts it to the owner.
      const under = this.state.players[object.lastKnown.controller];
      if (under !== undefined) under.creaturesDiedThisTurn += died;
    }

    // A permanent spell that was kicked has to remember it across this one
    // move: `kicked` dies with the stack object (below), but the rider it
    // paid for is an ETB trigger that only fires once the permanent is
    // already here (Verix Bladewing). Cleared like any other zone-scoped
    // flag on the *next* move, so a Verix that dies and returns is unkicked.
    const enteringKicked = object.zone === "stack" && to === "battlefield" && object.kicked === true;
    // Last-known information for a spell leaving the stack: its mana value
    // with X, read by "that spell's mana value" after it's gone (Mana Drain).
    // Deliberately not cleared by later moves: it's only ever read through a
    // target that was a spell, and that spell's last existence on the stack
    // doesn't change because the card was exiled from the graveyard since.
    if (object.zone === "stack" && object.kind === "card") {
      object.lastStackManaValue = this.manaValueOnStack(object);
    }
    // The mana spent to cast a spell stays with the permanent it becomes (an
    // "if N mana was spent to cast it" enters trigger reads it there) and
    // ends with any other move.
    if (!(object.zone === "stack" && to === "battlefield")) object.manaSpent = undefined;

    // Rule 400.7: wherever it goes, it arrives as a new object, and only a
    // library-to-graveyard move is "put there from a library" (Captain
    // N'ghathrod). Every other move — including graveyard to graveyard —
    // clears it. See `GameObject.putIntoGraveyardFromLibraryOnTurn`.
    object.putIntoGraveyardFromLibraryOnTurn =
      object.zone === "library" && to === "graveyard" ? this.state.turn.number : undefined;
    // Skullbriar (`countersPersistAcrossZones`): its counters stay with it
    // through any move except to a hand or library. Read before the reset
    // below, off the object as it is now: a Clone copying Skullbriar has the
    // ability as it leaves, and a Skullbriar that lost its abilities on the
    // battlefield (Turn to Frog) doesn't, so its counters go as usual.
    const keepCounters =
      to !== "hand" &&
      to !== "library" &&
      this.registry.get(printedCardName(object)).countersPersistAcrossZones &&
      !(object.zone === "battlefield" && hasLostAbilities(object));
    // A card leaving a graveyard, as it was there — what a "whenever one or
    // more artifact cards leave your graveyard" trigger asks about, since
    // those look back in time (rule 603.10a). Taken now, before the reset
    // below and before it can become something else where it's going (a
    // Clone reanimated as a copy of an artifact was a creature card).
    // Tokens aren't cards (rule 111.1). A commander completing a deferred
    // return to hand from a graveyard was already announced as it was
    // deferred (above).
    const alreadyAnnounced =
      this.completingCommanderMove === id &&
      this.state.deferredCommanderMove?.commander === id &&
      this.state.deferredCommanderMove.from === "graveyard";
    const leftGraveyard =
      object.zone === "graveyard" && to !== "graveyard" && !object.isToken && !alreadyAnnounced
        ? this.graveyardSnapshot(id)
        : undefined;
    const from = this.zoneList(object.zone, object.owner);
    const index = from.indexOf(id);
    if (index >= 0) from.splice(index, 1);

    object.zone = to;
    this.zoneList(to, object.owner).push(id);
    object.zoneChangeCount = (object.zoneChangeCount ?? 0) + 1;

    // A change of zone resets everything that only applies in one zone.
    object.attacking = null;
    object.blocking = null;
    object.blockedBy = [];
    object.blocked = false;
    object.markedByDeathtouch = false;
    if (!keepCounters) object.counters = {};
    object.modifiers = [];
    object.attachedTo = null;
    // A permanent that leaves the battlefield reverts to its owner's control
    // (rule 110.2 / 400.3) — so a stolen creature that dies or is bounced goes
    // to its owner, not the thief.
    object.controlEndsAtCleanup = false;
    delete object.controlEffects;
    object.controller = object.owner;
    // A copy effect ends when the object changes zones (rule 707.2) — a Clone
    // that dies and returns is a Clone again.
    object.copyOf = null;
    // An ETB "choose a creature type" choice ends when the object changes
    // zones — a fresh entry chooses again (Urza's Incubator — P14).
    object.chosenCreatureType = null;
    // Alt-cast zone markers (ROADMAP Phase 6) end on any zone change: a
    // Snapcaster grant, a suspend / foretell exile state.
    object.grantedFlashback = null;
    object.suspended = false;
    object.exileAtEndStep = false;
    object.foretold = false;
    object.foretoldOnTurn = null;
    // Modes chosen for a targeted modal spell (Phase 11 EG-2) and a kicker
    // paid as it was cast (P8) both end with the stack.
    object.chosenModes = undefined;
    object.kicked = undefined;
    // "That spell can't be countered" was about this casting, so it ends when
    // the spell leaves the stack (Cavern of Souls). So does what the casting
    // sacrificed ("the sacrificed creature" — see `LastKnownRefs`).
    object.uncounterable = undefined;
    object.lastKnownRefs = undefined;
    object.enteredKicked = enteringKicked;
    // The O-Ring link (rule 720.2) dies with any move: a card that leaves
    // exile some other way is no longer the one the Banishing Light took, so
    // nothing comes back when the Light does. `exileByEffect` sets this
    // *after* its own move, so an exile doesn't clear its own mark.
    object.exiledBy = undefined;
    // Likewise a delayed flicker return's link (Norin the Wary, rule 610.3).
    object.flickerLink = undefined;
    object.overloaded = undefined;
    // Graveyard permissions: a card's own "you may cast it this turn" belongs
    // to that object in that graveyard, and a grantor's spent allowances to
    // that object on the battlefield — a card that comes back is a new object
    // (rule 400.7), with no permission and a fresh set of allowances (the
    // Karador and Muldrotha rulings).
    object.graveyardCastPermission = undefined;
    object.graveyardCastUsedThisTurn = undefined;
    object.graveyardCastTypesUsedThisTurn = undefined;
    object.exileIfWouldGoToGraveyard = undefined;
    // Its "exile it if it would leave" replacement was about the permanent
    // that just left (rule 400.7).
    object.exileIfItWouldLeave = undefined;
    // The adventure "may cast the creature from exile" permission (rule 715.3)
    // ends when the card changes zones. `resolveTopOfStack` re-sets it *after*
    // the move to exile that creates the state.
    object.onAdventure = false;
    // A multi-face card reverts to its front face while not on the battlefield
    // or stack (rule 712); casting/playing it sets the face again.
    if (object.faces !== undefined && to !== "battlefield" && to !== "stack") {
      object.face = 0;
    }

    if (to === "battlefield") {
      object.enteredBattlefieldOnTurn = this.state.turn.number;
      object.summoningSick = true;
      this.state.timestampSeq += 1;
      object.timestamp = this.state.timestampSeq;
      // Who it enters under: its owner, unless the effect puts it onto the
      // battlefield under someone else's control. The control effect that
      // keeps it there is the caller's to create, after the move (layer 2
      // would hand it straight back otherwise), so it is put back under its
      // owner at the end of this branch — but for the length of the entry it
      // is that player's. Its replacements judge it as theirs (rule 614.12),
      // and so does every trigger the entry sets off: Shalai and Hallar sees
      // the counters Giada puts on an Angel reanimated under your control.
      const enteringController = enter.under ?? object.controller;
      object.controller = enteringController;
      // Replacement effects that apply as it enters (rule 614.1c) — tapped /
      // enters-with-counters, its own and other permanents'. `object.counters`
      // was just reset above (unless it keeps them across zones, when these
      // add to what it brought).
      const entering = this.entersBattlefieldReplacement(id, enter.tapped === true);
      object.tapped = entering.tapped;
      for (const c of entering.counters) {
        object.counters[c.kind] = (object.counters[c.kind] ?? 0) + c.amount;
      }
      if (entering.painIfUntapped > 0) {
        this.dealDamage(
          id,
          { kind: "player", player: enteringController },
          entering.painIfUntapped,
        );
      }
      // A shock land (rule 614.13): "you may pay N life; if you don't, it
      // enters tapped". It enters tapped by default; if its controller can
      // afford the life, the `pay-life-for-untapped` decision pauses the game
      // here (like the 903.9a commander choice) to let them untap it. If
      // another decision is already being answered — the search that found
      // this land — the offer waits its turn in `pendingPayLifeForUntapped`.
      if (entering.mayPayLife > 0) {
        object.tapped = true;
        if (this.state.players[enteringController].life >= entering.mayPayLife) {
          const offer = { player: enteringController, source: id, life: entering.mayPayLife };
          if (this.state.awaiting === null) {
            this.state.awaiting = { kind: "pay-life-for-untapped", ...offer };
          } else {
            this.state.pendingPayLifeForUntapped.push(offer);
          }
        }
      }
      // Transforming DFCs (ROADMAP Phase 10b). A daybound/nightbound permanent
      // makes the game day if it's neither (726.2); a daybound one then enters
      // transformed if it's night (702.145f). A card that just says "enters the
      // battlefield transformed" carries the replacement flag instead.
      if (this.isTransformingDfc(id)) {
        const front = this.frontFaceDef(id);
        if (front.keywords.includes("daybound")) {
          if (this.state.dayNight === null) this.setDayNight("day");
          if (this.state.dayNight === "night") object.face = 1;
        } else if (entering.transformed) {
          object.face = 1;
        }
      }
      // A Saga enters with one lore counter, firing its chapter I ability
      // (rule 714.2b).
      if (this.registry.get(printedCardName(object)).chapters !== null) {
        this.addLoreCounter(id);
      }
      // Counters it entered with were *put* on it (rule 122.6), so a
      // "whenever counters are put on" trigger sees them. Announced last, once
      // the permanent is fully itself (face, tapped state) on the battlefield.
      for (const c of entering.counters) {
        this.emit({
          type: "counter-added",
          object: id,
          counter: c.kind,
          amount: c.amount,
          by: enteringController,
        });
      }
      object.controller = object.owner;
    } else {
      object.tapped = false;
      object.damageMarked = 0;
      object.enteredBattlefieldOnTurn = null;
      object.summoningSick = false;
      object.timestamp = 0;
      // The `{X}` a spell was cast for ends when it changes zones (rule 112.7 /
      // 608.2h) — so a Walking Ballista that dies and returns re-enters as a
      // fresh 0/0 with X=0, not its old size.
      object.xValue = null;
      object.castVia = null;
      // "Has haste until it leaves the battlefield" (a suspend cast) ends here.
      object.hastyUntilItLeaves = false;
    }

    // The hook for `leaves-battlefield` triggers (rule 603.6d) — fired for
    // every destination, and (from the death paths) just before the more
    // specific `permanent-destroyed`.
    if (
      leavingBattlefield &&
      (to === "graveyard" || to === "exile" || to === "hand" || to === "library" || to === "command")
    ) {
      this.leaveBatch?.left.push(id);
      this.emit({ type: "permanent-left-battlefield", object: id, toZone: to });
    }
    if (leftGraveyard !== undefined) this.noteGraveyardDeparture(id, leftGraveyard);
    return true;
  }

  /**
   * A card as it is in its graveyard — what a `leaves-graveyard` trigger's
   * filter is matched against (rule 603.10a). Read with its **front face**
   * up: outside the battlefield and the stack a multi-face card has only its
   * front face's characteristics (rules 712.8a, 715.4), but a cast or a land
   * play out of a graveyard has already turned up the face it's using by the
   * time `moveObject` sees it — a Kazandu Mammoth played as Kazandu Valley
   * (Muldrotha) left the graveyard a creature card, not a land card.
   */
  private graveyardSnapshot(id: ObjectId): LastKnownInfo {
    return this.withFace(id, 0, () => this.takeLastKnown(id));
  }

  /** Card `id` has left a graveyard (or, for a deferred commander, is sure
   * to): part of the simultaneous move under way, announced when that's
   * done — or, on its own, a move of its own, announced now. */
  private noteGraveyardDeparture(id: ObjectId, snapshot: LastKnownInfo): void {
    if (this.graveyardLeaveBatch !== null) {
      this.graveyardLeaveBatch.set(id, snapshot);
    } else {
      this.announceGraveyardDepartures(new Map([[id, snapshot]]));
    }
  }

  /**
   * Carry out `fn` as one simultaneous move for the cards it takes out of
   * graveyards: they are announced together, as one `cards-left-graveyard`
   * once `fn` is done, so a "whenever one or more cards leave your
   * graveyard" trigger fires once for all of them. Anything that moves
   * several graveyard cards in one instruction runs inside one — exiling a
   * whole graveyard, the cards a choice returns, an escape cost, a
   * `simultaneous` sequence. A move outside one is its own event. Nested
   * calls join the outer move.
   */
  private withGraveyardLeaveBatch(fn: () => void): void {
    if (this.graveyardLeaveBatch !== null) {
      fn();
      return;
    }
    const batch = new Map<ObjectId, LastKnownInfo>();
    this.graveyardLeaveBatch = batch;
    try {
      fn();
    } finally {
      this.graveyardLeaveBatch = null;
    }
    if (batch.size > 0) this.announceGraveyardDepartures(batch);
  }

  /** Announce one simultaneous move of cards out of graveyards, with each
   * card's snapshot from there on hand for the triggers it fires. */
  private announceGraveyardDepartures(departed: ReadonlyMap<ObjectId, LastKnownInfo>): void {
    const outer = this.graveyardDepartures;
    this.graveyardDepartures = departed;
    try {
      this.emit({ type: "cards-left-graveyard", objects: [...departed.keys()] });
    } finally {
      this.graveyardDepartures = outer;
    }
  }

  /**
   * Which cards of a `cards-left-graveyard` count toward a `leaves-graveyard`
   * trigger: left the right player's graveyard (`who`) and match `filter` as
   * they were there. Shared by the match and the count, like
   * {@link batchedAttackers}, so a trigger that fired on three artifact cards
   * can't then count two.
   */
  private graveyardLeavers(
    spec: Extract<TriggerSpec, { on: "leaves-graveyard" }>,
    cards: readonly ObjectId[],
    self: GameObject,
  ): readonly ObjectId[] {
    return cards.filter((id) => {
      const snapshot = this.graveyardDepartures?.get(id);
      const owner = snapshot?.owner ?? this.state.objects[id]?.owner;
      if (owner === undefined || !this.matchesWhoPlayer(spec.who, owner, self)) return false;
      return (
        spec.filter === undefined ||
        matchesFilter(this.state, this.registry, id, spec.filter, {
          you: self.controller,
          ...(snapshot !== undefined ? { snapshot } : {}),
          // A comparison against a live amount, as `triggerFilterOk` answers
          // one for every other trigger filter.
          amount: this.filterAmounts({
            source: self.id,
            controller: self.controller,
            triggerObject: id,
          }),
        })
      );
    });
  }

  private zoneList(zone: ZoneType, owner: PlayerId): ObjectId[] {
    if (zone === "library" || zone === "hand" || zone === "graveyard") {
      return this.state.zones.perPlayer[owner][zone];
    }
    return this.state.zones.shared[zone];
  }

  private emit(event: GameEventInput): void {
    const seq = this.state.eventSeq;
    this.state.eventSeq += 1;
    const full = { ...event, seq } as GameEvent;
    this.state.eventLog.push(full);
    // Every consequential state change announces itself here, so this is the
    // broad safety net for the computed-value cache: whatever just changed,
    // `detectTriggers` and everything after it read fresh values.
    invalidateComputedCache();
    this.detectTriggers(full);
  }
}
