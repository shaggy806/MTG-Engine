import { defineCard } from "../define.js";

export default defineCard({
  name: "Searing Flesh",
  manaCost: "{6}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Searing Flesh deals 7 damage to target opponent or planeswalker.",
  targets: ["opponent-or-planeswalker"],
  effect: { kind: "damage", amount: 7, target: 0 },
});
