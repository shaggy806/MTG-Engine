/**
 * A `PlayerController` supplies the decisions the rules require of a player.
 *
 * `act(view)` is the single entry point: when `view.state.awaiting` is set the
 * controller must return the matching declaration, otherwise it returns any
 * legal priority action. The base classes implement `act` by delegating to the
 * per-decision methods below, so subclasses only override what they care about.
 */

import type {
  Action,
  AttackerDeclaration,
  BlockerDeclaration,
  LegalAction,
} from "./actions.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameObject, GameState } from "./state.js";
import type { TargetRef, TargetSpec } from "./target.js";

export type { AttackerDeclaration, BlockerDeclaration };

export interface ControllerView {
  readonly state: GameState;
  readonly player: PlayerId;
  /** Everything this player may legally do right now. */
  legalActions(): readonly LegalAction[];
}

export interface PlayerController {
  readonly playerId: PlayerId;
  /** Called whenever this player holds priority. Return an action to take. */
  act(view: ControllerView): Action;
  /** Choose exactly `count` cards from `hand` to discard. */
  chooseDiscards(hand: readonly GameObject[], count: number): readonly ObjectId[];
  /** Declare this player's attackers. */
  declareAttackers(view: ControllerView): readonly AttackerDeclaration[];
  /** Declare this player's blockers. */
  declareBlockers(view: ControllerView): readonly BlockerDeclaration[];
  /**
   * Order the blockers assigned to one attacker for damage assignment
   * (attacking player's choice). Reached via `act` as an `order-blockers`
   * action when `awaiting.kind === "order-blockers"`.
   */
  orderBlockers(
    view: ControllerView,
    attacker: ObjectId,
    blockers: readonly ObjectId[],
  ): readonly ObjectId[];
  /**
   * Choose one target per spec for a triggered ability being put on the stack.
   * `legalOptions[i]` is the non-empty list of legal targets for `specs[i]`.
   */
  chooseTargets(
    view: ControllerView,
    sourceName: string,
    specs: readonly TargetSpec[],
    legalOptions: readonly (readonly TargetRef[])[],
  ): readonly TargetRef[];
}

const passFor = (player: PlayerId): Action => ({
  type: "pass-priority",
  player,
});

const discardFromFront = (
  hand: readonly GameObject[],
  count: number,
): readonly ObjectId[] => hand.slice(0, count).map((object) => object.id);

const firstOfEach = (
  legalOptions: readonly (readonly TargetRef[])[],
): readonly TargetRef[] => legalOptions.map((options) => options[0]);

/**
 * Answer whatever the engine is waiting on, or `null` if it isn't waiting.
 * Shared by every controller so `act` only has to handle priority choices.
 */
function answerAwaited(
  controller: PlayerController,
  view: ControllerView,
): Action | null {
  const awaiting = view.state.awaiting;
  if (awaiting === null || awaiting.player !== controller.playerId) return null;
  const player = controller.playerId;

  if (awaiting.kind === "attackers") {
    return { type: "declare-attackers", player, attackers: controller.declareAttackers(view) };
  }
  if (awaiting.kind === "blockers") {
    return { type: "declare-blockers", player, blocks: controller.declareBlockers(view) };
  }
  if (awaiting.kind === "order-blockers") {
    const blockers = view.state.objects[awaiting.attacker].blockedBy;
    return {
      type: "order-blockers",
      player,
      attacker: awaiting.attacker,
      order: controller.orderBlockers(view, awaiting.attacker, [...blockers]),
    };
  }
  const hand = view.state.zones.perPlayer[player].hand.map(
    (id) => view.state.objects[id],
  );
  return {
    type: "discard",
    player,
    cards: controller.chooseDiscards(hand, awaiting.count),
  };
}

/** Always passes priority, never attacks or blocks; discards from the front. */
export class AutomaticController implements PlayerController {
  readonly playerId: PlayerId;

  constructor(playerId: PlayerId) {
    this.playerId = playerId;
  }

  act(view: ControllerView): Action {
    return answerAwaited(this, view) ?? passFor(this.playerId);
  }

  chooseDiscards(
    hand: readonly GameObject[],
    count: number,
  ): readonly ObjectId[] {
    return discardFromFront(hand, count);
  }

  declareAttackers(_view: ControllerView): readonly AttackerDeclaration[] {
    return [];
  }

  declareBlockers(_view: ControllerView): readonly BlockerDeclaration[] {
    return [];
  }

  orderBlockers(
    _view: ControllerView,
    _attacker: ObjectId,
    blockers: readonly ObjectId[],
  ): readonly ObjectId[] {
    return blockers;
  }

  chooseTargets(
    _view: ControllerView,
    _sourceName: string,
    _specs: readonly TargetSpec[],
    legalOptions: readonly (readonly TargetRef[])[],
  ): readonly TargetRef[] {
    return firstOfEach(legalOptions);
  }
}

/** A queued action, optionally gated on a condition being true. */
export type ScriptEntry =
  | Action
  | { readonly action: Action; readonly when: (view: ControllerView) => boolean };

const entryAction = (entry: ScriptEntry): Action =>
  "action" in entry ? entry.action : entry;

const entryReady = (entry: ScriptEntry, view: ControllerView): boolean =>
  "action" in entry ? entry.when(view) : true;

