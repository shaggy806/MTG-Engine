import { defineCard } from "../define.js";

export default defineCard({
  name: "Unyaro Bee Sting",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Unyaro Bee Sting deals 2 damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 2, target: 0 },
});
