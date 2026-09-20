import { defineCard } from "../define.js";

export default defineCard({
  name: "Impact Tremors",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "Whenever a creature you control enters, this enchantment deals 1 damage to each opponent.",
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { type: "creature" },
      },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Whenever a creature you control enters, this enchantment deals 1 damage to each opponent.",
    },
  ],
});
