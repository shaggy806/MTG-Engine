import { defineCard } from "../define.js";

export default defineCard({
  name: "Blood Rites",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "{1}{R}, Sacrifice a creature: This enchantment deals 2 damage to any target.",
  activated: [
    {
      cost: { mana: "{1}{R}", tap: false, sacrifice: "creature-you-control" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{1}{R}, Sacrifice a creature: This enchantment deals 2 damage to any target.",
    },
  ],
});
