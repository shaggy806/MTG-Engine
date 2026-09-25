import { defineCard } from "../define.js";

export default defineCard({
  name: "Lightning Blast",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Lightning Blast deals 4 damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 4, target: 0 },
});
