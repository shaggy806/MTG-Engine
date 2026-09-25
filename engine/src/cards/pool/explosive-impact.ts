import { defineCard } from "../define.js";

export default defineCard({
  name: "Explosive Impact",
  manaCost: "{5}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Explosive Impact deals 5 damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 5, target: 0 },
});
