import { defineCard } from "../define.js";

// EDHREC rank 5253.
// Makes Orc Army by amassing → the engine's "Army Token".
//
// Rulings:
//   [2023-06-16] Amass abilities are now written as "amass [subtype] N." Previous cards with amass
//     have received errata to say "amass Zombies N."
//   [2023-06-16] Some cards refer to the "amassed Army." That means the Army creature you chose to
//     receive counters, even if no counters were placed on it for some reason.
//   [2023-06-16] To amass Orcs N, if you don't control an Army creature, create a 0/0 black Orc
//     Army creature token. Then you choose an Army creature you control and put N +1/+1 counters
//     on it. If that Army isn't already an Orc, it becomes an Orc in addition to its other types.
//   [2023-06-16] In the rare case that you control multiple Army creatures (perhaps because you
//     played a creature with changeling) while you amass Orcs, you choose which of your Army
//     creatures to put the +1/+1 counters on. If that creature isn't an Orc, it becomes an Orc in
//     addition to its other types.
//   [2023-06-16] If you don't control an Army, the Orc Army token you create enters the
//     battlefield as a 0/0 creature before receiving counters. Any abilities that trigger when a
//     creature with a certain power enters the battlefield, such as that of Mentor of the Meek,
//     will see the token enter as a 0/0 creature before it gets +1/+1 counters.
//   [2023-06-16] Some spells and abilities that amass Orcs may require targets. If each target
//     chosen is an illegal target as that spell or ability tries to resolve, it won't resolve. You
//     won't amass Orcs.
//   [2023-06-16] Amass Zombies works the same way, except you create a 0/0 black Zombie Army
//     creature token if you don't control an Army. If the Army creature you chose isn't already a
//     Zombie, it becomes a Zombie in addition to its other types. By combining cards with amass
//     Orcs and amass Zombies, you can end up with an Orc Zombie Army.

export default defineCard({
  name: "March from the Black Gate",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "When this enchantment enters and whenever an Army you control attacks, amass Orcs 1. (Put a +1/+1 counter on an Army you control. It's also an Orc. If you don't control an Army, create a 0/0 black Orc Army creature token first.)",
  // One ability with two trigger events, written as two triggered abilities
  // with the same effect.
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "amass", amount: 1, creatureType: "Orc" },
      resolve: null,
      text: "When this enchantment enters and whenever an Army you control attacks, amass Orcs 1.",
    },
    {
      trigger: { on: "attacks", who: "you-control", filter: { subtype: "Army" } },
      targets: [],
      effect: { kind: "amass", amount: 1, creatureType: "Orc" },
      resolve: null,
      text: "When this enchantment enters and whenever an Army you control attacks, amass Orcs 1.",
    },
  ],
});
