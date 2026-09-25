import { defineCard } from "../define.js";

export default defineCard({
  name: "Silverclad Ferocidons",
  manaCost: "{5}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dinosaur"],
  power: 8,
  toughness: 5,
  text: "Enrage — Whenever this creature is dealt damage, each opponent sacrifices a permanent of their choice.",
  triggered: [
    {
      trigger: { on: "dealt-damage", who: "self" },
      targets: [],
      effect: { kind: "sacrifice", who: "each-opponent", filter: {}, count: 1 },
      resolve: null,
      text: "Enrage — Whenever this creature is dealt damage, each opponent sacrifices a permanent of their choice.",
    },
  ],
});
