import { defineCard } from "../define.js";

export default defineCard({
  name: "Aladdin's Ring",
  manaCost: "{8}",
  colors: [],
  types: ["artifact"],
  text: "{8}, {T}: This artifact deals 4 damage to any target.",
  activated: [
    {
      cost: { mana: "{8}", tap: true },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 4, target: 0 },
      resolve: null,
      text: "{8}, {T}: This artifact deals 4 damage to any target.",
    },
  ],
});
