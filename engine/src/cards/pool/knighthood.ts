import { defineCard } from "../define.js";

export default defineCard({
  name: "Knighthood",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: "Creatures you control have first strike.",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["first-strike"],
      text: "Creatures you control have first strike.",
    },
  ],
});
