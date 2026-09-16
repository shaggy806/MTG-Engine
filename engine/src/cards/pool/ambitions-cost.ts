import { defineCard } from "../define.js";

export default defineCard({
  name: "Ambition's Cost",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "You draw three cards and you lose 3 life.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 3 },
      { kind: "lose-life", amount: 3 },
    ],
  },
});
