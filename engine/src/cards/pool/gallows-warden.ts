import { defineCard } from "../define.js";

export default defineCard({
  name: "Gallows Warden",
  manaCost: "{4}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nOther Spirit creatures you control get +0/+1.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Spirit" },
      grantPt: [0, 1],
      text: "Other Spirit creatures you control get +0/+1.",
    },
  ],
});
