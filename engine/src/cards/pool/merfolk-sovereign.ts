import { defineCard } from "../define.js";

// EDHREC rank 4143.
//
// Rulings:
//   [2009-10-01] To have any effect, Merfolk Sovereign's activated ability must be activated
//     before the declare blockers step begins. Once a Merfolk has become blocked, activating
//     Merfolk Sovereign's ability won't change that.

export default defineCard({
  name: "Merfolk Sovereign",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Noble"],
  power: 2,
  toughness: 2,
  text: "Other Merfolk creatures you control get +1/+1.\n{T}: Target Merfolk creature can't be blocked this turn.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [{ kind: "permanent", filter: { type: "creature", subtype: "Merfolk" } }],
      effect: { kind: "grant-keyword", target: 0, keyword: "unblockable", duration: "end-of-turn" },
      resolve: null,
      text: "{T}: Target Merfolk creature can't be blocked this turn.",
    },
  ],
  static: [
    {
      affects: { scope: "creatures-you-control", excludeSelf: true, subtype: "Merfolk" },
      grantPt: [1, 1],
      text: "Other Merfolk creatures you control get +1/+1.",
    },
  ],
});
