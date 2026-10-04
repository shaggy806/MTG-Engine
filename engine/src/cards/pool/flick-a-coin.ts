import { defineCard } from "../define.js";

// EDHREC rank 3769.
//
// Rulings:
//   [2023-09-01] If the target is not legal as Flick a Coin tries to resolve, Flick a Coin is
//     removed from the stack. You won't create a Treasure token, and you won't draw a card.

export default defineCard({
  name: "Flick a Coin",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["instant"],
  text: "Flick a Coin deals 1 damage to any target. You create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")\nDraw a card.",
  targets: ["any-target"],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "damage", amount: 1, target: 0 },
      { kind: "create-token", token: "Treasure Token", count: 1 },
      { kind: "draw", amount: 1 },
    ],
  },
});
