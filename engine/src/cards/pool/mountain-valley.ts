import { defineCard } from "../define.js";
import { entersTappedStatic } from "../helpers.js";

const SEARCH_TEXT =
  "{T}, Sacrifice this land: Search your library for a Mountain or Forest card, put it onto the battlefield, then shuffle.";

// Any card with either land type, basic or not; finding nothing is allowed
// (the ruling).
export default defineCard({
  name: "Mountain Valley",
  types: ["land"],
  text: `This land enters tapped.\n${SEARCH_TEXT}`,
  static: [entersTappedStatic("Mountain Valley")],
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "land", subtypes: ["Mountain", "Forest"] },
        destination: "battlefield",
        min: 0,
        max: 1,
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
  ],
});
