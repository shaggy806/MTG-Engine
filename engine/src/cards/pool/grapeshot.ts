import { defineCard } from "../define.js";

/**
 * ROADMAP Phase 8 — storm. The `this-cast` trigger fires the `storm` effect,
 * which copies this spell for each spell cast (by ANY player, rule 702.40a)
 * before it this turn — the count captured on the spell object at cast. Copies
 * keep the original's target; the "you may choose new targets" clause isn't
 * offered (declining it is always legal).
 */
export default defineCard({
  name: "Grapeshot",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Storm (When you cast this spell, copy it for each spell cast before it this turn.)\nGrapeshot deals 1 damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 1, target: 0 },
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [],
      effect: { kind: "storm" },
      resolve: null,
      text: "Storm — when you cast this spell, copy it for each spell cast before it this turn.",
    },
  ],
});
