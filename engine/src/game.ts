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
import type { CardDefinition, CardType, CombatRestriction, Keyword } from "./cards.js";
import { computeCharacteristics, effectiveSubtypes, hasLostAbilities } from "./characteristics.js";
import type { Characteristics } from "./characteristics.js";
import { AutomaticController } from "./controller.js";
import type { ControllerView, PlayerController } from "./controller.js";
import { applyEffectSpec } from "./effects.js";
import type {
  EffectSpec,
  ModeOption,
  PlayerScope,
  PtDuration,
  ResolutionContext,
  ZoneChoiceFilter,
} from "./effects.js";
import { matchesFilter } from "./filter.js";
import type { CardFilter } from "./filter.js";
import type {
  EventOfType,
  GameEvent,
  GameEventInput,
  GameEventType,
} from "./events.js";
import { COLORS, MANA_TYPES, emptyPool, parseManaCost, poolTotal } from "./mana.js";
import type { Color, ManaCost, ManaType } from "./mana.js";
import type { ObjectId, PlayerId, Rng } from "./primitives.js";
import { asObjectId, createRng, shuffle } from "./primitives.js";
import { DEFAULT_RULES, activePlayerOf, createPlayerState, printedCardName } from "./state.js";
import type { AwaitingDecision, GameObject, GameRules, GameState, ZoneType } from "./state.js";
import type { TargetRef, TargetSpec } from "./target.js";
import { isLegalTarget, legalTargets, protectionBlocks } from "./targeting.js";
import type { TargetSource } from "./targeting.js";
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

/** One of `player`'s permanents that can produce mana right now, with the
 * output of a single activation flattened: `fixed` is the concrete mana it
 * always makes, `anyColor` is how many "one mana of any colour" units it adds
 * on top (Arcane Signet, Command Tower, Treasure). `sacrificeSelf` = using it
 * sacrifices the source (Treasure) rather than tapping it. */
interface ManaSource {
  readonly id: ObjectId;
  readonly isLand: boolean;
  readonly fixed: readonly ManaType[];
  readonly anyColor: number;
  readonly sacrificeSelf: boolean;
}

/** One entry of a mana-payment plan: activate `source`, adding the concrete
 * `mana` list to the pool; `sacrifice` if it's a Treasure-style ability. */
interface ManaPlanStep {
  readonly source: ObjectId;
  readonly mana: readonly ManaType[];
  readonly sacrifice: boolean;
}

/** A fully-worked-out way to pay a cost: which sources to tap ({@link
 * ManaPlanStep}), how much life to pay for Phyrexian pips, and the cost with
 * every hybrid pip resolved to a concrete colour / generic amount — which is
 * what {@link Game.spendFromPool} actually deducts. */
interface ManaPayment {
  readonly steps: readonly ManaPlanStep[];
  readonly life: number;
  readonly resolved: ManaCost;
}
/** Combat damage from the same commander at or above this total is a loss (rule 903.10a). */
const COMMANDER_DAMAGE_THRESHOLD = 21;

/** The creature types Artificial Evolution (layer 3 text-change) offers as
 * the old / new word — the ones the card pool actually cares about, so the
 * choice stays a short menu. "Wall" is deliberately excluded as a *new* type
 * (the card forbids it) — see `beginTextChoice`. */
