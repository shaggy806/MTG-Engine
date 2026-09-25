import { defineCard } from "../define.js";

export default defineCard({
  name: "Greater Tanuki",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["enchantment", "creature"],
  subtypes: ["Dog"],
  power: 6,
  toughness: 5,
  keywords: ["trample"],
  text: "Trample\nChannel — {2}{G}, Discard this card: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
  activated: [
    {
      cost: { mana: "{2}{G}", tap: false },
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
      text: "Channel — {2}{G}, Discard this card: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
      zone: "hand",
    },
  ],
});
