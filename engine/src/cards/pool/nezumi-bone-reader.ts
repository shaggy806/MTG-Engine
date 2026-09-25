import { defineCard } from "../define.js";

export default defineCard({
  name: "Nezumi Bone-Reader",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Rat", "Shaman"],
  power: 1,
  toughness: 1,
  text: "{B}, Sacrifice a creature: Target player discards a card. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{B}", tap: false, sacrifice: "creature-you-control" },
      targets: ["player"],
      effect: { kind: "discard", target: 0, amount: 1 },
      resolve: null,
      text: "{B}, Sacrifice a creature: Target player discards a card. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
