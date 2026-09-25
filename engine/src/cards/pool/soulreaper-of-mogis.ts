import { defineCard } from "../define.js";

export default defineCard({
  name: "Soulreaper of Mogis",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment", "creature"],
  subtypes: ["Minotaur", "Shaman"],
  power: 2,
  toughness: 3,
  text: "{2}{B}, Sacrifice a creature: Draw a card.",
  activated: [
    {
      cost: { mana: "{2}{B}", tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}{B}, Sacrifice a creature: Draw a card.",
    },
  ],
});
