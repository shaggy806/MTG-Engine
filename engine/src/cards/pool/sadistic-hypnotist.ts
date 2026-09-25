import { defineCard } from "../define.js";

export default defineCard({
  name: "Sadistic Hypnotist",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Minion"],
  power: 2,
  toughness: 2,
  text: "Sacrifice a creature: Target player discards two cards. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      targets: ["player"],
      effect: { kind: "discard", target: 0, amount: 2 },
      resolve: null,
      text: "Sacrifice a creature: Target player discards two cards. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
