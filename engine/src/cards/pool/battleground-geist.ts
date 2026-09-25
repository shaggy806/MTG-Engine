import { defineCard } from "../define.js";

export default defineCard({
  name: "Battleground Geist",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nOther Spirit creatures you control get +1/+0.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Spirit" },
      grantPt: [1, 0],
      text: "Other Spirit creatures you control get +1/+0.",
    },
  ],
});
