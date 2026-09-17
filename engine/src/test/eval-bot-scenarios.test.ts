import { describe, expect, it } from "vitest";

import { BOT_SCENARIOS, runScenarios } from "../bot/scenarios.js";
import { CHAMPIONS } from "../bot/champions/index.js";
import { DEFAULT_WEIGHTS, normalizeWeights } from "../bot/evaluate.js";
import type { EvalWeights } from "../bot/evaluate.js";
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

describe("the land-drop invariant", () => {
  // A land in hand must never be worth more than a land on the battlefield.
  // Three of the four checked-in champions had `extraLands` *exactly* equal to
  // `hand`, which scores a land drop past the cap at zero — and since the
  // priority search scores passing first and skips ties, an exactly-even land
  // drop is declined. They only played lands at all because a basic land
  // happens to add `untappedMana` too, which is luck rather than design.
  it("raises both land terms above `hand`, whatever vector it is given", () => {
    const broken: EvalWeights = { ...DEFAULT_WEIGHTS, hand: 4, lands: 1, extraLands: 0 };
    const fixed = normalizeWeights(broken);
    expect(fixed.lands).toBeGreaterThan(fixed.hand);
    expect(fixed.extraLands).toBeGreaterThan(fixed.hand);
  });

  it("leaves a vector that already satisfies it untouched", () => {
    expect(normalizeWeights(DEFAULT_WEIGHTS)).toBe(DEFAULT_WEIGHTS);
  });

  it("holds for every champion, since the controller normalizes on construction", () => {
    for (const champion of CHAMPIONS) {
      const w = normalizeWeights(champion.weights);
      expect(w.lands, `${champion.id}.lands`).toBeGreaterThan(w.hand);
      expect(w.extraLands, `${champion.id}.extraLands`).toBeGreaterThan(w.hand);
    }
  });

  it("plays a land rather than passing even under a vector that scores it at zero", () => {
    // The end-to-end version: a vector where a land drop is worth exactly
    // nothing must still make the drop, because the search no longer weighs a
    // land against passing at all.
    const flat: EvalWeights = { ...DEFAULT_WEIGHTS, hand: 2, lands: 2, extraLands: 2 };
    const [report] = runScenarios(flat, registry).filter((r) => r.name.startsWith("plays a land"));
    expect(report.passed, report.detail).toBe(true);
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
