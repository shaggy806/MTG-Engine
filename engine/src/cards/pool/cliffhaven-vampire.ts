import { defineCard } from "../define.js";

export default defineCard({
  name: "Cliffhaven Vampire",
  manaCost: "{2}{W}{B}",
  colors: ["W", "B"],
  types: ["creature"],
  subtypes: ["Vampire", "Warrior", "Ally"],
  power: 2,
  toughness: 4,
  keywords: ["flying"],
  text: "Flying\nWhenever you gain life, each opponent loses 1 life.",
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
