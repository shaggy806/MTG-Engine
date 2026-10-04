import { defineCard } from "../define.js";

// EDHREC rank 4318.
//
// Rulings:
//   [2004-10-04] The ability only applies while this card is on the battlefield.
//   [2013-07-01] If the creature type of a Sliver changes so it's no longer a Sliver, it will no
//     longer be affected by its own ability. Its ability will continue to affect other Sliver
//     creatures.

const TEXT = "All Slivers have shroud. (They can't be the targets of spells or abilities.)";

export default defineCard({
  name: "Crystalline Sliver",
  manaCost: "{W}{U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Sliver"],
  power: 2,
  toughness: 2,
  text: TEXT,
  static: [
    {
      // Every Sliver, whoever controls it (Harmonic Sliver's scope).
      affects: { scope: "filter", filter: { subtype: "Sliver" } },
      grantKeywords: ["shroud"],
      text: TEXT,
    },
  ],
});
