/**
 * The gauntlet: frozen opponents the tuner scores a candidate against.
 *
 * A tuner optimizes exactly what it is scored on. Scored only against the v1
 * `HeuristicBotController` it will find whatever v1 is bad at — v1 attacks
 * with everything and never holds a blocker back, so a vector that punishes
 * that alone would look superb and could be worse against anything else,
 * itself included. Fitness therefore runs against a *pool*: v1, every weight
 * vector that has ever been accepted or shipped, and a few deliberately
 * different playing styles, so no single opponent's weaknesses dominate.
 *
 * ## These vectors are frozen, and that's why they're spelled out in full
 *
 * Each champion writes out the whole `EvalWeights` literally rather than
 * spreading `DEFAULT_WEIGHTS` and overriding a few keys. A gauntlet member
 * whose weights drift when the current defaults change isn't a fixed point to
 * measure against: a later tuning run would be compared with an opponent that
 * silently moved, and every earlier bench number recorded against it would
 * become a lie. Adding a weight to `EvalWeights` is meant to break compilation
 * here — the value each existing champion should carry for a term it predates
 * is a judgement call (usually 0, "the term didn't exist"), not something to
 * infer from whatever the new default happens to be.
 *
 * See `docs/plans/smarter-bots.md`, "Not just beating v1".
 */

import type { EvalWeights } from "../evaluate.js";

export interface Champion {
  /** Stable id, used by `bot:tune --gauntlet` and in the JSON log. */
  readonly id: string;
  /** When this vector was frozen (ISO date). */
  readonly date: string;
  /** What it is, and how it benched when frozen. */
  readonly note: string;
  readonly weights: EvalWeights;
}

import { SHIPPED_2026_09_23 } from "./shipped-2026-09-23.js";
import { BASELINE_2026_09_17 } from "./baseline-2026-09-17.js";
import { AGGRESSIVE } from "./aggressive.js";
import { DEFENSIVE } from "./defensive.js";
import { RAMP } from "./ramp.js";

/**
 * Newest first. Tuned champions are appended as they're accepted; the three
 * hand-set styles stay at the end and are never replaced — their job is to be
 * *different*, not to be good.
 */
export const CHAMPIONS: readonly Champion[] = [
  SHIPPED_2026_09_23,
  BASELINE_2026_09_17,
  AGGRESSIVE,
  DEFENSIVE,
  RAMP,
];

export function championById(id: string): Champion {
  const found = CHAMPIONS.find((c) => c.id === id);
  if (found === undefined) {
    throw new Error(`unknown champion "${id}" (have: ${CHAMPIONS.map((c) => c.id).join(", ")})`);
  }
  return found;
}

export { SHIPPED_2026_09_23, BASELINE_2026_09_17, AGGRESSIVE, DEFENSIVE, RAMP };
