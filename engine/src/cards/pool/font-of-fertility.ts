import { defineCard } from "../define.js";

export default defineCard({
  name: "Font of Fertility",
  manaCost: "{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "{1}{G}, Sacrifice this enchantment: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
  activated: [
    {
      cost: { mana: "{1}{G}", tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", type: "land" },
        destination: "battlefield",
        min: 0,
        max: 1,
        enterTapped: true,
      },
      resolve: null,
      text: "{1}{G}, Sacrifice this enchantment: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
    },
  ],
});
