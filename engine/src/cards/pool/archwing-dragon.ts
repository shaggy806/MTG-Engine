import { defineCard } from "../define.js";

export default defineCard({
  name: "Archwing Dragon",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 4,
  toughness: 4,
  keywords: ["flying", "haste"],
  text: "Flying, haste\nAt the beginning of the end step, return this creature to its owner's hand.",
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
