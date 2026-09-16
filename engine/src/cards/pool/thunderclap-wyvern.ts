import { defineCard } from "../define.js";

export default defineCard({
  name: "Thunderclap Wyvern",
  manaCost: "{2}{W}{U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Drake"],
  power: 2,
  toughness: 3,
  keywords: ["flash", "flying"],
  text: "Flash\nFlying\nOther creatures you control with flying get +1/+1.",
  static: [
    {
      affects: { scope: "creatures-you-control", withKeyword: "flying", excludeSelf: true },
      grantPt: [1, 1],
      text: "Other creatures you control with flying get +1/+1.",
    },
  ],
});
