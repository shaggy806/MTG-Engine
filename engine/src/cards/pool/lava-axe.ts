import { defineCard } from "../define.js";

export default defineCard({
  name: "Lava Axe",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Lava Axe deals 5 damage to target player or planeswalker.",
  targets: ["player-or-planeswalker"],
  effect: { kind: "damage", amount: 5, target: 0 },
});
