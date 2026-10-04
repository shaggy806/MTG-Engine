import { defineCard } from "../define.js";

// EDHREC rank 5713.
//
// Rulings:
//   [2005-10-01] If there are fewer than three cards in your library, follow the instructions in
//     the order given for any cards that are there.

export default defineCard({
  name: "Telling Time",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Look at the top three cards of your library. Put one of those cards into your hand, one on top of your library, and one on the bottom of your library.",
  // Expressive Iteration's shape: one to hand, one to the bottom, and the one
  // left stays where it is — on top of the library.
  effect: {
    kind: "look-and-choose",
    zone: "library",
    count: 3,
    min: 1,
    max: 1,
    destination: "hand",
    secondPick: { min: 1, max: 1, destination: "library-bottom" },
    leftover: "stay",
  },
});
