import { defineCard } from "../define.js";

export default defineCard({
  name: "Unburied Earthcarver",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 2,
  text: "{2}, Sacrifice another creature: Put a +1/+1 counter on this creature.",
  activated: [
    {
      cost: { mana: "{2}", tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{2}, Sacrifice another creature: Put a +1/+1 counter on this creature.",
      otherOnly: true,
    },
  ],
});
