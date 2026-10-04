import { defineCard } from "../define.js";

// EDHREC rank 5954.

export default defineCard({
  name: "Grixis Panorama",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{1}, {T}, Sacrifice this land: Search your library for a basic Island, Swamp, or Mountain card, put it onto the battlefield tapped, then shuffle.",
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
      // Jund Panorama's shape.
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", subtypes: ["Island", "Swamp", "Mountain"] },
        destination: "battlefield",
        enterTapped: true,
        min: 0,
        max: 1,
      },
      resolve: null,
      text: "{1}, {T}, Sacrifice this land: Search your library for a basic Island, Swamp, or Mountain card, put it onto the battlefield tapped, then shuffle.",
    },
  ],
});
