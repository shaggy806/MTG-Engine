import { defineCard } from "../define.js";

export default defineCard({
  name: "Niblis of the Urn",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nWhenever this creature attacks, you may tap target creature.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: ["creature"],
      effect: { kind: "may", prompt: "Tap target creature?", effect: { kind: "tap", target: 0 } },
      resolve: null,
      text: "Whenever this creature attacks, you may tap target creature.",
    },
  ],
});
