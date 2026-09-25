import { defineCard } from "../define.js";

export default defineCard({
  name: "Repulsor Rays",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Repulsor Rays deals 3 damage to target creature.",
  targets: ["creature"],
  effect: { kind: "damage", amount: 3, target: 0 },
});
