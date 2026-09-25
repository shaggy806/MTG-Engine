import { defineCard } from "../define.js";

export default defineCard({
  name: "Chief of the Edge",
  manaCost: "{W}{B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 3,
  toughness: 2,
  text: "Other Warrior creatures you control get +1/+0.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Warrior" },
      grantPt: [1, 0],
      text: "Other Warrior creatures you control get +1/+0.",
    },
  ],
});
