import { defineCard } from "../define.js";

export default defineCard({
  name: "Cat Burglar",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Kor", "Rogue", "Minion"],
  power: 2,
  toughness: 2,
  text: "{2}{B}, {T}: Target player discards a card. Activate only as a sorcery.",
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
