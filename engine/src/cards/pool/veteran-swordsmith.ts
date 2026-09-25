import { defineCard } from "../define.js";

export default defineCard({
  name: "Veteran Swordsmith",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 2,
  text: "Other Soldier creatures you control get +1/+0.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Soldier" },
      grantPt: [1, 0],
      text: "Other Soldier creatures you control get +1/+0.",
    },
  ],
});
