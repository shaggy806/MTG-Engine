import { defineCard } from "../define.js";

export default defineCard({
  name: "Unfulfilled Desires",
  manaCost: "{1}{U}{B}",
  colors: ["U", "B"],
  types: ["enchantment"],
  text: "{1}, Pay 1 life: Draw a card, then discard a card.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, payLife: 1 },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: "{1}, Pay 1 life: Draw a card, then discard a card.",
    },
  ],
});
