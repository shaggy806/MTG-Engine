import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// #488 in top-commanders.txt.
//
// Where the rest go is decided after the Gate is put down, so it counts.
const TEXT =
  "Whenever Nine-Fingers Keene deals combat damage to a player, look at the top nine cards of your " +
  "library. You may put a Gate card from among them onto the battlefield. Then if you control nine or " +
  "more Gates, put the rest into your hand. Otherwise, put the rest on the bottom of your library in a " +
  "random order.";
const WARD = ward({ payLife: 9 });

export default defineCard({
  name: "Nine-Fingers Keene",
  manaCost: "{1}{B}{G}{U}",
  colors: ["B", "G", "U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 4,
  toughness: 4,
  keywords: ["menace"],
  text: `Menace\n${WARD.text}\n${TEXT}`,
  triggered: [
    WARD,
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 9,
        min: 0,
        max: 1,
        destination: "battlefield",
        leftover: "bottom-random",
        leftoverIf: {
          condition: { kind: "controls", filter: { subtype: "Gate" }, atLeast: 9 },
          leftover: "hand",
        },
        filter: { subtype: "Gate" },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
