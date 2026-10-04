import { defineCard } from "../define.js";

// EDHREC rank 4680.
// Makes Orc Army by amassing → the engine's "Army Token".
//
// Rulings:
//   [2023-06-16] To amass Orcs N, if you don't control an Army creature, create a 0/0 black Orc
//     Army creature token. Then you choose an Army creature you control and put N +1/+1 counters
//     on it. If that Army isn't already an Orc, it becomes an Orc in addition to its other types.
//   [2023-06-16] In the rare case that you control multiple Army creatures (perhaps because you
//     played a creature with changeling) while you amass Orcs, you choose which of your Army
//     creatures to put the +1/+1 counters on. If that creature isn't an Orc, it becomes an Orc in
//     addition to its other types.
//   [2023-06-16] Amass abilities are now written as "amass [subtype] N." Previous cards with amass
//     have received errata to say "amass Zombies N."
//   [2023-06-16] If you don't control an Army, the Orc Army token you create enters the
//     battlefield as a 0/0 creature before receiving counters. Any abilities that trigger when a
//     creature with a certain power enters the battlefield, such as that of Mentor of the Meek,
//     will see the token enter as a 0/0 creature before it gets +1/+1 counters.
//   [2023-06-16] Amass Zombies works the same way, except you create a 0/0 black Zombie Army
//     creature token if you don't control an Army. If the Army creature you chose isn't already a
//     Zombie, it becomes a Zombie in addition to its other types. By combining cards with amass
//     Orcs and amass Zombies, you can end up with an Orc Zombie Army.
//   [2023-06-16] Some spells and abilities that amass Orcs may require targets. If each target
//     chosen is an illegal target as that spell or ability tries to resolve, it won't resolve. You
//     won't amass Orcs.
//   [2023-06-16] Some cards refer to the "amassed Army." That means the Army creature you chose to
//     receive counters, even if no counters were placed on it for some reason.

// "Your choice of lifelink or indestructible" is chosen as it resolves — an
// unannounced `modal` — then the amass (Enter the God-Eternals' shape). With
// its target illegal the spell doesn't resolve and nothing is amassed (the
// ruling).
export default defineCard({
  name: "Orcish Medicine",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Target creature gains your choice of lifelink or indestructible until end of turn.\nAmass Orcs 1. (Put a +1/+1 counter on an Army you control. It's also an Orc. If you don't control an Army, create a 0/0 black Orc Army creature token first.)",
  targets: ["creature"],
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "modal",
        minModes: 1,
        maxModes: 1,
        modes: [
          {
            text: "Lifelink",
            effect: { kind: "grant-keyword", target: 0, keyword: "lifelink", duration: "end-of-turn" },
          },
          {
            text: "Indestructible",
            effect: { kind: "grant-keyword", target: 0, keyword: "indestructible", duration: "end-of-turn" },
          },
        ],
      },
      { kind: "amass", amount: 1, creatureType: "Orc" },
    ],
  },
});
