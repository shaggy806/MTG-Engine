import { defineCard } from "../define.js";

export default defineCard({
  name: "Ajani's Pridemate",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Cat", "Soldier"],
  power: 2,
  toughness: 2,
  text: "Whenever you gain life, put a +1/+1 counter on Ajani's Pridemate.",
  triggered: [
    {
      trigger: { on: "gains-life", who: "you" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Whenever you gain life, put a +1/+1 counter on Ajani's Pridemate.",
    },
  ],
});
