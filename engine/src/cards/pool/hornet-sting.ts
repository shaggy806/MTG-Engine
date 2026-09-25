import { defineCard } from "../define.js";

export default defineCard({
  name: "Hornet Sting",
  manaCost: "{G}",
  colors: ["G"],
  types: ["instant"],
  text: "Hornet Sting deals 1 damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 1, target: 0 },
});
