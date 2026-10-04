import { defineCard } from "../define.js";

// EDHREC rank 5484.
//
// Rulings:
//   [2021-09-24] If you cast Electric Revelation using flashback, you must still pay its
//     additional cost of discarding a card.

export default defineCard({
  name: "Electric Revelation",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "As an additional cost to cast this spell, discard a card.\nDraw two cards.\nFlashback {3}{R} (You may cast this card from your graveyard for its flashback cost and any additional costs. Then exile it.)",
  // Flashback still pays the discard (the ruling) — an additional cost.
  additionalCost: { discard: 1 },
  flashback: { cost: "{3}{R}" },
  effect: { kind: "draw", amount: 2 },
});
