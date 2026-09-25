import { defineCard } from "../define.js";

export default defineCard({
  name: "Cunning Sparkmage",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Shaman"],
  power: 0,
  toughness: 1,
  keywords: ["haste"],
  text: "Haste\n{T}: This creature deals 1 damage to any target.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{T}: This creature deals 1 damage to any target.",
    },
  ],
});
