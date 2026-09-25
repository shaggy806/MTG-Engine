import { defineCard } from "../define.js";

export default defineCard({
  name: "Lifegift",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: "Whenever a land enters, you may gain 1 life.",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "any", filter: { type: "land" } },
      targets: [],
      effect: { kind: "may", prompt: "Gain 1 life?", effect: { kind: "gain-life", amount: 1 } },
      resolve: null,
      text: "Whenever a land enters, you may gain 1 life.",
    },
  ],
});
