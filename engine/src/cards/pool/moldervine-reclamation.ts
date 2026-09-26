import { defineCard } from "../define.js";

const TEXT = "Whenever a creature you control dies, you gain 1 life and draw a card.";

// It sees creatures that die alongside it (the ruling).
export default defineCard({
  name: "Moldervine Reclamation",
  manaCost: "{3}{B}{G}",
  colors: ["B", "G"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "dies", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-life", amount: 1 },
          { kind: "draw", amount: 1 },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
