import { defineCard } from "../define.js";

export default defineCard({
  name: "Deadly Dispute",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text:
    "As an additional cost to cast this spell, sacrifice an artifact or creature.\n" +
    "Draw two cards and create a Treasure token.",
  additionalCost: { sacrifice: { typesAnyOf: ["artifact", "creature"], controlledBy: "you" } },
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 2 },
      { kind: "create-token", token: "Treasure Token", count: 1 },
    ],
  },
});
