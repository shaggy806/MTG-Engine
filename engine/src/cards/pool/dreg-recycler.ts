import { defineCard } from "../define.js";

export default defineCard({
  name: "Dreg Recycler",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Beast"],
  power: 2,
  toughness: 2,
  text: "{T}, Sacrifice an artifact or creature: Each opponent loses 1 life and you gain 1 life.",
  activated: [
    {
      cost: {
        mana: null,
        tap: true,
        sacrifice: { filter: { typesAnyOf: ["artifact", "creature"] } },
      },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "{T}, Sacrifice an artifact or creature: Each opponent loses 1 life and you gain 1 life.",
    },
  ],
});
