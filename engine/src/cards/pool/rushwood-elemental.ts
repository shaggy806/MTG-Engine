import { defineCard } from "../define.js";

export default defineCard({
  name: "Rushwood Elemental",
  manaCost: "{G}{G}{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 4,
  toughness: 4,
  keywords: ["trample"],
  text: "Trample\nAt the beginning of your upkeep, you may put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Put a +1/+1 counter on ~?",
        effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      },
      resolve: null,
      text: "At the beginning of your upkeep, you may put a +1/+1 counter on this creature.",
    },
  ],
});
