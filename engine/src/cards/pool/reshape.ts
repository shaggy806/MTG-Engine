import { defineCard } from "../define.js";

// EDHREC rank 3113.
//
// Rulings:
//   [2020-08-07] If a card in a player's library has {X} in its mana cost, X is considered to be 0
//     for that card.

export default defineCard({
  name: "Reshape",
  manaCost: "{X}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "As an additional cost to cast this spell, sacrifice an artifact.\nSearch your library for an artifact card with mana value X or less, put it onto the battlefield, then shuffle.",
  additionalCost: { sacrifice: { type: "artifact", controlledBy: "you" } },
  // Chord of Calling's X-bounded search, to the battlefield.
  effect: {
    kind: "search-library",
    filter: { type: "artifact", manaValue: { op: "lte", n: "x" } },
    destination: "battlefield",
    min: 0,
    max: 1,
  },
});
