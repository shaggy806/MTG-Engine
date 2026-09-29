import { defineCard } from "../define.js";

const SEARCH_TEXT =
  "{3}{G}, {T}, Sacrifice this land: Search your library for up to two basic land cards, put them onto the battlefield tapped, then shuffle.";

export default defineCard({
  name: "Blighted Woodland",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${SEARCH_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{3}{G}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "land", supertype: "basic" },
        destination: "battlefield",
        min: 0,
        max: 2,
        enterTapped: true,
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
  ],
});
