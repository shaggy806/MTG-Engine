import { defineCard } from "../define.js";

export default defineCard({
  name: "Furious Assault",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "Whenever you cast a creature spell, this enchantment deals 1 damage to target player or planeswalker.",
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "creature" } },
      targets: ["player-or-planeswalker"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "Whenever you cast a creature spell, this enchantment deals 1 damage to target player or planeswalker.",
    },
  ],
});
