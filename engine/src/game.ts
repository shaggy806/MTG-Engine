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
import type { PtDuration, ResolutionContext, ZoneChoiceFilter } from "./effects.js";
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
import type { AwaitingDecision, GameObject, GameRules, GameState, ZoneType } from "./state.js";
import type { TargetRef, TargetSpec } from "./target.js";
import { isLegalTarget, legalTargets } from "./targeting.js";
import { PHASE_OF_STEP, isMainPhase, nextStep, stepUsesPriority } from "./turn.js";
import type { Step } from "./turn.js";
import { viewFor } from "./view.js";
import type { PlayerView, ViewOptions } from "./view.js";

export interface DeckList {
  readonly player: PlayerId;
  readonly cards: readonly string[];
  /** Name of a card to start in the command zone instead of the library
   * (rule 903.4). Not one of `cards` — an extra card on top of the deck. */
  readonly commander?: string;
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
/** Combat damage from the same commander at or above this total is a loss (rule 903.10a). */
const COMMANDER_DAMAGE_THRESHOLD = 21;

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
      },
      priority: { active: false, holder: null, passed: [] },
      result: { over: false, winner: null, reason: null },
      awaiting: null,
      pendingBlockerOrders: [],
      pendingBlockerDeclarations: [],
      pendingTriggers: [],
      pendingCommanderChoices: [],
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
        this.castSpell(
          action.player,
          action.card,
          action.targets ?? [],
          action.xValue ?? 0,
        );
        break;
      case "activate-ability":
        this.activateAbility(
          action.player,
          action.source,
          action.abilityIndex,
          action.targets ?? [],
          action.sacrifice,
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
      case "choose-from-zone":
        this.applyChooseFromZone(action.player, action.chosen);
        break;
      case "mulligan":
        this.applyMulligan(action.player, action.keep);
        break;
      case "put-on-bottom":
        this.applyPutOnBottom(action.player, action.cards);
        break;
      case "commander-replacement":
        this.applyCommanderChoice(action.player, action.toCommandZone);
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
      case "choose-from-zone":
        return this.whyCannotChooseFromZone(action.player, action.chosen);
      case "mulligan":
        return this.whyCannotMulligan(action.player);
      case "put-on-bottom":
        return this.whyCannotPutOnBottom(action.player, action.cards);
      case "commander-replacement":
        return this.whyCannotCommanderChoice(action.player);
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
        const defenders = this.legalDefenders(player);
        return [
          {
            kind: "declare-attackers",
            defenders,
            eligible: this.state.zones.shared.battlefield.filter((id) =>
              defenders.some((defender) => this.whyCannotAttack(player, id, defender) === null),
            ),
          },
        ];
      }
      if (awaiting.kind === "blockers") {
        const attackers = this.currentAttackers().filter(
          (id) => this.state.objects[id].attacking === player,
        );
        const eligible = this.state.zones.shared.battlefield
          .filter((id) => this.state.objects[id].controller === player)
          .map((blocker) => ({
            blocker,
            canBlock: attackers.filter(
              (attacker) => this.whyCannotBlock(player, blocker, attacker) === null,
            ),
          }))
          .filter((entry) => entry.canBlock.length > 0);
        const menaceAttackers = attackers.filter((id) =>
          this.objHasKeyword(id, "menace"),
        );
        return [{ kind: "declare-blockers", eligible, menaceAttackers }];
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
      if (awaiting.kind === "choose-from-zone") {
        return [
          {
            kind: "choose-from-zone",
            ids: [...awaiting.ids],
            eligible: [...awaiting.eligible],
            min: awaiting.min,
            max: awaiting.max,
          },
        ];
      }
      if (awaiting.kind === "mulligan") {
        return [{ kind: "mulligan", count: awaiting.count }];
      }
      if (awaiting.kind === "mulligan-bottom") {
        return [
          {
            kind: "put-on-bottom",
            count: awaiting.count,
            from: [...this.state.zones.perPlayer[player].hand],
          },
        ];
      }
      if (awaiting.kind === "commander-replacement") {
        return [
          {
            kind: "commander-replacement",
            commander: awaiting.commander,
            movedTo: awaiting.movedTo,
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

    const ownCommanders = this.state.zones.shared.command.filter((id) =>
      this.isCastableCommander(player, id),
    );
    for (const card of [...this.state.zones.perPlayer[player].hand, ...ownCommanders]) {
      const cardName = this.state.objects[card].cardName;
      const def = this.registry.get(cardName);
      if (def.types.includes("land")) {
        if (this.whyCannotPlayLand(player, card) === null) {
          out.push({ kind: "play-land", card, cardName });
        }
      } else if (this.whyCannotCastSpell(player, card) === null) {
        const parsed = parseManaCost(def.manaCost);
        out.push({
          kind: "cast-spell",
          card,
          cardName,
          targetSpecs: def.targets,
          targetOptions: this.targetOptionsFor(def.targets, player),
          ...(parsed.x > 0
            ? { xCost: { maxX: this.maxAffordableX(player, card, def) } }
            : {}),
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
          targetOptions: this.targetOptionsFor(ability.targets, player),
          ...(ability.cost.sacrifice === "creature-you-control"
            ? { sacrifice: { choices: this.sacrificeCandidates(player, source, ability) } }
            : {}),
        });
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
      const ability = this.registry.get(action.cardName).activated[action.abilityIndex];
      return isManaAbility(ability);
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
  ): readonly (readonly TargetRef[])[] {
    return specs.map((spec) =>
      legalTargets(this.state, this.registry, spec, forPlayer),
    );
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

  private setup(
    decks: readonly DeckList[],
    shuffleLibrary: boolean,
    mulligans: boolean,
  ): void {
    for (const { player, cards, commander } of decks) {
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
          markedByDeathtouch: false,
          enteredBattlefieldOnTurn: null,
          summoningSick: false,
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
          isCommander: false,
          xValue: null,
        };
        ids.push(id);
      }
      this.state.zones.perPlayer[player].library = shuffleLibrary
        ? shuffle(ids, this.rng)
        : ids;

      if (commander !== undefined) {
        this.registry.get(commander); // validate up front
        const id = this.mintObjectId();
        this.state.objects[id] = {
          id,
          cardName: commander,
          owner: player,
          controller: player,
          zone: "command",
          tapped: false,
          damageMarked: 0,
          markedByDeathtouch: false,
          enteredBattlefieldOnTurn: null,
          summoningSick: false,
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
          isCommander: true,
          xValue: null,
        };
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
   * Deals opening hands, then asks each player in turn order whether to
   * mulligan (London style — shuffle hand into library, draw a fresh 7, no
   * cap), and once they keep, how many cards (equal to mulligans taken) to
   * put on the bottom. Fully resolves one player before moving to the next;
   * real tournament rules poll every player simultaneously each round, but
   * this engine answers one awaiting decision at a time, so this reaches
   * the same end state sequentially instead — a documented simplification,
   * like the automatic commander-replacement redirect.
   */
  private beginMulligans(): void {
    for (const player of this.state.turnOrder) {
      for (let i = 0; i < this.state.rules.openingHandSize; i += 1) {
        this.drawCard(player);
      }
    }
    this.advanceMulligans(0);
  }

  private advanceMulligans(index: number): void {
    if (index >= this.state.turnOrder.length) {
      this.beginTurn();
      return;
    }
    const player = this.state.turnOrder[index];
    this.state.awaiting = { kind: "mulligan", player, count: 0 };
    this.prepareForPriority(player);
  }

  private applyMulligan(player: PlayerId, keep: boolean): void {
    const why = this.whyCannotMulligan(player);
    if (why !== null) throw new Error(why);

    const awaiting = this.state.awaiting;
    if (awaiting === null || awaiting.kind !== "mulligan") {
      throw new Error("unreachable: whyCannotMulligan should have caught this");
    }

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
      const count = awaiting.count + 1;
      this.emit({ type: "mulligan-taken", player, count });
      this.state.awaiting = { kind: "mulligan", player, count };
      this.prepareForPriority(player);
      return;
    }

    this.emit({ type: "hand-kept", player, mulligans: awaiting.count });
    if (awaiting.count > 0) {
      this.state.awaiting = { kind: "mulligan-bottom", player, count: awaiting.count };
      this.prepareForPriority(player);
      return;
    }
    this.state.awaiting = null;
    this.advanceMulligans(this.state.turnOrder.indexOf(player) + 1);
  }

  private whyCannotMulligan(player: PlayerId): string | null {
    const awaiting = this.state.awaiting;
    if (awaiting === null || awaiting.kind !== "mulligan" || awaiting.player !== player) {
      return `${player} is not being asked about a mulligan`;
    }
    return null;
  }

  private applyPutOnBottom(player: PlayerId, cards: readonly ObjectId[]): void {
    const why = this.whyCannotPutOnBottom(player, cards);
    if (why !== null) throw new Error(why);

    for (const id of cards) this.moveObject(id, "library");
    this.emit({ type: "cards-put-on-bottom", player, objects: [...cards] });
    this.state.awaiting = null;
    this.advanceMulligans(this.state.turnOrder.indexOf(player) + 1);
  }

  private whyCannotPutOnBottom(
    player: PlayerId,
    cards: readonly ObjectId[],
  ): string | null {
    const awaiting = this.state.awaiting;
    if (
      awaiting === null ||
      awaiting.kind !== "mulligan-bottom" ||
      awaiting.player !== player
    ) {
      return `${player} is not being asked to put cards on the bottom of their library`;
    }
    if (cards.length !== awaiting.count) {
      return `${player} must put exactly ${awaiting.count} card(s) on the bottom, chose ${cards.length}`;
    }
    if (new Set(cards).size !== cards.length) {
      return `${player} chose the same card twice`;
    }
    const hand = new Set(this.state.zones.perPlayer[player].hand);
    for (const id of cards) {
      if (!hand.has(id)) return `${player} tried to put ${id} on the bottom, not in hand`;
    }
    return null;
  }

  /** Answers a pending `commander-replacement` decision (rule 903.9a). */
  private applyCommanderChoice(player: PlayerId, toCommandZone: boolean): void {
    const why = this.whyCannotCommanderChoice(player);
    if (why !== null) throw new Error(why);
    const awaiting = this.state.awaiting;
    if (awaiting === null || awaiting.kind !== "commander-replacement") {
      throw new Error("unreachable: whyCannotCommanderChoice should have caught this");
    }

    const commander = awaiting.commander;
    if (toCommandZone) {
      this.moveObject(commander, "command");
    }
    this.emit({
      type: "commander-zone-decision",
      object: commander,
      toCommandZone,
      from: awaiting.movedTo,
    });

    this.state.pendingCommanderChoices = this.state.pendingCommanderChoices.filter(
      (c) => c.commander !== commander,
    );
    this.state.awaiting = null;
    this.prepareForPriority(this.activePlayer);
  }

  private whyCannotCommanderChoice(player: PlayerId): string | null {
    const awaiting = this.state.awaiting;
    if (
      awaiting === null ||
      awaiting.kind !== "commander-replacement" ||
      awaiting.player !== player
    ) {
      return `${player} is not being asked about a commander replacement`;
    }
    return null;
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
   * Repeatedly: perform state-based actions, then resolve any pending commander
   * replacement choice (rule 903.9a), then put any waiting triggered abilities
   * on the stack — until nothing more happens. Then grant priority.
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
      // A commander that just changed zones owes its owner a choice; hand them
      // priority to make it. `applyCommanderChoice` calls back into here.
      if (this.promptCommanderChoice()) return;
      if (!this.placePendingTriggers()) break;
    }
    this.grantPriority(player);
  }

  /**
   * If a commander is sitting in a hidden zone awaiting its owner's 903.9a
   * choice, set `awaiting` and give that player priority. Returns whether it
   * did. Drops stale entries (the commander has since moved on its own).
   */
  private promptCommanderChoice(): boolean {
    while (this.state.pendingCommanderChoices.length > 0) {
      const next = this.state.pendingCommanderChoices[0];
      const object = this.state.objects[next.commander];
      if (object !== undefined && object.zone === next.movedTo) {
        this.state.awaiting = {
          kind: "commander-replacement",
          player: object.owner,
          commander: next.commander,
          movedTo: next.movedTo,
        };
        this.grantPriority(object.owner);
        return true;
      }
      this.state.pendingCommanderChoices.shift();
    }
    return false;
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
      if (object.controller !== active) continue;
      // Summoning sickness wears off as the controller's turn begins.
      object.summoningSick = false;
      if (object.tapped) {
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

    for (const id of chosen) this.moveObject(id, awaiting.destination);

    if (awaiting.leftover === "bottom-random") {
      // `moveObject` always appends to a zone's array, and the library's
      // array is drawn from index 0 (the top) — so pushing here lands each
      // card on the bottom, in shuffle order.
      for (const id of shuffle(leftover, this.rng)) this.moveObject(id, "library");
      this.state.rngState = this.rng.seed;
    }
    // leftover === "stay": nothing to do — those cards were only ever looked
    // at, never removed from wherever they already were.

    this.emit({ type: "cards-chosen-from-zone", player, objects: [...chosen] });
    this.state.awaiting = null;
    this.prepareForPriority(this.activePlayer);
  }

  private whyCannotChooseFromZone(
    player: PlayerId,
    chosen: readonly ObjectId[],
  ): string | null {
    const awaiting = this.state.awaiting;
    if (
      awaiting === null ||
      awaiting.kind !== "choose-from-zone" ||
      awaiting.player !== player
    ) {
      return `${player} is not being asked to choose from a zone`;
    }
    if (new Set(chosen).size !== chosen.length) {
      return `${player} chose the same card twice`;
    }
    if (chosen.length < awaiting.min || chosen.length > awaiting.max) {
      return `${player} must choose between ${awaiting.min} and ${awaiting.max} card(s), chose ${chosen.length}`;
    }
    const eligible = new Set(awaiting.eligible);
    for (const id of chosen) {
      if (!eligible.has(id)) return `${player} chose ${id}, not an eligible candidate`;
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
      if (object.damageMarked !== 0 || object.markedByDeathtouch) {
        object.damageMarked = 0;
        object.markedByDeathtouch = false;
        cleared.push(id);
      }
    }
    if (cleared.length > 0) {
      this.emit({ type: "damage-cleared", objects: cleared });
    }
  }

  // --- combat -----------------------------------------------------

  /** Every player `attacker` could legally declare an attack against. */
  private legalDefenders(attacker: PlayerId): PlayerId[] {
    return this.state.turnOrder.filter(
      (player) => player !== attacker && !this.state.players[player].hasLost,
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
    return object.summoningSick;
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
   * `promptNextBlockerDeclaration` the same way `pendingBlockerOrders` drains
   * one `order-blockers` action at a time.
   */
  private declareBlockersStep(): void {
    const attackers = this.currentAttackers();
    if (attackers.length === 0) return;
    const attackedBy = new Set(
      attackers.map((id) => this.state.objects[id].attacking).filter((p) => p !== null),
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
   * left to ask — mirrors `pendingBlockerOrders`: the current head stays in
   * the queue until `applyBlockerDeclarations` actually answers it and pops
   * it off, this only peeks/skips ahead of that.
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
    if (!this.legalDefenders(player).includes(target)) {
      return "attackers can only attack an opponent who hasn't already lost";
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
    if (attacker.attacking !== player) {
      const attackerDef = this.registry.get(attacker.cardName);
      return `${blockerDef.name} can't block ${attackerDef.name} — it isn't attacking ${player}`;
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
    const blockerCount = new Map<ObjectId, number>();
    for (const { blocker, attacker } of blocks) {
      if (seen.has(blocker)) {
        const def = this.creatureDef(blocker);
        return `${def?.name ?? blocker} is already blocking`;
      }
      seen.add(blocker);
      const why = this.whyCannotBlock(player, blocker, attacker);
      if (why !== null) return why;
      blockerCount.set(attacker, (blockerCount.get(attacker) ?? 0) + 1);
    }
    for (const [attacker, count] of blockerCount) {
      if (count === 1 && this.objHasKeyword(attacker, "menace")) {
        const def = this.creatureDef(attacker);
        return `${def?.name ?? attacker} has menace and must be blocked by two or more creatures`;
      }
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

    // Every defender has declared (or been skipped) — the attacking player
    // orders the blockers of each multi-blocked attacker for damage
    // assignment (rule 509.2), one `order-blockers` action each. The
    // declaration order is the default the UI can just confirm.
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
    // Rule 510: if any combatant has first or double strike there are two
    // damage passes. We fold both into this one step (no priority window
    // between them), running SBAs after the first so dead combatants drop out.
    if (this.combatFirstStrikeInPlay()) {
      this.dealCombatDamage("first");
      this.runStateBasedActions();
      if (this.state.result.over) return;
      this.dealCombatDamage("regular");
    } else {
      this.dealCombatDamage("all");
    }
  }

  /** Any attacker or blocker in the current combat with first or double strike. */
  private combatFirstStrikeInPlay(): boolean {
    for (const attackerId of this.currentAttackers()) {
      if (this.striker(attackerId)) return true;
      for (const blockerId of this.state.objects[attackerId].blockedBy) {
        if (this.striker(blockerId)) return true;
      }
    }
    return false;
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
    // Regular pass: everyone except first-strike-only creatures (double
    // strikers deal again).
    return ds || !this.objHasKeyword(id, "first-strike");
  }

  private dealCombatDamage(pass: "first" | "regular" | "all"): void {
    const assignments: {
      source: ObjectId;
      target: TargetRef;
      amount: number;
    }[] = [];
    const powerOf = (id: ObjectId): number =>
      computeCharacteristics(this.state, this.registry, id).power;
    const toughnessOf = (id: ObjectId): number =>
      computeCharacteristics(this.state, this.registry, id).toughness;

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
                target: { kind: "player", player: attacker.attacking },
                amount: power,
              });
            }
          } else {
            const deathtouch = this.objHasKeyword(attackerId, "deathtouch");
            const trample = this.objHasKeyword(attackerId, "trample");
            let remaining = power;
            liveBlockers.forEach((blockerId, index) => {
              const marked = this.state.objects[blockerId].damageMarked;
              const lethal = deathtouch
                ? 1
                : Math.max(0, toughnessOf(blockerId) - marked);
              const isLastAndNoTrample =
                !trample && index === liveBlockers.length - 1;
              const amount = isLastAndNoTrample
                ? remaining
                : Math.min(remaining, lethal);
              remaining -= amount;
              if (amount > 0) {
                assignments.push({
                  source: attackerId,
                  target: { kind: "object", object: blockerId },
                  amount,
                });
              }
            });
            if (trample && remaining > 0 && attacker.attacking !== null) {
              assignments.push({
                source: attackerId,
                target: { kind: "player", player: attacker.attacking },
                amount: remaining,
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
      this.dealDamage(source, target, amount);
      if (target.kind === "player" && this.state.objects[source].isCommander) {
        const controller = this.state.objects[source].controller;
        const taken = this.state.players[target.player].commanderDamageTaken;
        taken[controller] = (taken[controller] ?? 0) + amount;
      }
    }
  }

  private endCombatStep(): void {
    this.state.pendingBlockerOrders = [];
    this.state.pendingBlockerDeclarations = [];
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

  /** {2} more each previous time this player's commander was cast from the
   * command zone this game (rule 903.4, "commander tax"). */
  private commanderTax(player: PlayerId): number {
    return 2 * this.state.players[player].commanderCastCount;
  }

  /** `def.manaCost`, plus the commander tax if `cardId` is being cast from
   * the command zone, with `{X}` resolved to `xValue` (folded into generic). */
  private castingCostOf(
    player: PlayerId,
    cardId: ObjectId,
    def: CardDefinition,
    xValue = 0,
  ): ManaCost {
    const base = parseManaCost(def.manaCost);
    const tax = this.isCastableCommander(player, cardId) ? this.commanderTax(player) : 0;
    return {
      colored: base.colored,
      generic: base.generic + tax + base.x * Math.max(0, xValue),
      x: 0,
    };
  }

  /** Largest value of `{X}` this player could currently pay for when casting
   * `cardId` (0 if only X=0 is affordable). */
  private maxAffordableX(player: PlayerId, cardId: ObjectId, def: CardDefinition): number {
    const parsed = parseManaCost(def.manaCost);
    if (parsed.x === 0) return 0;
    // Upper bound: every mana source plus everything already floating — X can't
    // exceed that no matter what.
    const pool = this.state.players[player].manaPool;
    const cap =
      this.manaSources(player).reduce((n, s) => n + s.produces.length, 0) +
      MANA_TYPES.reduce((n, t) => n + pool[t], 0);
    let best = 0;
    for (let k = 1; k <= cap; k += 1) {
      if (this.planManaPayment(player, this.castingCostOf(player, cardId, def, k)) === null) {
        break;
      }
      best = k;
    }
    return best;
  }

  private whyCannotCastSpell(player: PlayerId, cardId: ObjectId): string | null {
    const blocked = this.whyCannotAct(player);
    if (blocked !== null) return blocked;
    if (
      !this.state.zones.perPlayer[player].hand.includes(cardId) &&
      !this.isCastableCommander(player, cardId)
    ) {
      return `${player} does not have that card in hand`;
    }
    const def = this.registry.get(this.state.objects[cardId].cardName);
    if (def.types.includes("land")) return "lands are played, not cast";
    // Instant-speed if it's an instant or has flash (rule 702.8); otherwise
    // sorcery timing applies.
    if (!def.types.includes("instant") && !def.keywords.includes("flash")) {
      const timing = this.whyNotSorcerySpeed(player, `cast ${def.name}`);
      if (timing !== null) return timing;
    }
    for (const spec of def.targets) {
      if (legalTargets(this.state, this.registry, spec, player).length === 0) {
        return `${def.name} has no legal ${spec} target`;
      }
    }
    if (this.planManaPayment(player, this.castingCostOf(player, cardId, def)) === null) {
      return `${player} cannot pay the cost of ${def.name}`;
    }
    return null;
  }

  private castSpell(
    player: PlayerId,
    cardId: ObjectId,
    targets: readonly TargetRef[],
    xValue = 0,
  ): void {
    const why = this.whyCannotCastSpell(player, cardId);
    if (why !== null) throw new Error(why);

    const object = this.state.objects[cardId];
    const def = this.registry.get(object.cardName);
    const hasX = parseManaCost(def.manaCost).x > 0;
    const chosenX = hasX ? Math.max(0, Math.floor(xValue)) : 0;

    if (targets.length !== def.targets.length) {
      throw new Error(
        `${def.name} takes ${def.targets.length} target(s), got ${targets.length}`,
      );
    }
    def.targets.forEach((spec, i) => {
      if (!isLegalTarget(this.state, this.registry, spec, targets[i], player)) {
        throw new Error(`illegal target for ${def.name}`);
      }
    });

    const castingFromCommand = this.isCastableCommander(player, cardId);
    const cost = this.castingCostOf(player, cardId, def, chosenX);
    const plan = this.planManaPayment(player, cost);
    if (plan === null) {
      throw new Error(`${player} cannot pay the cost of ${def.name}`);
    }

    // Commit: move to the stack, pay, announce.
    this.moveObject(cardId, "stack");
    object.targets = targets.length > 0 ? [...targets] : null;
    object.xValue = hasX ? chosenX : null;
    for (const sourceId of plan) this.tapManaSource(sourceId);
    this.spendFromPool(player, cost);
    if (castingFromCommand) this.state.players[player].commanderCastCount += 1;

    this.emit({
      type: "spell-cast",
      player,
      object: cardId,
      targets: [...targets],
      x: hasX ? chosenX : null,
    });
    this.afterPlayerAction(player);
  }

  /** Permanents `player` could sacrifice to pay `ability`'s sacrifice cost.
   * `[]` when the ability has no sacrifice cost. For a `"self"` cost it's just
   * the source (so a caller can still show/confirm it). */
  private sacrificeCandidates(
    player: PlayerId,
    sourceId: ObjectId,
    ability: { readonly cost: { readonly sacrifice?: string } },
  ): ObjectId[] {
    if (ability.cost.sacrifice === undefined) return [];
    if (ability.cost.sacrifice === "self") return [sourceId];
    // "creature-you-control"
    return this.state.zones.shared.battlefield.filter((id) => {
      const object = this.state.objects[id];
      return (
        object.controller === player &&
        this.registry.get(object.cardName).types.includes("creature")
      );
    });
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
    if (ability.sorcerySpeed) {
      const timing = this.whyNotSorcerySpeed(player, `activate ${def.name}'s ability`);
      if (timing !== null) return timing;
    }
    for (const spec of ability.targets) {
      if (legalTargets(this.state, this.registry, spec, player).length === 0) {
        return `${def.name}'s ability has no legal ${spec} target`;
      }
    }
    if (this.planManaPayment(player, parseManaCost(ability.cost.mana)) === null) {
      return `${player} cannot pay for ${def.name}'s ability`;
    }
    if (
      ability.cost.sacrifice !== undefined &&
      this.sacrificeCandidates(player, sourceId, ability).length === 0
    ) {
      return `${player} has nothing to sacrifice for ${def.name}'s ability`;
    }
    return null;
  }

  private activateAbility(
    player: PlayerId,
    sourceId: ObjectId,
    abilityIndex: number,
    targets: readonly TargetRef[],
    sacrifice?: ObjectId,
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
      if (!isLegalTarget(this.state, this.registry, spec, targets[i], player)) {
        throw new Error(`illegal target for ${def.name}'s ability`);
      }
    });

    // Resolve which permanent the sacrifice cost (if any) will consume.
    let sacrificeVictim: ObjectId | null = null;
    if (ability.cost.sacrifice !== undefined) {
      const candidates = this.sacrificeCandidates(player, sourceId, ability);
      if (ability.cost.sacrifice === "self") {
        sacrificeVictim = sourceId;
      } else {
        if (sacrifice === undefined || !candidates.includes(sacrifice)) {
          throw new Error(
            `${def.name}'s ability requires sacrificing a creature you control`,
          );
        }
        sacrificeVictim = sacrifice;
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
    if (sacrificeVictim !== null) {
      this.moveObject(sacrificeVictim, "graveyard");
      this.emit({ type: "permanent-sacrificed", object: sacrificeVictim, player });
    }

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
      markedByDeathtouch: false,
      enteredBattlefieldOnTurn: null,
      summoningSick: false,
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
      isToken: false,
      attachedTo: null,
      isCommander: false,
      xValue: null,
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
   *
   * Ordered by which source `planManaPayment` should reach for first: lands
   * before non-lands (so paying a cost doesn't tap down a creature that could
   * otherwise attack or block), and within that, sources that make fewer
   * distinct colors before more flexible ones (so a narrow source gets used
   * while a source that could cover more needs stays open longer). Ties keep
   * battlefield order (`Array.prototype.sort` is stable), so the choice is
   * deterministic rather than arbitrary.
   */
  private manaSources(
    player: PlayerId,
  ): { id: ObjectId; produces: ManaType[]; isLand: boolean }[] {
    const out: { id: ObjectId; produces: ManaType[]; isLand: boolean }[] = [];
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      if (object.controller !== player || object.tapped) continue;
      if (this.tapAbilityBlockedBySickness(object)) continue;

      const def = this.registry.get(object.cardName);
      const produces: ManaType[] = [];
      for (const ability of def.activated) {
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
      if (produces.length > 0) {
        out.push({ id, produces, isLand: def.types.includes("land") });
      }
    }
    out.sort((a, b) => {
      if (a.isLand !== b.isLand) return a.isLand ? -1 : 1;
      return new Set(a.produces).size - new Set(b.produces).size;
    });
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
      !this.anyTargetLegal(def.targets, targets, object.controller)
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

    const context = this.makeResolutionContext(
      id,
      object.controller,
      targets,
      object.xValue ?? 0,
    );
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
      !this.anyTargetLegal(ability.targets, targets, object.controller)
    ) {
      this.removeAbilityFromStack(id);
      this.emit({
        type: "spell-fizzled",
        object: id,
        reason: "all targets are illegal",
      });
      return;
    }

    const context = this.makeResolutionContext(
      source,
      object.controller,
      targets,
      object.xValue ?? 0,
    );
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
      case "cast-spell": {
        if (event.type !== "spell-cast") return false;
        const casterMatches =
          spec.who === "any" || (spec.who === "you" && event.player === self.controller);
        if (!casterMatches) return false;
        if (spec.noncreatureOnly) {
          const castObject = this.state.objects[event.object];
          if (
            castObject !== undefined &&
            this.registry.get(castObject.cardName).types.includes("creature")
          ) {
            return false;
          }
        }
        return true;
      }
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
        legalTargets(this.state, this.registry, spec, trigger.controller),
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
        if (
          !isLegalTarget(this.state, this.registry, spec, chosen[i], trigger.controller)
        ) {
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
    forPlayer: PlayerId,
  ): boolean {
    return specs.some(
      (spec, i) =>
        targets[i] !== undefined &&
        isLegalTarget(this.state, this.registry, spec, targets[i], forPlayer),
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
    x = 0,
  ): ResolutionContext {
    return {
      controller,
      source,
      targets,
      x,
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
      returnToHand: (target) => this.returnToHandByEffect(target),
      exileObject: (target) => this.exileByEffect(target),
      fight: (a, b, oneSided) => this.fightCreatures(a, b, oneSided),
      counterSpell: (target) => this.counterSpellByEffect(target),
      mill: (target, amount) => this.millByEffect(target, amount),
      discardCards: (target, amount) => this.discardByEffect(target, amount),
      modifyPt: (target, power, toughness, duration) =>
        this.modifyPt(target, power, toughness, duration),
      addCounter: (target, counter, amount) =>
        this.addCounter(target, counter, amount),
      proliferate: () => this.proliferateAll(),
      grantKeyword: (target, keyword, duration) =>
        this.grantKeyword(target, keyword, duration),
      createToken: (token, count) => this.createTokens(controller, token, count),
      attach: (target) => this.attachPermanent(source, target),
      lookAndChoose: (zone, count, min, max, destination, leftover, filter) =>
        this.beginZoneChoice(controller, zone, count, min, max, destination, leftover, filter),
    };
  }

  /** Does `id` satisfy a `"look-and-choose"` effect's optional filter? Always
   * true when there's no filter — the effect just doesn't restrict the choice. */
  private matchesZoneChoiceFilter(id: ObjectId, filter: ZoneChoiceFilter | undefined): boolean {
    if (filter === undefined) return true;
    const def = this.registry.get(this.state.objects[id].cardName);
    if (filter.type !== undefined && !def.types.includes(filter.type)) return false;
    if (filter.subtype !== undefined && !def.subtypes.includes(filter.subtype)) return false;
    return true;
  }

  /** See the `"look-and-choose"` {@link EffectSpec}. */
  private beginZoneChoice(
    player: PlayerId,
    zone: "library" | "graveyard",
    count: number | undefined,
    min: number,
    max: number,
    destination: "battlefield" | "hand",
    leftover: "bottom-random" | "stay",
    filter: ZoneChoiceFilter | undefined,
  ): void {
    const zoneCards = this.state.zones.perPlayer[player][zone];
    const ids = zone === "library" ? zoneCards.slice(0, count ?? 0) : [...zoneCards];
    // A filter (e.g. "only a Dragon card") narrows what's *choosable*, never
    // what's *revealed* — the player still looks at everything either way,
    // and naturally ends up unable to choose anything if nothing matches
    // (min/max clamp to 0 along with it), same as the real card whiffing.
    const eligible = ids.filter((id) => this.matchesZoneChoiceFilter(id, filter));
    this.state.awaiting = {
      kind: "choose-from-zone",
      player,
      ids,
      eligible,
      min: Math.min(min, eligible.length),
      max: Math.min(max, eligible.length),
      destination,
      leftover,
    };
  }

  /** Create `count` copies of the named token, controlled by `controller` (rule 111). */
  private createTokens(controller: PlayerId, tokenName: string, count: number): void {
    this.registry.get(tokenName); // validate the token is a known definition
    for (let i = 0; i < count; i += 1) {
      const id = this.mintObjectId();
      this.state.timestampSeq += 1;
      this.state.objects[id] = {
        id,
        cardName: tokenName,
        owner: controller,
        controller,
        zone: "battlefield",
        tapped: false,
        damageMarked: 0,
        markedByDeathtouch: false,
        enteredBattlefieldOnTurn: this.state.turn.number,
        summoningSick: true,
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
        timestamp: this.state.timestampSeq,
        isToken: true,
        attachedTo: null,
        isCommander: false,
        xValue: null,
      };
      this.state.zones.shared.battlefield.push(id);
      this.emit({ type: "permanent-entered-battlefield", object: id });
    }
  }

  /** Attach an Aura/Equipment (`source`) to `target` (used by Equip-like effects). */
  private attachPermanent(source: ObjectId, target: TargetRef): void {
    if (target.kind !== "object") return;
    const sourceObject = this.state.objects[source];
    const targetObject = this.state.objects[target.object];
    if (sourceObject === undefined || sourceObject.zone !== "battlefield") return;
    if (targetObject === undefined || targetObject.zone !== "battlefield") return;
    sourceObject.attachedTo = target.object;
    this.emit({ type: "permanent-attached", source, target: target.object });
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

  /** Proliferate (rule 701.27), simplified: every battlefield permanent that
   * already has a counter gets one more of each kind it has. The "choose any
   * number" clause isn't modeled — it proliferates everything. */
  private proliferateAll(): void {
    for (const id of [...this.state.zones.shared.battlefield]) {
      const object = this.state.objects[id];
      for (const kind of Object.keys(object.counters)) {
        if (object.counters[kind] > 0) {
          object.counters[kind] += 1;
          this.emit({ type: "counter-added", object: id, counter: kind, amount: 1 });
        }
      }
    }
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
    if (this.objHasKeyword(target.object, "indestructible")) {
      this.emit({
        type: "permanent-destroy-prevented",
        object: target.object,
        reason: "indestructible",
      });
      return;
    }
    this.moveObject(target.object, "graveyard");
    this.emit({
      type: "permanent-destroyed",
      object: target.object,
      reason: "destroyed",
    });
  }

  private returnToHandByEffect(target: TargetRef): void {
    if (target.kind !== "object") return;
    const object = this.state.objects[target.object];
    if (object === undefined || object.zone !== "battlefield") return;
    // A token would just be swept by SBAs; a commander is redirected to the
    // command zone by `moveObject` — both handled downstream, this just asks
    // for the hand.
    const owner = object.owner;
    this.moveObject(target.object, "hand");
    this.emit({ type: "permanent-returned-to-hand", object: target.object, owner });
  }

  private exileByEffect(target: TargetRef): void {
    if (target.kind !== "object") return;
    const object = this.state.objects[target.object];
    if (object === undefined || object.zone !== "battlefield") return;
    this.moveObject(target.object, "exile");
    this.emit({ type: "permanent-exiled", object: target.object });
  }

  /** Counter a spell on the stack (rule 701.5): it's removed from the stack and
   * put into its owner's graveyard without resolving. A countered permanent
   * spell never enters the battlefield; a countered commander is redirected to
   * the command zone by `moveObject` like any other. */
  private counterSpellByEffect(target: TargetRef): void {
    if (target.kind !== "object") return;
    const object = this.state.objects[target.object];
    if (object === undefined || object.zone !== "stack" || object.kind !== "card") return;
    object.targets = null;
    object.xValue = null;
    this.moveObject(target.object, "graveyard");
    this.emit({ type: "spell-countered", object: target.object });
  }

  /** Two creatures fight (rule 701.12): each deals damage equal to its power to
   * the other, unless `oneSided` (Rabid Bite — only `a` deals). Whichever is
   * already gone deals/takes nothing. */
  private fightCreatures(a: TargetRef, b: TargetRef, oneSided: boolean): void {
    if (a.kind !== "object" || b.kind !== "object") return;
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

  /** Target player discards `amount` cards. If their hand is that small or
   * smaller they just discard all of it; otherwise the game waits on their
   * `discard` action (they choose which — same decision shape as the
   * cleanup-step discard, distinguished by `fromEffect`). */
  private discardByEffect(target: TargetRef, amount: number): void {
    if (target.kind !== "player") return;
    const player = target.player;
    if (this.state.players[player] === undefined || amount <= 0) return;
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
      this.applyLifelink(source, amount);
      return;
    }
    const object = this.state.objects[target.object];
    if (object === undefined || object.zone !== "battlefield") return;
    object.damageMarked += amount;
    if (this.sourceHasKeyword(source, "deathtouch")) {
      object.markedByDeathtouch = true;
    }
    this.emit({ type: "damage-dealt", source, target, amount });
    this.applyLifelink(source, amount);
  }

  /** True if `source` is a battlefield creature whose current keywords include `keyword`. */
  private sourceHasKeyword(source: ObjectId, keyword: Keyword): boolean {
    const object = this.state.objects[source];
    if (object === undefined || object.zone !== "battlefield") return false;
    if (!this.registry.get(object.cardName).types.includes("creature")) {
      return false;
    }
    return this.objHasKeyword(source, keyword);
  }

  private applyLifelink(source: ObjectId, amount: number): void {
    if (amount <= 0 || !this.sourceHasKeyword(source, "lifelink")) return;
    this.changeLife(this.state.objects[source].controller, amount);
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
        } else {
          const lethal = Object.entries(playerState.commanderDamageTaken).find(
            ([, amount]) => amount >= COMMANDER_DAMAGE_THRESHOLD,
          );
          if (lethal !== undefined) {
            reason = `took ${COMMANDER_DAMAGE_THRESHOLD}+ combat damage from ${lethal[0]}'s commander`;
          }
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
        const computed = computeCharacteristics(this.state, this.registry, id);
        const toughness = computed.toughness;
        const indestructible = computed.keywords.has("indestructible");
        let reason: string | null = null;
        if (toughness <= 0) {
          // 0 toughness is a state-based *loss*, not destruction — indestructible
          // does not save it (rule 704.5f vs 704.5g).
          reason = "toughness is 0 or less";
        } else if (!indestructible && object.damageMarked >= toughness) {
          reason = "lethal damage";
        } else if (!indestructible && object.markedByDeathtouch && object.damageMarked > 0) {
          reason = "deathtouch";
        }
        if (reason !== null) {
          this.moveObject(id, "graveyard");
          this.emit({ type: "permanent-destroyed", object: id, reason });
          changed = true;
        }
      }

      // Auras with no legal permanent to enchant go to the graveyard (704.5n);
      // Equipment just becomes unattached and stays on the battlefield.
      for (const id of [...this.state.zones.shared.battlefield]) {
        const object = this.state.objects[id];
        if (object.attachedTo === null) continue;
        const host = this.state.objects[object.attachedTo];
        if (host !== undefined && host.zone === "battlefield") continue;

        if (this.registry.get(object.cardName).subtypes.includes("Aura")) {
          this.moveObject(id, "graveyard");
          this.emit({
            type: "permanent-destroyed",
            object: id,
            reason: "no longer attached to a legal permanent",
          });
        } else {
          object.attachedTo = null;
        }
        changed = true;
      }

      // The legend rule (704.5j): a player controlling 2+ legendary
      // permanents with the same name keeps only one. No player choice is
      // modeled — the copy they've controlled longest (lowest timestamp)
      // survives and the rest go to the graveyard.
      const legendaryGroups = new Map<string, ObjectId[]>();
      for (const id of this.state.zones.shared.battlefield) {
        const object = this.state.objects[id];
        if (!this.registry.get(object.cardName).supertypes.includes("legendary")) continue;
        const key = `${object.controller} ${object.cardName}`;
        const group = legendaryGroups.get(key);
        if (group) group.push(id);
        else legendaryGroups.set(key, [id]);
      }
      for (const group of legendaryGroups.values()) {
        if (group.length <= 1) continue;
        const survivor = group.reduce((oldest, id) =>
          this.state.objects[id].timestamp < this.state.objects[oldest].timestamp
            ? id
            : oldest,
        );
        for (const id of group) {
          if (id === survivor) continue;
          this.moveObject(id, "graveyard");
          this.emit({ type: "permanent-destroyed", object: id, reason: "legend rule" });
        }
        changed = true;
      }

      // A token that isn't on the battlefield ceases to exist (rule 111.7/704.5d).
      for (const id of Object.keys(this.state.objects) as ObjectId[]) {
        const object = this.state.objects[id];
        if (!object.isToken || object.zone === "battlefield") continue;
        const zone = this.zoneList(object.zone, object.owner);
        const index = zone.indexOf(id);
        if (index >= 0) zone.splice(index, 1);
        delete this.state.objects[id];
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
    // Commander replacement (rule 903.9a): a commander put into a hidden zone
    // *may* go to the command zone instead — that's the owner's choice. The
    // move to `to` happens now; `promptCommanderChoice` (run before priority)
    // asks, and moves it to the command zone if they say yes.
    if (
      object.isCommander &&
      (to === "graveyard" || to === "exile" || to === "hand" || to === "library") &&
      !this.state.pendingCommanderChoices.some((c) => c.commander === id)
    ) {
      this.state.pendingCommanderChoices.push({ commander: id, movedTo: to });
    }
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
    object.markedByDeathtouch = false;
    object.counters = {};
    object.modifiers = [];
    object.attachedTo = null;

    if (to === "battlefield") {
      object.enteredBattlefieldOnTurn = this.state.turn.number;
      object.summoningSick = true;
      this.state.timestampSeq += 1;
      object.timestamp = this.state.timestampSeq;
    } else {
      object.tapped = false;
      object.damageMarked = 0;
      object.enteredBattlefieldOnTurn = null;
      object.summoningSick = false;
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
