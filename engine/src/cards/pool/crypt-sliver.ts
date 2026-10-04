import { defineCard } from "../define.js";

// EDHREC rank 5425.
//
// Rulings:
//   [2013-07-01] If the creature type of a Sliver changes so it’s no longer a Sliver, it will no
//     longer be affected by its own ability. Its ability will continue to affect other Sliver
//     creatures.
//   [2013-07-01] Abilities that Slivers grant, as well as power/toughness boosts, are cumulative.
//     However, for some abilities, like flying, having more than one instance of the ability
//     doesn’t provide any additional benefit.

export default defineCard({
  name: "Crypt Sliver",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 1,
  toughness: 1,
  text: "All Slivers have \"{T}: Regenerate target Sliver.\"",
  static: [
    {
      // Every Sliver, whoever controls it, this one included while it's a
      // Sliver; the granted ability is that Sliver's own.
      affects: { scope: "filter", filter: { subtype: "Sliver" } },
      grantsActivated: [
        {
          cost: { mana: null, tap: true },
          targets: [{ kind: "permanent", filter: { subtype: "Sliver" } }],
          effect: { kind: "regenerate", target: 0 },
          resolve: null,
          text: "{T}: Regenerate target Sliver.",
        },
      ],
      text: "All Slivers have \"{T}: Regenerate target Sliver.\"",
    },
  ],
});
