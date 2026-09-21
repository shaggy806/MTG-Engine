import { describe, expect, it } from "vitest";

import { DECISION_ACTIONS, DECISION_OFFERS } from "../../decisions/contract.js";
import type { DecisionKind } from "../../decisions/contract.js";
import { DECISIONS, decisionForAction, decisionForOffer } from "../../decisions/registry.js";
import { asObjectId } from "../../primitives.js";
import type { PlayerId } from "../../primitives.js";
import { decisionHasSource } from "../../state.js";
import type { AwaitingDecision } from "../../state.js";

const ALICE = "alice" as PlayerId;

/**
 * A minimal `AwaitingDecision` per migrated kind, so the module's declared
 * `hasSource` can be checked against `state.ts`'s `decisionHasSource` — the
 * copy the registry takes over in the closing step. Grows one entry per
 * migration; the "every registered kind has a fixture" test is what stops it
 * silently falling behind.
 */
const FIXTURES: Partial<Record<DecisionKind, AwaitingDecision>> = {
  "choose-copy": {
    kind: "choose-copy",
    player: ALICE,
    source: asObjectId("obj-1"),
    options: [asObjectId("obj-2")],
  },
  "pay-life-for-untapped": {
    kind: "pay-life-for-untapped",
    player: ALICE,
    source: asObjectId("obj-1"),
    life: 2,
  },
  scry: {
    kind: "scry",
    player: ALICE,
    cards: [asObjectId("obj-1")],
    mode: "scry",
    then: null,
    source: asObjectId("obj-2"),
    x: 0,
  },
};

describe("decision registry", () => {
  it("stores every module under its own kind", () => {
    // The one runtime check standing in for a correlation TypeScript cannot
    // express: `defineDecision`'s cast is sound only if this holds.
    for (const [key, module] of Object.entries(DECISIONS)) {
      expect(module, `${key} is registered but undefined`).toBeDefined();
      expect(module?.kind, `${key} is registered under the wrong key`).toBe(key);
    }
  });

  it("only registers kinds the tables know about", () => {
    for (const key of Object.keys(DECISIONS)) {
      expect(DECISION_ACTIONS, `${key} is not in DECISION_ACTIONS`).toHaveProperty(key);
      expect(DECISION_OFFERS, `${key} is not in DECISION_OFFERS`).toHaveProperty(key);
    }
  });

  it("routes every registered kind's actions and offers back to it", () => {
    for (const kind of Object.keys(DECISIONS) as DecisionKind[]) {
      for (const type of DECISION_ACTIONS[kind]) {
        const found = decisionForAction({ type, player: ALICE } as never);
        expect(found?.kind, `action ${type} routed to ${found?.kind}`).toBe(kind);
      }
      for (const offer of DECISION_OFFERS[kind]) {
        const found = decisionForOffer({ kind: offer } as never);
        expect(found?.kind, `offer ${offer} routed to ${found?.kind}`).toBe(kind);
      }
    }
  });

  it("routes a priority action to no module", () => {
    expect(decisionForAction({ type: "pass-priority", player: ALICE })).toBeUndefined();
    expect(decisionForOffer({ kind: "pass-priority" })).toBeUndefined();
  });

  it("agrees with state.ts about which decisions name a source", () => {
    // Temporary: `decisionHasSource` becomes a re-export from the registry in
    // the closing step, at which point the two cannot disagree and this goes.
    for (const kind of Object.keys(DECISIONS) as DecisionKind[]) {
      const fixture = FIXTURES[kind];
      expect(fixture, `no FIXTURES entry for the newly migrated "${kind}"`).toBeDefined();
      if (fixture === undefined) continue;
      expect(DECISIONS[kind]?.hasSource, `${kind} disagrees on hasSource`).toBe(
        decisionHasSource(fixture),
      );
    }
  });
});
