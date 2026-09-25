import { defineCard } from "../define.js";

export default defineCard({
  name: "Scalding Devil",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Devil"],
  power: 1,
  toughness: 1,
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
