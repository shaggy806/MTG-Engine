import { defineCard } from "../define.js";

// EDHREC rank 2750.
//
// Rulings:
//   [2004-10-04] The player can put the cards in their graveyard in any order they choose.
//
// The half is read as the spell resolves (Cut Your Losses' shape).

export default defineCard({
  name: "Traumatize",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Target player mills half their library, rounded down.",
  targets: ["player"],
  effect: { kind: "mill", target: 0, amount: { half: { librarySize: "each" }, round: "down" } },
});
