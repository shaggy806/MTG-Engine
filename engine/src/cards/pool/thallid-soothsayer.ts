import { defineCard } from "../define.js";

export default defineCard({
  name: "Thallid Soothsayer",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Fungus"],
  power: 2,
  toughness: 3,
  text: "{2}, Sacrifice a creature: Draw a card.",
  activated: [
    {
      cost: { mana: "{2}", tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}, Sacrifice a creature: Draw a card.",
    },
  ],
});
