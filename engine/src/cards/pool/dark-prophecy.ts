import { defineCard } from "../define.js";

// EDHREC rank 4337.

const TEXT = "Whenever a creature you control dies, you draw a card and you lose 1 life.";

export default defineCard({
  name: "Dark Prophecy",
  manaCost: "{B}{B}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "lose-life", amount: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
