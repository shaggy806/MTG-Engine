import { defineCard } from "../define.js";

export default defineCard({
  name: "Collective Blessing",
  manaCost: "{3}{G}{G}{W}",
  colors: ["G", "W"],
  types: ["enchantment"],
  text: "Creatures you control get +3/+3.",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantPt: [3, 3],
      text: "Creatures you control get +3/+3.",
    },
  ],
});
