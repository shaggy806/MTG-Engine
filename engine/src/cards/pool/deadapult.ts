import { defineCard } from "../define.js";

export default defineCard({
  name: "Deadapult",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "{R}, Sacrifice a Zombie: This enchantment deals 2 damage to any target.",
  activated: [
    {
      cost: { mana: "{R}", tap: false, sacrifice: { filter: { subtype: "Zombie" } } },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{R}, Sacrifice a Zombie: This enchantment deals 2 damage to any target.",
    },
  ],
});
