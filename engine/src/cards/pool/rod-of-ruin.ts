import { defineCard } from "../define.js";

export default defineCard({
  name: "Rod of Ruin",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "{3}, {T}: This artifact deals 1 damage to any target.",
  activated: [
    {
      cost: { mana: "{3}", tap: true },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{3}, {T}: This artifact deals 1 damage to any target.",
    },
  ],
});
