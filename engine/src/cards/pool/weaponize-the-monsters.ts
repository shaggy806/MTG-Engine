import { defineCard } from "../define.js";

export default defineCard({
  name: "Weaponize the Monsters",
  manaCost: "{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "{2}, Sacrifice a creature: This enchantment deals 2 damage to any target.",
  activated: [
    {
      cost: { mana: "{2}", tap: false, sacrifice: "creature-you-control" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{2}, Sacrifice a creature: This enchantment deals 2 damage to any target.",
    },
  ],
});
