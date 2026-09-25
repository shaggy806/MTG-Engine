import { defineCard } from "../define.js";

export default defineCard({
  name: "Goblin Fireslinger",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 1,
  toughness: 1,
  text: "{T}: This creature deals 1 damage to target player or planeswalker.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: ["player-or-planeswalker"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "{T}: This creature deals 1 damage to target player or planeswalker.",
    },
  ],
});
