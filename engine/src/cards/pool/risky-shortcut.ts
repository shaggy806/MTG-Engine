import { defineCard } from "../define.js";

// EDHREC rank 3611.

export default defineCard({
  name: "Risky Shortcut",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Draw two cards. Each player loses 2 life.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 2 },
      { kind: "lose-life", amount: 2, who: "each-player" },
    ],
  },
});
