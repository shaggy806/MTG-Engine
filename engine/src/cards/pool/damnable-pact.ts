import { defineCard } from "../define.js";

// EDHREC rank 3178.

export default defineCard({
  name: "Damnable Pact",
  manaCost: "{X}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Target player draws X cards and loses X life.",
  targets: ["player"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: "x", target: 0 },
      { kind: "lose-life", amount: "x", target: 0 },
    ],
  },
});
