import { defineCard } from "../define.js";

export default defineCard({
  name: "Searing Spear",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Searing Spear deals 3 damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 3, target: 0 },
});
