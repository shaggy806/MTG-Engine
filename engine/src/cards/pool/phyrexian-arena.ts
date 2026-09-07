import { defineCard } from "../define.js";

export default defineCard({
  name: "Phyrexian Arena",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "At the beginning of your upkeep, you draw a card and you lose 1 life.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "lose-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "At the beginning of your upkeep, draw a card and lose 1 life.",
    },
  ],
});
