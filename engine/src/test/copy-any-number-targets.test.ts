/**
 * A copy of a spell with "any number of target …" keeps its number of
 * targets (rule 707.10c): asked for new ones, it's one slot per target it
 * has — each one creature, another than the ones before it (601.2c) — never
 * a fresh "any number" group. Offered as a group, the random player answered
 * six targets for a copy with two (fuzzer seed 24, 2026-10-09).
 */
import { describe, expect, it } from "vitest";

import type { TargetSpec } from "../target.js";
import { cast, lands, ref, settle, spawn, table, toHand, watchTargets } from "./harness.js";

describe("copying Solidarity of Heroes", () => {
  it("asks for exactly as many single targets as the copy has", () => {
    const { game, a } = table();
    lands(game, "Forest", 5);
    lands(game, "Island", 2);
    const [b1, b2] = [spawn(game, "Grizzly Bears"), spawn(game, "Grizzly Bears")];
    spawn(game, "Grizzly Bears");
    const solidarity = toHand(game, "Solidarity of Heroes");
    cast(game, solidarity, { targets: [ref(b1), ref(b2)], settle: false });
    let asked: readonly TargetSpec[] = [];
    const seen = watchTargets(a, (offered, specs) => {
      asked = specs;
      return offered.map((slot) => slot[0]);
    });
    cast(game, toHand(game, "Twincast"), { targets: [ref(solidarity)], settle: false });
    settle(game);
    expect(seen.asked).toBe(1);
    expect(asked).toHaveLength(2);
    expect(asked.some((s) => typeof s === "object" && s.kind === "any-number")).toBe(false);
    // Each slot offers the creatures, its current target first.
    expect(seen.offered.map((slot) => slot.length)).toEqual([3, 3]);
  });
});
