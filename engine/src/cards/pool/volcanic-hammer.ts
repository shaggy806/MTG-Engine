import { defineCard } from "../define.js";

export default defineCard({
  name: "Volcanic Hammer",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Volcanic Hammer deals 3 damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 3, target: 0 },
});
