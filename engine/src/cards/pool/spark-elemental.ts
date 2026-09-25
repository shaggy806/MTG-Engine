import { defineCard } from "../define.js";

export default defineCard({
  name: "Spark Elemental",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 3,
  toughness: 1,
  keywords: ["trample", "haste"],
  text: "Trample, haste (This creature can deal excess combat damage to the player or planeswalker it's attacking. This creature can attack and {T} as soon as it comes under your control.)\nAt the beginning of the end step, sacrifice this creature.",
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
