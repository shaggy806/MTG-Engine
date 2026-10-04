import { defineCard } from "../define.js";

// EDHREC rank 4562.
//
// Rulings:
//   [2014-09-20] The activated ability can be activated only if Bloodsoaked Champion is in your
//     graveyard. Notably, if it attacks and then dies later in the turn, you can use its ability
//     to return it to the battlefield, as its attack satisfies its own activation instruction.
//   [2024-11-08] Raid abilities evaluate the entire turn to see if you attacked with a creature.
//     That creature doesn't have to still be on the battlefield. Similarly, the player,
//     planeswalker, or battle it attacked doesn't have to still be in the game or on the
//     battlefield.
//   [2024-11-08] Raid abilities care only that you attacked with a creature. It doesn't matter how
//     many creatures you attacked with or which player, planeswalker, or battle those creatures
//     attacked.

// The Raid return is Reassembling Skeleton's graveyard ability (the card
// stays in the graveyard while it's on the stack), gated on "Activate only
// if you attacked this turn" — Alesha's `attacked` turn stat, which reads the
// whole turn (the rulings).
const RAID_TEXT =
  "Raid — {1}{B}: Return this card from your graveyard to the battlefield. Activate only if you attacked this turn.";

export default defineCard({
  name: "Bloodsoaked Champion",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Warrior"],
  power: 2,
  toughness: 1,
  text: `This creature can't block.\n${RAID_TEXT}`,
  activated: [
    {
      cost: { mana: "{1}{B}", tap: false },
      zone: "graveyard",
      staysInZone: true,
      condition: { kind: "turn-stat", stat: "attacked", who: "you", atLeast: 1 },
      targets: [],
      effect: { kind: "put-onto-battlefield", target: "source" },
      resolve: null,
      text: RAID_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      restrictions: ["cant-block"],
      text: "This creature can't block.",
    },
  ],
});
