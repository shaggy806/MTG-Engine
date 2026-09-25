import { defineCard } from "../define.js";

export default defineCard({
  name: "Spirit of Malevolence",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 1,
  text: "When this creature dies, each opponent loses 1 life and you gain 1 life.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "When this creature dies, each opponent loses 1 life and you gain 1 life.",
    },
  ],
});
