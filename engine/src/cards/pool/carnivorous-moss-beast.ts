import { defineCard } from "../define.js";

export default defineCard({
  name: "Carnivorous Moss-Beast",
  manaCost: "{4}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Plant", "Elemental", "Beast"],
  power: 4,
  toughness: 5,
  text: "{5}{G}{G}: Put a +1/+1 counter on this creature.",
  activated: [
    {
      cost: { mana: "{5}{G}{G}", tap: false },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{5}{G}{G}: Put a +1/+1 counter on this creature.",
    },
  ],
});
