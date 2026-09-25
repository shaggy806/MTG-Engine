import { defineCard } from "../define.js";

export default defineCard({
  name: "Zealot of the God-Pharaoh",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Minotaur", "Archer"],
  power: 4,
  toughness: 3,
  text: "{4}{R}: This creature deals 2 damage to target opponent or planeswalker.",
  activated: [
    {
      cost: { mana: "{4}{R}", tap: false },
      targets: ["opponent-or-planeswalker"],
      effect: { kind: "damage", amount: 2, target: 0 },
      resolve: null,
      text: "{4}{R}: This creature deals 2 damage to target opponent or planeswalker.",
    },
  ],
});
