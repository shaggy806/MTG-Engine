import { defineCard } from "../define.js";

// EDHREC rank 3791.
//
// Rulings:
//   [2020-08-07] Because damage remains marked on a creature until the damage is removed as the
//     turn ends, nonlethal damage dealt to artifact creatures you control may become lethal if
//     Tempered Steel leaves the battlefield during that turn.

const TEXT = "Artifact creatures you control get +2/+2.";

export default defineCard({
  name: "Tempered Steel",
  manaCost: "{1}{W}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: TEXT,
  static: [
    {
      affects: { scope: "filter", filter: { types: ["artifact", "creature"], controlledBy: "you" } },
      grantPt: [2, 2],
      text: TEXT,
    },
  ],
});
