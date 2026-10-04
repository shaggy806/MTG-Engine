import { defineCard } from "../define.js";

// EDHREC rank 3507.
//
// Rulings:
//   [2018-12-07] A creature with 0 power can attack, as long as it doesn't also have defender.
//   [2018-12-07] If the attacking creature leaves the battlefield before Raid Bombardment's
//     triggered ability resolves, Raid Bombardment deals 1 damage to the player or planeswalker
//     that creature was attacking before it left the battlefield.
//   [2018-12-07] The power of the attacking creature is checked only when the ability triggers.
//     Once it triggers, Raid Bombardment will deal 1 damage to the appropriate player or
//     planeswalker even if the creature's power changes before the ability resolves.
//   [2018-12-07] If you attack with multiple creatures with power 2 or less, Raid Bombardment's
//     ability triggers for each of them separately.
//   [2023-09-01] Raid Bombardment's ability won't do anything when a creature you control with
//     power 2 or less attacks a battle.

export default defineCard({
  name: "Raid Bombardment",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["enchantment"],
  text: "Whenever a creature you control with power 2 or less attacks, this enchantment deals 1 damage to the player or planeswalker that creature is attacking.",
  triggered: [
    {
      // Power is checked only as it triggers, and the player or planeswalker
      // it was declared attacking is fixed then: the damage still lands if the
      // creature has left or grown since (the rulings).
      trigger: { on: "attacks", who: "you-control", filter: { type: "creature", power: { op: "lte", n: 2 } } },
      targets: [],
      effect: { kind: "damage", amount: 1, toTriggerRecipient: true },
      resolve: null,
      text: "Whenever a creature you control with power 2 or less attacks, this enchantment deals 1 damage to the player or planeswalker that creature is attacking.",
    },
  ],
});
