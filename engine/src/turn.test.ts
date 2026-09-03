import { describe, expect, it } from "vitest";

import {
  PHASE_OF_STEP,
  TURN_SEQUENCE,
  nextStep,
  phaseOfStep,
  stepUsesPriority,
} from "./turn.js";

describe("turn structure", () => {
  it("runs 12 steps from untap to cleanup", () => {
    expect(TURN_SEQUENCE).toHaveLength(12);
    expect(TURN_SEQUENCE[0]).toBe("untap");
    expect(TURN_SEQUENCE[TURN_SEQUENCE.length - 1]).toBe("cleanup");
  });

  it("maps every step to a phase", () => {
    for (const step of TURN_SEQUENCE) {
      expect(PHASE_OF_STEP[step]).toBeTruthy();
    }
    expect(phaseOfStep("draw")).toBe("beginning");
    expect(phaseOfStep("declare-blockers")).toBe("combat");
    expect(phaseOfStep("end")).toBe("ending");
  });

  it("nextStep walks the sequence and stops after cleanup", () => {
    expect(nextStep("untap")).toBe("upkeep");
    expect(nextStep("draw")).toBe("precombat-main");
    expect(nextStep("end")).toBe("cleanup");
    expect(nextStep("cleanup")).toBeNull();
  });

  it("grants priority in every step except untap and cleanup", () => {
    expect(stepUsesPriority("untap")).toBe(false);
    expect(stepUsesPriority("cleanup")).toBe(false);
    for (const step of TURN_SEQUENCE) {
      if (step === "untap" || step === "cleanup") continue;
      expect(stepUsesPriority(step)).toBe(true);
    }
  });
});
