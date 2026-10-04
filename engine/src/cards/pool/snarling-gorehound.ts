import { defineCard } from "../define.js";

// EDHREC rank 5155.
//
// Rulings:
//   [2024-02-02] Snarling Gorehound's ability checks the power of a creature only at the moment it
//     enters the battlefield. If it enters with counters, those counters are included. If that
//     creature's power is 2 or less when it enters the battlefield but becomes greater than 2
//     after the ability triggers, you'll still surveil 1.

// Mentor of the Meek's trigger.
const TEXT = "Whenever another creature you control with power 2 or less enters, surveil 1.";

export default defineCard({
  name: "Snarling Gorehound",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Dog"],
  power: 1,
  toughness: 1,
  keywords: ["menace"],
  text: `Menace\n${TEXT} (Look at the top card of your library. You may put it into your graveyard.)`,
  triggered: [
    {
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        otherOnly: true,
        filter: { type: "creature", power: { op: "lte", n: 2 } },
      },
      targets: [],
      effect: { kind: "surveil", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
