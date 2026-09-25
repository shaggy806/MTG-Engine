import { defineCard } from "../define.js";

export default defineCard({
  name: "Engulfing Eruption",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Engulfing Eruption deals 5 damage to target creature.",
  targets: ["creature"],
  effect: { kind: "damage", amount: 5, target: 0 },
});
