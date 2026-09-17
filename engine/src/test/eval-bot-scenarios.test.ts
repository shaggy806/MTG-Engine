import { describe, expect, it } from "vitest";

import { BOT_SCENARIOS, runScenarios } from "../bot/scenarios.js";
import { CHAMPIONS } from "../bot/champions/index.js";
import { DEFAULT_WEIGHTS } from "../bot/evaluate.js";
import { FEATURE_KEYS } from "../bot/features.js";
import { createDefaultRegistry } from "../cards.js";

const registry = createDefaultRegistry();

// The positions in `bot/scenarios.ts` are the one measurement of the bot that
// doesn't depend on an opponent, which is what makes them the gate on a
// *fitted* weight vector: a regression can find a coefficient that predicts
// winning without causing it, and no win rate will ever say so.
describe("bot scenarios", () => {
  const reports = runScenarios(DEFAULT_WEIGHTS, registry);

  for (const report of reports) {
    it(`${report.name}: ${report.rule}`, () => {
      expect(report.passed, report.detail).toBe(true);
    });
  }

  it("covers every scenario in the suite", () => {
    expect(reports).toHaveLength(BOT_SCENARIOS.length);
  });
});

describe("champions", () => {
  // A gauntlet member whose weights drift when the current defaults change
  // isn't a fixed point to measure against — every bench number ever recorded
  // against it would silently become a lie. The vectors are written out in
  // full for that reason, and this is the check that they stay complete.
  it("each carry every weight, spelled out rather than spread from the defaults", () => {
    for (const champion of CHAMPIONS) {
      for (const key of Object.keys(DEFAULT_WEIGHTS)) {
        expect(champion.weights[key as keyof typeof DEFAULT_WEIGHTS], `${champion.id}.${key}`).toBeTypeOf(
          "number",
        );
      }
      expect(Object.keys(champion.weights).sort()).toEqual(Object.keys(DEFAULT_WEIGHTS).sort());
    }
  });

  it("have distinct ids and a date", () => {
    const ids = CHAMPIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const champion of CHAMPIONS) {
      expect(champion.date, champion.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(champion.note.length, champion.id).toBeGreaterThan(0);
    }
  });

  it("are actually different from one another", () => {
    // The gauntlet's whole job is that no single opponent's weaknesses
    // dominate. Two members with the same vector are one member.
    const seen = new Set(CHAMPIONS.map((c) => JSON.stringify(c.weights)));
    expect(seen.size).toBe(CHAMPIONS.length);
  });
});

describe("features", () => {
  it("name every linear term in EvalWeights, and only those", () => {
    // `landCap` is a threshold inside a feature, `opponent`/`otherOpponents`
    // are how a table is aggregated, and the two crackback knobs belong to the
    // attack builder — none is a coefficient, so none is fittable.
    const notFeatures = ["landCap", "opponent", "otherOpponents", "crackbackParanoia", "crackbackMargin"];
    expect([...FEATURE_KEYS].sort()).toEqual(
      Object.keys(DEFAULT_WEIGHTS)
        .filter((k) => !notFeatures.includes(k))
        .sort(),
    );
  });
});
