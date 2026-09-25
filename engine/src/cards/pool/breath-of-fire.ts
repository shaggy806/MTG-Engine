import { defineCard } from "../define.js";

export default defineCard({
  name: "Breath of Fire",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Breath of Fire deals 2 damage to target creature.",
  targets: ["creature"],
  effect: { kind: "damage", amount: 2, target: 0 },
});
