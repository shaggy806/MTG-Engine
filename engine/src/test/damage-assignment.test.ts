import { describe, expect, it } from "vitest";

import { damageAssignmentViolations, standardAssignment } from "../combat/damage.js";
import { asObjectId } from "../primitives.js";

// Rule 510.1c since Foundations: no damage assignment order, any division
// among the blockers; 702.19b: lethal on every blocker before any tramples
// over. `lethal` already folds in marked damage and deathtouch.
const offer = (power: number, lethal: readonly number[], trample: boolean) => ({
  power,
  lethal,
  trample,
  blockers: lethal.map((_, i) => asObjectId(`blocker-${i}`)),
});

describe("damageAssignmentViolations", () => {
  it("without trample, any split that adds up to the power is legal", () => {
    expect(damageAssignmentViolations(offer(6, [2, 2], false), [1, 5])).toBeNull();
    expect(damageAssignmentViolations(offer(6, [2, 2], false), [6, 0])).toBeNull();
    expect(damageAssignmentViolations(offer(6, [2, 2], false), [0, 6])).toBeNull();
  });

  it("without trample, the whole power must go on the blockers", () => {
    expect(damageAssignmentViolations(offer(6, [2, 2], false), [2, 2])).toMatch(
      /trampling attacker/,
    );
  });

  it("with trample, damage goes over only once every blocker has lethal", () => {
    expect(damageAssignmentViolations(offer(6, [2, 2], true), [2, 2])).toBeNull();
    expect(damageAssignmentViolations(offer(6, [2, 2], true), [1, 2])).toMatch(/lethal/);
    // Short of lethal is fine when nothing goes over.
    expect(damageAssignmentViolations(offer(6, [2, 2], true), [1, 5])).toBeNull();
  });

  it("deathtouch plus trample may put 1 on each blocker and the rest over", () => {
    expect(damageAssignmentViolations(offer(6, [1, 1], true), [1, 1])).toBeNull();
  });

  it("rejects the wrong number of amounts, fractions, negatives and too much", () => {
    expect(damageAssignmentViolations(offer(3, [2, 2], false), [3])).toMatch(/each of 2/);
    expect(damageAssignmentViolations(offer(3, [2, 2], false), [1.5, 1.5])).toMatch(/whole/);
    expect(damageAssignmentViolations(offer(3, [2, 2], false), [-1, 4])).toMatch(/whole/);
    expect(damageAssignmentViolations(offer(3, [2, 2], false), [2, 2])).toMatch(/more than/);
  });
});

describe("standardAssignment", () => {
  it("kills as many blockers as it can, the ones needing least first", () => {
    // Lethal down the declared order would have been [3, 1, 0]: one kill.
    expect(standardAssignment(offer(4, [3, 2, 2], false))).toEqual([0, 2, 2]);
  });

  it("breaks a tie in declaration order", () => {
    expect(standardAssignment(offer(3, [2, 2], false))).toEqual([2, 1]);
  });

  it("puts what can't kill on the cheapest blocker still alive", () => {
    expect(standardAssignment(offer(5, [3, 4, 2], false))).toEqual([3, 0, 2]);
    expect(standardAssignment(offer(1, [3, 2], false))).toEqual([0, 1]);
  });

  it("without trample, leaves the excess on the last blocker it killed", () => {
    expect(standardAssignment(offer(7, [2, 3], false))).toEqual([2, 5]);
  });

  it("with trample, sends the excess over once every blocker has lethal", () => {
    expect(standardAssignment(offer(7, [2, 3], true))).toEqual([2, 3]);
    expect(standardAssignment(offer(6, [1, 1], true))).toEqual([1, 1]);
  });

  it("with trample but not enough for every blocker, nothing goes over", () => {
    expect(standardAssignment(offer(4, [2, 3], true))).toEqual([2, 2]);
  });

  // Lethal damage kills nothing indestructible (Darksteel Myr, 0/1).
  const withMyr = (power: number, trample: boolean) => ({
    ...offer(power, [1, 2], trample),
    indestructible: [true, false],
  });

  it("spends damage on an indestructible blocker last", () => {
    // Cheapest first alone would put 1 on each and kill nothing.
    expect(standardAssignment(withMyr(2, false))).toEqual([0, 2]);
  });

  it("still gives an indestructible blocker lethal when that lets damage trample over", () => {
    expect(standardAssignment(withMyr(4, true))).toEqual([1, 2]);
    expect(standardAssignment(withMyr(2, true))).toEqual([0, 2]);
  });

  it("is always a legal answer", () => {
    const cases = [
      offer(4, [3, 2, 2], false),
      offer(5, [3, 4, 2], true),
      offer(9, [0, 3], true),
      offer(2, [0, 3], false),
      offer(3, [5], true),
      offer(6, [2], false),
      withMyr(2, false),
      withMyr(5, false),
      withMyr(4, true),
    ];
    for (const each of cases) {
      expect(damageAssignmentViolations(each, standardAssignment(each))).toBeNull();
    }
  });
});
