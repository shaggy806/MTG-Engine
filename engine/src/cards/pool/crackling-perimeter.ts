import { defineCard } from "../define.js";

export default defineCard({
  name: "Crackling Perimeter",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "Tap an untapped Gate you control: This enchantment deals 1 damage to each opponent.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 1, filter: { subtype: "Gate", controlledBy: "you" }, includeSelf: true },
      },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Tap an untapped Gate you control: This enchantment deals 1 damage to each opponent.",
    },
  ],
});
