import { defineCard } from "../define.js";

// EDHREC rank 2770.
//
// Rulings:
//   [2022-06-10] You must pay all costs and follow all timing rules for cards played this way. For
//     example, you may play a land exiled this way only during your main phase and only if you
//     haven't played a land yet this turn.

export default defineCard({
  name: "Inspired Tinkering",
  manaCost: "{4}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Exile the top three cards of your library. Until the end of your next turn, you may play those cards.\nCreate three Treasure tokens. (They're artifacts with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "impulse-exile", amount: 3, duration: "your-next-turn" },
      { kind: "create-token", token: "Treasure Token", count: 3 },
    ],
  },
});
