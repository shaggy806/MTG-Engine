import { defineCard } from "../define.js";

export default defineCard({
  name: "Reckless Assault",
  manaCost: "{2}{B}{R}",
  colors: ["B", "R"],
  types: ["enchantment"],
  text: "{1}, Pay 2 life: This enchantment deals 1 damage to any target.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, payLife: 2 },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{1}, Pay 2 life: This enchantment deals 1 damage to any target.",
    },
  ],
});
