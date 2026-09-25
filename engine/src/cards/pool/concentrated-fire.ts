import { defineCard } from "../define.js";

export default defineCard({
  name: "Concentrated Fire",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Concentrated Fire deals 5 damage to target creature.",
  targets: ["creature"],
  effect: { kind: "damage", amount: 5, target: 0 },
});
