import { defineCard } from "../define.js";

export default defineCard({
  name: "Warped Landscape",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{2}, {T}, Sacrifice this land: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", type: "land" },
        destination: "battlefield",
        min: 0,
        max: 1,
        enterTapped: true,
      },
      resolve: null,
      text: "{2}, {T}, Sacrifice this land: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.",
    },
  ],
});
