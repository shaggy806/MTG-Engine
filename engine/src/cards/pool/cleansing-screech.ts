import { defineCard } from "../define.js";

export default defineCard({
  name: "Cleansing Screech",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Cleansing Screech deals 4 damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 4, target: 0 },
});
