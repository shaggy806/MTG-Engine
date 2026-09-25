import { defineCard } from "../define.js";

export default defineCard({
  name: "Witness of Tomorrows",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["enchantment", "creature"],
  subtypes: ["Sphinx"],
  power: 3,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\n{3}{U}: Scry 1.",
  activated: [
    {
      cost: { mana: "{3}{U}", tap: false },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "{3}{U}: Scry 1.",
    },
  ],
});
