import { defineCard } from "../define.js";

export default defineCard({
  name: "Myr Scrapling",
  manaCost: "{1}",
  colors: [],
  types: ["artifact", "creature"],
  subtypes: ["Myr"],
  power: 1,
  toughness: 1,
  text: "Sacrifice this creature: Put a +1/+1 counter on target creature.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "Sacrifice this creature: Put a +1/+1 counter on target creature.",
    },
  ],
});
