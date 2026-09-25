import { defineCard } from "../define.js";

export default defineCard({
  name: "Brotherhood Patriarch",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Assassin"],
  power: 4,
  toughness: 1,
  text: "When this creature dies, each opponent loses 2 life and you gain 2 life.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 2, who: "each-opponent" },
          { kind: "gain-life", amount: 2 },
        ],
      },
      resolve: null,
      text: "When this creature dies, each opponent loses 2 life and you gain 2 life.",
    },
  ],
});
