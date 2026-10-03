import { defineCard } from "../define.js";

export default defineCard({
  name: "Midnight Banshee",
  manaCost: "{3}{B}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 5,
  toughness: 5,
  keywords: ["wither"],
  text: "Wither (This deals damage to creatures in the form of -1/-1 counters.)\nAt the beginning of your upkeep, put a -1/-1 counter on each nonblack creature.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", notColors: ["B"] },
        counter: "-1/-1",
        amount: 1,
      },
      resolve: null,
      text: "At the beginning of your upkeep, put a -1/-1 counter on each nonblack creature.",
    },
  ],
});
