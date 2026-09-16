import { defineCard } from "../define.js";

export default defineCard({
  name: "True Conviction",
  manaCost: "{3}{W}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: "Creatures you control have double strike and lifelink.",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["double-strike", "lifelink"],
      text: "Creatures you control have double strike and lifelink.",
    },
  ],
});
