import { defineCard } from "../define.js";

// EDHREC rank 2719.
//
// Rulings:
//   [2023-05-12] You discard a card at random even if you didn't find an artifact card in your
//     library.
//   [2023-05-12] You can't do anything between putting the artifact card you found in your hand
//     and discarding. You may end up discarding that card. But hey, if you do, 2 damage!
//
// One resolution: the random discard follows the search at once, and the
// damage asks what that discard did (`this-way`).
export default defineCard({
  name: "Reckless Handling",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Search your library for an artifact card, reveal it, put it into your hand, shuffle, then discard a card at random. If an artifact card was discarded this way, Reckless Handling deals 2 damage to each opponent.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "search-library", filter: { type: "artifact" }, destination: "hand", min: 0, max: 1, reveal: true },
      { kind: "discard", target: "you", amount: 1, random: true },
      {
        kind: "conditional",
        condition: { kind: "this-way", what: "discarded", filter: { type: "artifact" } },
        then: { kind: "damage", amount: 2, who: "each-opponent" },
      },
    ],
  },
});
