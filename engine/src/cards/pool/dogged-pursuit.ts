import { defineCard } from "../define.js";

export default defineCard({
  name: "Dogged Pursuit",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "At the beginning of your end step, each opponent loses 1 life and you gain 1 life.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "At the beginning of your end step, each opponent loses 1 life and you gain 1 life.",
    },
  ],
});
