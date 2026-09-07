import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 7 — the reference extra-turn card. `take-extra-turn` pushes the
 * caster onto `GameState.extraTurns`; `beginTurn` takes it from the front
 * instead of advancing the rotation. This "lite" version goes to the graveyard
 * rather than exiling itself.
 */
export default defineCard({
  name: "Time Warp",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Take an extra turn after this one.",
  effect: { kind: "take-extra-turn" },
});
