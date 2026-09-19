import { defineCard } from "../define.js";

export default defineCard({
  name: "Seize the Spoils",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text:
    "As an additional cost to cast this spell, discard a card.\n" +
    "Draw two cards and create a Treasure token.",
  additionalCost: { discard: 1 },
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 2 },
      { kind: "create-token", token: "Treasure Token", count: 1 },
    ],
  },
});
