import { defineCard } from "../define.js";

// EDHREC rank 5840.
//
// Rulings:
//   [2017-03-14] Creatures you control may attack multiple players and/or planeswalkers. For each
//     attacking creature, Hellrider will deal damage to the corresponding player or planeswalker.
//
// Raid Bombardment's shape: the player or planeswalker each attacker was
// declared attacking is fixed as the trigger fires.

const TEXT =
  "Whenever a creature you control attacks, this creature deals 1 damage to the player or planeswalker it's attacking.";

export default defineCard({
  name: "Hellrider",
  manaCost: "{2}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Devil"],
  power: 3,
  toughness: 3,
  keywords: ["haste"],
  text: `Haste\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "damage", amount: 1, toTriggerRecipient: true },
      resolve: null,
      text: TEXT,
    },
  ],
});
