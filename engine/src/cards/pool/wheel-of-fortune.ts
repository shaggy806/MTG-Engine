import { defineCard } from "../define.js";

export default defineCard({
  name: "Wheel of Fortune",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Each player discards their hand, then draws seven cards.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "discard-hand", who: "each-player" },
      { kind: "draw", amount: 7, who: "each-player" },
    ],
  },
});
