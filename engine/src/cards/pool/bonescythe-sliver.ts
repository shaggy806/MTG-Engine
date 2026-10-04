import { defineCard } from "../define.js";

// EDHREC rank 4334.
//
// Rulings:
//   [2013-07-01] If Bonescythe Sliver leaves the battlefield after other Sliver creatures you
//     control have dealt first-strike damage but before regular combat damage, those Slivers won't
//     deal regular combat damage (unless they still have double strike for some other reason).

const TEXT = "Sliver creatures you control have double strike.";

export default defineCard({
  name: "Bonescythe Sliver",
  manaCost: "{3}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 2,
  toughness: 2,
  text: `${TEXT} (They deal both first-strike and regular combat damage.)`,
  static: [
    {
      // Itself included: it's a Sliver creature you control (Galerider Sliver's shape).
      affects: { scope: "creatures-you-control", subtype: "Sliver" },
      grantKeywords: ["double-strike"],
      text: TEXT,
    },
  ],
});
