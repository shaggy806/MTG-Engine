import { defineCard } from "../define.js";

// EDHREC rank 6280.
// Makes Dragon → use "Dragon Token (Dragonback Assault)".

export default defineCard({
  name: "Sarkhan Unbroken",
  manaCost: "{2}{G}{U}{R}",
  colors: ["U", "R", "G"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Sarkhan"],
  loyalty: 4,
  text: "+1: Draw a card, then add one mana of any color.\n−2: Create a 4/4 red Dragon creature token with flying.\n−8: Search your library for any number of Dragon creature cards, put them onto the battlefield, then shuffle.",
  activated: [
    {
      loyaltyCost: 1,
      cost: { mana: null, tap: false },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "add-mana", mana: "any-color", amount: 1 },
        ],
      },
      resolve: null,
      text: "+1: Draw a card, then add one mana of any color.",
    },
    {
      loyaltyCost: -2,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "create-token", token: "Dragon Token (Dragonback Assault)", count: 1 },
      resolve: null,
      text: "−2: Create a 4/4 red Dragon creature token with flying.",
    },
    {
      loyaltyCost: -8,
      cost: { mana: null, tap: false },
      targets: [],
      // The World Tree's "any number of" search.
      effect: {
        kind: "search-library",
        filter: { type: "creature", subtype: "Dragon" },
        destination: "battlefield",
        min: 0,
        max: { librarySize: "you" },
      },
      resolve: null,
      text: "−8: Search your library for any number of Dragon creature cards, put them onto the battlefield, then shuffle.",
    },
  ],
});
