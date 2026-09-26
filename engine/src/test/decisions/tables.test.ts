import { describe, expect, it } from "vitest";

import { DECISION_ACTIONS, DECISION_OFFERS } from "../../decisions/contract.js";
import type { DecisionKind } from "../../decisions/contract.js";

/**
 * These tables are the engine's totality guarantee over `AwaitingDecision`.
 *
 * The compiler already enforces most of it: `satisfies Record<DecisionKind, …>`
 * fails the build if a kind is missing or a value isn't a real `Action`
 * type / `LegalAction` kind. What it cannot check is the *routing* — that no
 * two kinds claim the same action, so an incoming action resolves to exactly
 * one module. That is what this file is for.
 */
describe("decision tables", () => {
  const KIND_COUNT = 19;

  it("covers every decision kind, and only those", () => {
    expect(Object.keys(DECISION_ACTIONS)).toHaveLength(KIND_COUNT);
    expect(Object.keys(DECISION_OFFERS).sort()).toEqual(
      Object.keys(DECISION_ACTIONS).sort(),
    );
  });

  it("names at least one action and one offer per kind", () => {
    for (const [kind, actions] of Object.entries(DECISION_ACTIONS)) {
      expect(actions.length, `${kind} answers no action`).toBeGreaterThan(0);
    }
    for (const [kind, offers] of Object.entries(DECISION_OFFERS)) {
      expect(offers.length, `${kind} offers nothing`).toBeGreaterThan(0);
    }
  });

  it("routes each action type to exactly one kind", () => {
    const owner = new Map<string, DecisionKind>();
    for (const [kind, actions] of Object.entries(DECISION_ACTIONS)) {
      for (const action of actions) {
        expect(
          owner.get(action),
          `${action} is claimed by both ${owner.get(action)} and ${kind}`,
        ).toBeUndefined();
        owner.set(action, kind as DecisionKind);
      }
    }
    // One more action than kinds: `mulligan` is the one kind with two, because a
    // single AwaitingDecision carries both halves of the mulligan phase and
    // switches on the player's own `hand.step`.
    expect(owner.size).toBe(KIND_COUNT + 1);
    expect(DECISION_ACTIONS.mulligan).toEqual(["mulligan", "put-on-bottom"]);
  });

  it("offers what it answers", () => {
    // Not a rule — an offer and an action are different unions — but today
    // every kind's offer kinds and action types coincide, and a divergence
    // should be a deliberate edit rather than a slip.
    for (const kind of Object.keys(DECISION_ACTIONS) as DecisionKind[]) {
      expect([...DECISION_OFFERS[kind]].sort(), `${kind} offers/answers differ`).toEqual(
        [...DECISION_ACTIONS[kind]].sort(),
      );
    }
  });
});
