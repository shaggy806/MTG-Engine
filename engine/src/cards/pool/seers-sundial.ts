import { defineCard } from "../define.js";

// EDHREC rank 4422.
//
// Rulings:
//   [2010-03-01] You choose whether to pay {2} as the ability resolves. You may pay {2} only once
//     per resolution.

export default defineCard({
  name: "Seer's Sundial",
  manaCost: "{4}",
  colors: [],
  types: ["artifact"],
  text: "Landfall — Whenever a land you control enters, you may pay {2}. If you do, draw a card.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { type: "land" } },
      targets: [],
      effect: { kind: "may", prompt: "Pay {2} to draw a card?", cost: "{2}", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: "Landfall — Whenever a land you control enters, you may pay {2}. If you do, draw a card.",
    },
  ],
});
