import { defineCard } from "../define.js";

export default defineCard({
  name: "Grim Tutor",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text:
    "Search your library for a card, put that card into your hand, then shuffle. You lose 3 life.",
  effect: {
    kind: "sequence",
    effects: [
      // "A card", no quality: one must be found while there is one (701.23d).
      { kind: "search-library", filter: {}, destination: "hand", min: 1, max: 1 },
      { kind: "lose-life", amount: 3 },
    ],
  },
});
