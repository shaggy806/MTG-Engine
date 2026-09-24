import { defineCard } from "../define.js";

export default defineCard({
  name: "Intangible Virtue",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: "Creature tokens you control get +1/+1 and have vigilance.",
  static: [
    {
      affects: { scope: "creatures-you-control", tokenOnly: true },
      grantPt: [1, 1],
      grantKeywords: ["vigilance"],
      text: "Creature tokens you control get +1/+1 and have vigilance.",
    },
  ],
});
