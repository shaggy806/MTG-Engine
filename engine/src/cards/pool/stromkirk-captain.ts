import { defineCard } from "../define.js";

// EDHREC rank 3048.

export default defineCard({
  name: "Stromkirk Captain",
  manaCost: "{1}{B}{R}",
  colors: ["B", "R"],
  types: ["creature"],
  subtypes: ["Vampire", "Soldier"],
  power: 2,
  toughness: 2,
  keywords: ["first-strike"],
  text: "First strike\nOther Vampire creatures you control get +1/+1 and have first strike.",
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Vampire", excludeSelf: true },
      grantPt: [1, 1],
      grantKeywords: ["first-strike"],
      text: "Other Vampire creatures you control get +1/+1 and have first strike.",
    },
  ],
});
