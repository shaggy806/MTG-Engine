import { defineCard } from "../define.js";

// EDHREC rank 4951.
//
// Rulings:
//   [2004-10-04] You do not have to find a plains or forest card if you do not want to.
//
// Mountain Valley's shape: any card with either land type, basic or not,
// onto the battlefield untapped; finding nothing is allowed.
const SEARCH_TEXT =
  "{T}, Sacrifice this land: Search your library for a Forest or Plains card, put it onto the battlefield, then shuffle.";

export default defineCard({
  name: "Grasslands",
  colors: [],
  types: ["land"],
  text: `This land enters tapped.\n${SEARCH_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "land", subtypes: ["Forest", "Plains"] },
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
