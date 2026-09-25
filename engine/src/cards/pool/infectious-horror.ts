import { defineCard } from "../define.js";

export default defineCard({
  name: "Infectious Horror",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Horror"],
  power: 2,
  toughness: 2,
  text: "Whenever this creature attacks, each opponent loses 2 life.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "lose-life", amount: 2, who: "each-opponent" },
      resolve: null,
      text: "Whenever this creature attacks, each opponent loses 2 life.",
    },
  ],
});
