import { defineCard } from "../define.js";

// EDH backlog #414 — the second card the choice-of-additional-costs feature
// unblocks, and the one that proves the branches needn't be the same shape:
// here one sacrifices a permanent and the other discards from hand.
export default defineCard({
  name: "Demand Answers",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["instant"],
  text:
    "As an additional cost to cast this spell, sacrifice an artifact or discard a card.\n" +
    "Draw two cards.",
  additionalCost: {
    options: [
      { text: "Sacrifice an artifact", sacrifice: { type: "artifact", controlledBy: "you" } },
      { text: "Discard a card", discard: 1 },
    ],
  },
  effect: { kind: "draw", amount: 2 },
});