type AttackChooser = (view: ControllerView) => readonly AttackerDeclaration[];
type BlockChooser = (view: ControllerView) => readonly BlockerDeclaration[];
type OrderChooser = (
  view: ControllerView,
  attacker: ObjectId,
  blockers: readonly ObjectId[],
) => readonly ObjectId[];
type TargetChooser = (
  view: ControllerView,
  sourceName: string,
  specs: readonly TargetSpec[],
  legalOptions: readonly (readonly TargetRef[])[],
) => readonly TargetRef[];

/**
 * Plays a fixed queue of priority actions (each firing when its `when` guard is
 * true), and delegates the other decisions to assignable callbacks. Useful for
 * tests and scripted demos.
 */
export class ScriptedController implements PlayerController {
  readonly playerId: PlayerId;
  private readonly queue: ScriptEntry[];

  declareAttackersFn: AttackChooser = () => [];
  declareBlockersFn: BlockChooser = () => [];
  orderBlockersFn: OrderChooser = (_view, _attacker, blockers) => blockers;
  chooseTargetsFn: TargetChooser = (_view, _source, _specs, legalOptions) =>
    firstOfEach(legalOptions);

  constructor(playerId: PlayerId, script: readonly ScriptEntry[] = []) {
    this.playerId = playerId;
    this.queue = [...script];
  }

  enqueue(...entries: ScriptEntry[]): void {
    this.queue.push(...entries);
  }

  act(view: ControllerView): Action {
    const awaited = answerAwaited(this, view);
    if (awaited !== null) return awaited;

    const next = this.queue[0];
    if (
      next !== undefined &&
      entryAction(next).player === this.playerId &&
      entryReady(next, view)
    ) {
      this.queue.shift();
      return entryAction(next);
    }
    return passFor(this.playerId);
  }

  chooseDiscards(
    hand: readonly GameObject[],
    count: number,
  ): readonly ObjectId[] {
    return discardFromFront(hand, count);
  }

  declareAttackers(view: ControllerView): readonly AttackerDeclaration[] {
    return this.declareAttackersFn(view);
  }

  declareBlockers(view: ControllerView): readonly BlockerDeclaration[] {
    return this.declareBlockersFn(view);
  }

  orderBlockers(
    view: ControllerView,
    attacker: ObjectId,
    blockers: readonly ObjectId[],
  ): readonly ObjectId[] {
    return this.orderBlockersFn(view, attacker, blockers);
  }

  chooseTargets(
    view: ControllerView,
    sourceName: string,
    specs: readonly TargetSpec[],
    legalOptions: readonly (readonly TargetRef[])[],
  ): readonly TargetRef[] {
    return this.chooseTargetsFn(view, sourceName, specs, legalOptions);
  }
}

/**
 * Picks uniformly at random from `legalActions()`. Useful as a filler opponent
 * and as a fuzz test: a random-vs-random game that runs to completion exercises
 * every action path the engine claims is legal.
 */
export class RandomController extends AutomaticController {
  private readonly random: () => number;

  constructor(playerId: PlayerId, random: () => number = Math.random) {
    super(playerId);
    this.random = random;
  }

  act(view: ControllerView): Action {
    const options = view.legalActions();
    if (options.length === 0) return passFor(this.playerId);
    return this.toAction(options[this.pickIndex(options.length)]);
  }

  private pickIndex(length: number): number {
    return Math.min(length - 1, Math.floor(this.random() * length));
  }

  private pickTargets(
    options: readonly (readonly TargetRef[])[],
  ): readonly TargetRef[] {
    return options.map((choices) => choices[this.pickIndex(choices.length)]);
  }

  private toAction(legal: LegalAction): Action {
    const player = this.playerId;
    switch (legal.kind) {
      case "play-land":
        return { type: "play-land", player, card: legal.card };
      case "cast-spell":
        return {
          type: "cast-spell",
          player,
          card: legal.card,
          targets: this.pickTargets(legal.targetOptions),
        };
      case "activate-ability":
        return {
          type: "activate-ability",
          player,
          source: legal.source,
          abilityIndex: legal.abilityIndex,
          targets: this.pickTargets(legal.targetOptions),
        };
      case "declare-attackers":
        return {
          type: "declare-attackers",
          player,
          attackers: legal.eligible
            .filter(() => this.random() < 0.6)
            .map((attacker) => ({ attacker, defender: legal.defender })),
        };
      case "declare-blockers": {
        const blocks: BlockerDeclaration[] = [];
        for (const entry of legal.eligible) {
          if (this.random() < 0.5) continue;
          blocks.push({
            blocker: entry.blocker,
            attacker: entry.canBlock[this.pickIndex(entry.canBlock.length)],
          });
        }
        // A menace attacker must be blocked by 0 or 2+ creatures; drop lone blocks.
        const filtered = blocks.filter(
          (b) =>
            !legal.menaceAttackers.includes(b.attacker) ||
            blocks.filter((x) => x.attacker === b.attacker).length >= 2,
        );
        return { type: "declare-blockers", player, blocks: filtered };
      }
      case "order-blockers": {
        const order = [...legal.blockers];
        for (let i = order.length - 1; i > 0; i -= 1) {
          const j = this.pickIndex(i + 1);
          const tmp = order[i];
          order[i] = order[j];
          order[j] = tmp;
        }
        return { type: "order-blockers", player, attacker: legal.attacker, order };
      }
      case "discard": {
        const pool = [...legal.from];
        const cards: ObjectId[] = [];
        for (let i = 0; i < legal.count && pool.length > 0; i += 1) {
          cards.push(pool.splice(this.pickIndex(pool.length), 1)[0]);
        }
        return { type: "discard", player, cards };
      }
      default:
        return passFor(player);
    }
  }
}
