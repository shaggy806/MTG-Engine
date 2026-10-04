import { defineCard } from "../define.js";

// EDHREC rank 4320.
//
// Rulings:
//   [2013-07-01] If the creature type of a Sliver changes so it's no longer a Sliver, it will no
//     longer be affected by its own ability. Its ability will continue to affect other Sliver
//     creatures.

const TEXT = "Slivers can't be blocked except by Slivers.";

export default defineCard({
  name: "Shifting Sliver",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 2,
  toughness: 2,
  text: TEXT,
  static: [
    {
      // Every Sliver, whoever controls it; Prowler's Helm's "except by Walls" shape.
      affects: { scope: "filter", filter: { type: "creature", subtype: "Sliver" } },
      cantBeBlockedBy: { notSubtypes: ["Sliver"] },
      text: TEXT,
    },
  ],
});
