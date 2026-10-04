import { defineCard } from "../define.js";

// EDHREC rank 2732.
//
// Rulings:
//   [2004-10-04] Because the "search" requires you to find a card with certain characteristics,
//     you don't have to find the card if you don't want to.

export default defineCard({
  name: "Sylvan Tutor",
  manaCost: "{G}",
  colors: ["G"],
  types: ["sorcery"],
  text: "Search your library for a creature card, reveal it, then shuffle and put that card on top.",
  effect: {
    kind: "search-library",
    filter: { type: "creature" },
    destination: "library-top",
    min: 0,
    max: 1,
    reveal: true,
  },
});
