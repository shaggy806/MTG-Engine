import { defineCard } from "../define.js";

export default defineCard({
  name: "Vampire Neonate",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 0,
  toughness: 3,
  text: "{2}, {T}: Each opponent loses 1 life and you gain 1 life.",
  activated: [
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "{2}, {T}: Each opponent loses 1 life and you gain 1 life.",
    },
  ],
});
