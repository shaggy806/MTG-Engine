import { defineCard } from "../define.js";

export default defineCard({
  name: "Ajani's Mantra",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment"],
  text: "At the beginning of your upkeep, you may gain 1 life.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "may", prompt: "Gain 1 life?", effect: { kind: "gain-life", amount: 1 } },
      resolve: null,
      text: "At the beginning of your upkeep, you may gain 1 life.",
    },
  ],
});
