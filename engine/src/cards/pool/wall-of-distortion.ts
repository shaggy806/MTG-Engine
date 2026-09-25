import { defineCard } from "../define.js";

export default defineCard({
  name: "Wall of Distortion",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Wall"],
  power: 1,
  toughness: 3,
  keywords: ["defender"],
  text: "Defender (This creature can't attack.)\n{2}{B}, {T}: Target player discards a card. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: "{2}{B}", tap: true },
      targets: ["player"],
      effect: { kind: "discard", target: 0, amount: 1 },
      resolve: null,
      text: "{2}{B}, {T}: Target player discards a card. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
