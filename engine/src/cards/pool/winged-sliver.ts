import { defineCard } from "../define.js";

// EDHREC rank 5976.
//
// Rulings:
//   [2013-07-01] If the creature type of a Sliver changes so it’s no longer a Sliver, it will no
//     longer be affected by its own ability. Its ability will continue to affect other Sliver
//     creatures.
//   [2013-07-01] Abilities that Slivers grant, as well as power/toughness boosts, are cumulative.
//     However, for some abilities, like flying, having more than one instance of the ability
//     doesn’t provide any additional benefit.

export default defineCard({
  name: "Winged Sliver",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 1,
  toughness: 1,
  text: "All Sliver creatures have flying.",
  static: [
    {
      // Every Sliver creature, whoever controls it, itself included (Sinew Sliver's scope).
      affects: { scope: "filter", filter: { type: "creature", subtype: "Sliver" } },
      grantKeywords: ["flying"],
      text: "All Sliver creatures have flying.",
    },
  ],
});
