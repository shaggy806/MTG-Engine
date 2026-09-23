import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const SEARCH =
  "{3}, {T}, Sacrifice this land: Search your library for a land card, put it onto the battlefield tapped, then shuffle.";

// "Land — Urza's Cave" is two land types, Urza's and Cave (rule 205.3i).
export default defineCard({
  name: "Urza's Cave",
  colors: [],
  types: ["land"],
  subtypes: ["Urza's", "Cave"],
  text: `{T}: Add {C}.\n${SEARCH}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{3}", tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "land" },
        destination: "battlefield",
        min: 0,
        max: 1,
        enterTapped: true,
      },
      resolve: null,
      text: SEARCH,
    },
  ],
});
