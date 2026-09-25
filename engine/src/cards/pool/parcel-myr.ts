import { defineCard } from "../define.js";

export default defineCard({
  name: "Parcel Myr",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Clue", "Myr"],
  power: 2,
  toughness: 1,
  text: "{2}, Sacrifice this creature: Draw a card.",
  activated: [
    {
      cost: { mana: "{2}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}, Sacrifice this creature: Draw a card.",
    },
  ],
});
