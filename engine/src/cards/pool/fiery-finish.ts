import { defineCard } from "../define.js";

export default defineCard({
  name: "Fiery Finish",
  manaCost: "{4}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Fiery Finish deals 7 damage to target creature.",
  targets: ["creature"],
  effect: { kind: "damage", amount: 7, target: 0 },
});
