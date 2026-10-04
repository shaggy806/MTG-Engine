import { defineCard } from "../define.js";

// EDHREC rank 5684.
//
// Rulings:
//   [2021-03-19] Knight of the Reliquary's first ability applies only while it's on the
//     battlefield. In all other zones, it's a 2/2 creature.

export default defineCard({
  name: "Knight of the Reliquary",
  manaCost: "{1}{G}{W}",
  colors: ["W", "G"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 2,
  toughness: 2,
  text: "This creature gets +1/+1 for each land card in your graveyard.\n{T}, Sacrifice a Forest or Plains: Search your library for a land card, put it onto the battlefield, then shuffle.",
  static: [
    {
      affects: { scope: "self" },
      grantPtPerCount: { inGraveyard: { type: "land", ownedBy: "you" }, pt: [1, 1] },
      text: "This creature gets +1/+1 for each land card in your graveyard.",
    },
  ],
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { subtypes: ["Forest", "Plains"] } } },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "land" },
        destination: "battlefield",
        min: 0,
        max: 1,
      },
      resolve: null,
      text: "{T}, Sacrifice a Forest or Plains: Search your library for a land card, put it onto the battlefield, then shuffle.",
    },
  ],
});
