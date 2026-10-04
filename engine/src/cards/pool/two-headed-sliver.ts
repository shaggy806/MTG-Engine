import { defineCard } from "../define.js";

// EDHREC rank 6162.
//
// Rulings:
//   [2013-07-01] If the creature type of a Sliver changes so it's no longer a Sliver, it will no
//     longer be affected by its own ability. Its ability will continue to affect other Sliver
//     creatures.
//   [2021-03-19] Multiple instances of menace on the same creature are redundant.

const TEXT = "All Sliver creatures have menace. (They can't be blocked except by two or more creatures.)";

export default defineCard({
  name: "Two-Headed Sliver",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 1,
  toughness: 1,
  text: TEXT,
  static: [
    {
      // Every Sliver creature, whoever controls it, itself included (Sinew Sliver's scope).
      affects: { scope: "filter", filter: { type: "creature", subtype: "Sliver" } },
      grantKeywords: ["menace"],
      text: "All Sliver creatures have menace.",
    },
  ],
});
