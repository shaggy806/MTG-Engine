import { defineCard } from "../define.js";

export default defineCard({
  name: "Flame Slash",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Flame Slash deals 4 damage to target creature.",
  targets: ["creature"],
  effect: { kind: "damage", amount: 4, target: 0 },
});
