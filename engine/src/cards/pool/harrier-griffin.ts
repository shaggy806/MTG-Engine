import { defineCard } from "../define.js";

export default defineCard({
  name: "Harrier Griffin",
  manaCost: "{5}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Griffin"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nAt the beginning of your upkeep, tap target creature.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: ["creature"],
      effect: { kind: "tap", target: 0 },
      resolve: null,
      text: "At the beginning of your upkeep, tap target creature.",
    },
  ],
});
