import { defineCard } from "../define.js";

export default defineCard({
  name: "Kongming, \"Sleeping Dragon\"",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Advisor"],
  power: 2,
  toughness: 2,
  text: "Other creatures you control get +1/+1.",
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantPt: [1, 1],
      text: "Other creatures you control get +1/+1.",
    },
  ],
});
