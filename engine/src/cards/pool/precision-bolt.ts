import { defineCard } from "../define.js";

export default defineCard({
  name: "Precision Bolt",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Precision Bolt deals 3 damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 3, target: 0 },
});
