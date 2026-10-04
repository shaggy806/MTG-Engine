import { defineCard } from "../define.js";

// EDHREC rank 3136.
//
// Rulings:
//   [2004-10-04] It counts how many cards you discard. Since this card will not be in your hand
//     at that time, this card is not counted.

export default defineCard({
  name: "Tolarian Winds",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Discard all the cards in your hand, then draw that many cards.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "discard-hand", who: "you" },
      { kind: "draw", amount: { thisWay: "discarded" } },
    ],
  },
});
