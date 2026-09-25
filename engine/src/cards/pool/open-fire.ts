import { defineCard } from "../define.js";

export default defineCard({
  name: "Open Fire",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Open Fire deals 3 damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 3, target: 0 },
});
