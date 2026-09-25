import { defineCard } from "../define.js";

export default defineCard({
  name: "Souldrinker",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Spirit"],
  power: 2,
  toughness: 2,
  text: "Pay 3 life: Put a +1/+1 counter on this creature.",
  activated: [
    {
      cost: { mana: null, tap: false, payLife: 3 },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Pay 3 life: Put a +1/+1 counter on this creature.",
    },
  ],
});
