/**
 * The game state tree and pure selectors over it.
 *
 * `GameState` is a plain, structurally-cloneable object: no class instances,
 * functions, `Map`s, or `Set`s. The {@link Game} class owns the single mutable
 * instance and is the only thing that writes to it; everything else reads.
 */

import type { ManaPool } from "./mana.js";
import { emptyPool } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameEvent } from "./events.js";
import type { Phase, Step } from "./turn.js";
import { phaseOfStep } from "./turn.js";

export type PrivateZone = "library" | "hand" | "graveyard";
export type SharedZone = "battlefield" | "stack" | "exile" | "command";
export type ZoneType = PrivateZone | SharedZone;

/** An instance of a card (or token) somewhere in the game. */
export interface GameObject {
  readonly id: ObjectId;
  /** Key into the {@link CardRegistry} for printed characteristics. */
  readonly cardName: string;
  readonly owner: PlayerId;
  controller: PlayerId;
  zone: ZoneType;
  tapped: boolean;
  damageMarked: number;
  /** Turn number this object last entered the battlefield; `null` otherwise. */
  enteredBattlefieldOnTurn: number | null;
}

export interface PlayerState {
  readonly id: PlayerId;
  life: number;
  manaPool: ManaPool;
  maxHandSize: number;
  landsPlayedThisTurn: number;
  hasLost: boolean;
  lossReason: string | null;
  /**
   * Set when the player tried to draw from an empty library. Checked and
   * cleared by state-based actions (rule 704.5c).
   */
  attemptedDrawFromEmptyLibrary: boolean;
}

export interface GameRules {
  startingLife: number;
  openingHandSize: number;
  maxHandSize: number;
  /** In a two-player game the player who goes first skips their first draw. */
  skipFirstDraw: boolean;
}

export const DEFAULT_RULES: GameRules = {
  startingLife: 20,
  openingHandSize: 7,
  maxHandSize: 7,
  skipFirstDraw: true,
};

export interface TurnState {
  number: number;
  activePlayerIndex: number;
  step: Step;
}

export interface PriorityState {
  active: boolean;
  holder: PlayerId | null;
  /** Players who have passed since priority was last granted, in order. */
  passed: PlayerId[];
}

export interface GameResult {
  over: boolean;
  winner: PlayerId | null;
  reason: string | null;
}

export interface GameState {
  seed: number;
  /** Current PRNG position; rebuild the stream with `createRng(rngState)`. */
  rngState: number;
  rules: GameRules;
  /** Seating order, also the order priority passes. */
  turnOrder: PlayerId[];
  startingPlayer: PlayerId;
  players: Record<PlayerId, PlayerState>;
  objects: Record<ObjectId, GameObject>;
  zones: {
    perPlayer: Record<PlayerId, Record<PrivateZone, ObjectId[]>>;
    shared: Record<SharedZone, ObjectId[]>;
  };
  turn: TurnState;
  priority: PriorityState;
  result: GameResult;
  eventLog: GameEvent[];
  eventSeq: number;
  nextObjectSeq: number;
}

export function createPlayerState(id: PlayerId, rules: GameRules): PlayerState {
  return {
    id,
    life: rules.startingLife,
    manaPool: emptyPool(),
    maxHandSize: rules.maxHandSize,
    landsPlayedThisTurn: 0,
    hasLost: false,
    lossReason: null,
    attemptedDrawFromEmptyLibrary: false,
  };
}

// --- selectors -------------------------------------------------------------

export const activePlayerOf = (state: GameState): PlayerId =>
  state.turnOrder[state.turn.activePlayerIndex];

export const currentPhaseOf = (state: GameState): Phase =>
  phaseOfStep(state.turn.step);

export const privateZone = (
  state: GameState,
  player: PlayerId,
  zone: PrivateZone,
): readonly ObjectId[] => state.zones.perPlayer[player][zone];

export const battlefieldOf = (state: GameState): readonly ObjectId[] =>
  state.zones.shared.battlefield;

export const resolveObjects = (
  state: GameState,
  ids: readonly ObjectId[],
): GameObject[] => ids.map((id) => state.objects[id]);
