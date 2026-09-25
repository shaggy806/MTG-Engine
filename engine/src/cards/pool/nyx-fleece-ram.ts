import { defineCard } from "../define.js";

export default defineCard({
  name: "Nyx-Fleece Ram",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["enchantment", "creature"],
  subtypes: ["Sheep"],
  power: 0,
  toughness: 5,
  text: "At the beginning of your upkeep, you gain 1 life.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "At the beginning of your upkeep, you gain 1 life.",
    },
  ],
});
