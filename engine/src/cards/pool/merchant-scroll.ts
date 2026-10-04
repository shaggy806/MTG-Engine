import { defineCard } from "../define.js";

// EDHREC rank 2550.
//
// Rulings:
//   [2004-10-04] Because the "search" requires you to find a card with certain characteristics,
//     you don't have to find the card if you don't want to.

export default defineCard({
  name: "Merchant Scroll",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Search your library for a blue instant card, reveal that card, put it into your hand, then shuffle.",
  effect: {
    kind: "search-library",
    filter: { type: "instant", colors: ["U"] },
    destination: "hand",
    min: 0,
    max: 1,
    reveal: true,
  },
});
