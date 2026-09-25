import { defineCard } from "../define.js";

export default defineCard({
  name: "Geist of the Archives",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 0,
  toughness: 4,
  keywords: ["defender"],
  text: "Defender\nAt the beginning of your upkeep, scry 1. (Look at the top card of your library. You may put that card on the bottom.)",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "scry", amount: 1 },
      resolve: null,
      text: "At the beginning of your upkeep, scry 1.",
    },
  ],
});
