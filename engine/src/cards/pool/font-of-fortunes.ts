import { defineCard } from "../define.js";

export default defineCard({
  name: "Font of Fortunes",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "{1}{U}, Sacrifice this enchantment: Draw two cards.",
  activated: [
    {
      cost: { mana: "{1}{U}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "{1}{U}, Sacrifice this enchantment: Draw two cards.",
    },
  ],
});
