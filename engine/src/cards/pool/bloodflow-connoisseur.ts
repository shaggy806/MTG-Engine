import { defineCard } from "../define.js";

export default defineCard({
  name: "Bloodflow Connoisseur",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 1,
  toughness: 1,
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
