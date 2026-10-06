import { defineCard } from "../define.js";

// EDHREC rank 6431.
//
// Experimental Augury's shape: the one chosen goes to hand, the rest on the
// bottom in an order the caster picks.
export default defineCard({
  name: "Anticipate",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Look at the top three cards of your library. Put one of them into your hand and the rest on the bottom of your library in any order.",
  effect: {
    kind: "look-and-choose",
    zone: "library",
    count: 3,
    min: 1,
    max: 1,
    destination: "hand",
    leftover: "bottom-any-order",
  },
});
