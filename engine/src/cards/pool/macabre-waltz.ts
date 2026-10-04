import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

// EDHREC rank 5264.
//
// Rulings:
//   [2018-07-13] If you have no other cards in hand, you'll have to discard one of the creature
//     cards you return to your hand.
//   [2018-07-13] You may cast Macabre Waltz targeting one or zero creature cards. You'll still
//     discard a card, even if you target no creature cards.

export default defineCard({
  name: "Macabre Waltz",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Return up to two target creature cards from your graveyard to your hand, then discard a card.",
  // Zero, one or two targets; the discard happens whatever was chosen, and
  // may be one of the returned cards (the rulings).
  targets: distinctTargets(2, { kind: "card-in-graveyard", whose: "you", filter: { type: "creature" } }, { optional: true }),
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "sequence",
        simultaneous: true,
        effects: [
          { kind: "return-to-hand", target: 0, from: "graveyard" },
          { kind: "return-to-hand", target: 1, from: "graveyard" },
        ],
      },
      { kind: "discard", target: "you", amount: 1 },
    ],
  },
});
