import { defineCard } from "../define.js";

// EDHREC rank 5806.

export default defineCard({
  name: "Cruel Tutor",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Search your library for a card, then shuffle and put that card on top. You lose 2 life.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "search-library", filter: {}, destination: "library-top", min: 1, max: 1 },
      { kind: "lose-life", amount: 2 },
    ],
  },
});
