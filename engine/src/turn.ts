/**
 * The turn structure: phases, steps, their order, and which steps grant
 * priority. Follows the comprehensive rules section 500.
 */

export type Phase =
  | "beginning"
  | "precombat-main"
  | "combat"
  | "postcombat-main"
  | "ending";

export type Step =
  | "untap"
  | "upkeep"
  | "draw"
  | "precombat-main"
  | "begin-combat"
  | "declare-attackers"
  | "declare-blockers"
  | "combat-damage"
  | "end-combat"
  | "postcombat-main"
  | "end"
  | "cleanup";

/**
 * Every step of a turn in order. Main phases are represented as a single
 * step each; the combat-damage step is not yet split for first strike.
 */
export const TURN_SEQUENCE = [
  "untap",
  "upkeep",
  "draw",
  "precombat-main",
  "begin-combat",
  "declare-attackers",
  "declare-blockers",
  "combat-damage",
  "end-combat",
  "postcombat-main",
  "end",
  "cleanup",
] as const satisfies readonly Step[];

export const PHASE_OF_STEP = {
  untap: "beginning",
  upkeep: "beginning",
  draw: "beginning",
  "precombat-main": "precombat-main",
  "begin-combat": "combat",
  "declare-attackers": "combat",
  "declare-blockers": "combat",
  "combat-damage": "combat",
  "end-combat": "combat",
  "postcombat-main": "postcombat-main",
  end: "ending",
  cleanup: "ending",
} as const satisfies Record<Step, Phase>;

export function phaseOfStep(step: Step): Phase {
  return PHASE_OF_STEP[step];
}

/** The step after `step`, or `null` if `step` is the last one of the turn. */
export function nextStep(step: Step): Step | null {
  const index = TURN_SEQUENCE.indexOf(step);
  if (index < 0 || index >= TURN_SEQUENCE.length - 1) return null;
  return TURN_SEQUENCE[index + 1];
}

/**
 * Untap and cleanup are the two steps in which no player normally receives
 * priority (rules 502.3 and 514.3).
 */
export function stepUsesPriority(step: Step): boolean {
  return step !== "untap" && step !== "cleanup";
}

export function isMainPhase(step: Step): boolean {
  return step === "precombat-main" || step === "postcombat-main";
}
