import { defineCard } from "../define.js";

// EDHREC rank 4310.

export default defineCard({
  name: "Squirrel Sovereign",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Squirrel", "Noble"],
  power: 2,
  toughness: 2,
  text: "Other Squirrels you control get +1/+1.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Squirrel" },
      grantPt: [1, 1],
      text: "Other Squirrels you control get +1/+1.",
    },
  ],
});
