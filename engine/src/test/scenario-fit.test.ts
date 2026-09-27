import { describe, expect, it } from "vitest";

import type { Action } from "../actions.js";
import { DEFAULT_WEIGHTS } from "../bot/evaluate.js";
import type { EvalOutcome } from "../bot/evaluate.js";
import { FEATURE_KEYS } from "../bot/features.js";
import type { PlayerFeatures } from "../bot/features.js";
import {
  fitWeights,
  handTune,
  leversFor,
  recordScenario,
  replayChoice,
  replayRight,
  scenarioMargin,
} from "../bot/scenario-fit.js";
import type { ScenarioRecord } from "../bot/scenario-fit.js";
import { BOT_SCENARIOS, TRAINING_SCENARIOS } from "../bot/scenarios.js";
import { createDefaultRegistry } from "../cards.js";
import { asPlayerId } from "../primitives.js";

const registry = createDefaultRegistry();

// Everything `bot:fit-scenarios` says rests on one claim: replaying a recorded
// scenario under a weight vector picks what the bot itself would pick. Under
// the vector it was recorded with, that has to be exactly what it did pick.
describe("recorded scenarios", () => {
  const records = [...BOT_SCENARIOS, ...TRAINING_SCENARIOS]
    .map((scenario) => recordScenario(scenario, registry, DEFAULT_WEIGHTS))
    .filter((r): r is ScenarioRecord => r !== null && "answers" in r);

  it("cover every scenario that is a position", () => {
    const positions = [...BOT_SCENARIOS, ...TRAINING_SCENARIOS].filter((s) => s.position);
    expect(records).toHaveLength(positions.length);
    expect(records.filter((r) => r.answers.length > 0).length).toBeGreaterThan(20);
  });

  for (const record of records) {
    it(`replay picks what the bot picked: ${record.name}`, () => {
      if (record.answers.length > 0) {
        expect(record.answers[replayChoice(record, DEFAULT_WEIGHTS)].action).toEqual(record.chosen);
      }
      expect(replayRight(record, DEFAULT_WEIGHTS)).toBe(record.chosenRight);
    });
  }
});

describe("tuning against synthetic records", () => {
  // A fixed base, so these say what the tuner does whatever the shipped
  // weights are: `handManaValue` is zero here, as it was before step 8.
  const BASE = { ...DEFAULT_WEIGHTS, handManaValue: 0 };
  const zero = Object.fromEntries(FEATURE_KEYS.map((k) => [k, 0])) as PlayerFeatures;
  const pass: Action = { type: "pass-priority", player: asPlayerId("alice") };
  const answer = (features: Partial<PlayerFeatures>, right: boolean) => ({
    action: pass,
    outcome: { mine: { ...zero, ...features }, theirs: [] } satisfies EvalOutcome,
    right,
  });
  const record = (
    name: string,
    kind: "gate" | "training",
    answers: ReturnType<typeof answer>[],
  ): ScenarioRecord => ({ name, kind, answers, chosen: pass, chosenRight: false, exact: true });

  // Right only if a card's mana value in hand counts for something; the tie
  // at `handManaValue: 0` goes to the wrong answer, listed first.
  const discard = record("discard", "training", [
    answer({}, false),
    answer({ handManaValue: 6 }, true),
  ]);
  // Right until `handManaValue` passes 2/30 — the gate the discard's lever
  // mustn't break.
  const sol = record("sol ring", "gate", [
    answer({ otherPermanents: 1 }, true),
    answer({ handManaValue: 30 }, false),
  ]);

  it("finds the nearest single weight that fixes a scenario, and what it breaks", () => {
    expect(replayRight(discard, BASE)).toBe(false);
    const levers = leversFor(discard, [discard, sol], BASE, ["handManaValue"]);
    expect(levers).toHaveLength(1);
    expect(levers[0]).toMatchObject({ key: "handManaValue", value: 0.05, breaks: [] });
    expect(scenarioMargin(discard, { ...BASE, handManaValue: 0.05 })).toBeCloseTo(0.3);
  });

  it("tunes by hand without breaking the gate", () => {
    const tuned = handTune([discard, sol], BASE, ["handManaValue"]);
    expect(tuned.pulled).toEqual([
      { scenario: "discard", key: "handManaValue", from: 0, value: 0.05 },
    ]);
    expect(tuned.unfixed).toEqual([]);
    expect(replayRight(sol, tuned.weights)).toBe(true);
  });

  it("won't take a weight below its floor", () => {
    // Fixable only by pricing a permanent below a card in hand — the trade
    // that stopped the bot casting mana rocks.
    const rock = record("rock", "training", [
      answer({ otherPermanents: 1.5 }, false),
      answer({ hand: 1 }, true),
    ]);
    expect(replayRight(rock, BASE)).toBe(false);
    expect(leversFor(rock, [rock], BASE, ["otherPermanents"])).toEqual([]);
    const fitted = fitWeights([rock], { base: BASE, free: ["otherPermanents"] });
    expect(fitted.weights.otherPermanents).toBeGreaterThanOrEqual(BASE.hand);
  });

  it("fits jointly when asked, keeping the gate right", () => {
    const fitted = fitWeights([discard, sol], {
      base: BASE,
      free: ["handManaValue"],
      lambda: 0.01,
    });
    expect(replayRight(discard, fitted.weights)).toBe(true);
    expect(replayRight(sol, fitted.weights)).toBe(true);
  });
});
