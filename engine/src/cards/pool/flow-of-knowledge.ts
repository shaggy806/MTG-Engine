import { defineCard } from "../define.js";

// EDHREC rank 3560.

export default defineCard({
  name: "Flow of Knowledge",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Draw a card for each Island you control, then discard two cards.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: { countOf: { subtype: "Island", controlledBy: "you" } } },
      { kind: "discard", target: "you", amount: 2 },
    ],
  },
});
