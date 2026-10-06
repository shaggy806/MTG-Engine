import { defineCard } from "../define.js";

// Rulings:
//   [2021-03-19] You won't lose the game until you try to draw from the empty library.

const TEXT = "When this creature enters, exile all cards from your library.";

export default defineCard({
  name: "Leveler",
  manaCost: "{5}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Juggernaut"],
  power: 10,
  toughness: 10,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      // "All but the bottom 0": every card, in one move.
      effect: { kind: "exile-from-library", whose: "you", allBut: 0 },
      resolve: null,
      text: TEXT,
    },
  ],
});
