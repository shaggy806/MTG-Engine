import { defineCard } from "../define.js";

export default defineCard({
  name: "Goblin Chieftain",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin"],
  power: 2,
  toughness: 2,
  keywords: ["haste"],
  text: "Other Goblin creatures you control get +1/+1 and have haste.",
  static: [
    {
      affects: {
        scope: "creatures-you-control",
        subtype: "Goblin",
        excludeSelf: true,
      },
      grantPt: [1, 1],
      grantKeywords: ["haste"],
      text: "Other Goblin creatures you control get +1/+1 and have haste.",
    },
  ],
});
