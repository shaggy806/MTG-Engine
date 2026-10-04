import { defineCard } from "../define.js";

// EDHREC rank 5923.

export default defineCard({
  name: "Ancient Craving",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "You draw three cards and you lose 3 life.",
  // Ambition's Cost's shape.
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 3 },
      { kind: "lose-life", amount: 3 },
    ],
  },
});
