import { defineCard } from "../define.js";

export default defineCard({
  name: "Bloodthirsty Aerialist",
  manaCost: "{1}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Rogue"],
  power: 2,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhenever you gain life, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you gain life, put a +1/+1 counter on this creature.",
    },
  ],
});
