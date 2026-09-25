import { defineCard } from "../define.js";

export default defineCard({
  name: "Vermin Gorger",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 2,
  toughness: 2,
  text: "{T}, Sacrifice another creature: Each opponent loses 2 life and you gain 2 life.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "creature-you-control" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 2, who: "each-opponent" },
          { kind: "gain-life", amount: 2 },
        ],
      },
      resolve: null,
      text: "{T}, Sacrifice another creature: Each opponent loses 2 life and you gain 2 life.",
      otherOnly: true,
    },
  ],
});
