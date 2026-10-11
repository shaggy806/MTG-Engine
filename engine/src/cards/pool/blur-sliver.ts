import { defineCard } from "../define.js";

// EDHREC rank 6736.
//
// Rulings: a Sliver that stops being a Sliver no longer gets its own haste,
// though the others still do; and Slivers' granted abilities are cumulative.

const TEXT = "Sliver creatures you control have haste.";

export default defineCard({
  name: "Blur Sliver",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 2,
  toughness: 2,
  text: `${TEXT} (They can attack and {T} as soon as they come under your control.)`,
  static: [
    {
      // Itself included: it's a Sliver creature you control (Bonescythe Sliver's shape).
      affects: { scope: "creatures-you-control", subtype: "Sliver" },
      grantKeywords: ["haste"],
      text: TEXT,
    },
  ],
});
