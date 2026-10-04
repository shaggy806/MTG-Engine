import { defineCard } from "../define.js";

// EDHREC rank 3761.
//
// Rulings:
//   [2017-11-17] If the chosen target is illegal when Lightning Helix tries to resolve, it won't
//     resolve and none of its effects will happen. You won't gain 3 life.

export default defineCard({
  name: "Lightning Helix",
  manaCost: "{R}{W}",
  colors: ["W", "R"],
  types: ["instant"],
  text: "Lightning Helix deals 3 damage to any target and you gain 3 life.",
  targets: ["any-target"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "damage", amount: 3, target: 0 },
      { kind: "gain-life", amount: 3 },
    ],
  },
});
