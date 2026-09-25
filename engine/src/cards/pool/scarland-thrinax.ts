import { defineCard } from "../define.js";

export default defineCard({
  name: "Scarland Thrinax",
  manaCost: "{B}{R}{G}",
  colors: ["B", "R", "G"],
  types: ["creature"],
  subtypes: ["Lizard"],
  power: 2,
  toughness: 2,
  text: "Sacrifice a creature: Put a +1/+1 counter on this creature.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Sacrifice a creature: Put a +1/+1 counter on this creature.",
    },
  ],
});
