import { defineCard } from "../define.js";

// EDHREC rank 2486.

export default defineCard({
  name: "Infectious Inquiry",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "You draw two cards and you lose 2 life. Each opponent gets a poison counter.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 2 },
      { kind: "lose-life", amount: 2, who: "you" },
      { kind: "add-player-counters", counter: "poison", amount: 1, who: "each-opponent" },
    ],
  },
});
