import { defineCard } from "../define.js";

// EDHREC rank 4342.

const TEXT = "Sliver creatures you control have vigilance.";

export default defineCard({
  name: "Sentinel Sliver",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 2,
  toughness: 2,
  text: `${TEXT} (Attacking doesn't cause them to tap.)`,
  static: [
    {
      // Itself included: it's a Sliver creature you control (Galerider Sliver's shape).
      affects: { scope: "creatures-you-control", subtype: "Sliver" },
      grantKeywords: ["vigilance"],
      text: TEXT,
    },
  ],
});
