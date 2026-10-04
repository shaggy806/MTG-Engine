import { defineCard } from "../define.js";

// EDHREC rank 2630.
//
// Rulings:
//   [2004-10-04] Due to errata, you no longer shuffle your library.
//   [2004-10-04] This is not a draw.
// Experimental Augury's shape: the one chosen goes to hand, the rest on the
// bottom in an order the caster picks.
export default defineCard({
  name: "Impulse",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Look at the top four cards of your library. Put one of them into your hand and the rest on the bottom of your library in any order.",
  effect: {
    kind: "look-and-choose",
    zone: "library",
    count: 4,
    min: 1,
    max: 1,
    destination: "hand",
    leftover: "bottom-any-order",
  },
});
