/**
 * Actions a player (or agent) submits to the engine via `Game.dispatch`.
 *
 * Every decision the rules ask a player for is one of these — including combat
 * declarations and the cleanup discard — so a UI, a bot, and a replay all drive
 * the engine through the same entry point.
 */

import type { ObjectId, PlayerId } from "./primitives.js";
import type { TargetRef, TargetSpec } from "./target.js";

export interface AttackerDeclaration {
  readonly attacker: ObjectId;
  readonly defender: PlayerId;
}

export interface BlockerDeclaration {
  readonly blocker: ObjectId;
  readonly attacker: ObjectId;
}

export type Action =
  | { readonly type: "pass-priority"; readonly player: PlayerId }
  | { readonly type: "play-land"; readonly player: PlayerId; readonly card: ObjectId }
  | {
      readonly type: "cast-spell";
      readonly player: PlayerId;
      readonly card: ObjectId;
      readonly targets?: readonly TargetRef[];
    }
  | {
      readonly type: "activate-ability";
      readonly player: PlayerId;
      readonly source: ObjectId;
      readonly abilityIndex: number;
      readonly targets?: readonly TargetRef[];
    }
  | {
      readonly type: "declare-attackers";
      readonly player: PlayerId;
      readonly attackers: readonly AttackerDeclaration[];
    }
  | {
      readonly type: "declare-blockers";
      readonly player: PlayerId;
      readonly blocks: readonly BlockerDeclaration[];
    }
  | {
      readonly type: "order-blockers";
      readonly player: PlayerId;
      readonly attacker: ObjectId;
      /** The blockers of `attacker`, in damage-assignment order. */
      readonly order: readonly ObjectId[];
    }
  | {
      readonly type: "discard";
      readonly player: PlayerId;
      readonly cards: readonly ObjectId[];
    };

export type ActionType = Action["type"];

export const actionPlayer = (action: Action): PlayerId => action.player;

/**
 * A thing the player may legally do right now. `targetOptions[i]` lists every
 * legal target for target slot `i`, so a UI can highlight without guessing.
 */
export type LegalAction =
  | { readonly kind: "pass-priority" }
  | {
      readonly kind: "play-land";
      readonly card: ObjectId;
      readonly cardName: string;
    }
  | {
      readonly kind: "cast-spell";
      readonly card: ObjectId;
      readonly cardName: string;
      readonly targetSpecs: readonly TargetSpec[];
      readonly targetOptions: readonly (readonly TargetRef[])[];
    }
  | {
      readonly kind: "activate-ability";
      readonly source: ObjectId;
      readonly abilityIndex: number;
      readonly cardName: string;
      readonly text: string;
      readonly targetSpecs: readonly TargetSpec[];
      readonly targetOptions: readonly (readonly TargetRef[])[];
    }
  | {
      readonly kind: "declare-attackers";
      readonly eligible: readonly ObjectId[];
      readonly defender: PlayerId;
    }
  | {
      readonly kind: "declare-blockers";
      readonly eligible: readonly {
        readonly blocker: ObjectId;
        readonly canBlock: readonly ObjectId[];
      }[];
      /** Attackers with menace: block them with 0 or 2+ creatures, never 1. */
      readonly menaceAttackers: readonly ObjectId[];
    }
  | {
      readonly kind: "order-blockers";
      readonly attacker: ObjectId;
      /** The blockers to order; the current order is the default. */
      readonly blockers: readonly ObjectId[];
    }
  | {
      readonly kind: "discard";
      readonly count: number;
      readonly from: readonly ObjectId[];
    };
