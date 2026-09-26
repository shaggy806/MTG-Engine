import { defineCard } from "../define.js";

export default defineCard({
  name: "Rising of the Day",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "Creatures you control have haste.\nLegendary creatures you control get +1/+0.",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["haste"],
      text: "Creatures you control have haste.",
    },
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", supertype: "legendary", controlledBy: "you" },
      },
      grantPt: [1, 0],
      text: "Legendary creatures you control get +1/+0.",
    },
  ],
});
