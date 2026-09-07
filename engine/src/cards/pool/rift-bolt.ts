import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 6b — suspend. Cast from hand for `{2}{R}`, or suspend it for
 * `{R}` (exile with one time counter); the counter comes off at your next
 * upkeep and the engine casts it for free. Its controller chooses the target
 * — auto-picked for now (the `chooseTargets` gap).
 */
export default defineCard({
  name: "Rift Bolt",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Rift Bolt deals 3 damage to any target.\nSuspend 1—{R}",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 3, target: 0 },
  suspend: { n: 1, cost: "{R}" },
});
