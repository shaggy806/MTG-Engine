import { defineCard } from "../define.js";

export default defineCard({
  name: "Groundbreaker",
  manaCost: "{G}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 6,
  toughness: 1,
  keywords: ["trample", "haste"],
  text: "Trample, haste\nAt the beginning of the end step, sacrifice this creature.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      targets: [],
      effect: { kind: "sacrifice-source" },
      resolve: null,
      text: "At the beginning of the end step, sacrifice this creature.",
    },
  ],
});
