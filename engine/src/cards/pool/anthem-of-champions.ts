import { defineCard } from "../define.js";

// EDHREC rank 6313.

export default defineCard({
  name: "Anthem of Champions",
  manaCost: "{G}{W}",
  colors: ["W", "G"],
  types: ["enchantment"],
  text: "Creatures you control get +1/+1.",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantPt: [1, 1],
      text: "Creatures you control get +1/+1.",
    },
  ],
});
