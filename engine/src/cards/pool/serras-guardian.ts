import { defineCard } from "../define.js";

export default defineCard({
  name: "Serra's Guardian",
  manaCost: "{4}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Angel"],
  power: 5,
  toughness: 5,
  keywords: ["flying", "vigilance"],
  text: "Flying (This creature can't be blocked except by creatures with flying or reach.)\nVigilance (Attacking doesn't cause this creature to tap.)\nOther creatures you control have vigilance.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantKeywords: ["vigilance"],
      text: "Other creatures you control have vigilance.",
    },
  ],
});
