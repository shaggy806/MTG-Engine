/**
 * A `PlayerController` supplies the decisions the rules require of a player:
 * what to do when holding priority, which cards to discard in cleanup, and the
 * combat declarations.
 */

import type { Action } from "./actions.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameObject, GameState } from "./state.js";
import type { TargetRef, TargetSpec } from "./target.js";

export interface ControllerView {
  readonly state: GameState;
  readonly player: PlayerId;
}

export interface AttackerDeclaration {
  readonly attacker: ObjectId;
  readonly defender: PlayerId;
}

export interface BlockerDeclaration {
  readonly blocker: ObjectId;
  readonly attacker: ObjectId;
}

export interface PlayerController {
  readonly playerId: PlayerId;
  /** Called whenever this player holds priority. Return an action to take. */
  act(view: ControllerView): Action;
  /** Choose exactly `count` cards from `hand` to discard. */
  chooseDiscards(hand: readonly GameObject[], count: number): readonly ObjectId[];
  /** Declare this player's attackers (called on their turn's declare-attackers step). */
  declareAttackers(view: ControllerView): readonly AttackerDeclaration[];
  /** Declare this player's blockers (called on the declare-blockers step). */
  declareBlockers(view: ControllerView): readonly BlockerDeclaration[];
  /** Order the blockers assigned to one attacker (attacking player's choice). */
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

const firstOfEach = (
  legalOptions: readonly (readonly TargetRef[])[],
): readonly TargetRef[] => legalOptions.map((options) => options[0]);

const passFor = (player: PlayerId): Action => ({
  type: "pass-priority",
  player,
});

const discardFromFront = (
  hand: readonly GameObject[],
  count: number,
): readonly ObjectId[] => hand.slice(0, count).map((object) => object.id);

/** Always passes priority, never attacks or blocks; discards from the front. */
export class AutomaticController implements PlayerController {
  readonly playerId: PlayerId;

  constructor(playerId: PlayerId) {
    this.playerId = playerId;
  }

  act(_view: ControllerView): Action {
    return passFor(this.playerId);
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
 * true), and delegates combat declarations to assignable callbacks. Useful for
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
