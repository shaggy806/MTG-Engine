import { defineCard } from "../define.js";

export default defineCard({
  name: "Blessed Orator",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Cleric"],
  power: 1,
  toughness: 4,
  text: "Other creatures you control get +0/+1.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantPt: [0, 1],
      text: "Other creatures you control get +0/+1.",
    },
  ],
});
