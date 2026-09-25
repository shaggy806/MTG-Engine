import { defineCard } from "../define.js";

// #270 in top-commanders.txt.
//
// The enters trigger reads the X Rocco was cast with; "if you cast it" is
// read off how he entered, so a Rocco put onto the battlefield some other
// way doesn't trigger (and X would be 0 anyway).
const TEXT =
  "When Rocco enters, if you cast it, you may search your library for a creature card with mana " +
  "value X or less, put it onto the battlefield, then shuffle.";

export default defineCard({
  name: "Rocco, Cabaretti Caterer",
  manaCost: "{X}{R}{G}{W}",
  colors: ["R", "G", "W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Druid"],
  power: 3,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self", filter: { cast: true, castBy: "you" } },
      targets: [],
      effect: {
        kind: "search-library",
        filter: { type: "creature", manaValue: { op: "lte", n: "x" } },
        destination: "battlefield",
        min: 0,
        max: 1,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
