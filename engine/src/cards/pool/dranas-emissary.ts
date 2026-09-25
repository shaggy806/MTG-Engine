import { defineCard } from "../define.js";

export default defineCard({
  name: "Drana's Emissary",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Vampire", "Cleric", "Ally"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nAt the beginning of your upkeep, each opponent loses 1 life and you gain 1 life.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "At the beginning of your upkeep, each opponent loses 1 life and you gain 1 life.",
    },
  ],
});
