import { defineCard } from "../define.js";

export default defineCard({
  name: "Vampire Opportunist",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 2,
  toughness: 1,
  text: "{6}{B}: Each opponent loses 2 life and you gain 2 life.",
  activated: [
    {
      cost: { mana: "{6}{B}", tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 2, who: "each-opponent" },
          { kind: "gain-life", amount: 2 },
        ],
      },
      resolve: null,
      text: "{6}{B}: Each opponent loses 2 life and you gain 2 life.",
    },
  ],
});
