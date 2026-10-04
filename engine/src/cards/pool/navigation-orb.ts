import { defineCard } from "../define.js";

// EDHREC rank 4284.
// Kodama's Reach's split (first find onto the battlefield tapped, the other to
// hand) over Circuitous Route's "basic land cards and/or Gate cards" filter.

export default defineCard({
  name: "Navigation Orb",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{2}, {T}, Sacrifice this artifact: Search your library for up to two basic land cards and/or Gate cards, reveal those cards, put one onto the battlefield tapped and the other into your hand, then shuffle.",
  activated: [
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { anyOf: [{ type: "land", supertype: "basic" }, { subtype: "Gate" }] },
        min: 0,
        max: 2,
        reveal: true,
        destination: "battlefield",
        enterTapped: true,
        restDestination: "hand",
      },
      resolve: null,
      text: "{2}, {T}, Sacrifice this artifact: Search your library for up to two basic land cards and/or Gate cards, reveal those cards, put one onto the battlefield tapped and the other into your hand, then shuffle.",
    },
  ],
});
