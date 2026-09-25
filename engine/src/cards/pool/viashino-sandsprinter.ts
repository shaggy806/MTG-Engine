import { defineCard } from "../define.js";

export default defineCard({
  name: "Viashino Sandsprinter",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Lizard", "Warrior"],
  power: 4,
  toughness: 1,
  keywords: ["trample", "haste"],
  cycling: { cost: "{R}" },
  text: "Trample, haste\nAt the beginning of the end step, return this creature to its owner's hand. (Return it only if it's on the battlefield.)\nCycling {R} ({R}, Discard this card: Draw a card.)",
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
