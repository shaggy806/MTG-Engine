import { defineCard } from "../define.js";

// Raid, read as it resolves.
export default defineCard({
  name: "Chart a Course",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Draw two cards. Then discard a card unless you attacked this turn.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 2 },
      {
        kind: "conditional",
        condition: { kind: "not", of: { kind: "turn-stat", stat: "attacked", who: "you", atLeast: 1 } },
        then: { kind: "discard", target: "you", amount: 1 },
      },
    ],
  },
});
