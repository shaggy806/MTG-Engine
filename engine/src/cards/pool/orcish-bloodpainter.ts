import { defineCard } from "../define.js";

export default defineCard({
  name: "Orcish Bloodpainter",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Orc", "Shaman"],
  power: 2,
  toughness: 1,
  text: "{T}, Sacrifice a creature: This creature deals 1 damage to any target.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: "creature-you-control" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{T}, Sacrifice a creature: This creature deals 1 damage to any target.",
    },
  ],
});
