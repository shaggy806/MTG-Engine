import { defineCard } from "../define.js";

export default defineCard({
  name: "Sacred Prey",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Horse"],
  power: 1,
  toughness: 1,
  text: "Whenever this creature becomes blocked, you gain 1 life.",
  triggered: [
    {
      trigger: { on: "becomes-blocked", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever this creature becomes blocked, you gain 1 life.",
    },
  ],
});
