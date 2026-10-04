import { defineCard } from "../define.js";

// EDHREC rank 4909.
//
// Rulings:
//   [2026-03-20] If a card in a graveyard has {X} in its mana cost, X is 0 for the purpose of
//     determining its mana value.

export default defineCard({
  name: "Helping Hand",
  manaCost: "{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Return target creature card with mana value 3 or less from your graveyard to the battlefield tapped.",
  targets: [
    {
      kind: "card-in-graveyard",
      whose: "you",
      filter: { type: "creature", manaValue: { op: "lte", n: 3 } },
    },
  ],
  effect: { kind: "put-onto-battlefield", target: 0, enterTapped: true },
});
