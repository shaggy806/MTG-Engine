import { defineCard } from "../define.js";

// EDHREC rank 2673.
//
// Rulings:
//   [2020-08-07] Kuldotha Forgemaster can be one of the three artifacts you sacrifice to activate
//     the ability.

const TEXT =
  "{T}, Sacrifice three artifacts: Search your library for an artifact card, put it onto the battlefield, then shuffle.";

// The Forgemaster may be one of the three it sacrifices (its ruling): the
// sacrifice isn't "other".
export default defineCard({
  name: "Kuldotha Forgemaster",
  manaCost: "{5}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 3,
  toughness: 5,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { type: "artifact" }, count: 3 } },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "artifact" },
        destination: "battlefield",
        min: 0,
        max: 1,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
