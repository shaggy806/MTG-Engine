import { defineCard } from "../define.js";

export default defineCard({
  name: "Font of Vigor",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: "{2}{W}, Sacrifice this enchantment: You gain 7 life.",
  activated: [
    {
      cost: { mana: "{2}{W}", tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 7 },
      resolve: null,
      text: "{2}{W}, Sacrifice this enchantment: You gain 7 life.",
    },
  ],
});
