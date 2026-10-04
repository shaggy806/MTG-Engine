import { defineCard } from "../define.js";

// EDHREC rank 5286.

// Discard first, then draw — from an empty hand the draw still happens.
export default defineCard({
  name: "Romantic Rendezvous",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Discard a card, then draw two cards.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "discard", target: "you", amount: 1 },
      { kind: "draw", amount: 2 },
    ],
  },
});
