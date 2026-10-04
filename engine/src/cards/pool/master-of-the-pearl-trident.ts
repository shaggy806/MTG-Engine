import { defineCard } from "../define.js";

// EDHREC rank 3489.
//
// Rulings:
//   [2021-03-19] Because damage remains marked on a creature until the damage is removed as the
//     turn ends, nonlethal damage dealt to a Merfolk you control may become lethal if Master of
//     the Pearl Trident leaves the battlefield during that turn.

export default defineCard({
  name: "Master of the Pearl Trident",
  manaCost: "{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk"],
  power: 2,
  toughness: 2,
  text: "Other Merfolk creatures you control get +1/+1 and have islandwalk. (They can't be blocked as long as defending player controls an Island.)",
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Merfolk", excludeSelf: true },
      grantPt: [1, 1],
      grantKeywords: ["islandwalk"],
      text: "Other Merfolk creatures you control get +1/+1 and have islandwalk.",
    },
  ],
});
