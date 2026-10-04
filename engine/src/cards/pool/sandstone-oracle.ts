import { defineCard } from "../define.js";

// EDHREC rank 4274.
//
// Rulings:
//   [2020-11-10] You choose an opponent while Sandstone Oracle's ability is resolving. No player
//     may take actions between the time you make this choice and the time you draw cards.
//   [2020-11-10] To draw cards equal to the difference, first determine how many cards you'll
//     draw, then draw that many cards, as modified by replacement effects. For example, if you
//     have two cards in hand and the chosen opponent has five, Thought Reflection will cause you
//     to draw six cards instead of three.

const TEXT =
  "When this creature enters, choose an opponent. If that player has more cards in hand than you, draw cards equal to the difference.";

export default defineCard({
  name: "Sandstone Oracle",
  manaCost: "{7}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Sphinx"],
  power: 4,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      // The difference never goes below 0, so an opponent with no more cards
      // than you draws you nothing. One draw of that many, its count fixed first.
      effect: {
        kind: "choose-opponent",
        then: {
          kind: "draw",
          amount: { difference: [{ cardsInHand: "that-player" }, { cardsInHand: "you" }] },
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
