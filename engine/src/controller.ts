/**
 * A `PlayerController` supplies the decisions the rules require of a player.
 * Milestone 1 only ever needs one: which cards to discard in the cleanup step.
 * Priority is passed automatically because nothing is castable yet.
 */

import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameObject } from "./state.js";

export interface PlayerController {
  readonly playerId: PlayerId;
  /** Choose exactly `count` cards from `hand` to discard. */
  chooseDiscards(
    hand: readonly GameObject[],
    count: number,
  ): readonly ObjectId[];
}

/** Deterministic controller: discards from the front of the hand. */
export class AutomaticController implements PlayerController {
  readonly playerId: PlayerId;

  constructor(playerId: PlayerId) {
    this.playerId = playerId;
  }

  chooseDiscards(
    hand: readonly GameObject[],
    count: number,
  ): readonly ObjectId[] {
    return hand.slice(0, count).map((object) => object.id);
  }
}
