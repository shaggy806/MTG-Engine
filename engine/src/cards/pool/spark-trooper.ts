import { defineCard } from "../define.js";

export default defineCard({
  name: "Spark Trooper",
  manaCost: "{1}{R}{R}{W}",
  colors: ["W", "R"],
  types: ["creature"],
  subtypes: ["Elemental", "Soldier"],
  power: 6,
  toughness: 1,
  keywords: ["trample", "lifelink", "haste"],
  text: "Trample, lifelink, haste\nAt the beginning of the end step, sacrifice this creature.",
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
