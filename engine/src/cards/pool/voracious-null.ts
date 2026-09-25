import { defineCard } from "../define.js";

export default defineCard({
  name: "Voracious Null",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 2,
  toughness: 2,
  text: "{1}{B}, Sacrifice another creature: Put two +1/+1 counters on this creature. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{1}{B}", tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: 2 },
      resolve: null,
      text: "{1}{B}, Sacrifice another creature: Put two +1/+1 counters on this creature. Activate only as a sorcery.",
      otherOnly: true,
      sorcerySpeed: true,
    },
  ],
});
