import { defineCard } from "../define.js";

export default defineCard({
  name: "Viashino Cutthroat",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Lizard"],
  power: 5,
  toughness: 3,
  keywords: ["haste"],
  text: "Haste\nAt the beginning of the end step, return this creature to its owner's hand.",
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
