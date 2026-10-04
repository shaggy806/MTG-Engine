import { defineCard } from "../define.js";

// EDHREC rank 4083.
//
// Rulings:
//   [2012-10-01] If that creature deals combat damage to a player at the same time it's dealt
//     lethal damage (perhaps because it has trample and was blocked), it will die before the
//     triggered ability resolves and puts +1/+1 counters on it.

export default defineCard({
  name: "Necropolis Regent",
  manaCost: "{3}{B}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire"],
  power: 6,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying\nWhenever a creature you control deals combat damage to a player, put that many +1/+1 counters on it.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { type: "creature" } },
      targets: [],
      // Sphere Grid's shape, "that many" the damage dealt (Starwinder's triggerValue).
      // A creature that died meanwhile gets nothing (the ruling).
      effect: { kind: "add-counter", target: "trigger-object", counter: "+1/+1", amount: { triggerValue: true } },
      resolve: null,
      text: "Whenever a creature you control deals combat damage to a player, put that many +1/+1 counters on it.",
    },
  ],
});
