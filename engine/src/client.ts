/**
 * The engine as a web page imports it (`engine/client`): every type, and the
 * values the client uses, with no import path to the card pool.
 *
 * A page fetches card definitions in shards as it needs them
 * (`cards/card-shards.ts`), and the main barrel can't promise to leave them
 * out: it exports `BUILTIN_CARDS` and `createDefaultRegistry`, which import
 * every card file. A production build drops those anyway, since the engine
 * declares `"sideEffects": false` and nothing uses them. Vite's dev server
 * doesn't tree-shake, though, and there the barrel fetched every card as its
 * own module on every page load, over five thousand requests.
 *
 * So this lists only modules that are clean all the way down, and
 * `test/client-entry.test.ts` fails if anything here comes to reach a card
 * definition. The types cost nothing either way: `export type` compiles to
 * nothing, so every type still comes from the whole engine.
 */

export type * from "./index.js";

export * from "./primitives.js";
export * from "./mana.js";
export * from "./target.js";
export * from "./target-count.js";
export * from "./turn.js";
export * from "./state.js";
export * from "./view.js";
export * from "./identity.js";
export * from "./deck-validation.js";
export * from "./sample-decks.js";
export * from "./cards/classify.js";
export * from "./cards/edhrec-rank.js";
export * from "./cards/card-shards.js";
export { CardRegistry } from "./cards/card-registry.js";
export { PINNED_ART, TOKEN_NAMES } from "./cards/generated-index.js";
export { blockingViolations } from "./combat/blocking.js";
export { damageAssignmentViolations, standardAssignment } from "./combat/damage.js";
