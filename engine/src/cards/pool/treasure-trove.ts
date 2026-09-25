import { defineCard } from "../define.js";

export default defineCard({
  name: "Treasure Trove",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "{2}{U}{U}: Draw a card.",
  activated: [
    {
      cost: { mana: "{2}{U}{U}", tap: false },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{2}{U}{U}: Draw a card.",
    },
  ],
});
