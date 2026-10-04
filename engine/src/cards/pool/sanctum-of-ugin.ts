import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 2911.
// "If you do" is `sacrifice-source`'s `then`: a land already gone does nothing.
const CAST_TEXT =
  "Whenever you cast a colorless spell with mana value 7 or greater, you may sacrifice this land. If you do, search your library for a colorless creature card, reveal it, put it into your hand, then shuffle.";

export default defineCard({
  name: "Sanctum of Ugin",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${CAST_TEXT}`,
  activated: [addManaAbility({ mana: "C", text: "{T}: Add {C}." })],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { colorless: true, manaValue: { op: "gte", n: 7 } } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Sacrifice Sanctum of Ugin to search for a colorless creature card?",
        effect: {
          kind: "sacrifice-source",
          then: {
            kind: "search-library",
            filter: { type: "creature", colorless: true },
            destination: "hand",
            reveal: true,
            min: 0,
            max: 1,
          },
        },
      },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
