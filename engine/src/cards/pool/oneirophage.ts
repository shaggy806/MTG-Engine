import { defineCard } from "../define.js";

export default defineCard({
  name: "Oneirophage",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Squid", "Illusion"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nWhenever you draw a card, put a +1/+1 counter on this creature.",
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
