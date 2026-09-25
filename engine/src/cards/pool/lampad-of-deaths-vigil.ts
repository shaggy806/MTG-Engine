import { defineCard } from "../define.js";

export default defineCard({
  name: "Lampad of Death's Vigil",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment", "creature"],
  subtypes: ["Nymph"],
  power: 1,
  toughness: 3,
  text: "{1}, Sacrifice a creature: Each opponent loses 1 life and you gain 1 life.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "{1}, Sacrifice a creature: Each opponent loses 1 life and you gain 1 life.",
    },
  ],
});
