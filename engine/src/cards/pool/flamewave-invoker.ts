import { defineCard } from "../define.js";

export default defineCard({
  name: "Flamewave Invoker",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Mutant"],
  power: 2,
  toughness: 2,
  text: "{7}{R}: This creature deals 5 damage to target player or planeswalker.",
  activated: [
    {
      cost: { mana: "{7}{R}", tap: false },
      targets: ["player-or-planeswalker"],
      effect: { kind: "damage", amount: 5, target: 0 },
      resolve: null,
      text: "{7}{R}: This creature deals 5 damage to target player or planeswalker.",
    },
  ],
});
