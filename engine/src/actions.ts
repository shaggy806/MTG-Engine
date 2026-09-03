/** Actions a player (or agent) submits to the engine via `Game.dispatch`. */

import type { ObjectId, PlayerId } from "./primitives.js";
import type { TargetRef } from "./target.js";

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
    };

export type ActionType = Action["type"];

export const actionPlayer = (action: Action): PlayerId => action.player;
