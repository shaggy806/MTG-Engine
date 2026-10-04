import { defineCard } from "../define.js";

// EDHREC rank 6343.
//
// Rulings:
//   [2018-01-19] Because damage remains marked on a creature until it's removed as the turn ends,
//     nonlethal damage dealt to another Merfolk you control may become lethal if Merfolk
//     Mistbinder leaves the battlefield during that turn.

export default defineCard({
  name: "Merfolk Mistbinder",
  manaCost: "{G}{U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Merfolk", "Shaman"],
  power: 2,
  toughness: 2,
  text: "Other Merfolk you control get +1/+1.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Merfolk" },
      grantPt: [1, 1],
      text: "Other Merfolk you control get +1/+1.",
    },
  ],
});
