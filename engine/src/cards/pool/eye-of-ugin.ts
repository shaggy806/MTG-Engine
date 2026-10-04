import { defineCard } from "../define.js";

// EDHREC rank 2957.
//
// Rulings:
//   [2010-03-01] Eye of Ugin's second ability lets you find any colorless creature card in your
//     deck, such as an artifact creature card that has no colored mana symbols in its mana cost,
//     or a creature card that's become colorless due to Mycosynth Lattice.
//   [2010-03-01] Eye of Ugin doesn't have a mana ability.
//   [2013-04-15] Mistform Ultimus and creatures with changeling are Eldrazi. If they become
//     colorless, possibly due to Mycosynth Lattice, Eye of Ugin would reduce the cost to cast them
//     by {2}.

const REDUCE_TEXT = "Colorless Eldrazi spells you cast cost {2} less to cast.";
const SEARCH_TEXT =
  "{7}, {T}: Search your library for a colorless creature card, reveal it, put it into your hand, then shuffle.";

export default defineCard({
  name: "Eye of Ugin",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: `${REDUCE_TEXT}\n${SEARCH_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { subtype: "Eldrazi", colorless: true }, caster: "you", reduceGeneric: 2 },
      text: REDUCE_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{7}", tap: true },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "creature", colorless: true },
        destination: "hand",
        reveal: true,
        min: 0,
        max: 1,
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
  ],
});
