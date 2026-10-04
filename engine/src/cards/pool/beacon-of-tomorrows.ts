import { defineCard } from "../define.js";

// EDHREC rank 6144.
//
// Rulings:
//   [2007-07-15] If a Beacon is countered or doesn't resolve, it's put into its owner's graveyard,
//     not shuffled into the library.

export default defineCard({
  name: "Beacon of Tomorrows",
  manaCost: "{6}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Target player takes an extra turn after this one. Shuffle Beacon of Tomorrows into its owner's library.",
  targets: ["player"],
  effect: { kind: "take-extra-turn", target: 0 },
  // Only on resolving: a countered or fizzled Beacon goes to the graveyard (the ruling).
  shuffleIntoLibraryOnResolve: true,
});
