import { defineCard } from "../define.js";

export default defineCard({
  name: "Dimir Spybug",
  manaCost: "{U}{B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 1,
  toughness: 1,
  keywords: ["flying", "menace"],
  text: "Flying\nMenace (This creature can't be blocked except by two or more creatures.)\nWhenever you surveil, put a +1/+1 counter on this creature.",
  triggered: [
    {
      trigger: { on: "surveils", who: "you" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you surveil, put a +1/+1 counter on this creature.",
    },
  ],
});
