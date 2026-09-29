import { defineCard } from "../define.js";

const TEXT = "Each opponent draws a card, then you draw a card for each opponent who drew a card this way.";

// "For each opponent who drew a card this way" counts opponents, not cards
// (the rulings): one whose draw was replaced, or who had no card to draw,
// drew nothing and isn't counted; one who drew two through a replacement
// counts once. So it's asked opponent by opponent.
export default defineCard({
  name: "Cut a Deal",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: TEXT,
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 1, who: "each-opponent" },
      {
        kind: "for-each-player",
        who: "each-opponent",
        effect: {
          kind: "conditional",
          condition: { kind: "this-way", what: "drawn", who: "that-player", atLeast: 1 },
          then: { kind: "draw", amount: 1 },
        },
      },
    ],
  },
});
