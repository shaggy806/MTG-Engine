import { defineCard } from "../define.js";

export default defineCard({
  name: "Tolarian Serpent",
  manaCost: "{5}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Serpent"],
  power: 7,
  toughness: 7,
  text: "At the beginning of your upkeep, mill seven cards.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "mill", target: "you", amount: 7 },
      resolve: null,
      text: "At the beginning of your upkeep, mill seven cards.",
    },
  ],
});
