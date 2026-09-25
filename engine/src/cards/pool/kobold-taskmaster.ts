import { defineCard } from "../define.js";

export default defineCard({
  name: "Kobold Taskmaster",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Kobold"],
  power: 1,
  toughness: 2,
  text: "Other Kobold creatures you control get +1/+0.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Kobold" },
      grantPt: [1, 0],
      text: "Other Kobold creatures you control get +1/+0.",
    },
  ],
});
