/** Reference types for spell / ability targets. Pure data, no logic. */

import type { ObjectId, PlayerId } from "./primitives.js";

export type TargetRef =
  | { readonly kind: "player"; readonly player: PlayerId }
  | { readonly kind: "object"; readonly object: ObjectId };

/** What a target slot is allowed to point at. */
export type TargetSpec =
  | "any-target"
  | "creature"
  /** A creature whose current (computed, layer 5) colours don't include black
   * — Doom Blade / Terror. */
  | "nonblack-creature"
  | "creature-you-control"
  | "creature-an-opponent-controls"
  | "player"
  /** A player other than the one choosing the target ("target opponent" —
   * Iridescent Vinelasher). */
  | "opponent"
  | "creature-or-player"
  | "permanent"
  | "nonland-permanent"
  | "land"
  | "artifact"
  | "artifact-or-enchantment"
  | "creature-or-enchantment"
  /** A spell on the stack (a card, not an ability). */
  | "spell"
  | "creature-spell"
  | "noncreature-spell"
  /** An instant or sorcery spell on the stack (Twincast). */
  | "instant-or-sorcery-spell"
  /** An instant or sorcery card in the targeting player's graveyard
   * (Snapcaster Mage — ROADMAP Phase 6b). */
  | "instant-or-sorcery-in-your-graveyard";

export const targetsPlayer = (ref: TargetRef, player: PlayerId): boolean =>
  ref.kind === "player" && ref.player === player;

export const targetsObject = (ref: TargetRef, object: ObjectId): boolean =>
  ref.kind === "object" && ref.object === object;
