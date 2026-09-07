import { defineCard } from "../define.js";

export default defineCard({
  name: "Greed",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "{B}, Pay 2 life: Draw a card.",
  activated: [
    {
      cost: { mana: "{B}", tap: false, payLife: 2 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{B}, Pay 2 life: Draw a card.",
    },
  ],
});
