import { defineCard } from "../define.js";

export default defineCard({
  name: "Crucible of Fire",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "Dragon creatures you control get +3/+3.",
  static: [
    {
      affects: { scope: "creatures-you-control", subtype: "Dragon" },
      grantPt: [3, 3],
      text: "Dragon creatures you control get +3/+3.",
    },
  ],
});
