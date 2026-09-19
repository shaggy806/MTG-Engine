import { defineCard } from "../define.js";

export default defineCard({
  name: "Big Score",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["instant"],
  text:
    "As an additional cost to cast this spell, discard a card.\n" +
    "Draw two cards and create two Treasure tokens.",
  additionalCost: { discard: 1 },
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 2 },
      { kind: "create-token", token: "Treasure Token", count: 2 },
    ],
  },
});
