import { defineCard } from "../define.js";

export default defineCard({
  name: "Marauding Blight-Priest",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Cleric"],
  power: 3,
  toughness: 2,
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
