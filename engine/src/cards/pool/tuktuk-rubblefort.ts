import { defineCard } from "../define.js";

export default defineCard({
  name: "Tuktuk Rubblefort",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 0,
  toughness: 3,
  keywords: ["defender", "reach"],
  text: "Defender, reach\nCreatures you control have haste.",
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["haste"],
      text: "Creatures you control have haste.",
    },
  ],
});
