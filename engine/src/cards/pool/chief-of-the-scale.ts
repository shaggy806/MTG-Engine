import { defineCard } from "../define.js";

export default defineCard({
  name: "Chief of the Scale",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 3,
  text: "Other Warrior creatures you control get +0/+1.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Warrior" },
      grantPt: [0, 1],
      text: "Other Warrior creatures you control get +0/+1.",
    },
  ],
});
