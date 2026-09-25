import { defineCard } from "../define.js";

export default defineCard({
  name: "Flanking Troops",
  manaCost: "{2}{W}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 2,
  text: "Whenever this creature attacks, you may tap target creature.",
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
