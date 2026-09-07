import { defineCard } from "../define.js";

export default defineCard({
  name: "Flame Javelin",
  manaCost: "{2/R}{2/R}{2/R}",
  colors: ["R"],
  types: ["instant"],
  text: "({2/R} can be paid with any two mana or with {R}.)\nFlame Javelin deals 4 damage to any target.",
  targets: ["any-target"],
  effect: { kind: "damage", amount: 4, target: 0 },
});
