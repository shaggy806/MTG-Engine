import { defineCard } from "../define.js";

// EDHREC rank 5192.

export default defineCard({
  name: "Jund Panorama",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{1}, {T}, Sacrifice this land: Search your library for a basic Swamp, Mountain, or Forest card, put it onto the battlefield tapped, then shuffle.",
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
      // Naya Panorama's shape.
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", subtypes: ["Swamp", "Mountain", "Forest"] },
        destination: "battlefield",
        enterTapped: true,
        min: 0,
        max: 1,
      },
      resolve: null,
      text: "{1}, {T}, Sacrifice this land: Search your library for a basic Swamp, Mountain, or Forest card, put it onto the battlefield tapped, then shuffle.",
    },
  ],
});
