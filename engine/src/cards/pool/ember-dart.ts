import { defineCard } from "../define.js";

/** ROADMAP Phase 10 — the adventure half of Emberclaw Scout (rule 715). */
export default defineCard({
  name: "Ember Dart",
  manaCost: "{R}",
  colors: ["R"],
  types: ["instant"],
  subtypes: ["Adventure"],
  text: "Ember Dart deals 2 damage to target creature. (Then exile this card. You may cast the creature later from exile.)",
  targets: ["creature"],
  effect: { kind: "damage", amount: 2, target: 0 },
  faces: ["Emberclaw Scout", "Ember Dart"],
  adventure: true,
});
