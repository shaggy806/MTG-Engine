import { defineCard } from "../define.js";

export default defineCard({
  name: "Glorious Anthem",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
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
