import { defineCard } from "../define.js";

export default defineCard({
  name: "Lava Spike",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  subtypes: ["Arcane"],
  text: "Lava Spike deals 3 damage to target player or planeswalker.",
  targets: ["player-or-planeswalker"],
  effect: { kind: "damage", amount: 3, target: 0 },
});
