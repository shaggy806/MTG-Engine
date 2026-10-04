import { defineCard } from "../define.js";

// EDHREC rank 6060.
//
// Rulings:
//   [2018-04-27] If a creature is somehow both a Fungus and a Saproling, Sporecrown Thallid's
//     ability gives it only +1/+1.
//   [2018-04-27] Because damage remains marked on a creature until it's removed as the turn ends,
//     nonlethal damage dealt to a Fungus or Saproling creature you control may become lethal if
//     Sporecrown Thallid leaves the battlefield during that turn.

const TEXT = "Each other creature you control that's a Fungus or Saproling gets +1/+1.";

// One static over an `anyOf` filter, so a Fungus Saproling matches once and
// gets +1/+1, not +2/+2 (the ruling).
export default defineCard({
  name: "Sporecrown Thallid",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Fungus"],
  power: 2,
  toughness: 2,
  text: TEXT,
  static: [
    {
      affects: {
        scope: "filter",
        filter: {
          type: "creature",
          controlledBy: "you",
          anyOf: [{ subtype: "Fungus" }, { subtype: "Saproling" }],
        },
        excludeSelf: true,
      },
      grantPt: [1, 1],
      text: TEXT,
    },
  ],
});
