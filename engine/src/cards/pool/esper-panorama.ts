import { defineCard } from "../define.js";

// EDHREC rank 6229.

const FETCH_TEXT =
  "{1}, {T}, Sacrifice this land: Search your library for a basic Plains, Island, or Swamp card, put it onto the battlefield tapped, then shuffle.";

// Bant Panorama's shape.
export default defineCard({
  name: "Esper Panorama",
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
        filter: { supertype: "basic", subtypes: ["Plains", "Island", "Swamp"] },
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
