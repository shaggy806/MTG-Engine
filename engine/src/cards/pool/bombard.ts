import { defineCard } from "../define.js";

export default defineCard({
  name: "Bombard",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Bombard deals 4 damage to target creature.",
  targets: ["creature"],
  effect: { kind: "damage", amount: 4, target: 0 },
});
