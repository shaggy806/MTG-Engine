import { defineCard } from "../define.js";

// EDHREC rank 2866.
//
// Rulings:
//   [2004-10-04] Whether or not a creature is without flying is only checked on resolution.

export default defineCard({
  name: "Earthquake",
  manaCost: "{X}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Earthquake deals X damage to each creature without flying and each player.",
  effect: {
    kind: "sequence",
    simultaneous: true,
    effects: [
      { kind: "damage-all", filter: { type: "creature", notKeyword: "flying" }, amount: "x" },
      { kind: "damage", amount: "x", who: "each-player" },
    ],
  },
});
