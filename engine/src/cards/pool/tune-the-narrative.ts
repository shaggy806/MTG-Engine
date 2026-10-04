import { defineCard } from "../define.js";

// EDHREC rank 6042.

export default defineCard({
  name: "Tune the Narrative",
  manaCost: "{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Draw a card. You get {E}{E} (two energy counters).",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 1 },
      { kind: "get-energy", amount: 2 },
    ],
  },
});
