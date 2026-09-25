import { defineCard } from "../define.js";

export default defineCard({
  name: "Deepwood Tantiv",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Beast"],
  power: 2,
  toughness: 4,
  text: "Whenever this creature becomes blocked, you gain 2 life.",
  triggered: [
    {
      trigger: { on: "becomes-blocked", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 2 },
      resolve: null,
      text: "Whenever this creature becomes blocked, you gain 2 life.",
    },
  ],
});
