import { defineCard } from "../define.js";

export default defineCard({
  name: "Burning Fields",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Burning Fields deals 5 damage to target opponent or planeswalker.",
  targets: ["opponent-or-planeswalker"],
  effect: { kind: "damage", amount: 5, target: 0 },
});
