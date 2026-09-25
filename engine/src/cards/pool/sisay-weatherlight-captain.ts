import { defineCard } from "../define.js";

// #89 in top-commanders.txt.
//
// "Mana value less than Sisay's power" is read as the search applies
// (`{ amount: { powerOf: "source" } }`), so a Sisay that has left by then is
// read as she last existed.
const PT_TEXT = "Sisay gets +1/+1 for each color among other legendary permanents you control.";
const SEARCH_TEXT =
  "{W}{U}{B}{R}{G}: Search your library for a legendary permanent card with mana value less than " +
  "Sisay's power, put that card onto the battlefield, then shuffle.";

export default defineCard({
  name: "Sisay, Weatherlight Captain",
  manaCost: "{2}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 2,
  text: `${PT_TEXT}\n${SEARCH_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      grantPtPerCount: {
        colorsAmong: { supertype: "legendary", controlledBy: "you" },
        excludeSelf: true,
        pt: [1, 1],
      },
      text: PT_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{W}{U}{B}{R}{G}", tap: false },
      targets: [],
      effect: {
        kind: "search-library",
        filter: {
          supertype: "legendary",
          typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker", "battle"],
          manaValue: { op: "lt", n: { amount: { powerOf: "source" } } },
        },
        destination: "battlefield",
        min: 0,
        max: 1,
      },
      resolve: null,
      text: SEARCH_TEXT,
    },
  ],
});
