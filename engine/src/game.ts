/**
 * The game driver. Owns the single mutable {@link GameState}, advances the turn
 * structure, runs state-based actions, and appends to the event log.
 *
 * Milestone 1 scope: two players, a turn/step loop with priority passing,
 * turn-based actions (untap, draw, cleanup discard), decking-out and life-loss
 * as loss conditions, and snapshot/restore. Nothing is castable yet — there is
 * no stack and the only external action is passing priority.
 */

import { CardRegistry, createDefaultRegistry } from "./cards.js";
import { AutomaticController } from "./controller.js";
import type { PlayerController } from "./controller.js";
import type {
  EventOfType,
  GameEvent,
  GameEventInput,
  GameEventType,
} from "./events.js";
import type { ObjectId, PlayerId, Rng } from "./primitives.js";
import { asObjectId, createRng, shuffle } from "./primitives.js";
import {
  DEFAULT_RULES,
  activePlayerOf,
  createPlayerState,
} from "./state.js";
import type { GameRules, GameState, ZoneType } from "./state.js";
import { PHASE_OF_STEP, nextStep, stepUsesPriority } from "./turn.js";
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
  readonly registry?: CardRegistry;
  readonly controllers?: Partial<Record<PlayerId, PlayerController>>;
  readonly rules?: Partial<GameRules>;
}

/** An action a player (or agent) submits to the engine. Grows over time. */
export type Action = { readonly type: "pass-priority"; readonly player: PlayerId };

export interface SnapshotEnv {
  readonly registry?: CardRegistry;
  readonly controllers?: Partial<Record<PlayerId, PlayerController>>;
}

const ADVANCE_BUDGET = 200_000;

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
    game.setup(config.decks);
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

  /** Deep copy of the current state, suitable for {@link Game.fromSnapshot}. */
  snapshot(): GameState {
    return structuredClone(this.state);
  }

  // --- driving the game ------------------------------------------------

  dispatch(action: Action): readonly GameEvent[] {
    const from = this.state.eventLog.length;
    if (action.type === "pass-priority") {
      this.passPriority(action.player);
    } else {
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
      // Nothing is castable yet, so whoever holds priority simply passes.
      this.dispatch({
        type: "pass-priority",
        player: this.state.priority.holder,
      });
      return;
    }

    // Steps without priority (untap, cleanup) have already run their
    // turn-based actions in enterStep; advance to the next step.
    this.endStep();
  }

  // --- setup ----------------------------------------------------------

  private setup(decks: readonly DeckList[]): void {
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
        };
        ids.push(id);
      }
      this.state.zones.perPlayer[player].library = shuffle(ids, this.rng);
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
    this.state.priority.active = false;
    this.state.priority.holder = null;
    this.state.priority.passed = [];
    this.emit({ type: "step-began", step, phase: PHASE_OF_STEP[step] });

    this.performTurnBasedActions(step);
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

  // --- priority -----------------------------------------------------

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
    if (everyonePassed) {
      priority.active = false;
      priority.holder = null;
      priority.passed = [];
      // The stack is always empty in this milestone, so the step ends.
      this.endStep();
      return;
    }

    priority.holder = this.nextEligibleAfter(player);
    this.emit({ type: "priority-received", player: priority.holder });
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

  // --- state-based actions ----------------------------------------

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

  // --- zones ------------------------------------------------------

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
