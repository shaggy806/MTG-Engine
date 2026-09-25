import { defineCard } from "../define.js";

export default defineCard({
  name: "Barrage of Expendables",
  manaCost: "{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "{R}, Sacrifice a creature: This enchantment deals 1 damage to any target.",
  activated: [
    {
      cost: { mana: "{R}", tap: false, sacrifice: "creature-you-control" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{R}, Sacrifice a creature: This enchantment deals 1 damage to any target.",
    },
  ],
});
