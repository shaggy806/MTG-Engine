import { defineCard } from "../define.js";

export default defineCard({
  name: "Wizened Cenn",
  manaCost: "{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Kithkin", "Cleric"],
  power: 2,
  toughness: 2,
  text: "Other Kithkin creatures you control get +1/+1.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Kithkin" },
      grantPt: [1, 1],
      text: "Other Kithkin creatures you control get +1/+1.",
    },
  ],
});
