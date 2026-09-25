import { defineCard } from "../define.js";

export default defineCard({
  name: "Liliana's Steward",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 1,
  toughness: 2,
  text: "{T}, Sacrifice this creature: Target opponent discards a card. Activate only as a sorcery.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: ["opponent"],
      effect: { kind: "discard", target: 0, amount: 1 },
      resolve: null,
      text: "{T}, Sacrifice this creature: Target opponent discards a card. Activate only as a sorcery.",
      sorcerySpeed: true,
    },
  ],
});
