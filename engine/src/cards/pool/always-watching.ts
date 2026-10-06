import { defineCard } from "../define.js";

// EDHREC rank 6583.

export default defineCard({
  name: "Always Watching",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: "Nontoken creatures you control get +1/+1 and have vigilance.",
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", controlledBy: "you", token: false } },
      grantPt: [1, 1],
      grantKeywords: ["vigilance"],
      text: "Nontoken creatures you control get +1/+1 and have vigilance.",
    },
  ],
});
