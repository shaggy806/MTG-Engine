import { defineCard } from "../define.js";

export default defineCard({
  name: "Veteran Armorsmith",
  manaCost: "{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 3,
  text: "Other Soldier creatures you control get +0/+1.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Soldier" },
      grantPt: [0, 1],
      text: "Other Soldier creatures you control get +0/+1.",
    },
  ],
});