const CHANGEABLE_CREATURE_TYPES: readonly string[] = [
  "Goblin", "Elf", "Bear", "Zombie", "Vampire", "Bird",
  "Spirit", "Elemental", "Frog", "Insect", "Angel", "Wall",
];

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
      deferredCommanderMove: null,
      pendingDestruction: [],
      pendingSacrifices: [],
      pendingSacrificeVictims: [],
      preventAllCombatDamage: false,
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

  /** Combat restrictions on `id` from static abilities (Pacifism, Juggernaut). */
  private restrictionsOf(id: ObjectId): ReadonlySet<CombatRestriction> {
    return computeCharacteristics(this.state, this.registry, id).restrictions;
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
      case "choose-copy":
        this.applyCopyChoice(action.player, action.copy);
        break;
      case "choose-text":
        this.applyTextChoice(action.player, action.from, action.to);
        break;
      case "choose-modes":
        this.applyModesChoice(action.player, action.modes);
        break;
      case "sacrifice":
        this.applySacrifice(action.player, action.permanents);
        break;
      case "scry":
        this.applyScry(action.player, action.away);
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
      case "choose-copy":
        return this.whyCannotCopyChoice(action.player, action.copy);
      case "choose-text":
        return this.whyCannotTextChoice(action.player, action.from, action.to);
      case "choose-modes":
        return this.whyCannotChooseModes(action.player, action.modes);
      case "sacrifice":
        return this.whyCannotSacrifice(action.player, action.permanents);
      case "scry":
        return this.whyCannotScry(action.player, action.away);
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
            intendedZone: awaiting.intendedZone,
          },
        ];
      }
      if (awaiting.kind === "choose-copy") {
        return [
          { kind: "choose-copy", source: awaiting.source, options: [...awaiting.options] },
        ];
      }
      if (awaiting.kind === "choose-text") {
        return [
          {
            kind: "choose-text",
            source: awaiting.source,
            target: awaiting.target,
            fromOptions: [...awaiting.fromOptions],
            toOptions: [...awaiting.toOptions],
          },
        ];
      }
      if (awaiting.kind === "choose-modes") {
        return [
          {
            kind: "choose-modes",
            source: awaiting.source,
            minModes: awaiting.minModes,
            maxModes: awaiting.maxModes,
            modeTexts: awaiting.modes.map((m) => m.text),
          },
        ];
      }
      if (awaiting.kind === "sacrifice") {
        return [
          {
            kind: "sacrifice",
            count: awaiting.count,
            eligible: [...awaiting.eligible],
          },
        ];
      }
      if (awaiting.kind === "scry") {
        return [{ kind: "scry", mode: awaiting.mode, cards: [...awaiting.cards] }];
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
          targetOptions: this.targetOptionsFor(def.targets, player, this.cardSource(def)),
          ...(parsed.x > 0
            ? { xCost: { maxX: this.maxAffordableX(player, card, def) } }
            : {}),
        });
      }
    }

    for (const source of this.state.zones.shared.battlefield) {
      const object = this.state.objects[source];
      if (object.controller !== player) continue;
      this.registry.get(printedCardName(object)).activated.forEach((ability, index) => {
        if (this.whyCannotActivateAbility(player, source, index) !== null) return;
        out.push({
          kind: "activate-ability",
          source,
          abilityIndex: index,
          cardName: printedCardName(object),
          text: ability.text,
          targetSpecs: ability.targets,
          targetOptions: this.targetOptionsFor(ability.targets, player, this.permanentSource(source)),
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
    source?: TargetSource,
  ): readonly (readonly TargetRef[])[] {
    return specs.map((spec) =>
      legalTargets(this.state, this.registry, spec, forPlayer, source),
    );
  }

  /** The colour/type identity of a card (its printed values). */
  private cardSource(def: CardDefinition): TargetSource {
    return { colors: def.colors, types: def.types };
  }

  /** The colour/type identity of a permanent (its computed values). */
  private permanentSource(id: ObjectId): TargetSource {
    const c = computeCharacteristics(this.state, this.registry, id);
    return { colors: c.colors, types: c.types };
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
          controlEndsAtCleanup: false,
          copyOf: null,
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
          controlEndsAtCleanup: false,
          copyOf: null,
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

    const { commander, intendedZone } = deferred;
    this.state.awaiting = null;
    const destination = toCommandZone ? "command" : intendedZone;
    // `deferredCommanderMove` is still set here, so `moveObject` won't re-defer.
    this.moveObject(commander, destination);
    this.state.deferredCommanderMove = null;

    if (!toCommandZone && intendedZone === "graveyard") {
      // It really was put into a graveyard from the battlefield — a "dies"
      // event (rule 700.4). Emitting it here (not in `moveObject`) keeps the
      // non-commander death path untouched.
      this.emit({
        type: "permanent-destroyed",
        object: commander,
        reason: "put into its owner's graveyard",
      });
    }
    this.emit({
      type: "commander-zone-decision",
      object: commander,
      toCommandZone,
      from: intendedZone,
    });

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

  private whyCannotCopyChoice(player: PlayerId, copy: ObjectId | null): string | null {
    const awaiting = this.state.awaiting;
    if (awaiting === null || awaiting.kind !== "choose-copy" || awaiting.player !== player) {
      return `${player} is not being asked what to copy`;
    }
    if (copy !== null && !awaiting.options.includes(copy)) {
      return `${copy} is not one of the permanents that may be copied`;
    }
    return null;
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
  ): void {
    this.state.awaiting = {
      kind: "choose-modes",
      player: controller,
      source,
      minModes,
      maxModes: Math.min(maxModes, modes.length),
      modes: modes.map((m) => ({ text: m.text, effect: m.effect })),
      x,
    };
  }

  /** Answers a pending `choose-modes` decision. Applies the chosen modes'
   * effects, in listed order, against a fresh context for the source. */
  private applyModesChoice(player: PlayerId, modeIndices: readonly number[]): void {
    const why = this.whyCannotChooseModes(player, modeIndices);
    if (why !== null) throw new Error(why);
    const awaiting = this.state.awaiting;
    if (awaiting === null || awaiting.kind !== "choose-modes") {
      throw new Error("unreachable: whyCannotChooseModes should have caught this");
    }

    const { source, modes, x } = awaiting;
    this.state.awaiting = null;
    // Listed order, not the order the player named them (rule 700.2b).
    const ordered = [...modeIndices].sort((a, b) => a - b);
    this.emit({ type: "modes-chosen", source, modes: ordered });
    const context = this.makeResolutionContext(source, player, [], x);
    for (const i of ordered) applyEffectSpec(modes[i].effect, context);

    // A mode's effect may itself raise a decision (rare); otherwise resume.
    if (this.state.awaiting === null) this.prepareForPriority(this.activePlayer);
  }

  private whyCannotChooseModes(
    player: PlayerId,
    modeIndices: readonly number[],
  ): string | null {
    const awaiting = this.state.awaiting;
    if (
      awaiting === null ||
      awaiting.kind !== "choose-modes" ||
      awaiting.player !== player
    ) {
      return `${player} is not being asked to choose modes`;
    }
    if (new Set(modeIndices).size !== modeIndices.length) {
      return `${player} chose the same mode twice`;
    }
    if (modeIndices.length < awaiting.minModes || modeIndices.length > awaiting.maxModes) {
      return `${player} must choose between ${awaiting.minModes} and ${awaiting.maxModes} mode(s), chose ${modeIndices.length}`;
    }
    for (const i of modeIndices) {
      if (i < 0 || i >= awaiting.modes.length || !Number.isInteger(i)) {
        return `${i} is not a valid mode index`;
      }
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
    // Fog's "prevent all combat damage this turn" shield lapses.
    this.state.preventAllCombatDamage = false;
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
      this.runStateBasedActions();
      if (this.state.result.over) return;
      // An SBA / replacement raised a decision (e.g. a commander about to
      // leave the battlefield owes its owner a 903.9a choice) — hand that
      // player priority to answer it. `apply…Choice` calls back into here.
      if (this.state.awaiting !== null) {
        this.grantPriority(this.state.awaiting.player);
        return;
      }
      // Continue a mass-destroy (Wrath of God) that a 903.9a choice paused.
      if (this.state.pendingDestruction.length > 0) {
        this.drainPendingDestruction();
        continue;
      }
      // Work through a sacrifice effect (Diabolic Edict / Fleshbag Marauder):
      // move already-chosen victims, then ask the next player who has a choice.
      if (this.state.pendingSacrificeVictims.length > 0) {
        this.drainPendingSacrificeVictims();
        continue;
      }
      if (this.state.pendingSacrifices.length > 0) {
        this.promptNextSacrifice();
        continue;
      }
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

    for (const id of chosen) {
      this.moveObject(id, awaiting.destination);
      if (awaiting.enterTapped && awaiting.destination === "battlefield") {
        this.state.objects[id].tapped = true;
      }
    }

    if (awaiting.leftover === "bottom-random") {
      // `moveObject` always appends to a zone's array, and the library's
      // array is drawn from index 0 (the top) — so pushing here lands each
      // card on the bottom, in shuffle order.
      for (const id of shuffle(leftover, this.rng)) this.moveObject(id, "library");
      this.state.rngState = this.rng.seed;
    } else if (awaiting.leftover === "shuffle") {
      // A library search — shuffle the whole library afterwards (rule 701.19j).
      const library = this.state.zones.perPlayer[player].library;
      const order = shuffle([...library], this.rng);
      library.length = 0;
      library.push(...order);
      this.state.rngState = this.rng.seed;
      this.emit({ type: "library-shuffled", player });
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
    // "Until end of turn" control effects (Act of Treason) end — control
    // reverts to the owner, and the creature is summoning-sick for them again.
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      if (!object.controlEndsAtCleanup) continue;
      object.controlEndsAtCleanup = false;
      if (object.controller !== object.owner) {
        object.controller = object.owner;
        object.summoningSick = true;
        object.attacking = null;
        object.blocking = null;
        this.emit({
          type: "control-changed",
          object: id,
          controller: object.owner,
          untilEndOfTurn: false,
        });
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
    const def = this.registry.get(printedCardName(object));
    // Printed OR currently a creature by a layer-4 type-change (a man-land
    // animated this turn). The returned def is still the printed one — it's
    // used for the permanent's name and ability list, while its live P/T /
    // keywords come from `computeCharacteristics`.
    if (def.types.includes("creature")) return def;
    return computeCharacteristics(this.state, this.registry, id).types.includes("creature")
      ? def
      : null;
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
    if (this.restrictionsOf(creatureId).has("cant-attack")) {
      return `${def.name} can't attack`;
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
    if (this.restrictionsOf(blockerId).has("cant-block")) {
      return `${blockerDef.name} can't block`;
    }

    const attacker = this.state.objects[attackerId];
    if (attacker === undefined || attacker.attacking === null) {
      return `${attackerId} is not attacking`;
    }
    if (this.objHasKeyword(attackerId, "unblockable")) {
      const attackerDef = this.registry.get(printedCardName(attacker));
      return `${blockerDef.name} can't block ${attackerDef.name} (can't be blocked)`;
    }
    // Protection (rule 702.16) — can't be blocked by a matching creature.
    if (protectionBlocks(this.state, this.registry, attackerId, this.permanentSource(blockerId))) {
      const attackerDef = this.registry.get(printedCardName(attacker));
      return `${blockerDef.name} can't block ${attackerDef.name} (protection)`;
    }
    if (attacker.attacking !== player) {
      const attackerDef = this.registry.get(printedCardName(attacker));
      return `${blockerDef.name} can't block ${attackerDef.name} — it isn't attacking ${player}`;
    }
    if (
      this.objHasKeyword(attackerId, "flying") &&
      !this.objHasKeyword(blockerId, "flying") &&
      !this.objHasKeyword(blockerId, "reach")
    ) {
      const attackerDef = this.registry.get(printedCardName(attacker));
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

    // "Attacks each combat if able" (Juggernaut): auto-declare any must-attack
    // creature the player left out but that could legally attack. It's sent at
    // the first legal opponent (the player doesn't get to choose the target of
    // a forced attacker here — a small simplification).
    const declared = new Set(declarations.map((d) => d.attacker));
    const forced: AttackerDeclaration[] = [];
    for (const id of this.state.zones.shared.battlefield) {
      if (declared.has(id) || this.state.objects[id].controller !== player) continue;
      if (!this.restrictionsOf(id).has("must-attack")) continue;
      const defender = this.legalDefenders(player).find(
        (d) => this.whyCannotAttack(player, id, d) === null,
      );
      if (defender !== undefined) forced.push({ attacker: id, defender });
    }

    for (const { attacker, defender } of [...declarations, ...forced]) {
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
      const dealt = this.dealDamage(source, target, amount, true);
      if (dealt > 0 && target.kind === "player" && this.state.objects[source].isCommander) {
        const controller = this.state.objects[source].controller;
        const taken = this.state.players[target.player].commanderDamageTaken;
        taken[controller] = (taken[controller] ?? 0) + dealt;
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
   * the command zone, with `{X}` resolved to `xValue` (folded into generic),
   * and battlefield `costModification` statics (Foundry Inspector, Thalia)
   * applied to the generic portion (rule 601.2f — can't go below 0). */
  private castingCostOf(
    player: PlayerId,
    cardId: ObjectId,
    def: CardDefinition,
    xValue = 0,
  ): ManaCost {
    const base = parseManaCost(def.manaCost);
    const tax = this.isCastableCommander(player, cardId) ? this.commanderTax(player) : 0;
    let generic = base.generic + tax + base.x * Math.max(0, xValue);
    generic += this.costModificationFor(player, cardId);
    return {
      colored: base.colored,
      colorless: base.colorless,
      generic: Math.max(0, generic),
      x: 0,
      hybrid: base.hybrid,
    };
  }

  /** Net generic-mana adjustment to `cardId`'s cost from `costModification`
   * statics on the battlefield (increases first, then reductions — rule
   * 601.2f). Positive = costs more. */
  private costModificationFor(player: PlayerId, cardId: ObjectId): number {
    let delta = 0;
    for (const id of this.state.zones.shared.battlefield) {
      const source = this.state.objects[id];
      if (hasLostAbilities(source)) continue;
      for (const ability of this.registry.get(printedCardName(source)).static) {
        const mod = ability.costModification;
        if (mod === undefined) continue;
        // The filter is evaluated from the casting player's perspective, so
        // `controlledBy: "you"` means "a spell this player casts".
        if (!matchesFilter(this.state, this.registry, cardId, mod.applies, { you: player })) {
          continue;
        }
        delta += mod.increaseGeneric ?? 0;
        delta -= mod.reduceGeneric ?? 0;
      }
    }
    return delta;
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
      this.manaSources(player).reduce(
        (n, s) => n + s.fixed.length + s.anyColor,
        0,
      ) + MANA_TYPES.reduce((n, t) => n + pool[t], 0);
    let best = 0;
    for (let k = 1; k <= cap; k += 1) {
      if (this.payMana(player, this.castingCostOf(player, cardId, def, k)) === null) {
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
      if (
        legalTargets(this.state, this.registry, spec, player, this.cardSource(def)).length === 0
      ) {
        return `${def.name} has no legal ${spec} target`;
      }
    }
    if (this.payMana(player, this.castingCostOf(player, cardId, def)) === null) {
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
    const def = this.registry.get(printedCardName(object));
    const hasX = parseManaCost(def.manaCost).x > 0;
    const chosenX = hasX ? Math.max(0, Math.floor(xValue)) : 0;

    if (targets.length !== def.targets.length) {
      throw new Error(
        `${def.name} takes ${def.targets.length} target(s), got ${targets.length}`,
      );
    }
    def.targets.forEach((spec, i) => {
      if (!isLegalTarget(this.state, this.registry, spec, targets[i], player, this.cardSource(def))) {
        throw new Error(`illegal target for ${def.name}`);
      }
    });

    const castingFromCommand = this.isCastableCommander(player, cardId);
    const cost = this.castingCostOf(player, cardId, def, chosenX);
    const payment = this.payMana(player, cost);
    if (payment === null) {
      throw new Error(`${player} cannot pay the cost of ${def.name}`);
    }

    // Commit: move to the stack, pay, announce.
    this.moveObject(cardId, "stack");
    object.targets = targets.length > 0 ? [...targets] : null;
    object.xValue = hasX ? chosenX : null;
    this.executePayment(player, payment);
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
        this.registry.get(printedCardName(object)).types.includes("creature")
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
    const def = this.registry.get(printedCardName(source));
    const ability = def.activated[abilityIndex];
    if (ability === undefined) {
      return `${def.name} has no ability #${abilityIndex}`;
    }
    if (hasLostAbilities(source)) {
      return `${def.name} has lost its abilities`;
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
      if (
        legalTargets(this.state, this.registry, spec, player, this.permanentSource(sourceId)).length === 0
      ) {
        return `${def.name}'s ability has no legal ${spec} target`;
      }
    }
    if (this.payMana(player, parseManaCost(ability.cost.mana)) === null) {
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
    const def = this.registry.get(printedCardName(source));
    const ability = def.activated[abilityIndex];

    if (targets.length !== ability.targets.length) {
      throw new Error(
        `that ability of ${def.name} takes ${ability.targets.length} target(s), got ${targets.length}`,
      );
    }
    ability.targets.forEach((spec, i) => {
      if (
        !isLegalTarget(
          this.state,
          this.registry,
          spec,
          targets[i],
          player,
          this.permanentSource(sourceId),
        )
      ) {
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
    // Don't auto-tap the source for its own ability's mana cost unless there's
    // no other way to pay (it may want to attack / hold up its `{T}` ability).
    const payment = this.payMana(
      player,
      manaCost,
      ability.cost.tap ? undefined : sourceId,
    );
    if (payment === null) {
      throw new Error(`${player} cannot pay for ${def.name}'s ability`);
    }

    // Pay the cost.
    if (ability.cost.tap) {
      source.tapped = true;
      this.emit({ type: "permanent-tapped", object: sourceId });
    }
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
      // `def.name`, captured above — not `printedCardName(source)` now, since a
      // "Sacrifice this" cost may have moved the source (clearing a Clone's
      // `copyOf`) between then and here (rule 608.2g — the ability resolves
      // using its source's last-known information).
      def.name,
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
   * If a permanent somehow has more than one `{T}: Add` ability, their outputs
   * are merged into a single activation here — no card in the pool does, and
   * modelling "pick one" would need a real choice.
   */
  private manaSources(player: PlayerId): ManaSource[] {
    const out: ManaSource[] = [];
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      if (object.controller !== player || object.tapped) continue;
      if (this.tapAbilityBlockedBySickness(object)) continue;
      if (hasLostAbilities(object)) continue; // layer 6 — no mana ability

      const def = this.registry.get(printedCardName(object));
      const fixed: ManaType[] = [];
      let anyColor = 0;
      let sacrificeSelf = false;
      let found = false;
      for (const ability of def.activated) {
        if (
          !isManaAbility(ability) ||
          !ability.cost.tap ||
          ability.cost.mana !== null ||
          ability.effect === null ||
          ability.effect.kind !== "add-mana"
        ) {
          continue;
        }
        found = true;
        if (ability.cost.sacrifice === "self") sacrificeSelf = true;
        if (ability.effect.mana === "any-color") anyColor += ability.effect.amount;
        else {
          for (let k = 0; k < ability.effect.amount; k += 1) {
            fixed.push(ability.effect.mana);
          }
        }
      }
      if (found) {
        out.push({ id, isLand: def.types.includes("land"), fixed, anyColor, sacrificeSelf });
      }
    }
    const flexibility = (s: ManaSource): number =>
      new Set(s.fixed).size + (s.anyColor > 0 ? 5 : 0);
    out.sort((a, b) => {
      if (a.isLand !== b.isLand) return a.isLand ? -1 : 1;
      if (a.sacrificeSelf !== b.sacrificeSelf) return a.sacrificeSelf ? 1 : -1;
      return flexibility(a) - flexibility(b);
    });
    return out;
  }

  /** True if `object` is a summoning-sick creature (so its `{T}` costs can't be paid). */
  private tapAbilityBlockedBySickness(object: GameObject): boolean {
    return (
      this.registry.get(printedCardName(object)).types.includes("creature") &&
      this.hasSummoningSickness(object)
    );
  }

  /**
   * The full worked-out payment for `cost` — hybrid pips resolved, sources
   * chosen, life counted — or `null` if `player` can't pay. This is the entry
   * point every caster / activator / ward check goes through; feed the result
   * to {@link executePayment}.
   */
  private payMana(
    player: PlayerId,
    cost: ManaCost,
    avoid?: ObjectId,
  ): ManaPayment | null {
    const resolved = this.resolveHybridCost(player, cost, avoid);
    if (resolved === null) return null;
    const steps = this.planManaPayment(player, resolved.concrete, avoid);
    if (steps === null) return null;
    return { steps, life: resolved.life, resolved: resolved.concrete };
  }

  /** Carry out a {@link payMana} result: tap/sacrifice each planned source and
   * add its mana, spend the resolved cost from the pool, then pay any
   * Phyrexian life. */
  private executePayment(player: PlayerId, payment: ManaPayment): void {
    for (const step of payment.steps) this.useManaSource(step);
    this.spendFromPool(player, payment.resolved);
    if (payment.life > 0) this.changeLife(player, -payment.life);
  }

  /**
   * Resolve every hybrid / twobrid / Phyrexian pip in `cost` to a concrete
   * payment, returning the pip-free cost plus the life owed for Phyrexian pips
   * (or `null` if a pip can't be paid at all). Greedy and auto-pilot: for each
   * pip, prefer a coloured half the player can still afford, then the twobrid
   * `{2}`, then paying 2 life — and never take yourself below 1 life. Each
   * tentative choice is re-checked against the running total with
   * {@link planManaPayment}; since that planner is itself greedy, a cost that
   * needs genuine cross-pip coordination (`{W/U}{W/U}` off one W source and one
   * U source) can still misresolve, but ordinary hybrid costs are fine.
   */
  private resolveHybridCost(
    player: PlayerId,
    cost: ManaCost,
    avoid: ObjectId | undefined,
  ): { concrete: ManaCost; life: number } | null {
    if (cost.hybrid.length === 0) return { concrete: cost, life: 0 };

    let concrete: ManaCost = {
      generic: cost.generic,
      colored: { ...cost.colored },
      colorless: cost.colorless,
      x: 0,
      hybrid: [],
    };
    let life = 0;
    const startingLife = this.state.players[player].life;

    for (const pip of cost.hybrid) {
      let chosen: ManaCost | null = null;
      for (const option of pip) {
        if (option.kind !== "color") continue;
        const nextColored = { ...concrete.colored };
        nextColored[option.color] += 1;
        const trial: ManaCost = { ...concrete, colored: nextColored };
        if (this.planManaPayment(player, trial, avoid) !== null) {
          chosen = trial;
          break;
        }
      }
      if (chosen === null) {
        for (const option of pip) {
          if (option.kind !== "generic") continue;
          const trial: ManaCost = { ...concrete, generic: concrete.generic + option.amount };
          if (this.planManaPayment(player, trial, avoid) !== null) {
            chosen = trial;
            break;
          }
        }
      }
      if (chosen !== null) {
        concrete = chosen;
        continue;
      }
      if (pip.some((o) => o.kind === "phyrexian") && startingLife - life - 2 >= 1) {
        life += 2;
        continue;
      }
      return null;
    }
    return { concrete, life };
  }

  /**
   * How `player` would pay `cost` from mana sources, or `null` if they can't.
   * `cost.hybrid` is ignored here — {@link resolveHybridCost} lowers hybrid
   * pips to concrete colour / generic needs before this runs.
   * Existing floating mana is spent first; then colored pips, then `{C}` pips,
   * then generic are covered in turn, tapping a fresh source only when the
   * already-tapped ones can't. A source that makes more than one mana (Sol
   * Ring) or "any colour" (Signet, Treasure) has its surplus applied to later
   * needs before another source is touched.
   */
  private planManaPayment(
    player: PlayerId,
    cost: ManaCost,
    avoid?: ObjectId,
  ): ManaPlanStep[] | null {
    const pool = this.state.players[player].manaPool;

    const need: Record<ManaType, number> = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
    for (const color of COLORS) {
      need[color] = Math.max(0, cost.colored[color] - pool[color]);
    }
    need.C = Math.max(0, cost.colorless - pool.C);
    const poolUsedForSpecific =
      COLORS.reduce((sum, c) => sum + Math.min(cost.colored[c], pool[c]), 0) +
      Math.min(cost.colorless, pool.C);
    let genericNeed = Math.max(0, cost.generic - (poolTotal(pool) - poolUsedForSpecific));

    // `avoid` (the permanent whose ability is being activated) goes last, so a
    // man-land paying its own `{1}: becomes a creature` cost taps something
    // else and stays free to attack — but still taps itself if nothing else
    // can cover the cost.
    const all = this.manaSources(player);
    const sources =
      avoid === undefined
        ? all
        : [...all.filter((s) => s.id !== avoid), ...all.filter((s) => s.id === avoid)];

    interface Tapped {
      readonly src: ManaSource;
      readonly produced: ManaType[];
      readonly freeFixed: ManaType[];
      freeAny: number;
    }
    const tapped: Tapped[] = [];
    const isTapped = (id: ObjectId): boolean => tapped.some((t) => t.src.id === id);
    const open = (src: ManaSource): Tapped => {
      const t: Tapped = {
        src,
        produced: [],
        freeFixed: [...src.fixed],
        freeAny: src.anyColor,
      };
      tapped.push(t);
      return t;
    };
    const takeSpecific = (t: Tapped, m: ManaType): boolean => {
      const i = t.freeFixed.indexOf(m);
      if (i >= 0) {
        t.freeFixed.splice(i, 1);
        t.produced.push(m);
        return true;
      }
      if (m !== "C" && t.freeAny > 0) {
        t.freeAny -= 1;
        t.produced.push(m);
        return true;
      }
      return false;
    };
    const takeGeneric = (t: Tapped): boolean => {
      if (t.freeFixed.length > 0) {
        t.produced.push(t.freeFixed.shift() as ManaType);
        return true;
      }
      if (t.freeAny > 0) {
        t.freeAny -= 1;
        t.produced.push("C");
        return true;
      }
      return false;
    };
    const coverSpecific = (m: ManaType): boolean => {
      for (const t of tapped) if (takeSpecific(t, m)) return true;
      const canMake = (s: ManaSource): boolean =>
        s.fixed.includes(m) || (m !== "C" && s.anyColor > 0);
      const next = sources.find((s) => !isTapped(s.id) && canMake(s));
      return next !== undefined && takeSpecific(open(next), m);
    };
    const coverGeneric = (): boolean => {
      for (const t of tapped) if (takeGeneric(t)) return true;
      const next = sources.find((s) => !isTapped(s.id));
      return next !== undefined && takeGeneric(open(next));
    };

    for (const color of COLORS) {
      for (let i = 0; i < need[color]; i += 1) if (!coverSpecific(color)) return null;
    }
    for (let i = 0; i < need.C; i += 1) if (!coverSpecific("C")) return null;
    for (let i = 0; i < genericNeed; i += 1) if (!coverGeneric()) return null;

    return tapped.map((t) => ({
      source: t.src.id,
      sacrifice: t.src.sacrificeSelf,
      mana: [
        ...t.produced,
        ...t.freeFixed,
        ...Array.from<ManaType>({ length: t.freeAny }).fill("C"),
      ],
    }));
  }

  /** Carry out one {@link ManaPlanStep}: tap (or sacrifice) the source and add
   * its mana to the controller's pool. */
  private useManaSource(step: ManaPlanStep): void {
    const object = this.state.objects[step.source];
    const player = object.controller;
    for (const m of step.mana) this.addMana(player, m, 1);
    if (step.sacrifice) {
      this.moveObject(step.source, "graveyard");
      this.emit({ type: "permanent-sacrificed", object: step.source, player: object.owner });
    } else {
      object.tapped = true;
      this.emit({ type: "permanent-tapped", object: step.source });
    }
  }

  private addMana(
    player: PlayerId,
    mana: ManaType | "any-color",
    amount: number,
  ): void {
    // A standalone "add one mana of any colour" (not paying a cost) just makes
    // white — the planner resolves the colour itself when it's a payment.
    const concrete: ManaType = mana === "any-color" ? "W" : mana;
    this.state.players[player].manaPool[concrete] += amount;
    this.emit({ type: "mana-added", player, mana: concrete, amount });
  }

  private spendFromPool(player: PlayerId, cost: ManaCost): void {
    const pool = this.state.players[player].manaPool;
    pool.C -= cost.colorless;
    if (pool.C < 0) {
      throw new Error("mana pool underflow paying a {C} cost");
    }
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

    const def = this.registry.get(printedCardName(object));
    const targets = object.targets ?? [];

    if (
      def.targets.length > 0 &&
      !this.anyTargetLegal(def.targets, targets, object.controller, this.cardSource(def))
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

    // Ward (rule 702.21) — a warded target the caster doesn't control taxes
    // the spell, or counters it if the caster can't pay.
    if (
      targets.length > 0 &&
      !this.wardCheckPasses(object.controller, targets, () => {
        object.targets = null;
        object.xValue = null;
        this.moveObject(id, "graveyard");
        this.emit({ type: "spell-countered", object: id });
      })
    ) {
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
      if (def.copyOnEnter !== null) this.beginCopyChoice(id, object.controller);
    } else {
      this.moveObject(id, "graveyard");
      object.targets = null;
    }
  }

  private stackAbilityOf(object: GameObject): StackAbility {
    const def = this.registry.get(printedCardName(object));
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
      !this.anyTargetLegal(
        ability.targets,
        targets,
        object.controller,
        this.permanentSource(source),
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

    // Ward (rule 702.21) — same as for a spell, but a countered ability just
    // ceases to exist.
    if (
      targets.length > 0 &&
      !this.wardCheckPasses(object.controller, targets, () => {
        this.removeAbilityFromStack(id);
        this.emit({ type: "spell-countered", object: id });
      })
    ) {
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
    if (event.type === "permanent-left-battlefield") candidates.add(event.object);
    for (const id of candidates) {
      const object = this.state.objects[id];
      if (object === undefined) continue;
      if (hasLostAbilities(object)) continue; // layer 6 — no triggered abilities
      const abilities = this.registry.get(printedCardName(object)).triggered;
      abilities.forEach((ability, index) => {
        if (this.triggerMatches(ability.trigger, event, object)) {
          const autoTargets =
            ability.trigger.on === "deals-combat-damage-to-player" &&
            event.type === "damage-dealt" &&
            event.target.kind === "player"
              ? [event.target]
              : undefined;
          this.state.pendingTriggers.push({
            sourceObjectId: id,
            cardName: printedCardName(object),
            abilityIndex: index,
            controller: object.controller,
            ...(autoTargets ? { autoTargets } : {}),
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
          !(spec.otherOnly === true && event.object === self.id) &&
          this.matchesWho(spec.who, event.object, self) &&
          this.triggerFilterOk(spec.filter, event.object, self)
        );
      case "dies":
        return (
          event.type === "permanent-destroyed" &&
          !(spec.otherOnly === true && event.object === self.id) &&
          this.matchesWho(spec.who, event.object, self) &&
          this.triggerFilterOk(spec.filter, event.object, self)
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
          this.matchesWhoPlayer(spec.who, event.player, self)
        );
      case "leaves-battlefield":
        return (
          event.type === "permanent-left-battlefield" &&
          this.matchesWho(spec.who, event.object, self)
        );
      case "attacks":
        return (
          event.type === "attacker-declared" &&
          this.matchesWho(spec.who, event.attacker, self)
        );
      case "deals-combat-damage-to-player":
        return (
          event.type === "damage-dealt" &&
          event.combat &&
          event.target.kind === "player" &&
          this.matchesWho(spec.who, event.source, self)
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

  /** A trigger's optional `CardFilter` on the object that fired it. Evaluated
   * from the source's controller's perspective. */
  private triggerFilterOk(
    filter: CardFilter | undefined,
    subject: ObjectId,
    self: GameObject,
  ): boolean {
    return (
      filter === undefined ||
      matchesFilter(this.state, this.registry, subject, filter, { you: self.controller })
    );
  }

  /** Like `matchesWho`, but the subject is a *player* (a life-change trigger).
   * `"any"` matches anyone; `"you"` / `"you-control"` / `"self"` all mean the
   * source's controller. */
  private matchesWhoPlayer(
    who: TriggerWho,
    player: PlayerId,
    self: GameObject,
  ): boolean {
    return who === "any" || self.controller === player;
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
    readonly autoTargets?: readonly TargetRef[];
  }): void {
    const ability =
      this.registry.get(trigger.cardName).triggered[trigger.abilityIndex];

    const triggerSource = this.state.objects[trigger.sourceObjectId] !== undefined
      ? this.permanentSource(trigger.sourceObjectId)
      : undefined;
    let targets: readonly TargetRef[] = [];
    if (ability.targets.length > 0) {
      const auto = trigger.autoTargets ?? [];
      const chosen: TargetRef[] = [];
      for (let i = 0; i < ability.targets.length; i += 1) {
        const spec = ability.targets[i];
        if (auto[i] !== undefined) {
          // The triggering event determined this target (a saboteur's victim).
          if (
            !isLegalTarget(
              this.state,
              this.registry,
              spec,
              auto[i],
              trigger.controller,
              triggerSource,
            )
          ) {
            this.emit({
              type: "trigger-removed",
              source: trigger.sourceObjectId,
              reason: "no legal targets",
            });
            return;
          }
          chosen.push(auto[i]);
          continue;
        }
        const options = legalTargets(
          this.state,
          this.registry,
          spec,
          trigger.controller,
          triggerSource,
        );
        if (options.length === 0) {
          this.emit({
            type: "trigger-removed",
            source: trigger.sourceObjectId,
            reason: "no legal targets",
          });
          return;
        }
        const picked = this.controllers[trigger.controller].chooseTargets(
          this.controllerView(trigger.controller),
          trigger.cardName,
          [spec],
          [options],
        );
        if (
          picked.length !== 1 ||
          !isLegalTarget(
            this.state,
            this.registry,
            spec,
            picked[0],
            trigger.controller,
            triggerSource,
          )
        ) {
          throw new Error(`illegal target chosen for ${trigger.cardName}'s trigger`);
        }
        chosen.push(picked[0]);
      }
      targets = chosen;
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
    source?: TargetSource,
  ): boolean {
    return specs.some(
      (spec, i) =>
        targets[i] !== undefined &&
        isLegalTarget(this.state, this.registry, spec, targets[i], forPlayer, source),
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
      destroyAll: (filter) => this.destroyAllByEffect(controller, filter),
      damageAll: (filter, amount) => this.damageAllByEffect(source, controller, filter, amount),
      sacrificePermanents: (who, filter, count) =>
        this.sacrificeByEffect(controller, who, filter, count),
      returnToHand: (target) => this.returnToHandByEffect(target),
      exileObject: (target) => this.exileByEffect(target),
      fight: (a, b, oneSided) => this.fightCreatures(a, b, oneSided),
      counterSpell: (target) => this.counterSpellByEffect(target),
      gainControl: (target, untilEndOfTurn) =>
        this.gainControlByEffect(controller, target, untilEndOfTurn),
      mill: (target, amount) => this.millByEffect(target, amount),
      discardCards: (target, amount) => this.discardByEffect(target, amount),
      modifyPt: (target, power, toughness, duration) =>
        this.modifyPt(target, power, toughness, duration),
      addCounter: (target, counter, amount) =>
        this.addCounter(target, counter, amount),
      proliferate: () => this.proliferateAll(),
      grantKeyword: (target, keyword, duration) =>
        this.grantKeyword(target, keyword, duration),
      animate: (target, opts) => this.animate(target, opts),
      changeText: (target) => this.beginTextChoice(controller, source, target),
      createToken: (token, count) => this.createTokens(controller, token, count),
      attach: (target) => this.attachPermanent(source, target),
      preventAllCombatDamage: () => {
        this.state.preventAllCombatDamage = true;
        this.emit({ type: "combat-damage-prevention-set" });
      },
      chooseModes: (minModes, maxModes, modes) =>
        this.beginModesChoice(source, controller, x, minModes, maxModes, modes),
      changeLifeScoped: (who, delta) => this.changeLifeScoped(controller, who, delta),
      searchLibrary: (filter, destination, min, max, enterTapped) =>
        this.beginLibrarySearch(controller, filter, destination, min, max, enterTapped),
      scry: (amount, surveil, then) =>
        this.beginScry(source, controller, x, amount, surveil ? "surveil" : "scry", then ?? null),
      lookAndChoose: (zone, count, min, max, destination, leftover, filter) =>
        this.beginZoneChoice(controller, zone, count, min, max, destination, leftover, filter),
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
    };
  }

  /** See the `"search-library"` {@link EffectSpec}. Lists only the matching
   * cards (a real search reveals the whole library, but the only decision is
   * which matching card to take); `leftover: "shuffle"` shuffles the whole
   * library afterwards, whiff or not (rule 701.19). */
  private beginLibrarySearch(
    player: PlayerId,
    filter: CardFilter,
    destination: "hand" | "battlefield",
    min: number,
    max: number,
    enterTapped: boolean,
  ): void {
    const eligible = this.state.zones.perPlayer[player].library.filter((id) =>
      matchesFilter(this.state, this.registry, id, filter, { you: player }),
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

  private whyCannotScry(player: PlayerId, away: readonly ObjectId[]): string | null {
    const awaiting = this.state.awaiting;
    if (awaiting === null || awaiting.kind !== "scry" || awaiting.player !== player) {
      return `${player} is not being asked to scry`;
    }
    if (new Set(away).size !== away.length) {
      return `${player} chose the same card twice`;
    }
    const looked = new Set(awaiting.cards);
    for (const id of away) {
      if (!looked.has(id)) return `${id} was not among the cards looked at`;
    }
    return null;
  }

  /** Create `count` copies of the named token, controlled by `controller` (rule 111). */
  private createTokens(controller: PlayerId, tokenName: string, count: number): void {
    this.registry.get(tokenName); // validate the token is a known definition
    // Doubling Season / Parallel Lives (rule 614): "twice that many instead".
    const total = count * this.tokenCreationMultiplier(controller);
    for (let i = 0; i < total; i += 1) {
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
        controlEndsAtCleanup: false,
        copyOf: null,
      };
      this.state.zones.shared.battlefield.push(id);
      // A token can carry the same enters-battlefield replacements as any card.
      const entering = this.entersBattlefieldReplacement(id);
      this.state.objects[id].tapped = entering.tapped;
      for (const c of entering.counters) {
        this.state.objects[id].counters[c.kind] =
          (this.state.objects[id].counters[c.kind] ?? 0) + c.amount;
      }
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
    // Protection (rule 702.16) — can't be enchanted / equipped by a matching
    // Aura / Equipment.
    if (protectionBlocks(this.state, this.registry, target.object, this.permanentSource(source))) {
      return;
    }
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
  ): void {
    if (target.kind !== "object") return;
    const object = this.state.objects[target.object];
    if (object === undefined || object.zone !== "battlefield") return;
    object.modifiers.push({
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
      object: target.object,
      power: opts.power,
      toughness: opts.toughness,
      duration: opts.duration,
    });
  }

  /** Begin a text-changing effect (Artificial Evolution — layer 3): raise a
   * `choose-text` decision offering the target's current creature subtypes as
   * the word to replace. Nothing to replace ⇒ the effect does nothing. */
  private beginTextChoice(
    player: PlayerId,
    _source: ObjectId,
    target: TargetRef,
  ): void {
    if (target.kind !== "object") return;
    const object = this.state.objects[target.object];
    if (object === undefined || object.zone !== "battlefield") return;
    const fromOptions = effectiveSubtypes(this.registry, object).filter((s) =>
      CHANGEABLE_CREATURE_TYPES.includes(s),
    );
    if (fromOptions.length === 0) return;
    this.state.awaiting = {
      kind: "choose-text",
      player,
      source: target.object,
      target: target.object,
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

  private whyCannotTextChoice(
    player: PlayerId,
    from: string,
    to: string,
  ): string | null {
    const awaiting = this.state.awaiting;
    if (awaiting === null || awaiting.kind !== "choose-text" || awaiting.player !== player) {
      return `${player} is not being asked to change any text`;
    }
    if (!awaiting.fromOptions.includes(from)) {
      return `${from} is not a creature type on that permanent`;
    }
    if (!awaiting.toOptions.includes(to)) {
      return `${to} is not an allowed new creature type`;
    }
    return null;
  }

  private addCounter(target: TargetRef, counter: string, amount: number): void {
    if (target.kind !== "object") return;
    const object = this.state.objects[target.object];
    if (object === undefined || object.zone !== "battlefield") return;
    // Doubling Season (rule 614): "twice that many counters instead" — only
    // when counters are being *added*, never a removal.
    const total =
      amount > 0 ? amount * this.counterMultiplier(target.object, counter) : amount;
    object.counters[counter] = (object.counters[counter] ?? 0) + total;
    this.emit({ type: "counter-added", object: target.object, counter, amount: total });
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
    // A commander's move can be deferred for its owner's 903.9a choice —
    // `applyCommanderChoice` finishes it (and emits `permanent-destroyed`
    // itself if it lands in a graveyard).
    if (this.state.awaiting !== null) return;
    this.emit({
      type: "permanent-destroyed",
      object: target.object,
      reason: "destroyed",
    });
  }

  /** Destroy every battlefield permanent matching `filter` (Wrath of God).
   * The victims are queued so a commander's 903.9a choice can pause the wipe
   * without dropping the rest — `drainPendingDestruction` (run inside the
   * `prepareForPriority` fixpoint) works through the queue. */
  private destroyAllByEffect(you: PlayerId, filter: CardFilter): void {
    for (const id of [...this.state.zones.shared.battlefield]) {
      if (matchesFilter(this.state, this.registry, id, filter, { you })) {
        this.state.pendingDestruction.push(id);
      }
    }
    this.drainPendingDestruction();
  }

  private drainPendingDestruction(): void {
    while (this.state.pendingDestruction.length > 0) {
      if (this.state.awaiting !== null) return; // e.g. a commander's 903.9a choice
      const id = this.state.pendingDestruction.shift() as ObjectId;
      const object = this.state.objects[id];
      if (object === undefined || object.zone !== "battlefield") continue;
      this.destroyByEffect({ kind: "object", object: id });
    }
  }

  /** Deal `amount` damage to every battlefield permanent matching `filter`
   * (Pyroclasm). SBAs sweep the dead afterwards. */
  private damageAllByEffect(
    source: ObjectId,
    you: PlayerId,
    filter: CardFilter,
    amount: number,
  ): void {
    if (amount <= 0) return;
    for (const id of [...this.state.zones.shared.battlefield]) {
      if (matchesFilter(this.state, this.registry, id, filter, { you })) {
        this.dealDamage(source, { kind: "object", object: id }, amount);
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
    for (const player of players) {
      if (this.eligibleSacrifices(player, filter).length > 0) {
        this.state.pendingSacrifices.push({ player, filter, count });
      }
    }
  }

  /** Permanents `player` controls that match `filter` (they can only ever
   * sacrifice their own — rule 701.16a). */
  private eligibleSacrifices(player: PlayerId, filter: CardFilter): ObjectId[] {
    return this.state.zones.shared.battlefield.filter(
      (id) =>
        this.state.objects[id].controller === player &&
        matchesFilter(this.state, this.registry, id, filter, { you: player }),
    );
  }

  /** Drain `pendingSacrifices`: for each player, auto-sacrifice when there's
   * no choice, otherwise raise a `sacrifice` decision and stop. */
  private promptNextSacrifice(): void {
    while (this.state.pendingSacrifices.length > 0) {
      const next = this.state.pendingSacrifices[0];
      const eligible = this.eligibleSacrifices(next.player, next.filter);
      if (eligible.length === 0) {
        this.state.pendingSacrifices = this.state.pendingSacrifices.slice(1);
        continue;
      }
      if (eligible.length <= next.count) {
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
      this.state.pendingSacrifices = this.state.pendingSacrifices.slice(1);
      return;
    }
  }

  /** Actually move queued sacrifice victims to the graveyard, one at a time
   * (a commander among them can defer via 903.9a — the drain pauses). */
  private drainPendingSacrificeVictims(): void {
    while (this.state.pendingSacrificeVictims.length > 0) {
      if (this.state.awaiting !== null) return;
      const next = this.state.pendingSacrificeVictims[0];
      this.state.pendingSacrificeVictims = this.state.pendingSacrificeVictims.slice(1);
      const object = this.state.objects[next.object];
      if (object === undefined || object.zone !== "battlefield") continue;
      this.moveObject(next.object, "graveyard");
      if (this.state.awaiting !== null) return; // commander 903.9a deferred
      this.emit({ type: "permanent-sacrificed", object: next.object, player: next.player });
    }
  }

  /** Answers a pending `sacrifice` decision. */
  private applySacrifice(player: PlayerId, permanents: readonly ObjectId[]): void {
    const why = this.whyCannotSacrifice(player, permanents);
    if (why !== null) throw new Error(why);
    this.state.awaiting = null;
    for (const id of permanents) {
      this.state.pendingSacrificeVictims.push({ player, object: id });
    }
    this.prepareForPriority(this.activePlayer);
  }

  private whyCannotSacrifice(
    player: PlayerId,
    permanents: readonly ObjectId[],
  ): string | null {
    const awaiting = this.state.awaiting;
    if (awaiting === null || awaiting.kind !== "sacrifice" || awaiting.player !== player) {
      return `${player} is not being asked to sacrifice`;
    }
    if (new Set(permanents).size !== permanents.length) {
      return `${player} chose the same permanent twice`;
    }
    if (permanents.length !== awaiting.count) {
      return `${player} must sacrifice exactly ${awaiting.count}, chose ${permanents.length}`;
    }
    const eligible = new Set(awaiting.eligible);
    for (const id of permanents) {
      if (!eligible.has(id)) return `${id} is not an eligible sacrifice`;
    }
    return null;
  }

  private returnToHandByEffect(target: TargetRef): void {
    if (target.kind !== "object") return;
    const object = this.state.objects[target.object];
    if (object === undefined || object.zone !== "battlefield") return;
    // A token would just be swept by SBAs; a commander may be redirected to
    // the command zone via a deferred 903.9a choice — both handled downstream.
    const owner = object.owner;
    this.moveObject(target.object, "hand");
    if (this.state.awaiting !== null) return;
    this.emit({ type: "permanent-returned-to-hand", object: target.object, owner });
  }

  private exileByEffect(target: TargetRef): void {
    if (target.kind !== "object") return;
    const object = this.state.objects[target.object];
    if (object === undefined || object.zone !== "battlefield") return;
    this.moveObject(target.object, "exile");
    if (this.state.awaiting !== null) return;
    this.emit({ type: "permanent-exiled", object: target.object });
  }

  /** Recompute every battlefield permanent's controller from continuous
   * effects (temporary steals + control-granting Auras). Returns whether any
   * changed. A temporary steal (`controlEndsAtCleanup`) outranks an Aura
   * until it wears off in cleanup. */
  private recomputeControl(): boolean {
    // Cheap early-out for the overwhelmingly common no-control-effects board.
    const anyControlEffect = this.state.zones.shared.battlefield.some((id) => {
      const o = this.state.objects[id];
      return o.controller !== o.owner || this.registry.get(printedCardName(o)).controlEnchanted;
    });
    if (!anyControlEffect) return false;

    let changed = false;
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      if (object.controlEndsAtCleanup) continue;

      let controller = object.owner;
      let bestTimestamp = -1;
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

  /** `player` gains control of `target` (rule 613.1b, layer 2 — modeled by
   * reassigning `controller`). The creature is summoning-sick for its new
   * controller (rule 302.6; Act of Treason grants haste to compensate).
   * `untilEndOfTurn` marks it for a cleanup-step revert to its owner. */
  private gainControlByEffect(
    player: PlayerId,
    target: TargetRef,
    untilEndOfTurn: boolean,
  ): void {
    if (target.kind !== "object") return;
    const object = this.state.objects[target.object];
    if (object === undefined || object.zone !== "battlefield") return;
    if (object.controller === player) return;
    object.controller = player;
    object.summoningSick = true;
    object.attacking = null;
    object.blocking = null;
    if (untilEndOfTurn) object.controlEndsAtCleanup = true;
    this.emit({
      type: "control-changed",
      object: target.object,
      controller: player,
      untilEndOfTurn,
    });
  }

  /** Counter a spell on the stack (rule 701.5): it's removed from the stack and
   * put into its owner's graveyard without resolving. A countered permanent
   * spell never enters the battlefield; a countered commander is redirected to
   * the command zone by `moveObject` like any other. */
  /** The ward cost on `id` (rule 702.21) from a `"self"` static, or `null`. */
  private wardOf(id: ObjectId): { mana?: string; payLife?: number } | null {
    const object = this.state.objects[id];
    if (object === undefined || hasLostAbilities(object)) return null;
    for (const ability of this.registry.get(printedCardName(object)).static) {
      if (ability.ward !== undefined && ability.affects.scope === "self") {
        return ability.ward;
      }
    }
    return null;
  }

  /**
   * Ward (rule 702.21), checked as a targeted spell/ability begins to resolve:
   * for every warded permanent it targets that `caster` doesn't control, the
   * caster must pay the ward cost. Paid automatically when affordable (no
   * "decline and be countered" choice is modeled); otherwise the target's
   * spell/ability is countered — this returns `false` and the caller aborts
   * the resolution. `sourceIsSpell` picks the log wording.
   */
  private wardCheckPasses(
    caster: PlayerId,
    targets: readonly TargetRef[],
    onCountered: () => void,
  ): boolean {
    for (const target of targets) {
      if (target.kind !== "object") continue;
      const permanent = this.state.objects[target.object];
      if (
        permanent === undefined ||
        permanent.zone !== "battlefield" ||
        permanent.controller === caster
      ) {
        continue;
      }
      const ward = this.wardOf(target.object);
      if (ward === null) continue;

      const manaCost = parseManaCost(ward.mana ?? null);
      const payment = this.payMana(caster, manaCost);
      const lifeOk =
        ward.payLife === undefined || this.state.players[caster].life >= ward.payLife;
      if (payment === null || !lifeOk) {
        onCountered();
        return false;
      }
      this.executePayment(caster, payment);
      if (ward.payLife !== undefined) this.changeLife(caster, -ward.payLife);
      this.emit({ type: "ward-paid", object: target.object, player: caster });
    }
    return true;
  }

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

  /** Deal `amount` damage from `source` to `target`. Returns the amount
   * actually dealt after replacement effects (0 when a Fog-style shield
   * prevented it). */
  private dealDamage(
    source: ObjectId,
    target: TargetRef,
    amount: number,
    combat = false,
  ): number {
    if (amount <= 0) return 0;

    // Fog (rule 614): a turn-scoped shield prevents all combat damage.
    if (combat && this.state.preventAllCombatDamage) {
      this.emit({ type: "damage-prevented", source, target, amount });
      return 0;
    }

    if (target.kind === "player") {
      if (this.state.players[target.player] === undefined) return 0;
      this.emit({ type: "damage-dealt", source, target, amount, combat });
      this.changeLife(target.player, -amount);
      this.applyLifelink(source, amount);
      return amount;
    }
    const object = this.state.objects[target.object];
    if (object === undefined || object.zone !== "battlefield") return 0;
    // Protection (rule 702.16) — prevent damage from a matching source.
    if (
      this.state.objects[source] !== undefined &&
      protectionBlocks(this.state, this.registry, target.object, this.permanentSource(source))
    ) {
      this.emit({ type: "damage-prevented", source, target, amount });
      return 0;
    }
    object.damageMarked += amount;
    if (this.sourceHasKeyword(source, "deathtouch")) {
      object.markedByDeathtouch = true;
    }
    this.emit({ type: "damage-dealt", source, target, amount, combat });
    this.applyLifelink(source, amount);
    return amount;
  }

  /** True if `source` is a battlefield creature whose current keywords include `keyword`. */
  private sourceHasKeyword(source: ObjectId, keyword: Keyword): boolean {
    const object = this.state.objects[source];
    if (object === undefined || object.zone !== "battlefield") return false;
    if (this.creatureDef(source) === null) return false;
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

  /** Change life for a whole `PlayerScope` (a `gain-life` / `lose-life` effect
   * with `who`), APNAP-ordered so any resulting triggers stack in turn order. */
  private changeLifeScoped(controller: PlayerId, who: PlayerScope, delta: number): void {
    if (delta === 0) return;
    const active = this.state.turnOrder.indexOf(this.activePlayer);
    const rotated = [
      ...this.state.turnOrder.slice(active),
      ...this.state.turnOrder.slice(0, active),
    ];
    const players =
      who === "you"
        ? [controller]
        : rotated.filter(
            (p) =>
              !this.state.players[p].hasLost &&
              (who === "each-player" || p !== controller),
          );
    for (const p of players) this.changeLife(p, delta);
  }

  // --- state-based actions -----------------------------------

  private runStateBasedActions(): void {
    let changed = true;
    while (changed) {
      // A replacement raised a decision mid-sweep (a commander about to leave
      // the battlefield — rule 903.9a). Stop until it's answered; the caller
      // (`prepareForPriority` / `applyCommanderChoice`) resumes the sweep.
      if (this.state.awaiting !== null) return;
      changed = false;

      // Continuous control effects (layer 2), recomputed each pass: a
      // permanent is controlled by its owner unless a temporary steal
      // (`controlEndsAtCleanup`) or an attached control-granting Aura
      // (latest timestamp wins) says otherwise.
      if (this.recomputeControl()) changed = true;

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
        const computed = computeCharacteristics(this.state, this.registry, id);
        // Printed creatures and man-lands currently animated to creatures
        // (layer 4) both face the lethal-toughness / lethal-damage SBAs; once
        // an animation wears off the land isn't a creature and is skipped.
        if (!computed.types.includes("creature")) continue;
        // (A 0/0 Clone still choosing what to copy is protected by the
        // `awaiting !== null` guard at the top of this loop — SBAs don't run
        // while any decision is pending.)
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
          // A commander's move was deferred for its owner's 903.9a choice —
          // stop the sweep; `applyCommanderChoice` finishes the move and emits
          // `permanent-destroyed` itself if it lands in a graveyard.
          if (this.state.awaiting !== null) return;
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

        if (this.registry.get(printedCardName(object)).subtypes.includes("Aura")) {
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
        if (!this.registry.get(printedCardName(object)).supertypes.includes("legendary")) continue;
        const key = `${object.controller} ${object.cardName}`;
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
          if (this.state.awaiting !== null) return; // deferred 903.9a choice
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

  /**
   * The `enters-battlefield` replacements (rule 614.1c) that apply to `id` as
   * it enters — the entering card's own self-replacements ("~ enters tapped",
   * "~ enters with N +1/+1 counters"; `amount: "x"` reads the `{X}` chosen when
   * it was cast), with any `would-add-counter` multiplier (Doubling Season)
   * folded into the counter amounts.
   */
  private entersBattlefieldReplacement(id: ObjectId): {
    tapped: boolean;
    counters: { kind: string; amount: number }[];
  } {
    const object = this.state.objects[id];
    const def = this.registry.get(printedCardName(object));
    let tapped = false;
    const counters: { kind: string; amount: number }[] = [];
    for (const ability of def.static) {
      const r = ability.replacement;
      if (r === undefined || r.event !== "enters-battlefield") continue;
      if (r.tapped) tapped = true;
      if (r.counters) {
        const base =
          r.counters.amount === "x" ? (object.xValue ?? 0) : r.counters.amount;
        const amount = base * this.counterMultiplier(id, r.counters.kind);
        if (amount > 0) counters.push({ kind: r.counters.kind, amount });
      }
    }
    return { tapped, counters };
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
        if (r?.event === "would-create-token") mult *= r.multiplier;
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
          (r.counterKind === undefined || r.counterKind === kind)
        ) {
          mult *= r.multiplier;
        }
      }
    }
    return mult;
  }

  /** Whether a battlefield permanent replaces "put a card into a graveyard"
   * with "exile it instead" (Rest in Peace — rule 614). */
  private graveyardIsReplacedWithExile(): boolean {
    for (const id of this.state.zones.shared.battlefield) {
      const object = this.state.objects[id];
      if (hasLostAbilities(object)) continue;
      for (const ability of this.registry.get(printedCardName(object)).static) {
        const r = ability.replacement;
        if (r?.event === "would-be-put-into-graveyard" && r.instead === "exile") {
          return true;
        }
      }
    }
    return false;
  }

  private moveObject(id: ObjectId, to: ZoneType): void {
    const object = this.state.objects[id];
    const leavingBattlefield = object.zone === "battlefield" && to !== "battlefield";

    // Rest in Peace (rule 614): a *card* that would be put into a graveyard is
    // exiled instead. Tokens are exempt — they'd cease to exist either way.
    if (
      to === "graveyard" &&
      !object.isToken &&
      this.graveyardIsReplacedWithExile()
    ) {
      to = "exile";
      this.emit({ type: "graveyard-replaced-with-exile", object: id });
    }

    // Commander replacement (rule 903.9a): a commander that would leave the
    // battlefield for a hidden zone — its owner may send it to the command
    // zone instead. Ask *before* moving (this is a replacement effect, rule
    // 614), so a "dies" trigger never fires unless it truly lands in a
    // graveyard. The move is deferred to `applyCommanderChoice`.
    if (
      leavingBattlefield &&
      object.isCommander &&
      (to === "graveyard" || to === "exile" || to === "hand" || to === "library") &&
      this.state.deferredCommanderMove === null &&
      this.state.awaiting === null
    ) {
      this.state.deferredCommanderMove = { commander: id, intendedZone: to };
      this.state.awaiting = {
        kind: "commander-replacement",
        player: object.owner,
        commander: id,
        intendedZone: to,
      };
      return;
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
    // A permanent that leaves the battlefield reverts to its owner's control
    // (rule 110.2 / 400.3) — so a stolen creature that dies or is bounced goes
    // to its owner, not the thief.
    object.controlEndsAtCleanup = false;
    object.controller = object.owner;
    // A copy effect ends when the object changes zones (rule 707.2) — a Clone
    // that dies and returns is a Clone again.
    object.copyOf = null;

    if (to === "battlefield") {
      object.enteredBattlefieldOnTurn = this.state.turn.number;
      object.summoningSick = true;
      this.state.timestampSeq += 1;
      object.timestamp = this.state.timestampSeq;
      // Replacement effects that apply as it enters (rule 614.1c) — tapped /
      // enters-with-counters. `object.counters` was just reset above.
      const entering = this.entersBattlefieldReplacement(id);
      object.tapped = entering.tapped;
      for (const c of entering.counters) {
        object.counters[c.kind] = (object.counters[c.kind] ?? 0) + c.amount;
      }
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
    }

    // The hook for `leaves-battlefield` triggers (rule 603.6d) — fired for
    // every destination, and (from the death paths) just before the more
    // specific `permanent-destroyed`.
    if (
      leavingBattlefield &&
      (to === "graveyard" || to === "exile" || to === "hand" || to === "library" || to === "command")
    ) {
      this.emit({ type: "permanent-left-battlefield", object: id, toZone: to });
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
