import { defineCard } from "../define.js";

// EDHREC rank 4509.

const FETCH_TEXT =
  "{1}, {T}, Sacrifice this land: Search your library for a basic Mountain, Forest, or Plains card, put it onto the battlefield tapped, then shuffle.";

export default defineCard({
  name: "Naya Panorama",
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
      // The Landscapes' search (`landscape` helper), with a {1} in the cost.
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", subtypes: ["Mountain", "Forest", "Plains"] },
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
