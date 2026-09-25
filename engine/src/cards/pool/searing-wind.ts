import { defineCard } from "../define.js";

export default defineCard({
  name: "Searing Wind",
  manaCost: "{8}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Searing Wind deals 10 damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 10, target: 0 },
});
