import { defineCard } from "../define.js";

export default defineCard({
  name: "Vicious Conquistador",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Soldier"],
  power: 1,
  toughness: 2,
  text: "Whenever this creature attacks, each opponent loses 1 life.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "lose-life", amount: 1, who: "each-opponent" },
      resolve: null,
      text: "Whenever this creature attacks, each opponent loses 1 life.",
    },
  ],
});
