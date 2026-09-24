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
      { kind: "search-library", filter: {}, destination: "hand", min: 0, max: 1 },
      { kind: "lose-life", amount: 3 },
    ],
  },
});
