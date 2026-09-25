import { defineCard } from "../define.js";

export default defineCard({
  name: "Veteran Armorer",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 2,
  text: "Other creatures you control get +0/+1.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantPt: [0, 1],
      text: "Other creatures you control get +0/+1.",
    },
  ],
});
