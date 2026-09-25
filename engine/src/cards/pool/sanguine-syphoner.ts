import { defineCard } from "../define.js";

export default defineCard({
  name: "Sanguine Syphoner",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Warlock"],
  power: 1,
  toughness: 3,
  text: "Whenever this creature attacks, each opponent loses 1 life and you gain 1 life.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "Whenever this creature attacks, each opponent loses 1 life and you gain 1 life.",
    },
  ],
});
