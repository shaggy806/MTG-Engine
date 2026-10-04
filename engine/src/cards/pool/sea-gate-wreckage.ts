import { defineCard } from "../define.js";

// EDHREC rank 5623.
//
// "Activate only if you have no cards in hand" is checked as it's activated;
// the hand as it resolves doesn't matter (the ruling).
//
// Rulings:
//   [2016-01-22] It doesn't matter how many cards are in your hand as the last ability resolves.
//     For example, if you have no cards in hand and control two Sea Gate Wreckages, you can
//     activate the last ability of each of them. You'll draw a card as each ability resolves.

const DRAW_TEXT = "{2}{C}, {T}: Draw a card. Activate only if you have no cards in hand.";

export default defineCard({
  name: "Sea Gate Wreckage",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}. ({C} represents colorless mana.)\n${DRAW_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{2}{C}", tap: true },
      condition: { kind: "hand-size", atMost: 0 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
