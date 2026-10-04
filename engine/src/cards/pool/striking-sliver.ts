import { defineCard } from "../define.js";

// EDHREC rank 5171.
//
// Rulings:
//   [2013-07-01] Abilities that Slivers grant, as well as power/toughness boosts, are cumulative.
//     However, for some abilities, like flying, having more than one instance of the ability
//     doesn’t provide any additional benefit.
//   [2013-07-01] If Striking Sliver leaves the battlefield after Sliver creatures you control have
//     dealt first-strike damage but before regular combat damage, those Slivers won’t deal regular
//     combat damage (unless they have double strike for some reason).
//   [2013-07-01] If you change the creature type of a Sliver you control so it’s no longer a
//     Sliver, it will no longer be affected by its own ability. Its ability will continue to
//     affect other Sliver creatures you control.

export default defineCard({
  name: "Striking Sliver",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 1,
  toughness: 1,
  text: "Sliver creatures you control have first strike. (They deal combat damage before creatures without first strike.)",
  static: [
    {
      // Itself included (Bonescythe Sliver's shape).
      affects: { scope: "creatures-you-control", subtype: "Sliver" },
      grantKeywords: ["first-strike"],
      text: "Sliver creatures you control have first strike.",
    },
  ],
});
