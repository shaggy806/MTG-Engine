import { defineCard } from "../define.js";

// A live-amount mana ability: `manaSources()` sizes it against the board, and
// with no creatures it produces nothing (and is no source at all).
export default defineCard({
  name: "Gaea's Cradle",
  colors: [],
  supertypes: ["legendary"],
  types: ["land"],
  text: "{T}: Add {G} for each creature you control.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "G",
        amount: { countOf: { type: "creature", controlledBy: "you" } },
      },
      resolve: null,
      text: "{T}: Add {G} for each creature you control.",
    },
  ],
});
