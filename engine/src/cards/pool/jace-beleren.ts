import { defineCard } from "../define.js";

// EDHREC rank 3602.
//
// Rulings:
//   [2009-10-01] If there are fewer than twenty cards in the targeted player's library, that
//     player puts all the cards from their library into their graveyard.

export default defineCard({
  name: "Jace Beleren",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["planeswalker"],
  subtypes: ["Jace"],
  loyalty: 3,
  text: "+2: Each player draws a card.\n−1: Target player draws a card.\n−10: Target player mills twenty cards.",
  activated: [
    {
      loyaltyCost: 2,
      cost: { mana: null, tap: false },
      targets: [],
      effect: { kind: "draw", amount: 1, who: "each-player" },
      resolve: null,
      text: "+2: Each player draws a card.",
    },
    {
      loyaltyCost: -1,
      cost: { mana: null, tap: false },
      targets: ["player"],
      effect: { kind: "draw", amount: 1, target: 0 },
      resolve: null,
      text: "−1: Target player draws a card.",
    },
    {
      loyaltyCost: -10,
      cost: { mana: null, tap: false },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: 20 },
      resolve: null,
      text: "−10: Target player mills twenty cards.",
    },
  ],
});
