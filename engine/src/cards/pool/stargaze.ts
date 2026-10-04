import { defineCard } from "../define.js";

// EDHREC rank 4106.
//
// Rulings:
//   [2024-07-26] If your library contains fewer than twice X cards, you'll look at your whole
//     library. You'll still lose X life.
//   [2024-07-26] If your library contains fewer than X cards, you'll put them all into your hand.
//     You can't choose to put any of them into your graveyard. You'll still lose X life.
// `look-and-choose` clamps both its count and its min/max to the cards there
// are, which is both rulings.

export default defineCard({
  name: "Stargaze",
  manaCost: "{X}{B}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Look at twice X cards from the top of your library. Put X cards from among them into your hand and the rest into your graveyard. You lose X life.",
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "look-and-choose",
        zone: "library",
        count: { product: ["x", 2] },
        min: "x",
        max: "x",
        destination: "hand",
        leftover: "graveyard",
      },
      { kind: "lose-life", amount: "x" },
    ],
  },
});
