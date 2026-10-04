import { defineCard } from "../define.js";

// EDHREC rank 3503.
//
// Rulings:
//   [2023-02-04] If the target creature is an illegal target by the time the spell tries to
//     resolve (most likely because it has left the battlefield in response), the spell will not
//     resolve. No card will be exiled.
//   [2023-02-04] You pay all costs and follow all normal timing rules for a card played this way.
//     For example, if the exiled card is a land card, you may play it only during your main phase
//     while the stack is empty.

export default defineCard({
  name: "Blazing Crescendo",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Target creature gets +3/+1 until end of turn.\nExile the top card of your library. Until the end of your next turn, you may play that card.",
  targets: ["creature"],
  // An illegal target fizzles the whole spell, so nothing is exiled (the ruling).
  effect: {
    kind: "sequence",
    effects: [
      { kind: "modify-pt", target: 0, power: 3, toughness: 1, duration: "end-of-turn" },
      { kind: "impulse-exile", amount: 1, duration: "your-next-turn" },
    ],
  },
});
