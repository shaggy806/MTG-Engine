import { defineCard } from "../define.js";

// One to hand, then one of the other two to the bottom, then the last exiled
// face up with a permission to play it (a land too) this turn.
export default defineCard({
  name: "Expressive Iteration",
  manaCost: "{U}{R}",
  colors: ["U", "R"],
  types: ["sorcery"],
  text:
    "Look at the top three cards of your library. Put one of them into your hand, put one of them on the bottom of your library, and exile one of them. You may play the exiled card this turn.",
  effect: {
    kind: "look-and-choose",
    zone: "library",
    count: 3,
    min: 1,
    max: 1,
    destination: "hand",
    secondPick: { min: 1, max: 1, destination: "library-bottom" },
    leftover: "exile-playable",
  },
});
