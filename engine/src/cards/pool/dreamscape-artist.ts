import { defineCard } from "../define.js";

// EDHREC rank 6581.

const TEXT =
  "{2}{U}, {T}, Discard a card, Sacrifice a land: Search your library for up to two basic land cards, put them onto the battlefield, then shuffle.";

export default defineCard({
  name: "Dreamscape Artist",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Human", "Spellshaper"],
  power: 1,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: "{2}{U}", tap: true, discard: { count: 1 }, sacrifice: { filter: { type: "land" } } },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", type: "land" },
        min: 0,
        max: 2,
        destination: "battlefield",
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
