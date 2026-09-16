import { defineCard } from "../define.js";

export default defineCard({
  name: "Dictate of Heliod",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  keywords: ["flash"],
  text: "Flash\nCreatures you control get +2/+2.",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantPt: [2, 2],
      text: "Creatures you control get +2/+2.",
    },
  ],
});
