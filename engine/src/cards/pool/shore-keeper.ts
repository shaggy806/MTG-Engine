import { defineCard } from "../define.js";

export default defineCard({
  name: "Shore Keeper",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Trilobite"],
  power: 0,
  toughness: 3,
  text: "{7}{U}, {T}, Sacrifice this creature: Draw three cards.",
  activated: [
    {
      cost: { mana: "{7}{U}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 3 },
      resolve: null,
      text: "{7}{U}, {T}, Sacrifice this creature: Draw three cards.",
    },
  ],
});
