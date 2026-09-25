import { defineCard } from "../define.js";

export default defineCard({
  name: "Command the Storm",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Command the Storm deals 5 damage to target creature.",
  targets: ["creature"],
  effect: { kind: "damage", amount: 5, target: 0 },
});
