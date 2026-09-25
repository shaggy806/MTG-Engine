import { defineCard } from "../define.js";

export default defineCard({
  name: "Tattered Mummy",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Jackal"],
  power: 1,
  toughness: 2,
  text: "When this creature dies, each opponent loses 2 life.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "lose-life", amount: 2, who: "each-opponent" },
      resolve: null,
      text: "When this creature dies, each opponent loses 2 life.",
    },
  ],
});
