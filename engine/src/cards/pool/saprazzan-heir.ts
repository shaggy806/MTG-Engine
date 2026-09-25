import { defineCard } from "../define.js";

export default defineCard({
  name: "Saprazzan Heir",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk"],
  power: 1,
  toughness: 1,
  text: "Whenever this creature becomes blocked, you may draw three cards.",
  triggered: [
    {
      trigger: { on: "becomes-blocked", who: "self" },
      targets: [],
      effect: { kind: "may", prompt: "Draw three cards?", effect: { kind: "draw", amount: 3 } },
      resolve: null,
      text: "Whenever this creature becomes blocked, you may draw three cards.",
    },
  ],
});
