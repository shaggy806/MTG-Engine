import { defineCard } from "../define.js";

// EDHREC rank 5517.
//
// Rulings:
//   [2004-10-04] Because the "search" requires you to find a card with certain characteristics,
//     you don't have to find the card if you don't want to.
//
// Grasslands' shape: any card with either land type, basic or not, onto the
// battlefield untapped; finding nothing is allowed.
const SEARCH_TEXT =
  "{T}, Sacrifice this land: Search your library for a Plains or Island card, put it onto the battlefield, then shuffle.";

export default defineCard({
  name: "Flood Plain",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n${SEARCH_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "land", subtypes: ["Plains", "Island"] },
        destination: "battlefield",
        min: 0,
        max: 1,
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
