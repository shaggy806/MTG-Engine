import { defineCard } from "../define.js";

export default defineCard({
  name: "Ghirapur Aether Grid",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "Tap two untapped artifacts you control: This enchantment deals 1 damage to any target.",
  activated: [
    {
      cost: {
        mana: null,
        tap: false,
        tapOthers: { count: 2, filter: { type: "artifact", controlledBy: "you" }, includeSelf: true },
      },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "Tap two untapped artifacts you control: This enchantment deals 1 damage to any target.",
    },
  ],
});
