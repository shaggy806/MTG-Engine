import { defineCard } from "../define.js";

// EDHREC rank 6112.
//
// Rulings:
//   [2024-06-07] {E} is the energy symbol. It represents one energy counter.
//   [2024-06-07] If an effect says you get one or more {E}, you get that many energy counters.

export default defineCard({
  name: "Glimmer of Genius",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Scry 2, then draw two cards. You get {E}{E} (two energy counters).",
  // Deliberate's scry-then-draw; a `sequence` waits for the scry's decisions
  // (and its `then`) before the energy.
  effect: {
    kind: "sequence",
    effects: [
      { kind: "scry", amount: 2, then: { kind: "draw", amount: 2 } },
      { kind: "get-energy", amount: 2 },
    ],
  },
});
