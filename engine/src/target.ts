/** Reference types for spell / ability targets. Pure data, no logic. */

import type { ObjectId, PlayerId } from "./primitives.js";

export type TargetRef =
  | { readonly kind: "player"; readonly player: PlayerId }
  | { readonly kind: "object"; readonly object: ObjectId };

/** What a target slot is allowed to point at. */
export type TargetSpec =
  | "any-target"
  | "creature"
  | "player"
  | "creature-or-player"
  | "permanent";

export const targetsPlayer = (ref: TargetRef, player: PlayerId): boolean =>
  ref.kind === "player" && ref.player === player;

export const targetsObject = (ref: TargetRef, object: ObjectId): boolean =>
  ref.kind === "object" && ref.object === object;
