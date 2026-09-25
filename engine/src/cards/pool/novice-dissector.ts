import { defineCard } from "../define.js";

export default defineCard({
  name: "Novice Dissector",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Troll", "Warlock"],
  power: 3,
  toughness: 3,
  text: "{1}, Sacrifice another creature: Put a +1/+1 counter on target creature. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{1}", tap: false, sacrifice: "creature-you-control" },
      targets: ["creature"],
      effect: { kind: "add-counter", target: 0, counter: "+1/+1", amount: 1 },
      resolve: null,
      text: "{1}, Sacrifice another creature: Put a +1/+1 counter on target creature. Activate only as a sorcery.",
      otherOnly: true,
      sorcerySpeed: true,
    },
  ],
});
