import { defineCard } from "../define.js";

// EDHREC rank 4515.
//
// Rulings:
//   [2004-10-04] Because the "search" requires you to find a card with certain characteristics,
//     you don't have to find the card if you don't want to.

const TEXT =
  "{T}: Search your library for a legendary card, reveal that card, put it into your hand, then shuffle.";

export default defineCard({
  name: "Captain Sisay",
  manaCost: "{2}{G}{W}",
  colors: ["W", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 2,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { supertype: "legendary" },
        destination: "hand",
        min: 0,
        max: 1,
        reveal: true,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
