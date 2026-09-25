import { defineCard } from "../define.js";

export default defineCard({
  name: "Rotting Regisaur",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie", "Dinosaur"],
  power: 7,
  toughness: 6,
  text: "At the beginning of your upkeep, discard a card.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "discard", target: "you", amount: 1 },
      resolve: null,
      text: "At the beginning of your upkeep, discard a card.",
    },
  ],
});
