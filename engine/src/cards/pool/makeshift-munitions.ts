import { defineCard } from "../define.js";

export default defineCard({
  name: "Makeshift Munitions",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "{1}, Sacrifice an artifact or creature: This enchantment deals 1 damage to any target.",
  activated: [
    {
      cost: {
        mana: "{1}",
        tap: false,
        sacrifice: { filter: { typesAnyOf: ["artifact", "creature"] } },
      },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{1}, Sacrifice an artifact or creature: This enchantment deals 1 damage to any target.",
    },
  ],
});
