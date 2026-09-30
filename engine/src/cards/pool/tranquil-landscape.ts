import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const FETCH_TEXT =
  "{T}, Sacrifice this land: Search your library for a basic Forest, Plains, or Island card, put it onto the battlefield tapped, then shuffle.";

export default defineCard({
  name: "Tranquil Landscape",
  types: ["land"],
  text: `{T}: Add {C}.\n${FETCH_TEXT}\nCycling {G}{W}{U} ({G}{W}{U}, Discard this card: Draw a card.)`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
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
  cycling: { cost: "{G}{W}{U}" },
});
