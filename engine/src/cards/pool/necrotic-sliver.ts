import { defineCard } from "../define.js";

// EDHREC rank 5150.
//
// Rulings:
//   [2013-07-01] Abilities that Slivers grant, as well as power/toughness boosts, are cumulative.
//     However, for some abilities, like flying, having more than one instance of the ability
//     doesn't provide any additional benefit.
//   [2013-07-01] If the creature type of a Sliver changes so it's no longer a Sliver, it will no
//     longer be affected by its own ability. Its ability will continue to affect other Sliver
//     creatures.

// Harmonic Sliver's shape (every Sliver, whoever controls it), granting an
// activated ability as Ygra does ("Sacrifice this permanent" is the Sliver's
// own sacrifice).
const GRANTED_TEXT = "{3}, Sacrifice this permanent: Destroy target permanent.";
const TEXT = `All Slivers have "${GRANTED_TEXT}"`;

export default defineCard({
  name: "Necrotic Sliver",
  manaCost: "{1}{W}{B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 2,
  toughness: 2,
  text: TEXT,
  static: [
    {
      affects: { scope: "filter", filter: { subtype: "Sliver" } },
      grantsActivated: [
        {
          cost: { mana: "{3}", tap: false, sacrifice: "self" },
          targets: ["permanent"],
          effect: { kind: "destroy", target: 0 },
          resolve: null,
          text: GRANTED_TEXT,
        },
      ],
      text: TEXT,
    },
  ],
});
