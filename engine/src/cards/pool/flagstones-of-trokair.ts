import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 3352.

const SEARCH_TEXT =
  "When Flagstones of Trokair is put into a graveyard from the battlefield, you may search your library for a Plains card, put it onto the battlefield tapped, then shuffle.";

export default defineCard({
  name: "Flagstones of Trokair",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: `{T}: Add {W}.\n${SEARCH_TEXT}`,
  activated: [addManaAbility({ mana: "W", text: "{T}: Add {W}." })],
  triggered: [
    {
      // Ichor Wellspring's "put into a graveyard from the battlefield".
      trigger: { on: "leaves-battlefield", who: "self", to: ["graveyard"] },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search your library for a Plains card?",
        effect: {
          kind: "search-library",
          // Any card with the Plains subtype — not only a basic one.
          filter: { subtype: "Plains" },
          destination: "battlefield",
          enterTapped: true,
          min: 0,
          max: 1,
        },
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
  ],
});
