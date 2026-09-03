/**
 * The event log. Every observable change to game state emits an event; the
 * ordered log is the engine's audit trail and the basis for future replay and
 * networking.
 */

import type { ObjectId, PlayerId } from "./primitives.js";
import type { Phase, Step } from "./turn.js";

interface Base {
  /** Monotonic sequence number, assigned when the event is appended. */
  readonly seq: number;
}

export type GameEvent =
  | (Base & {
      readonly type: "game-started";
      readonly players: readonly PlayerId[];
      readonly startingPlayer: PlayerId;
      readonly seed: number;
    })
  | (Base & {
      readonly type: "turn-began";
      readonly turn: number;
      readonly activePlayer: PlayerId;
    })
  | (Base & {
      readonly type: "step-began";
      readonly step: Step;
      readonly phase: Phase;
    })
  | (Base & { readonly type: "priority-received"; readonly player: PlayerId })
  | (Base & { readonly type: "priority-passed"; readonly player: PlayerId })
  | (Base & { readonly type: "permanent-untapped"; readonly object: ObjectId })
  | (Base & {
      readonly type: "card-drawn";
      readonly player: PlayerId;
      readonly object: ObjectId;
    })
  | (Base & {
      readonly type: "draw-from-empty-library";
      readonly player: PlayerId;
    })
  | (Base & {
      readonly type: "cards-discarded";
      readonly player: PlayerId;
      readonly objects: readonly ObjectId[];
    })
  | (Base & {
      readonly type: "damage-cleared";
      readonly objects: readonly ObjectId[];
    })
  | (Base & {
      readonly type: "player-lost";
      readonly player: PlayerId;
      readonly reason: string;
    })
  | (Base & {
      readonly type: "game-ended";
      readonly winner: PlayerId | null;
      readonly reason: string;
    });

export type GameEventType = GameEvent["type"];

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/** A {@link GameEvent} without its `seq`, as passed to the emitter. */
export type GameEventInput = DistributiveOmit<GameEvent, "seq">;

/** The event variant for a given `type` discriminant. */
export type EventOfType<K extends GameEventType> = Extract<
  GameEvent,
  { type: K }
>;
