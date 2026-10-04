import { defineCard } from "../define.js";

// EDHREC rank 4008.
//
// Rulings:
//   [2024-11-08] Because damage remains marked on a creature until the damage is removed as the
//     turn ends, nonlethal damage dealt to a Cat you control may become lethal if King of the
//     Pride leaves the battlefield during that turn.

export default defineCard({
  name: "King of the Pride",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat"],
  power: 2,
  toughness: 1,
  text: "Other Cats you control get +2/+1.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Cat" },
      grantPt: [2, 1],
      text: "Other Cats you control get +2/+1.",
    },
  ],
});
