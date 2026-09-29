import { defineCard } from "../define.js";

// "Each other player" is each opponent at a table without teams. Cards, not
// players: an opponent with an empty hand discards nothing and adds nothing.
export default defineCard({
  name: "Syphon Mind",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Each other player discards a card. You draw a card for each card discarded this way.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "discard", target: "each-opponent", amount: 1 },
      { kind: "draw", amount: { thisWay: "discarded", who: "each-opponent" } },
    ],
  },
});
