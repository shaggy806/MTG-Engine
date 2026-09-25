import { defineCard } from "../define.js";

export default defineCard({
  name: "Lorescale Coatl",
  manaCost: "{1}{G}{U}",
  colors: ["U", "G"],
  types: ["creature"],
  subtypes: ["Snake"],
  power: 2,
  toughness: 2,
  text: "Whenever you draw a card, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "draws", who: "you" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you draw a card, put a +1/+1 counter on this creature.",
    },
  ],
});
