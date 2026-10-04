import { defineCard } from "../define.js";

// EDHREC rank 5420.
//
// Rulings:
//   [2013-07-01] If the creature type of a Sliver changes so it’s no longer a Sliver, it will no
//     longer be affected by its own ability. Its ability will continue to affect other Sliver
//     creatures.
//   [2013-07-01] Abilities that Slivers grant, as well as power/toughness boosts, are cumulative.
//     However, for some abilities, like flying, having more than one instance of the ability
//     doesn’t provide any additional benefit.

export default defineCard({
  name: "Hibernation Sliver",
  manaCost: "{U}{B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 2,
  toughness: 2,
  text: "All Slivers have \"Pay 2 life: Return this permanent to its owner's hand.\"",
  static: [
    {
      // Every Sliver, whoever controls it, this one included while it's a
      // Sliver; the granted ability is that Sliver's own.
      affects: { scope: "filter", filter: { subtype: "Sliver" } },
      grantsActivated: [
        {
          cost: { mana: null, tap: false, payLife: 2 },
          targets: [],
          effect: { kind: "return-to-hand", target: "source" },
          resolve: null,
          text: "Pay 2 life: Return this permanent to its owner's hand.",
        },
      ],
      text: "All Slivers have \"Pay 2 life: Return this permanent to its owner's hand.\"",
    },
  ],
});
