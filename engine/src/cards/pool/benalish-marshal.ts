import { defineCard } from "../define.js";

export default defineCard({
  name: "Benalish Marshal",
  manaCost: "{W}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Knight"],
  power: 3,
  toughness: 3,
  text: "Other creatures you control get +1/+1.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantPt: [1, 1],
      text: "Other creatures you control get +1/+1.",
    },
  ],
});
