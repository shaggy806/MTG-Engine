import { defineCard } from "../define.js";

// EDHREC rank 4605.
//
// Rulings:
//   [2013-07-01] If you change the creature type of a Sliver you control so it’s no longer a
//     Sliver, it will no longer be affected by its own ability. Its ability will continue to
//     affect other Sliver creatures you control.
//   [2013-07-01] Abilities that Slivers grant, as well as power/toughness boosts, are cumulative.
//     However, for some abilities, like flying, having more than one instance of the ability
//     doesn’t provide any additional benefit.

export default defineCard({
  name: "Syphon Sliver",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 2,
  toughness: 2,
  text: "Sliver creatures you control have lifelink. (Damage dealt by a Sliver creature you control also causes you to gain that much life.)",
  static: [
    {
      // Galerider Sliver's shape, itself included.
      affects: { scope: "creatures-you-control", subtype: "Sliver" },
      grantKeywords: ["lifelink"],
      text: "Sliver creatures you control have lifelink.",
    },
  ],
});
