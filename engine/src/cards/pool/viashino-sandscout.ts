import { defineCard } from "../define.js";

export default defineCard({
  name: "Viashino Sandscout",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Lizard", "Scout"],
  power: 2,
  toughness: 1,
  keywords: ["haste"],
  text: "Haste (This creature can attack and {T} as soon as it comes under your control.)\nAt the beginning of the end step, return this creature to its owner's hand. (Return it only if it's on the battlefield.)",
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: "At the beginning of the end step, return this creature to its owner's hand.",
    },
  ],
});
