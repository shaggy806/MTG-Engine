import { defineCard } from "../define.js";

// "That player" is the player whose draw step it is, who has already made
// the step's draw by the time this resolves (its ruling). They put every card
// in their hand on the bottom in the order they pick (`"library-bottom"` —
// the last picked lowest; rule 401.4), then draw as many as went there
// (`"put-on-bottom"` this way). Each Puzzle Box triggers separately.
const TEXT =
  "At the beginning of each player's draw step, that player puts the cards in their hand on the bottom of their library in any order, then draws that many cards.";

export default defineCard({
  name: "Teferi's Puzzle Box",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "step-begins", step: "draw", who: "any" },
      targets: [],
      effect: {
        kind: "for-each-player",
        who: "active-player",
        effect: {
          kind: "sequence",
          effects: [
            {
              kind: "look-and-choose",
              player: "that-player",
              zone: "hand",
              min: { cardsInHand: "that-player" },
              max: { cardsInHand: "that-player" },
              destination: "library-bottom",
              leftover: "stay",
            },
            {
              kind: "draw",
              amount: { thisWay: "put-on-bottom", who: "that-player" },
              who: "that-player",
            },
          ],
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
