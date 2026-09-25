import { defineCard } from "../define.js";

export default defineCard({
  name: "Serra's Blessing",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: "Creatures you control have vigilance. (Attacking doesn't cause them to tap.)",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["vigilance"],
      text: "Creatures you control have vigilance.",
    },
  ],
});
