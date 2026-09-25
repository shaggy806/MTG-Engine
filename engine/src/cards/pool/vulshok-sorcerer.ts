import { defineCard } from "../define.js";

export default defineCard({
  name: "Vulshok Sorcerer",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Shaman", "Sorcerer"],
  power: 1,
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
