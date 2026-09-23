import { defineCard } from "../define.js";

export default defineCard({
  name: "Unexpected Windfall",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["instant"],
  text:
    "As an additional cost to cast this spell, discard a card.\n" +
    "Draw two cards and create two Treasure tokens. (They're artifacts with " +
    '"{T}, Sacrifice this token: Add one mana of any color.")',
  additionalCost: { discard: 1 },
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 2 },
      { kind: "create-token", token: "Treasure Token", count: 2 },
    ],
  },
});
