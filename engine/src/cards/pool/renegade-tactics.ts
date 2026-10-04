import { defineCard } from "../define.js";

// EDHREC rank 3318.
//
// Rulings:
//   [2020-11-10] If the target creature is an illegal target by the time Renegade Tactics tries to
//     resolve, the spell doesn't resolve. You don't draw a card.

export default defineCard({
  name: "Renegade Tactics",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "Target creature can't block this turn.\nDraw a card.",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "restrict", target: 0, restrictions: ["cant-block"] },
      { kind: "draw", amount: 1 },
    ],
  },
});
