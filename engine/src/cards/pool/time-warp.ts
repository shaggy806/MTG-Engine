import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 7 — the reference extra-turn card. `take-extra-turn` pushes the
 * targeted player onto `GameState.extraTurns`; `beginTurn` takes it from the
 * front instead of advancing the rotation.
 */
export default defineCard({
  name: "Time Warp",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Target player takes an extra turn after this one.",
  targets: ["player"],
  effect: { kind: "take-extra-turn", target: 0 },
});
