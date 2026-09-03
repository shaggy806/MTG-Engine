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
import { actionPlayer } from "./actions.js";
import type { Action } from "./actions.js";
import { CardRegistry, createDefaultRegistry, hasKeyword } from "./cards.js";
import type { CardDefinition } from "./cards.js";
import { AutomaticController } from "./controller.js";
import type { ControllerView, PlayerController } from "./controller.js";
import { applyEffectSpec } from "./effects.js";
import type { ResolutionContext } from "./effects.js";
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
import { isLegalTarget } from "./targeting.js";
import { PHASE_OF_STEP, isMainPhase, nextStep, stepUsesPriority } from "./turn.js";
import type { Step } from "./turn.js";

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

  /** Deep copy of the current state, suitable for {@link Game.fromSnapshot}. */
  snapshot(): GameState {
    return structuredClone(this.state);
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
      default:
        throw new Error(
          `unhandled action: ${(action as { type: string }).type}`,
        );
    }
    return this.state.eventLog.slice(from);
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
      const view: ControllerView = { state: this.state, player: holder };
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
          sourceObjectId: null,
          abilityIndex: null,
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
    this.runStateBasedActions();
    if (this.state.result.over) return;

    if (stepUsesPriority(step)) {
      this.grantPriority(this.activePlayer);
    }
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
      const chosen = this.controllers[active].chooseDiscards(
        hand.map((id) => this.state.objects[id]),
        excess,
      );
      this.assertValidDiscards(active, chosen, excess);
      for (const id of chosen) this.moveObject(id, "graveyard");
      this.emit({
        type: "cards-discarded",
        player: active,
        objects: [...chosen],
      });
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

  private assertValidDiscards(
    player: PlayerId,
    chosen: readonly ObjectId[],
    expected: number,
  ): void {
    if (chosen.length !== expected) {
      throw new Error(
        `${player} must discard exactly ${expected} card(s), chose ${chosen.length}`,
      );
    }
    if (new Set(chosen).size !== chosen.length) {
      throw new Error(`${player} chose the same card twice to discard`);
    }
    const hand = new Set(this.state.zones.perPlayer[player].hand);
    for (const id of chosen) {
      if (!hand.has(id)) {
        throw new Error(`${player} tried to discard ${id}, not in hand`);
      }
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

  private declareAttackersStep(): void {
    const attackingPlayer = this.activePlayer;
    const defender = this.defendingPlayer();
    const declarations =
      this.controllers[attackingPlayer].declareAttackers({
        state: this.state,
        player: attackingPlayer,
      });

    const seen = new Set<ObjectId>();
    for (const { attacker: creatureId, defender: target } of declarations) {
      if (seen.has(creatureId)) {
        throw new Error(`${creatureId} was declared as an attacker twice`);
      }
      seen.add(creatureId);

      const object = this.state.objects[creatureId];
      const def = this.creatureDef(creatureId);
      if (object === undefined || def === null) {
        throw new Error(`${creatureId} is not a creature on the battlefield`);
      }
      if (object.controller !== attackingPlayer) {
        throw new Error(`${def.name} is not controlled by the active player`);
      }
      if (object.tapped) {
        throw new Error(`${def.name} is tapped and cannot attack`);
      }
      if (hasKeyword(def, "defender")) {
        throw new Error(`${def.name} has defender and cannot attack`);
      }
      if (this.hasSummoningSickness(object) && !hasKeyword(def, "haste")) {
        throw new Error(`${def.name} has summoning sickness`);
      }
      if (target !== defender) {
        throw new Error("attackers can only attack the defending player");
      }

      object.attacking = target;
      object.blockedBy = [];
      object.blocked = false;
      if (!hasKeyword(def, "vigilance")) {
        object.tapped = true;
      }
      this.emit({
        type: "attacker-declared",
        attacker: creatureId,
        defender: target,
      });
    }
  }

  private declareBlockersStep(): void {
    const attackers = this.currentAttackers();
    if (attackers.length === 0) return;

    const defender = this.defendingPlayer();
    const declarations = this.controllers[defender].declareBlockers({
      state: this.state,
      player: defender,
    });

    for (const { blocker: blockerId, attacker: attackerId } of declarations) {
      const blocker = this.state.objects[blockerId];
      const blockerDef = this.creatureDef(blockerId);
      if (blocker === undefined || blockerDef === null) {
        throw new Error(`${blockerId} is not a creature on the battlefield`);
      }
      if (blocker.controller !== defender) {
        throw new Error(`${blockerDef.name} is not controlled by the defender`);
      }
      if (blocker.tapped) {
        throw new Error(`${blockerDef.name} is tapped and cannot block`);
      }
      if (blocker.blocking !== null) {
        throw new Error(`${blockerDef.name} is already blocking`);
      }

      const attacker = this.state.objects[attackerId];
      if (attacker === undefined || attacker.attacking === null) {
        throw new Error(`${attackerId} is not attacking`);
      }
      const attackerDef = this.registry.get(attacker.cardName);
      if (
        hasKeyword(attackerDef, "flying") &&
        !hasKeyword(blockerDef, "flying") &&
        !hasKeyword(blockerDef, "reach")
      ) {
        throw new Error(
          `${blockerDef.name} can't block ${attackerDef.name} (flying)`,
        );
      }

      blocker.blocking = attackerId;
      attacker.blockedBy.push(blockerId);
      attacker.blocked = true;
      this.emit({
        type: "blocker-declared",
        blocker: blockerId,
        attacker: attackerId,
      });
    }

    // The attacking player orders each attacker's blockers for damage assignment.
    const attackingPlayer = this.activePlayer;
    for (const attackerId of attackers) {
      const attacker = this.state.objects[attackerId];
      if (attacker.blockedBy.length > 1) {
        const ordered = this.controllers[attackingPlayer].orderBlockers(
          { state: this.state, player: attackingPlayer },
          attackerId,
          [...attacker.blockedBy],
        );
        this.assertPermutation(attacker.blockedBy, ordered, "blocker order");
        attacker.blockedBy = [...ordered];
      }
    }
  }

  private combatDamageStep(): void {
    const assignments: {
      source: ObjectId;
      target: TargetRef;
      amount: number;
    }[] = [];

    for (const attackerId of this.currentAttackers()) {
      const attacker = this.state.objects[attackerId];
      const power = this.registry.get(attacker.cardName).power ?? 0;
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
          const toughness =
            this.registry.get(blocker.cardName).toughness ?? 0;
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
        const blockerPower =
          this.registry.get(this.state.objects[blockerId].cardName).power ?? 0;
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
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      object.attacking = null;
      object.blocking = null;
      object.blockedBy = [];
      object.blocked = false;
    }
  }

  private assertPermutation(
    original: readonly ObjectId[],
    given: readonly ObjectId[],
    label: string,
  ): void {
    const valid =
      given.length === original.length &&
      new Set(given).size === given.length &&
      given.every((id) => original.includes(id));
    if (!valid) throw new Error(`invalid ${label}`);
  }

  // --- player actions ----------------------------------------------

  private playLand(player: PlayerId, cardId: ObjectId): void {
    this.assertHasPriority(player);
    this.assertSorcerySpeed(player, "play a land");
    const playerState = this.state.players[player];
    if (playerState.landsPlayedThisTurn >= this.state.rules.maxLandsPerTurn) {
      throw new Error(`${player} has already played a land this turn`);
    }
    if (!this.state.zones.perPlayer[player].hand.includes(cardId)) {
      throw new Error(`${player} does not have that card in hand`);
    }
    const def = this.registry.get(this.state.objects[cardId].cardName);
    if (!def.types.includes("land")) {
      throw new Error(`${def.name} is not a land`);
    }

    this.moveObject(cardId, "battlefield");
    playerState.landsPlayedThisTurn += 1;
    this.emit({ type: "land-played", player, object: cardId });
    this.emit({ type: "permanent-entered-battlefield", object: cardId });
    this.afterPlayerAction(player);
  }

  private castSpell(
    player: PlayerId,
    cardId: ObjectId,
    targets: readonly TargetRef[],
  ): void {
    this.assertHasPriority(player);
    if (!this.state.zones.perPlayer[player].hand.includes(cardId)) {
      throw new Error(`${player} does not have that card in hand`);
    }
    const object = this.state.objects[cardId];
    const def = this.registry.get(object.cardName);
    if (def.types.includes("land")) {
      throw new Error("lands are played, not cast");
    }
    if (!def.types.includes("instant")) {
      this.assertSorcerySpeed(player, `cast ${def.name}`);
    }

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

  private activateAbility(
    player: PlayerId,
    sourceId: ObjectId,
    abilityIndex: number,
    targets: readonly TargetRef[],
  ): void {
    this.assertHasPriority(player);
    const source = this.state.objects[sourceId];
    if (source === undefined || source.zone !== "battlefield") {
      throw new Error("that permanent is not on the battlefield");
    }
    if (source.controller !== player) {
      throw new Error(`${player} does not control that permanent`);
    }
    const def = this.registry.get(source.cardName);
    const ability = def.activated[abilityIndex];
    if (ability === undefined) {
      throw new Error(`${def.name} has no ability #${abilityIndex}`);
    }

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

    if (ability.cost.tap) {
      if (source.tapped) {
        throw new Error(`${def.name} is already tapped`);
      }
      if (this.tapAbilityBlockedBySickness(source)) {
        throw new Error(`${def.name} has summoning sickness`);
      }
    }

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

    const abilityId = this.mintObjectId();
    this.state.objects[abilityId] = {
      id: abilityId,
      cardName: source.cardName,
      owner: player,
      controller: player,
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
      sourceObjectId: sourceId,
      abilityIndex,
    };
    this.state.zones.shared.stack.push(abilityId);
    this.emit({
      type: "ability-activated",
      source: sourceId,
      player,
      onStack: true,
    });
    this.afterPlayerAction(player);
  }

  private assertHasPriority(player: PlayerId): void {
    if (this.state.priority.holder !== player) {
      throw new Error(`${player} does not have priority`);
    }
  }

  private assertSorcerySpeed(player: PlayerId, what: string): void {
    if (this.activePlayer !== player) {
      throw new Error(`can only ${what} on your own turn`);
    }
    if (!isMainPhase(this.state.turn.step)) {
      throw new Error(`can only ${what} during a main phase`);
    }
    if (this.state.zones.shared.stack.length > 0) {
      throw new Error(`can only ${what} while the stack is empty`);
    }
  }

  private afterPlayerAction(player: PlayerId): void {
    this.runStateBasedActions();
    if (this.state.result.over) return;
    this.grantPriority(player);
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
      this.grantPriority(this.activePlayer);
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

  private resolveAbility(object: GameObject): void {
    const id = object.id;
    const def = this.registry.get(object.cardName);
    const ability = def.activated[object.abilityIndex ?? 0];
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
    };
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
        const toughness = def.toughness ?? 0;
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

    // A change of zone always leaves combat and drops stack targets.
    object.attacking = null;
    object.blocking = null;
    object.blockedBy = [];
    object.blocked = false;

    if (to === "battlefield") {
      object.enteredBattlefieldOnTurn = this.state.turn.number;
    } else {
      object.tapped = false;
      object.damageMarked = 0;
      object.enteredBattlefieldOnTurn = null;
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
    this.state.eventLog.push({ ...event, seq } as GameEvent);
  }
}
