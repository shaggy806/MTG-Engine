import { defineCard } from "../define.js";

export default defineCard({
  name: "Scorching Shot",
  manaCost: "{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Scorching Shot deals 5 damage to target creature.",
  targets: ["creature"],
  effect: { kind: "damage", amount: 5, target: 0 },
});
