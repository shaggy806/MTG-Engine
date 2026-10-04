import { defineCard } from "../define.js";

// EDHREC rank 5985.
//
// Rulings:
//   [2014-11-07] If you lose control of your commander, lieutenant abilities of creatures you
//     control will immediately stop applying. If this causes a creature’s toughness to become less
//     than or equal to the amount of damage marked on it, the creature will be destroyed.
//   [2014-11-07] If you gain control of a creature with a lieutenant ability owned by another
//     player, that ability will check to see if you control your commander and will apply if you
//     do. It won’t check whether its owner controls their commander.
//   [2014-11-07] Lieutenant abilities apply only if your commander is on the battlefield and under
//     your control.
//   [2014-11-07] Lieutenant abilities refer only to whether you control your commander, not any
//     other player’s commander.
//   [2014-11-07] If a triggered ability granted by a lieutenant ability triggers, and in response
//     to that trigger you lose control of your commander (causing the lieutenant to lose that
//     ability), that triggered ability will still resolve.
//
// Tyrant's Familiar's shape: Lieutenant is a condition on controlling your own commander.
const TEXT =
  'Lieutenant — As long as you control your commander, this creature gets +2/+2 and has "Whenever this creature becomes blocked, you may draw two cards."';

export default defineCard({
  name: "Stormsurge Kraken",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Kraken"],
  power: 5,
  toughness: 5,
  keywords: ["hexproof"],
  text: `Hexproof\n${TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      condition: {
        kind: "controls",
        filter: { isCommander: true, controlledBy: "you", ownedBy: "you" },
        atLeast: 1,
      },
      grantPt: [2, 2],
      grantsTriggered: [
        {
          trigger: { on: "becomes-blocked", who: "self" },
          targets: [],
          effect: { kind: "may", prompt: "Draw two cards?", effect: { kind: "draw", amount: 2 } },
          resolve: null,
          text: "Whenever this creature becomes blocked, you may draw two cards.",
        },
      ],
      text: TEXT,
    },
  ],
});
