import { defineCard } from "../define.js";

// EDHREC rank 4069.
//
// Rulings:
//   [2013-07-01] Abilities that Slivers grant, as well as power/toughness boosts, are cumulative.
//     However, for some abilities, like flying, having more than one instance of the ability
//     doesn’t provide any additional benefit.
//   [2013-07-01] If you change the creature type of a Sliver you control so it’s no longer a
//     Sliver, it will no longer be affected by its own ability. Its ability will continue to
//     affect other Sliver creatures you control.

export default defineCard({
  name: "Galerider Sliver",
  manaCost: "{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 1,
  toughness: 1,
  text: "Sliver creatures you control have flying.",
  static: [
    {
      // Itself included: it's a Sliver creature you control (Cloudshredder Sliver's shape).
      affects: { scope: "creatures-you-control", subtype: "Sliver" },
      grantKeywords: ["flying"],
      text: "Sliver creatures you control have flying.",
    },
  ],
});
