import { defineCard } from "../define.js";

// EDHREC rank 5292.
//
// Rulings:
//   [2013-07-01] If the creature type of a Sliver changes so it's no longer a Sliver, it will no
//     longer be affected by its own ability. Its ability will continue to affect other Sliver
//     creatures.
//   [2013-07-01] Abilities that Slivers grant, as well as power/toughness boosts, are cumulative.
//     However, for some abilities, like flying, having more than one instance of the ability
//     doesn't provide any additional benefit.
//   [2021-03-19] Because damage remains marked on a creature until the damage is removed as the
//     turn ends, nonlethal damage dealt to a Sliver may become lethal if Sinew Sliver leaves the
//     battlefield during that turn.
//   [2021-03-19] Sinew Sliver's ability does give itself +1/+1.

const TEXT = "All Sliver creatures get +1/+1.";

export default defineCard({
  name: "Sinew Sliver",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 1,
  toughness: 1,
  text: TEXT,
  static: [
    {
      // Every Sliver creature, whoever controls it, itself included
      // (Crystalline Sliver's scope).
      affects: { scope: "filter", filter: { type: "creature", subtype: "Sliver" } },
      grantPt: [1, 1],
      text: TEXT,
    },
  ],
});
