/**
 * `defineDecision`, in a module of its own — mirroring `cards/define.ts`,
 * and for the same reason a card definition doesn't import the registry.
 *
 * It cannot live in `registry.ts`: the registry imports every module in order
 * to collect them, so a module importing its definer back would be a
 * **value** cycle. Each module calls `defineDecision(...)` at its top level,
 * so the binding has to be initialised before the registry starts loading —
 * exactly the case ESM's cycle handling does not save you from. The symptom
 * would be `TypeError: defineDecision is not a function` at module init, not
 * a build failure.
 *
 * Dependency direction, one way throughout:
 *   contract.ts -> define.ts -> <one module per kind> -> registry.ts
 */

import type { AnyDecisionModule, DecisionKind, DecisionModule } from "./contract.js";

/**
 * Pin a module's `kind` as a literal while storing it type-erased.
 *
 * The cast is the one unsafe line in the whole registry, and it is
 * unavoidable: TypeScript cannot correlate a union-keyed lookup with the
 * matching union member, so `DECISIONS[k]` cannot be known to be
 * `DecisionModule<typeof k>`. It is sound because `kind: K` is pinned as a
 * literal at every definition site and `registry.test.ts` asserts
 * `DECISIONS[k].kind === k` for every entry — that assertion is the only
 * thing standing between a mistyped key and a runtime mismatch.
 */
export function defineDecision<K extends DecisionKind>(
  module: DecisionModule<K>,
): AnyDecisionModule {
  return module as unknown as AnyDecisionModule;
}
