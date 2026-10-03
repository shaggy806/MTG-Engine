import { defineCard } from "../define.js";

// The rest go on the bottom in an order the caster picks once the two are in
// hand (`"bottom-any-order"`).
export default defineCard({
  name: "Stock Up",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Look at the top five cards of your library. Put two of them into your hand and the rest on the bottom of your library in any order.",
  effect: {
    kind: "look-and-choose",
    zone: "library",
    count: 5,
    min: 2,
    max: 2,
    destination: "hand",
    leftover: "bottom-any-order",
  },
});
