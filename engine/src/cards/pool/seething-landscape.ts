import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const FETCH_TEXT =
  "{T}, Sacrifice this land: Search your library for a basic Island, Swamp, or Mountain card, put it onto the battlefield tapped, then shuffle.";

export default defineCard({
  name: "Seething Landscape",
  types: ["land"],
  text: `{T}: Add {C}.\n${FETCH_TEXT}\nCycling {U}{B}{R} ({U}{B}{R}, Discard this card: Draw a card.)`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "basic", subtypes: ["Island", "Swamp", "Mountain"] },
        destination: "battlefield",
        enterTapped: true,
        min: 0,
        max: 1,
      },
      resolve: null,
      text: FETCH_TEXT,
    },
  ],
  cycling: { cost: "{U}{B}{R}" },
});
