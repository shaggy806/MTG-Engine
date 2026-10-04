import { defineCard } from "../define.js";

// EDHREC rank 3422.
//
// Rulings:
//   [2019-06-14] If Cloudshredder Sliver leaves the battlefield during combat, any attacking
//     Slivers that came under your control this turn will continue to attack, even though they
//     will no longer have haste.

const TEXT = "Sliver creatures you control have flying and haste.";

export default defineCard({
  name: "Cloudshredder Sliver",
  manaCost: "{R}{W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 1,
  toughness: 1,
  text: TEXT,
  static: [
    {
      // Itself included: it's a Sliver creature you control.
      affects: { scope: "creatures-you-control", subtype: "Sliver" },
      grantKeywords: ["flying", "haste"],
      text: TEXT,
    },
  ],
});
