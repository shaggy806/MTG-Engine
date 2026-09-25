import { defineCard } from "../define.js";

export default defineCard({
  name: "Jungle Delver",
  manaCost: "{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Merfolk", "Warrior"],
  power: 1,
  toughness: 1,
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
