import { defineCard } from "../define.js";

export default defineCard({
  name: "Kyren Negotiations",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "Tap an untapped creature you control: This enchantment deals 1 damage to target player or planeswalker.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 1, filter: { type: "creature", controlledBy: "you" }, includeSelf: true },
      },
      targets: ["player-or-planeswalker"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "Tap an untapped creature you control: This enchantment deals 1 damage to target player or planeswalker.",
    },
  ],
});
