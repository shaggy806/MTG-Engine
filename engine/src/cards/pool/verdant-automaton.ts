import { defineCard } from "../define.js";

export default defineCard({
  name: "Verdant Automaton",
  manaCost: "{2}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 1,
  toughness: 2,
  text: "{3}{G}: Put a +1/+1 counter on this creature.",
  activated: [
    {
      cost: { mana: "{3}{G}", tap: false },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{3}{G}: Put a +1/+1 counter on this creature.",
    },
  ],
});
