import { defineCard } from "../define.js";

export default defineCard({
  name: "Empyrean Eagle",
  manaCost: "{1}{W}{U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Bird", "Spirit"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nOther creatures you control with flying get +1/+1.",
  static: [
    {
      affects: { scope: "creatures-you-control", withKeyword: "flying", excludeSelf: true },
      grantPt: [1, 1],
      text: "Other creatures you control with flying get +1/+1.",
    },
  ],
});
