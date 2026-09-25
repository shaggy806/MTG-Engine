import { defineCard } from "../define.js";

export default defineCard({
  name: "Tarpan",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Horse"],
  power: 1,
  toughness: 1,
  text: "When this creature dies, you gain 1 life.",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "When this creature dies, you gain 1 life.",
    },
  ],
});
