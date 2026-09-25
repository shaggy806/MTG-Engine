import { defineCard } from "../define.js";

export default defineCard({
  name: "Sarcomite Myr",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Phyrexian", "Myr"],
  power: 2,
  toughness: 1,
  text: "{2}: This creature gains flying until end of turn.\n{2}, Sacrifice this creature: Draw a card.",
  activated: [
    {
      cost: { mana: "{2}", tap: false },
      targets: [],
      effect: { kind: "grant-keyword", target: "source", keyword: "flying", duration: "end-of-turn" },
      resolve: null,
      text: "{2}: This creature gains flying until end of turn.",
    },
    {
      cost: { mana: "{2}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}, Sacrifice this creature: Draw a card.",
    },
  ],
});
