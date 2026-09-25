import { defineCard } from "../define.js";

export default defineCard({
  name: "Aggressive Mammoth",
  manaCost: "{3}{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elephant"],
  power: 8,
  toughness: 8,
  keywords: ["trample"],
  text: "Trample (This creature can deal excess combat damage to the player or planeswalker it's attacking.)\nOther creatures you control have trample.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantKeywords: ["trample"],
      text: "Other creatures you control have trample.",
    },
  ],
});
