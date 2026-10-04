import { defineCard } from "../define.js";

// EDHREC rank 3755.
//
// Compulsive Research's shape: one basic land card is a whole answer by
// itself, in place of two cards.
export default defineCard({
  name: "Thirst for Discovery",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Draw three cards. Then discard two cards unless you discard a basic land card.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 3 },
      { kind: "discard", target: "you", amount: 2, unlessOne: { supertype: "basic", type: "land" } },
    ],
  },
});
