import { defineCard } from "../define.js";

export default defineCard({
  name: "Ravenous Harpy",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Harpy"],
  power: 1,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\n{1}, Sacrifice another creature: Put a +1/+1 counter on this creature.",
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
