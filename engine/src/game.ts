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
import type { StackAbility, TriggerSpec, TriggerWho } from "./abilities.js";
import { actionPlayer } from "./actions.js";
import type {
  Action,
  AttackerDeclaration,
  BlockerDeclaration,
  LegalAction,
} from "./actions.js";
import { CardRegistry, createDefaultRegistry } from "./cards.js";
import type { CardDefinition, Keyword } from "./cards.js";
import { computeCharacteristics } from "./characteristics.js";
import type { Characteristics } from "./characteristics.js";
import { AutomaticController } from "./controller.js";
import type { ControllerView, PlayerController } from "./controller.js";
import { applyEffectSpec } from "./effects.js";
import type { PtDuration, ResolutionContext } from "./effects.js";
import type {
  EventOfType,
  GameEvent,
  GameEventInput,
  GameEventType,
} from "./events.js";
import { COLORS, MANA_TYPES, emptyPool, parseManaCost } from "./mana.js";
import type { ManaCost, ManaType } from "./mana.js";
import type { ObjectId, PlayerId, Rng } from "./primitives.js";
import { asObjectId, createRng, shuffle } from "./primitives.js";
import { DEFAULT_RULES, activePlayerOf, createPlayerState } from "./state.js";
import type { GameObject, GameRules, GameState, ZoneType } from "./state.js";
import type { TargetRef, TargetSpec } from "./target.js";
import { isLegalTarget, legalTargets } from "./targeting.js";
import { PHASE_OF_STEP, isMainPhase, nextStep, stepUsesPriority } from "./turn.js";
import type { Step } from "./turn.js";
import { viewFor } from "./view.js";
import type { PlayerView, ViewOptions } from "./view.js";

export interface DeckList {
  readonly player: PlayerId;
  readonly cards: readonly string[];
}

export interface GameConfig {
  /** Exactly two decks. Seating order follows array order. */
  readonly decks: readonly DeckList[];
  readonly seed?: number;
  /** Defaults to the first player in `decks`. */
  readonly startingPlayer?: PlayerId;
  /** Shuffle libraries at setup (default true). Set false for scripted setups. */
  readonly shuffle?: boolean;
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

export class Game {
  readonly state: GameState;
  private readonly registry: CardRegistry;
  private readonly controllers: Record<PlayerId, PlayerController>;
  private readonly rng: Rng;

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
  }

  static create(config: GameConfig): Game {
    if (config.decks.length !== 2) {
      throw new Error("Game.create currently supports exactly two players");
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
      },
      priority: { active: false, holder: null, passed: [] },
      result: { over: false, winner: null, reason: null },
      awaiting: null,
      pendingBlockerOrders: [],
      pendingTriggers: [],
      timestampSeq: 0,
      eventLog: [],
      eventSeq: 0,
      nextObjectSeq: 0,
    };

