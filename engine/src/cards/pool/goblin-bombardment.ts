import { defineCard } from "../define.js";

// "Sacrifice a creature" is a cost, so the creature is gone as the ability is
// activated and the damage still happens if that creature was the only one
// (or if the ability is countered, the creature stays sacrificed). The
// activator picks which creature — the `sacrifice` choice on the offer.
export default defineCard({
  name: "Goblin Bombardment",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "Sacrifice a creature: This enchantment deals 1 damage to any target.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      targets: ["any-target"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "Sacrifice a creature: This enchantment deals 1 damage to any target.",
    },
  ],
});
