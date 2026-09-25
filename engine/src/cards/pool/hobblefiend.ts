import { defineCard } from "../define.js";

export default defineCard({
  name: "Hobblefiend",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Devil"],
  power: 2,
  toughness: 1,
  keywords: ["trample"],
  text: "Trample (This creature can deal excess combat damage to the player or planeswalker it's attacking.)\n{1}, Sacrifice another creature: Put a +1/+1 counter on this creature.",
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
