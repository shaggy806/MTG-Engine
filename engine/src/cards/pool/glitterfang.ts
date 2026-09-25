import { defineCard } from "../define.js";

export default defineCard({
  name: "Glitterfang",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 1,
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
