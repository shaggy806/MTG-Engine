import { defineCard } from "../define.js";

export default defineCard({
  name: "Hungry Ghoul",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 2,
  text: "{1}, Sacrifice another creature: Put a +1/+1 counter on this creature.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{1}, Sacrifice another creature: Put a +1/+1 counter on this creature.",
      otherOnly: true,
    },
  ],
});