    const game = new Game(state, registry, controllers, rng);
    game.setup(config.decks, config.shuffle ?? true);
    return game;
  }

  static fromSnapshot(snapshot: GameState, env: SnapshotEnv = {}): Game {
    const state = structuredClone(snapshot);
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

  private objHasKeyword(id: ObjectId, keyword: Keyword): boolean {
    return computeCharacteristics(this.state, this.registry, id).keywords.has(
      keyword,
    );
  }

  /** Deep copy of the current state, suitable for {@link Game.fromSnapshot}. */
  snapshot(): GameState {
    return structuredClone(this.state);
  }

  /** A redacted, self-contained snapshot from one player's seat. */
  viewFor(player: PlayerId, options: ViewOptions = {}): PlayerView {
    return viewFor(this.state, this.registry, player, options);
  }

  // --- driving the game ------------------------------------------------

  dispatch(action: Action): readonly GameEvent[] {
    const from = this.state.eventLog.length;
    switch (action.type) {
      case "pass-priority":
        this.passPriority(action.player);
        break;
      case "play-land":
        this.playLand(action.player, action.card);
        break;
      case "cast-spell":
        this.castSpell(action.player, action.card, action.targets ?? []);
        break;
      case "activate-ability":
        this.activateAbility(
          action.player,
          action.source,
          action.abilityIndex,
          action.targets ?? [],
        );
        break;
      case "declare-attackers":
        this.applyAttackerDeclarations(action.player, action.attackers);
        break;
      case "declare-blockers":
        this.applyBlockerDeclarations(action.player, action.blocks);
        break;
      case "order-blockers":
        this.applyBlockerOrder(action.player, action.attacker, action.order);
        break;
      case "discard":
        this.applyDiscard(action.player, action.cards);
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
    switch (action.type) {
      case "pass-priority":
        if (this.state.awaiting !== null) return "a declaration is pending";
        return this.state.priority.holder === action.player
          ? null
          : `${action.player} does not have priority`;
      case "play-land":
        return this.whyCannotPlayLand(action.player, action.card);
      case "cast-spell":
        return this.whyCannotCastSpell(action.player, action.card);
      case "activate-ability":
        return this.whyCannotActivateAbility(
          action.player,
          action.source,
          action.abilityIndex,
        );
      case "declare-attackers":
        return this.whyCannotDeclareAttackers(action.player, action.attackers);
      case "declare-blockers":
        return this.whyCannotDeclareBlockers(action.player, action.blocks);
      case "order-blockers":
        return this.whyCannotOrderBlockers(
          action.player,
          action.attacker,
          action.order,
        );
      case "discard":
        return this.whyCannotDiscard(action.player, action.cards);
      default:
        return `unknown action: ${(action as { type: string }).type}`;
    }
  }

  /** Everything `player` may legally do right now. */
  legalActions(player: PlayerId): LegalAction[] {
    if (this.state.result.over) return [];

    const awaiting = this.state.awaiting;
    if (awaiting !== null) {
      if (awaiting.player !== player) return [];
      if (awaiting.kind === "attackers") {
        const defender = this.defendingPlayer();
        return [
          {
            kind: "declare-attackers",
            defender,
            eligible: this.state.zones.shared.battlefield.filter(
              (id) => this.whyCannotAttack(player, id, defender) === null,
            ),
          },
        ];
      }
      if (awaiting.kind === "blockers") {
        const attackers = this.currentAttackers();
        const eligible = this.state.zones.shared.battlefield
          .filter((id) => this.state.objects[id].controller === player)
          .map((blocker) => ({
            blocker,
            canBlock: attackers.filter(
              (attacker) => this.whyCannotBlock(player, blocker, attacker) === null,
            ),
          }))
          .filter((entry) => entry.canBlock.length > 0);
        return [{ kind: "declare-blockers", eligible }];
      }
      if (awaiting.kind === "order-blockers") {
        return [
          {
            kind: "order-blockers",
            attacker: awaiting.attacker,
            blockers: [...this.state.objects[awaiting.attacker].blockedBy],
          },
        ];
      }
      return [
        {
          kind: "discard",
          count: awaiting.count,
          from: [...this.state.zones.perPlayer[player].hand],
        },
      ];
    }

    if (this.state.priority.holder !== player) return [];
    const out: LegalAction[] = [{ kind: "pass-priority" }];

    for (const card of this.state.zones.perPlayer[player].hand) {
      const cardName = this.state.objects[card].cardName;
      const def = this.registry.get(cardName);
      if (def.types.includes("land")) {
        if (this.whyCannotPlayLand(player, card) === null) {
          out.push({ kind: "play-land", card, cardName });
        }
      } else if (this.whyCannotCastSpell(player, card) === null) {
        out.push({
          kind: "cast-spell",
          card,
          cardName,
          targetSpecs: def.targets,
          targetOptions: this.targetOptionsFor(def.targets),
        });
      }
    }

    for (const source of this.state.zones.shared.battlefield) {
      const object = this.state.objects[source];
      if (object.controller !== player) continue;
      this.registry.get(object.cardName).activated.forEach((ability, index) => {
        if (this.whyCannotActivateAbility(player, source, index) !== null) return;
        out.push({
          kind: "activate-ability",
          source,
          abilityIndex: index,
          cardName: object.cardName,
          text: ability.text,
          targetSpecs: ability.targets,
          targetOptions: this.targetOptionsFor(ability.targets),
        });
      });
    }

    return out;
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
  ): readonly (readonly TargetRef[])[] {
    return specs.map((spec) => legalTargets(this.state, this.registry, spec));
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

  private setup(decks: readonly DeckList[], shuffleLibrary: boolean): void {
    for (const { player, cards } of decks) {
      this.state.players[player] = createPlayerState(player, this.state.rules);
      this.state.zones.perPlayer[player] = {
        library: [],
        hand: [],
        graveyard: [],
      };

      const ids: ObjectId[] = [];
      for (const name of cards) {
        this.registry.get(name); // validate the deck list up front
        const id = this.mintObjectId();
        this.state.objects[id] = {
          id,
          cardName: name,
          owner: player,
          controller: player,
          zone: "library",
          tapped: false,
          damageMarked: 0,
          enteredBattlefieldOnTurn: null,
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
        };
        ids.push(id);
      }
      this.state.zones.perPlayer[player].library = shuffleLibrary
        ? shuffle(ids, this.rng)
        : ids;
    }
    this.state.rngState = this.rng.seed;

    this.emit({
      type: "game-started",
      players: [...this.state.turnOrder],
      startingPlayer: this.state.startingPlayer,
      seed: this.state.seed,
    });

    for (const player of this.state.turnOrder) {
      for (let i = 0; i < this.state.rules.openingHandSize; i += 1) {
        this.drawCard(player);
      }
    }

    this.beginTurn();
  }

  private mintObjectId(): ObjectId {
    const n = this.state.nextObjectSeq;
    this.state.nextObjectSeq += 1;
    return asObjectId(`obj-${n}`);
  }

  // --- turn / step progression --------------------------------------

  private beginTurn(): void {
    this.state.turn.number += 1;
    if (this.state.turn.number > 1) {
      this.state.turn.activePlayerIndex =
        (this.state.turn.activePlayerIndex + 1) % this.state.turnOrder.length;
    }
    for (const player of this.state.turnOrder) {
      this.state.players[player].landsPlayedThisTurn = 0;
    }
    this.emit({
      type: "turn-began",
      turn: this.state.turn.number,
      activePlayer: this.activePlayer,
    });
    this.enterStep("untap");
  }

  private enterStep(step: Step): void {
    this.state.turn.step = step;
    for (const player of this.state.turnOrder) {
      this.state.players[player].manaPool = emptyPool();
    }
    this.state.priority.active = false;
    this.state.priority.holder = null;
    this.state.priority.passed = [];
    this.emit({ type: "step-began", step, phase: PHASE_OF_STEP[step] });

    this.performTurnBasedActions(step);

    // A turn-based action may have asked a player for a declaration; that
    // player gets priority so they can dispatch it.
    if (this.state.awaiting !== null) {
      this.prepareForPriority(this.state.awaiting.player);
      return;
    }
    if (stepUsesPriority(step)) {
      this.prepareForPriority(this.activePlayer);
    } else {
      this.runStateBasedActions();
    }
  }

  /**
   * Repeatedly: perform state-based actions, then put any waiting triggered
   * abilities on the stack — until neither happens. Then grant priority.
   */
  private prepareForPriority(player: PlayerId): void {
    let guard = 0;
    for (;;) {
      guard += 1;
      if (guard > 1000) {
        throw new Error("prepareForPriority did not settle; likely an engine bug");
      }
      this.runStateBasedActions();
      if (this.state.result.over) return;
      if (!this.placePendingTriggers()) break;
    }
    this.grantPriority(player);
  }

  private endStep(): void {
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
    } else if (step === "draw") {
      this.drawStep();
    } else if (step === "declare-attackers") {
      this.declareAttackersStep();
    } else if (step === "declare-blockers") {
      this.declareBlockersStep();
    } else if (step === "combat-damage") {
      this.combatDamageStep();
    } else if (step === "end-combat") {
      this.endCombatStep();
    } else if (step === "cleanup") {
      this.cleanupStep();
    }
  }

  private untapStep(): void {
    const active = this.activePlayer;
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      if (object.controller === active && object.tapped) {
        object.tapped = false;
        this.emit({ type: "permanent-untapped", object: id });
      }
    }
  }

  private drawStep(): void {
    const active = this.activePlayer;
    const firstTurnForStarter =
      this.state.turn.number === 1 && active === this.state.startingPlayer;
    if (this.state.rules.skipFirstDraw && firstTurnForStarter) return;
    this.drawCard(active);
  }

  private cleanupStep(): void {
    const active = this.activePlayer;
    const hand = this.state.zones.perPlayer[active].hand;
    const excess = hand.length - this.state.players[active].maxHandSize;
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

    for (const id of cards) this.moveObject(id, "graveyard");
    this.emit({ type: "cards-discarded", player, objects: [...cards] });
    this.state.awaiting = null;

    this.finishCleanup();
    // The cleanup step normally grants no priority; move straight on.
    this.state.priority.active = false;
    this.state.priority.holder = null;
    this.state.priority.passed = [];
    this.runStateBasedActions();
    if (this.state.result.over) return;
    this.endStep();
  }

  private whyCannotDiscard(
    player: PlayerId,
    cards: readonly ObjectId[],
  ): string | null {
    const awaiting = this.state.awaiting;
    if (
      awaiting === null ||
      awaiting.kind !== "discard" ||
      awaiting.player !== player
    ) {
      return `${player} is not being asked to discard`;
    }
    if (cards.length !== awaiting.count) {
      return `${player} must discard exactly ${awaiting.count} card(s), chose ${cards.length}`;
    }
    if (new Set(cards).size !== cards.length) {
      return `${player} chose the same card twice to discard`;
    }
    const hand = new Set(this.state.zones.perPlayer[player].hand);
    for (const id of cards) {
      if (!hand.has(id)) return `${player} tried to discard ${id}, not in hand`;
    }
    return null;
  }

  private finishCleanup(): void {
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
      if (object.damageMarked !== 0) {
        object.damageMarked = 0;
        cleared.push(id);
      }
    }
    if (cleared.length > 0) {
      this.emit({ type: "damage-cleared", objects: cleared });
    }
  }

  // --- combat -----------------------------------------------------

  private defendingPlayer(): PlayerId {
    return (
      this.state.turnOrder.find((player) => player !== this.activePlayer) ??
      this.activePlayer
    );
  }

  /** Battlefield creatures currently declared as attackers. */
  private currentAttackers(): ObjectId[] {
    return this.state.zones.shared.battlefield.filter(
      (id) => this.state.objects[id].attacking != null,
    );
  }

  private creatureDef(id: ObjectId): CardDefinition | null {
    const object = this.state.objects[id];
    if (object === undefined || object.zone !== "battlefield") return null;
    const def = this.registry.get(object.cardName);
    return def.types.includes("creature") ? def : null;
  }

  private hasSummoningSickness(object: GameObject): boolean {
    return (
      object.enteredBattlefieldOnTurn !== null &&
      object.enteredBattlefieldOnTurn >= this.state.turn.number
    );
  }

  /** Ask the active player to declare attackers (rule 508.1). */
  private declareAttackersStep(): void {
    this.state.awaiting = { kind: "attackers", player: this.activePlayer };
  }

  /** Ask the defending player to declare blockers, if anyone is attacking. */
  private declareBlockersStep(): void {
    if (this.currentAttackers().length === 0) return;
    this.state.awaiting = {
      kind: "blockers",
      player: this.defendingPlayer(),
    };
  }

  private whyCannotAttack(
    player: PlayerId,
    creatureId: ObjectId,
    target: PlayerId,
  ): string | null {
    const object = this.state.objects[creatureId];
    const def = this.creatureDef(creatureId);
    if (object === undefined || def === null) {
      return `${creatureId} is not a creature on the battlefield`;
    }
    if (object.controller !== player) {
      return `${def.name} is not controlled by the active player`;
    }
    if (object.tapped) return `${def.name} is tapped and cannot attack`;
    if (this.objHasKeyword(creatureId, "defender")) {
      return `${def.name} has defender and cannot attack`;
    }
    if (
      this.hasSummoningSickness(object) &&
      !this.objHasKeyword(creatureId, "haste")
    ) {
      return `${def.name} has summoning sickness`;
    }
    if (target !== this.defendingPlayer()) {
      return "attackers can only attack the defending player";
    }
    return null;
  }

  private whyCannotBlock(
    player: PlayerId,
    blockerId: ObjectId,
    attackerId: ObjectId,
  ): string | null {
    const blocker = this.state.objects[blockerId];
    const blockerDef = this.creatureDef(blockerId);
    if (blocker === undefined || blockerDef === null) {
      return `${blockerId} is not a creature on the battlefield`;
    }
    if (blocker.controller !== player) {
      return `${blockerDef.name} is not controlled by the defender`;
    }
    if (blocker.tapped) return `${blockerDef.name} is tapped and cannot block`;

    const attacker = this.state.objects[attackerId];
    if (attacker === undefined || attacker.attacking === null) {
      return `${attackerId} is not attacking`;
    }
    if (
      this.objHasKeyword(attackerId, "flying") &&
      !this.objHasKeyword(blockerId, "flying") &&
      !this.objHasKeyword(blockerId, "reach")
    ) {
      const attackerDef = this.registry.get(attacker.cardName);
      return `${blockerDef.name} can't block ${attackerDef.name} (flying)`;
    }
    return null;
  }

  private whyCannotDeclareAttackers(
    player: PlayerId,
    declarations: readonly AttackerDeclaration[],
  ): string | null {
    const awaiting = this.state.awaiting;
    if (
      awaiting === null ||
      awaiting.kind !== "attackers" ||
      awaiting.player !== player
    ) {
      return `${player} is not being asked to declare attackers`;
    }
    const seen = new Set<ObjectId>();
    for (const { attacker, defender } of declarations) {
      if (seen.has(attacker)) {
        return `${attacker} was declared as an attacker twice`;
      }
      seen.add(attacker);
      const why = this.whyCannotAttack(player, attacker, defender);
      if (why !== null) return why;
    }
    return null;
  }

  private whyCannotDeclareBlockers(
    player: PlayerId,
    blocks: readonly BlockerDeclaration[],
  ): string | null {
    const awaiting = this.state.awaiting;
    if (
      awaiting === null ||
      awaiting.kind !== "blockers" ||
      awaiting.player !== player
    ) {
      return `${player} is not being asked to declare blockers`;
    }
    const seen = new Set<ObjectId>();
    for (const { blocker, attacker } of blocks) {
      if (seen.has(blocker)) {
        const def = this.creatureDef(blocker);
        return `${def?.name ?? blocker} is already blocking`;
      }
      seen.add(blocker);
      const why = this.whyCannotBlock(player, blocker, attacker);
      if (why !== null) return why;
    }
    return null;
  }

  private applyAttackerDeclarations(
    player: PlayerId,
    declarations: readonly AttackerDeclaration[],
  ): void {
    const why = this.whyCannotDeclareAttackers(player, declarations);
    if (why !== null) throw new Error(why);

    for (const { attacker, defender } of declarations) {
      const object = this.state.objects[attacker];
      object.attacking = defender;
      object.blockedBy = [];
      object.blocked = false;
      if (!this.objHasKeyword(attacker, "vigilance")) {
        object.tapped = true;
      }
      this.emit({ type: "attacker-declared", attacker, defender });
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

    for (const { blocker: blockerId, attacker: attackerId } of blocks) {
      const blocker = this.state.objects[blockerId];
      const attacker = this.state.objects[attackerId];
      blocker.blocking = attackerId;
      attacker.blockedBy.push(blockerId);
      attacker.blocked = true;
      this.emit({
        type: "blocker-declared",
        blocker: blockerId,
        attacker: attackerId,
      });
    }

    // The attacking player orders the blockers of each multi-blocked attacker
    // for damage assignment (rule 509.2), one `order-blockers` action each.
    // The declaration order is the default the UI can just confirm.
    this.state.awaiting = null;
    this.state.pendingBlockerOrders = this.currentAttackers().filter(
      (id) => this.state.objects[id].blockedBy.length > 1,
    );
    this.promptNextBlockerOrder();
  }

  /**
   * Ask the attacking player to order the next multi-blocked attacker's
   * blockers, or resume the step once every one has been ordered.
   */
  private promptNextBlockerOrder(): void {
    const next = this.state.pendingBlockerOrders[0];
    if (next === undefined) {
      this.state.awaiting = null;
      this.prepareForPriority(this.activePlayer);
      return;
    }
    this.state.awaiting = {
      kind: "order-blockers",
      player: this.activePlayer,
      attacker: next,
    };
    this.grantPriority(this.activePlayer);
  }

  private whyCannotOrderBlockers(
    player: PlayerId,
    attacker: ObjectId,
    order: readonly ObjectId[],
  ): string | null {
    const awaiting = this.state.awaiting;
    if (
      awaiting === null ||
      awaiting.kind !== "order-blockers" ||
      awaiting.player !== player
    ) {
      return `${player} is not being asked to order blockers`;
    }
    if (awaiting.attacker !== attacker) {
      return `expected an order for ${awaiting.attacker}, got ${attacker}`;
    }
    const current = this.state.objects[attacker]?.blockedBy ?? [];
    const valid =
      order.length === current.length &&
      new Set(order).size === order.length &&
      order.every((id) => current.includes(id));
    if (!valid) return "blocker order must be a permutation of the blockers";
    return null;
  }

  private applyBlockerOrder(
    player: PlayerId,
    attacker: ObjectId,
    order: readonly ObjectId[],
  ): void {
    const why = this.whyCannotOrderBlockers(player, attacker, order);
    if (why !== null) throw new Error(why);

    this.state.objects[attacker].blockedBy = [...order];
    this.state.pendingBlockerOrders = this.state.pendingBlockerOrders.filter(
      (id) => id !== attacker,
    );
    this.promptNextBlockerOrder();
  }

  private combatDamageStep(): void {
    const assignments: {
      source: ObjectId;
      target: TargetRef;
      amount: number;
    }[] = [];

    for (const attackerId of this.currentAttackers()) {
      const attacker = this.state.objects[attackerId];
      const power = computeCharacteristics(this.state, this.registry, attackerId).power;
      const liveBlockers = attacker.blockedBy.filter(
        (id) => this.state.objects[id]?.zone === "battlefield",
      );

      if (!attacker.blocked) {
        if (attacker.attacking !== null && power > 0) {
          assignments.push({
            source: attackerId,
            target: { kind: "player", player: attacker.attacking },
            amount: power,
          });
        }
      } else if (power > 0 && liveBlockers.length > 0) {
        // Auto-assign: minimum lethal down the order, remainder to the last.
        let remaining = power;
        liveBlockers.forEach((blockerId, index) => {
          const blocker = this.state.objects[blockerId];
          const toughness = computeCharacteristics(
            this.state,
            this.registry,
            blockerId,
          ).toughness;
          const lethal = Math.max(0, toughness - blocker.damageMarked);
          const isLast = index === liveBlockers.length - 1;
          const amount = isLast ? remaining : Math.min(remaining, lethal);
          remaining -= amount;
          if (amount > 0) {
            assignments.push({
              source: attackerId,
              target: { kind: "object", object: blockerId },
              amount,
            });
          }
        });
      }

      for (const blockerId of liveBlockers) {
        const blockerPower = computeCharacteristics(
          this.state,
          this.registry,
          blockerId,
        ).power;
        if (blockerPower > 0) {
          assignments.push({
            source: blockerId,
            target: { kind: "object", object: attackerId },
            amount: blockerPower,
          });
        }
      }
    }

    // All combat damage is dealt simultaneously.
    for (const { source, target, amount } of assignments) {
      this.dealDamage(source, target, amount);
    }
  }

  private endCombatStep(): void {
    this.state.pendingBlockerOrders = [];
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

  private whyCannotPlayLand(player: PlayerId, cardId: ObjectId): string | null {
    return (
      this.whyCannotAct(player) ??
      this.whyNotSorcerySpeed(player, "play a land") ??
      this.landDropReason(player) ??
      this.landInHandReason(player, cardId)
    );
  }

  private landDropReason(player: PlayerId): string | null {
    const playerState = this.state.players[player];
    return playerState.landsPlayedThisTurn >= this.state.rules.maxLandsPerTurn
      ? `${player} has already played a land this turn`
      : null;
  }

  private landInHandReason(player: PlayerId, cardId: ObjectId): string | null {
    if (!this.state.zones.perPlayer[player].hand.includes(cardId)) {
      return `${player} does not have that card in hand`;
    }
    const def = this.registry.get(this.state.objects[cardId].cardName);
    return def.types.includes("land") ? null : `${def.name} is not a land`;
  }

  private playLand(player: PlayerId, cardId: ObjectId): void {
    const why = this.whyCannotPlayLand(player, cardId);
    if (why !== null) throw new Error(why);
    const playerState = this.state.players[player];

    this.moveObject(cardId, "battlefield");
    playerState.landsPlayedThisTurn += 1;
    this.emit({ type: "land-played", player, object: cardId });
    this.emit({ type: "permanent-entered-battlefield", object: cardId });
    this.afterPlayerAction(player);
  }

  /**
   * Why `player` cannot cast `cardId` at all right now — ignoring which targets
   * they would pick, but requiring that every target slot has a legal option.
   */
  private whyCannotCastSpell(player: PlayerId, cardId: ObjectId): string | null {
    const blocked = this.whyCannotAct(player);
    if (blocked !== null) return blocked;
    if (!this.state.zones.perPlayer[player].hand.includes(cardId)) {
      return `${player} does not have that card in hand`;
    }
    const def = this.registry.get(this.state.objects[cardId].cardName);
    if (def.types.includes("land")) return "lands are played, not cast";
    if (!def.types.includes("instant")) {
      const timing = this.whyNotSorcerySpeed(player, `cast ${def.name}`);
      if (timing !== null) return timing;
    }
    for (const spec of def.targets) {
      if (legalTargets(this.state, this.registry, spec).length === 0) {
        return `${def.name} has no legal ${spec} target`;
      }
    }
    if (this.planManaPayment(player, parseManaCost(def.manaCost)) === null) {
      return `${player} cannot pay the cost of ${def.name}`;
    }
    return null;
  }

  private castSpell(
    player: PlayerId,
    cardId: ObjectId,
    targets: readonly TargetRef[],
  ): void {
    const why = this.whyCannotCastSpell(player, cardId);
    if (why !== null) throw new Error(why);

    const object = this.state.objects[cardId];
    const def = this.registry.get(object.cardName);

    if (targets.length !== def.targets.length) {
      throw new Error(
        `${def.name} takes ${def.targets.length} target(s), got ${targets.length}`,
      );
    }
    def.targets.forEach((spec, i) => {
      if (!isLegalTarget(this.state, this.registry, spec, targets[i])) {
        throw new Error(`illegal target for ${def.name}`);
      }
    });

    const cost = parseManaCost(def.manaCost);
    const plan = this.planManaPayment(player, cost);
    if (plan === null) {
      throw new Error(`${player} cannot pay the cost of ${def.name}`);
    }

    // Commit: move to the stack, pay, announce.
    this.moveObject(cardId, "stack");
    object.targets = targets.length > 0 ? [...targets] : null;
    for (const sourceId of plan) this.tapManaSource(sourceId);
    this.spendFromPool(player, cost);

    this.emit({
      type: "spell-cast",
      player,
      object: cardId,
      targets: [...targets],
    });
    this.afterPlayerAction(player);
  }

  private whyCannotActivateAbility(
    player: PlayerId,
    sourceId: ObjectId,
    abilityIndex: number,
  ): string | null {
    const blocked = this.whyCannotAct(player);
    if (blocked !== null) return blocked;
    const source = this.state.objects[sourceId];
    if (source === undefined || source.zone !== "battlefield") {
      return "that permanent is not on the battlefield";
    }
    if (source.controller !== player) {
      return `${player} does not control that permanent`;
    }
    const def = this.registry.get(source.cardName);
    const ability = def.activated[abilityIndex];
    if (ability === undefined) {
      return `${def.name} has no ability #${abilityIndex}`;
    }
    if (ability.cost.tap) {
      if (source.tapped) return `${def.name} is already tapped`;
      if (this.tapAbilityBlockedBySickness(source)) {
        return `${def.name} has summoning sickness`;
      }
    }
    for (const spec of ability.targets) {
      if (legalTargets(this.state, this.registry, spec).length === 0) {
        return `${def.name}'s ability has no legal ${spec} target`;
      }
    }
    if (this.planManaPayment(player, parseManaCost(ability.cost.mana)) === null) {
      return `${player} cannot pay for ${def.name}'s ability`;
    }
    return null;
  }

  private activateAbility(
    player: PlayerId,
    sourceId: ObjectId,
    abilityIndex: number,
    targets: readonly TargetRef[],
  ): void {
    const why = this.whyCannotActivateAbility(player, sourceId, abilityIndex);
    if (why !== null) throw new Error(why);

    const source = this.state.objects[sourceId];
    const def = this.registry.get(source.cardName);
    const ability = def.activated[abilityIndex];

    if (targets.length !== ability.targets.length) {
      throw new Error(
        `that ability of ${def.name} takes ${ability.targets.length} target(s), got ${targets.length}`,
      );
    }
    ability.targets.forEach((spec, i) => {
      if (!isLegalTarget(this.state, this.registry, spec, targets[i])) {
        throw new Error(`illegal target for ${def.name}'s ability`);
      }
    });

    const manaCost = parseManaCost(ability.cost.mana);
    const plan = this.planManaPayment(player, manaCost);
    if (plan === null) {
      throw new Error(`${player} cannot pay for ${def.name}'s ability`);
    }

    // Pay the cost.
    if (ability.cost.tap) {
      source.tapped = true;
      this.emit({ type: "permanent-tapped", object: sourceId });
    }
    for (const manaSourceId of plan) this.tapManaSource(manaSourceId);
    this.spendFromPool(player, manaCost);

    if (isManaAbility(ability)) {
      // Mana abilities resolve immediately and never use the stack.
      const context = this.makeResolutionContext(sourceId, player, []);
      if (ability.effect !== null) applyEffectSpec(ability.effect, context);
      this.emit({
        type: "ability-activated",
        source: sourceId,
        player,
        onStack: false,
      });
      return;
    }

    this.mintAbilityObject(
      sourceId,
      source.cardName,
      player,
      "activated",
      abilityIndex,
      targets,
    );
    this.emit({
      type: "ability-activated",
      source: sourceId,
      player,
      onStack: true,
    });
    this.afterPlayerAction(player);
  }

  private mintAbilityObject(
    sourceId: ObjectId,
    cardName: string,
    controller: PlayerId,
    abilityKind: "activated" | "triggered",
    abilityIndex: number,
    targets: readonly TargetRef[],
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
      enteredBattlefieldOnTurn: null,
      targets: targets.length > 0 ? [...targets] : null,
      attacking: null,
      blocking: null,
      blockedBy: [],
      blocked: false,
      kind: "ability",
      abilityKind,
      sourceObjectId: sourceId,
      abilityIndex,
      counters: {},
      modifiers: [],
      timestamp: 0,
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
   * mana each can make. A `{T}` mana ability of a creature is unavailable while
   * that creature is summoning-sick (rule 302.6).
   */
  private manaSources(player: PlayerId): { id: ObjectId; produces: ManaType[] }[] {
    const out: { id: ObjectId; produces: ManaType[] }[] = [];
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      if (object.controller !== player || object.tapped) continue;
      if (this.tapAbilityBlockedBySickness(object)) continue;

      const produces: ManaType[] = [];
      for (const ability of this.registry.get(object.cardName).activated) {
        if (
          isManaAbility(ability) &&
          ability.cost.tap &&
          ability.cost.mana === null &&
          ability.effect !== null &&
          ability.effect.kind === "add-mana"
        ) {
          for (let k = 0; k < ability.effect.amount; k += 1) {
            produces.push(ability.effect.mana);
          }
        }
      }
      if (produces.length > 0) out.push({ id, produces });
    }
    return out;
  }

  /** True if `object` is a summoning-sick creature (so its `{T}` costs can't be paid). */
  private tapAbilityBlockedBySickness(object: GameObject): boolean {
    return (
      this.registry.get(object.cardName).types.includes("creature") &&
      this.hasSummoningSickness(object)
    );
  }

  /**
   * Which of `player`'s mana sources to tap to cover `cost`, or `null` if it
   * can't be covered. Existing floating mana is spent first.
   */
  private planManaPayment(player: PlayerId, cost: ManaCost): ObjectId[] | null {
    const pool = this.state.players[player].manaPool;
    const coloredNeed: Record<string, number> = {};
    for (const color of COLORS) {
      coloredNeed[color] = Math.max(0, cost.colored[color] - pool[color]);
    }
    const poolSpentOnColors = COLORS.reduce(
      (sum, color) => sum + Math.min(cost.colored[color], pool[color]),
      0,
    );
    const poolLeftForGeneric =
      MANA_TYPES.reduce((sum, type) => sum + pool[type], 0) - poolSpentOnColors;
    let genericNeed = Math.max(0, cost.generic - poolLeftForGeneric);

    const sources = this.manaSources(player);
    const used = new Set<ObjectId>();
    const plan: ObjectId[] = [];

    for (const color of COLORS) {
      for (let i = 0; i < coloredNeed[color]; i += 1) {
        const source = sources.find(
          (s) => !used.has(s.id) && s.produces.includes(color),
        );
        if (source === undefined) return null;
        used.add(source.id);
        plan.push(source.id);
      }
    }
    while (genericNeed > 0) {
      const source = sources.find((s) => !used.has(s.id));
      if (source === undefined) return null;
      used.add(source.id);
      plan.push(source.id);
      genericNeed -= 1;
    }
    return plan;
  }

  /** Activate `id`'s simple `{T}: Add` mana ability: tap it and fill the pool. */
  private tapManaSource(id: ObjectId): void {
    const object = this.state.objects[id];
    const ability = this.registry
      .get(object.cardName)
      .activated.find(
        (a) =>
          isManaAbility(a) &&
          a.cost.tap &&
          a.cost.mana === null &&
          a.effect !== null &&
          a.effect.kind === "add-mana",
      );
    if (ability === undefined || ability.effect?.kind !== "add-mana") {
      throw new Error("that permanent has no simple mana ability");
    }
    object.tapped = true;
    this.emit({ type: "permanent-tapped", object: id });
    this.addMana(object.controller, ability.effect.mana, ability.effect.amount);
  }

  private addMana(player: PlayerId, mana: ManaType, amount: number): void {
    this.state.players[player].manaPool[mana] += amount;
    this.emit({ type: "mana-added", player, mana, amount });
  }

  private spendFromPool(player: PlayerId, cost: ManaCost): void {
    const pool = this.state.players[player].manaPool;
    for (const color of COLORS) {
      pool[color] -= cost.colored[color];
      if (pool[color] < 0) {
        throw new Error("mana pool underflow paying a colored cost");
      }
    }
    let generic = cost.generic;
    for (const type of GENERIC_SPEND_ORDER) {
      const spend = Math.min(generic, pool[type]);
      pool[type] -= spend;
      generic -= spend;
    }
    if (generic > 0) {
      throw new Error("mana pool underflow paying a generic cost");
    }
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
      this.runStateBasedActions();
      if (this.state.result.over) {
        priority.active = false;
        priority.holder = null;
        return;
      }
      this.prepareForPriority(this.activePlayer);
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

  private resolveTopOfStack(): void {
    const stack = this.state.zones.shared.stack;
    const id = stack[stack.length - 1];
    const object = this.state.objects[id];

    if (object.kind === "ability") {
      this.resolveAbility(object);
      return;
    }

    const def = this.registry.get(object.cardName);
    const targets = object.targets ?? [];

    if (
      def.targets.length > 0 &&
      !this.anyTargetLegal(def.targets, targets)
    ) {
      this.moveObject(id, "graveyard");
      object.targets = null;
      this.emit({
        type: "spell-fizzled",
        object: id,
        reason: "all targets are illegal",
      });
      return;
    }

    const context = this.makeResolutionContext(id, object.controller, targets);
    if (def.resolve !== null) {
      def.resolve(context);
    } else if (def.effect !== null) {
      applyEffectSpec(def.effect, context);
    }
    this.emit({ type: "spell-resolved", object: id });

    if (this.isPermanentSpell(def)) {
      this.moveObject(id, "battlefield");
      object.targets = null;
      this.emit({ type: "permanent-entered-battlefield", object: id });
    } else {
      this.moveObject(id, "graveyard");
      object.targets = null;
    }
  }

  private stackAbilityOf(object: GameObject): StackAbility {
    const def = this.registry.get(object.cardName);
    const index = object.abilityIndex ?? 0;
    return object.abilityKind === "triggered"
      ? def.triggered[index]
      : def.activated[index];
  }

  private resolveAbility(object: GameObject): void {
    const id = object.id;
    const ability = this.stackAbilityOf(object);
    const targets = object.targets ?? [];
    const source = object.sourceObjectId ?? id;

    if (
      ability.targets.length > 0 &&
      !this.anyTargetLegal(ability.targets, targets)
    ) {
      this.removeAbilityFromStack(id);
      this.emit({
        type: "spell-fizzled",
        object: id,
        reason: "all targets are illegal",
      });
      return;
    }

    const context = this.makeResolutionContext(source, object.controller, targets);
    if (ability.resolve !== null) {
      ability.resolve(context);
    } else if (ability.effect !== null) {
      applyEffectSpec(ability.effect, context);
    }
    this.emit({ type: "ability-resolved", source });
    this.removeAbilityFromStack(id);
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
    const candidates = new Set<ObjectId>(this.state.zones.shared.battlefield);
    if (event.type === "permanent-destroyed") candidates.add(event.object);
    for (const id of candidates) {
      const object = this.state.objects[id];
      if (object === undefined) continue;
      const abilities = this.registry.get(object.cardName).triggered;
      abilities.forEach((ability, index) => {
        if (this.triggerMatches(ability.trigger, event, object)) {
          this.state.pendingTriggers.push({
            sourceObjectId: id,
            cardName: object.cardName,
            abilityIndex: index,
            controller: object.controller,
          });
        }
      });
    }
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
          this.matchesWho(spec.who, event.object, self)
        );
      case "dies":
        return (
          event.type === "permanent-destroyed" &&
          this.matchesWho(spec.who, event.object, self)
        );
      case "attacks":
        return (
          event.type === "attacker-declared" &&
          this.matchesWho(spec.who, event.attacker, self)
        );
      case "step-begins":
        return (
          event.type === "step-began" &&
          event.step === spec.step &&
          (spec.who !== "you" || this.activePlayer === self.controller)
        );
      default:
        return false;
    }
  }

  private matchesWho(
    who: TriggerWho,
    subject: ObjectId,
    self: GameObject,
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
        return object !== undefined && object.controller === self.controller;
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

    const ordered = [
      ...pending.filter((t) => t.controller === this.activePlayer),
      ...pending.filter((t) => t.controller !== this.activePlayer),
    ];
    for (const trigger of ordered) this.placeTriggerOnStack(trigger);
    return true;
  }

  private placeTriggerOnStack(trigger: {
    readonly sourceObjectId: ObjectId;
    readonly cardName: string;
    readonly abilityIndex: number;
    readonly controller: PlayerId;
  }): void {
    const ability =
      this.registry.get(trigger.cardName).triggered[trigger.abilityIndex];

    let targets: readonly TargetRef[] = [];
    if (ability.targets.length > 0) {
      const legalOptions = ability.targets.map((spec) =>
        legalTargets(this.state, this.registry, spec),
      );
      if (legalOptions.some((options) => options.length === 0)) {
        this.emit({
          type: "trigger-removed",
          source: trigger.sourceObjectId,
          reason: "no legal targets",
        });
        return;
      }
      const chosen = this.controllers[trigger.controller].chooseTargets(
        this.controllerView(trigger.controller),
        trigger.cardName,
        ability.targets,
        legalOptions,
      );
      if (chosen.length !== ability.targets.length) {
        throw new Error(`bad target count for ${trigger.cardName}'s trigger`);
      }
      ability.targets.forEach((spec, i) => {
        if (!isLegalTarget(this.state, this.registry, spec, chosen[i])) {
          throw new Error(`illegal target chosen for ${trigger.cardName}'s trigger`);
        }
      });
      targets = [...chosen];
    }

    this.mintAbilityObject(
      trigger.sourceObjectId,
      trigger.cardName,
      trigger.controller,
      "triggered",
      trigger.abilityIndex,
      targets,
    );
    this.emit({
      type: "ability-triggered",
      source: trigger.sourceObjectId,
      controller: trigger.controller,
    });
  }

  private anyTargetLegal(
    specs: readonly TargetSpec[],
    targets: readonly TargetRef[],
  ): boolean {
    return specs.some(
      (spec, i) =>
        targets[i] !== undefined &&
        isLegalTarget(this.state, this.registry, spec, targets[i]),
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
    targets: readonly TargetRef[],
  ): ResolutionContext {
    return {
      controller,
      source,
      targets,
      dealDamage: (target, amount) => this.dealDamage(source, target, amount),
      draw: (player, count) => {
        for (let i = 0; i < count; i += 1) this.drawCard(player);
      },
      gainLife: (player, amount) => this.changeLife(player, amount),
      loseLife: (player, amount) => this.changeLife(player, -amount),
      addMana: (player, mana, amount) => this.addMana(player, mana, amount),
      tapPermanent: (target) => this.setTapped(target, true),
      untapPermanent: (target) => this.setTapped(target, false),
      destroyPermanent: (target) => this.destroyByEffect(target),
      modifyPt: (target, power, toughness, duration) =>
        this.modifyPt(target, power, toughness, duration),
      addCounter: (target, counter, amount) =>
        this.addCounter(target, counter, amount),
      grantKeyword: (target, keyword, duration) =>
        this.grantKeyword(target, keyword, duration),
    };
  }

  private modifyPt(
    target: TargetRef,
    power: number,
    toughness: number,
    duration: PtDuration,
  ): void {
    if (target.kind !== "object") return;
    const object = this.state.objects[target.object];
    if (object === undefined || object.zone !== "battlefield") return;
    object.modifiers.push({
      power,
      toughness,
      keywords: [],
      untilEndOfTurn: duration === "end-of-turn",
    });
    this.emit({
      type: "pt-modified",
      object: target.object,
      power,
      toughness,
      duration,
    });
  }

  private grantKeyword(
    target: TargetRef,
    keyword: Keyword,
    duration: PtDuration,
  ): void {
    if (target.kind !== "object") return;
    const object = this.state.objects[target.object];
    if (object === undefined || object.zone !== "battlefield") return;
    object.modifiers.push({
      power: 0,
      toughness: 0,
      keywords: [keyword],
      untilEndOfTurn: duration === "end-of-turn",
    });
    this.emit({
      type: "keyword-granted",
      object: target.object,
      keyword,
      duration,
    });
  }

  private addCounter(target: TargetRef, counter: string, amount: number): void {
    if (target.kind !== "object") return;
    const object = this.state.objects[target.object];
    if (object === undefined || object.zone !== "battlefield") return;
    object.counters[counter] = (object.counters[counter] ?? 0) + amount;
    this.emit({ type: "counter-added", object: target.object, counter, amount });
  }

  private setTapped(target: TargetRef, tapped: boolean): void {
    if (target.kind !== "object") return;
    const object = this.state.objects[target.object];
    if (object === undefined || object.zone !== "battlefield") return;
    if (object.tapped === tapped) return;
    object.tapped = tapped;
    this.emit(
      tapped
        ? { type: "permanent-tapped", object: target.object }
        : { type: "permanent-untapped", object: target.object },
    );
  }

  private destroyByEffect(target: TargetRef): void {
    if (target.kind !== "object") return;
    const object = this.state.objects[target.object];
    if (object === undefined || object.zone !== "battlefield") return;
    this.moveObject(target.object, "graveyard");
    this.emit({
      type: "permanent-destroyed",
      object: target.object,
      reason: "destroyed",
    });
  }

  private dealDamage(
    source: ObjectId,
    target: TargetRef,
    amount: number,
  ): void {
    if (amount <= 0) return;
    if (target.kind === "player") {
      if (this.state.players[target.player] === undefined) return;
      this.emit({ type: "damage-dealt", source, target, amount });
      this.changeLife(target.player, -amount);
      return;
    }
    const object = this.state.objects[target.object];
    if (object === undefined || object.zone !== "battlefield") return;
    object.damageMarked += amount;
    this.emit({ type: "damage-dealt", source, target, amount });
  }

  private changeLife(player: PlayerId, delta: number): void {
    const playerState = this.state.players[player];
    playerState.life += delta;
    this.emit({
      type: "life-changed",
      player,
      delta,
      life: playerState.life,
    });
  }

  // --- state-based actions -----------------------------------

  private runStateBasedActions(): void {
    let changed = true;
    while (changed) {
      changed = false;

      for (const player of this.state.turnOrder) {
        const playerState = this.state.players[player];
        if (playerState.hasLost) continue;
        let reason: string | null = null;
        if (playerState.life <= 0) {
          reason = "life total is 0 or less";
        } else if (playerState.attemptedDrawFromEmptyLibrary) {
          reason = "attempted to draw from an empty library";
        }
        if (reason !== null) {
          playerState.hasLost = true;
          playerState.lossReason = reason;
          this.emit({ type: "player-lost", player, reason });
          changed = true;
        }
      }

      for (const id of [...this.state.zones.shared.battlefield]) {
        const object = this.state.objects[id];
        const def = this.registry.get(object.cardName);
        if (!def.types.includes("creature")) continue;
        const toughness = computeCharacteristics(this.state, this.registry, id).toughness;
        let reason: string | null = null;
        if (toughness <= 0) {
          reason = "toughness is 0 or less";
        } else if (object.damageMarked >= toughness) {
          reason = "lethal damage";
        }
        if (reason !== null) {
          this.moveObject(id, "graveyard");
          this.emit({ type: "permanent-destroyed", object: id, reason });
          changed = true;
        }
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

  // --- zones -------------------------------------------------

  private drawCard(player: PlayerId): void {
    const library = this.state.zones.perPlayer[player].library;
    if (library.length === 0) {
      this.state.players[player].attemptedDrawFromEmptyLibrary = true;
      this.emit({ type: "draw-from-empty-library", player });
      return;
    }
    const id = library[0];
    this.moveObject(id, "hand");
    this.emit({ type: "card-drawn", player, object: id });
  }

  private moveObject(id: ObjectId, to: ZoneType): void {
    const object = this.state.objects[id];
    const from = this.zoneList(object.zone, object.owner);
    const index = from.indexOf(id);
    if (index >= 0) from.splice(index, 1);

    object.zone = to;
    this.zoneList(to, object.owner).push(id);

    // A change of zone resets everything that only applies in one zone.
    object.attacking = null;
    object.blocking = null;
    object.blockedBy = [];
    object.blocked = false;
    object.counters = {};
    object.modifiers = [];

    if (to === "battlefield") {
      object.enteredBattlefieldOnTurn = this.state.turn.number;
      this.state.timestampSeq += 1;
      object.timestamp = this.state.timestampSeq;
    } else {
      object.tapped = false;
      object.damageMarked = 0;
      object.enteredBattlefieldOnTurn = null;
      object.timestamp = 0;
    }
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
    this.detectTriggers(full);
  }
}
