import { defineCard } from "../define.js";

export default defineCard({
  name: "Cinder Storm",
  manaCost: "{6}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Cinder Storm deals 7 damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 7, target: 0 },
});
