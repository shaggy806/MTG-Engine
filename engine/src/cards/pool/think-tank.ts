import { defineCard } from "../define.js";

export default defineCard({
  name: "Think Tank",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: "At the beginning of your upkeep, surveil 1. (Look at the top card of your library. You may put that card into your graveyard.)",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: "At the beginning of your upkeep, surveil 1.",
    },
  ],
});
