import { defineCard } from "../define.js";

export default defineCard({
  name: "Blood Researcher",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  types: ["creature"],
  subtypes: ["Vampire", "Druid"],
  power: 2,
  toughness: 2,
  keywords: ["menace"],
  text: "Menace (This creature can't be blocked except by two or more creatures.)\nWhenever you gain life, put a +1/+1 counter on this creature.",
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
