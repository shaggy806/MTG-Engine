import { defineCard } from "../define.js";

export default defineCard({
  name: "Pulse Tracker",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Rogue"],
  power: 1,
  toughness: 1,
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
