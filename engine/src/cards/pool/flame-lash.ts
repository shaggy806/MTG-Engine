import { defineCard } from "../define.js";

export default defineCard({
  name: "Flame Lash",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Flame Lash deals 4 damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 4, target: 0 },
});
