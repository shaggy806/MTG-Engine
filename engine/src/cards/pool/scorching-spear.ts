import { defineCard } from "../define.js";

export default defineCard({
  name: "Scorching Spear",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Scorching Spear deals 1 damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 1, target: 0 },
});
