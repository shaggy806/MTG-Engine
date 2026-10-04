import { defineCard } from "../define.js";

// EDHREC rank 3070.

export default defineCard({
  name: "Legion Lieutenant",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Vampire", "Knight"],
  power: 2,
  toughness: 2,
  text: "Other Vampires you control get +1/+1.",
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Vampire", excludeSelf: true },
      grantPt: [1, 1],
      text: "Other Vampires you control get +1/+1.",
    },
  ],
});
