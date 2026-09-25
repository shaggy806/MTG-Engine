import { defineCard } from "../define.js";

export default defineCard({
  name: "Aang, Air Nomad",
  manaCost: "{3}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Avatar", "Ally"],
  power: 5,
  toughness: 4,
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
