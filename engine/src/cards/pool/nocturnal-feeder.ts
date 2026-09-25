import { defineCard } from "../define.js";

export default defineCard({
  name: "Nocturnal Feeder",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Rogue"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nWhen this creature dies, each opponent loses 2 life and you gain 2 life.",
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
