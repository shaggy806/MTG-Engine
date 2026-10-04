import { defineCard } from "../define.js";

// EDHREC rank 4580.

export default defineCard({
  name: "Master of the Feast",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["enchantment", "creature"],
  subtypes: ["Demon"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying\nAt the beginning of your upkeep, each opponent draws a card.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "draw", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "At the beginning of your upkeep, each opponent draws a card.",
    },
  ],
});
