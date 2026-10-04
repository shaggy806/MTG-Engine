import { defineCard } from "../define.js";

// EDHREC rank 6379.

export default defineCard({
  name: "Megantic Sliver",
  manaCost: "{5}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 3,
  toughness: 3,
  text: "Sliver creatures you control get +3/+3.",
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Sliver" },
      grantPt: [3, 3],
      text: "Sliver creatures you control get +3/+3.",
    },
  ],
});
