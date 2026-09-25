import { defineCard } from "../define.js";

export default defineCard({
  name: "Explosive Shot",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Explosive Shot deals 4 damage to target creature.",
  targets: ["creature"],
  effect: { kind: "damage", amount: 4, target: 0 },
});
