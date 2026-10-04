import { defineCard } from "../define.js";

// EDHREC rank 4833.

export default defineCard({
  name: "Brainstone",
  manaCost: "{1}",
  colors: [],
  types: ["artifact"],
  text: "{2}, {T}, Sacrifice this artifact: Draw three cards, then put two cards from your hand on top of your library in any order.",
  activated: [
    {
      cost: { mana: "{2}", tap: true, sacrifice: "self" },
      targets: [],
      // Brainstorm's shape: the put-back is a look-and-choose over the hand.
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 3 },
          { kind: "look-and-choose", zone: "hand", min: 2, max: 2, destination: "library-top", leftover: "stay" },
        ],
      },
      resolve: null,
      text: "{2}, {T}, Sacrifice this artifact: Draw three cards, then put two cards from your hand on top of your library in any order.",
    },
  ],
});
