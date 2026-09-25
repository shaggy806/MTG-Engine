import { defineCard } from "../define.js";

export default defineCard({
  name: "Epicure of Blood",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 4,
  toughness: 4,
  text: "Whenever you gain life, each opponent loses 1 life.",
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Whenever you gain life, each opponent loses 1 life.",
    },
  ],
});
