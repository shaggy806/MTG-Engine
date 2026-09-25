import { defineCard } from "../define.js";

export default defineCard({
  name: "Gobbling Ooze",
  manaCost: "{4}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Ooze"],
  power: 3,
  toughness: 3,
  text: "{G}, Sacrifice another creature: Put a +1/+1 counter on this creature.",
  activated: [
    {
      cost: { mana: "{G}", tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{G}, Sacrifice another creature: Put a +1/+1 counter on this creature.",
      otherOnly: true,
    },
  ],
});
