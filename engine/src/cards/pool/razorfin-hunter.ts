import { defineCard } from "../define.js";

export default defineCard({
  name: "Razorfin Hunter",
  manaCost: "{U}{R}",
  colors: ["U", "R"],
  types: ["creature"],
  subtypes: ["Merfolk", "Goblin"],
  power: 1,
  toughness: 1,
  text: "{T}: This creature deals 1 damage to any target.",
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
