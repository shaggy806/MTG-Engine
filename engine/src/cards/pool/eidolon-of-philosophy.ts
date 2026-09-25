import { defineCard } from "../define.js";

export default defineCard({
  name: "Eidolon of Philosophy",
  manaCost: "{U}",
  colors: ["U"],
  types: ["enchantment", "creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 2,
  text: "{6}{U}, Sacrifice this creature: Draw three cards.",
  activated: [
    {
      cost: { mana: "{6}{U}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 3 },
      resolve: null,
      text: "{6}{U}, Sacrifice this creature: Draw three cards.",
    },
  ],
});
