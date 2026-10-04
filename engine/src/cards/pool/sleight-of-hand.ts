import { defineCard } from "../define.js";

// EDHREC rank 2971.
// With only one card in your library, you put it into your hand (the ruling).

export default defineCard({
  name: "Sleight of Hand",
  manaCost: "{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Look at the top two cards of your library. Put one of them into your hand and the other on the bottom of your library.",
  effect: {
    kind: "look-and-choose",
    zone: "library",
    count: 2,
    min: 1,
    max: 1,
    destination: "hand",
    leftover: "bottom-any-order",
  },
});
