import { defineCard } from "../define.js";

// EDHREC rank 4971.

const FETCH_TEXT =
  "{1}, {T}, Sacrifice this land: Search your library for a basic Forest, Plains, or Island card, put it onto the battlefield tapped, then shuffle.";

// Naya Panorama's shape.
export default defineCard({
  name: "Bant Panorama",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${FETCH_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{1}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", subtypes: ["Forest", "Plains", "Island"] },
        destination: "battlefield",
        enterTapped: true,
        min: 0,
        max: 1,
      },
      resolve: null,
      text: FETCH_TEXT,
    },
  ],
});
