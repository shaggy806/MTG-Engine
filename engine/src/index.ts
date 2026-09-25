/**
 * MTG-Engine — Magic: The Gathering rules engine.
 *
 * Public API surface. See `game.ts` for the entry point ({@link Game}).
 */

export * from "./primitives.js";
export * from "./mana.js";
export * from "./target.js";
export * from "./target-count.js";
export * from "./effects.js";
export * from "./abilities.js";
export * from "./cards.js";
export * from "./identity.js";
export * from "./deck-validation.js";
export * from "./sample-decks.js";
export * from "./card-replacer.js";
export * from "./characteristics.js";
export * from "./turn.js";
export * from "./events.js";
export * from "./state.js";
export * from "./targeting.js";
export * from "./actions.js";
export * from "./controller.js";
export * from "./view.js";
export * from "./game.js";
/**
 * The decision registry's public surface. `decisionHasSource` was already
 * public (via `export * from "./state.js"`) before it moved here, so this
 * keeps the seam unchanged; `autoAnswerFor` is new, for a driver skipping a
 * seat's own windows.
 */
export { autoAnswerFor, decisionHasSource, mayActOn } from "./decisions/registry.js";
export type { DecisionKind } from "./decisions/contract.js";

/**
 * Combat reads, exported deliberately rather than by `export *`: these four
 * are the engine's answer to questions the client had been re-deriving by
 * hand from a `LegalAction`, and getting wrong. Everything else under
 * `combat/` stays internal.
 */
export { defendersForAttacker } from "./combat/eligibility.js";
export { blockingViolations } from "./combat/blocking.js";
export type { BlockOffer, BlockingViolation } from "./combat/blocking.js";
export { damageAssignmentViolations, standardAssignment } from "./combat/damage.js";
export type { DamageAssignmentOffer } from "./combat/damage.js";
export * from "./auto-settle.js";
export * from "./bot/index.js";
