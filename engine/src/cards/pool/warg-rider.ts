import { defineCard } from "../define.js";

// EDHREC rank 6354.
// Makes Orc Army by amassing → the engine's "Army Token".
//
// Rulings:
//   [2023-11-03] In the rare case that you control multiple Army creatures (perhaps because you
//     cast a creature with changeling) while you amass Orcs, you choose which of your Army
//     creatures to put the +1/+1 counters on. If that creature isn't an Orc, it becomes an Orc in
//     addition to its other types.
//   [2023-11-03] To amass Orcs N, if you don't control an Army creature, create a 0/0 black Orc
//     Army creature token. Then you choose an Army creature you control and put N +1/+1 counters
//     on it. If that Army isn't already an Orc, it becomes an Orc in addition to its other types.
//   [2023-11-03] If you don't control an Army, the Orc Army token you create enters the
//     battlefield as a 0/0 creature before receiving counters. Any abilities that trigger when a
//     creature with a certain power enters the battlefield, such as that of Mentor of the Meek,
//     will see the token enter as a 0/0 creature before it gets +1/+1 counters.

const MENACE_TEXT = "Other Orcs and Goblins you control have menace.";
const AMASS_TEXT = "At the beginning of combat on your turn, amass Orcs 2.";

export default defineCard({
  name: "Warg Rider",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Orc", "Warrior"],
  power: 4,
  toughness: 3,
  keywords: ["menace"],
  text:
    `Menace\n${MENACE_TEXT}\n${AMASS_TEXT} (Put two +1/+1 counters on an Army you control. ` +
    "It's also an Orc. If you don't control an Army, create a 0/0 black Orc Army creature token first.)",
  static: [
    {
      affects: {
        scope: "filter",
        filter: { type: "creature", controlledBy: "you", anyOf: [{ subtype: "Orc" }, { subtype: "Goblin" }] },
        excludeSelf: true,
      },
      grantKeywords: ["menace"],
      text: MENACE_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "begin-combat", who: "you" },
      targets: [],
      effect: { kind: "amass", amount: 2, creatureType: "Orc" },
      resolve: null,
      text: AMASS_TEXT,
    },
  ],
});
