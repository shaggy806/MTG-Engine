import { defineCard } from "../define.js";

// EDHREC rank 3917.
//
// Rulings:
//   [2025-06-06] You pay all costs and follow all timing rules for cards played this way. For
//     example, if the exiled card is a land card, you may play it only during your main phase
//     while the stack is empty and only if you have an available land play remaining.

export default defineCard({
  name: "Haste Magic",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Target creature gets +3/+1 and gains haste until end of turn. Exile the top card of your library. You may play it until your next end step.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 3, toughness: 1, duration: "end-of-turn" },
      { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
      // Rocco, Street Chef's "until your next end step".
      { kind: "impulse-exile", amount: 1, duration: "your-next-end-step" },
    ],
  },
});
