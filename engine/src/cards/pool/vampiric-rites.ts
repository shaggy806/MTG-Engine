import { defineCard } from "../define.js";

export default defineCard({
  name: "Vampiric Rites",
  manaCost: "{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "{1}{B}, Sacrifice a creature: You gain 1 life and draw a card.",
  activated: [
    {
      cost: { mana: "{1}{B}", tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-life", amount: 1 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: "{1}{B}, Sacrifice a creature: You gain 1 life and draw a card.",
    },
  ],
});
