import { defineCard } from "../define.js";

// EDHREC rank 4505.
//
// Rulings:
//   [2020-08-07] In a multiplayer game, if a player leaves the game, all cards that player owns
//     leave as well. If you leave the game, the permanent you control from Beacon of Unrest is
//     exiled.
//   [2020-08-07] If the target card is an illegal target by the time Beacon of Unrest tries to
//     resolve, the spell won't resolve. You won't shuffle it into your library.

export default defineCard({
  name: "Beacon of Unrest",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Put target artifact or creature card from a graveyard onto the battlefield under your control. Shuffle Beacon of Unrest into its owner's library.",
  targets: [{ kind: "card-in-graveyard", filter: { typesAnyOf: ["artifact", "creature"] } }],
  effect: { kind: "put-onto-battlefield", target: 0, underYourControl: true },
  // Only on resolving: a fizzled Beacon goes to the graveyard (the ruling).
  shuffleIntoLibraryOnResolve: true,
});
