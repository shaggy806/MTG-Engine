import { defineCard } from "../define.js";

export default defineCard({
  name: "Ragefire",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Ragefire deals 3 damage to target creature.",
  targets: ["creature"],
  effect: { kind: "damage", amount: 3, target: 0 },
});
