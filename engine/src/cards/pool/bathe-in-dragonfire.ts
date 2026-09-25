import { defineCard } from "../define.js";

export default defineCard({
  name: "Bathe in Dragonfire",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Bathe in Dragonfire deals 4 damage to target creature.",
  targets: ["creature"],
  effect: { kind: "damage", amount: 4, target: 0 },
});
