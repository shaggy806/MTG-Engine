import { defineCard } from "../define.js";

export default defineCard({
  name: "Volcanic Rambler",
  manaCost: "{5}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Elemental"],
  power: 6,
  toughness: 4,
  text: "{2}{R}: This creature deals 1 damage to target player or planeswalker.",
  activated: [
    {
      cost: { mana: "{2}{R}", tap: false },
      targets: ["player-or-planeswalker"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{2}{R}: This creature deals 1 damage to target player or planeswalker.",
    },
  ],
});
