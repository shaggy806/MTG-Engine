import { defineCard } from "../define.js";

// EDHREC rank 3530.
//
// Rulings:
//   [2017-09-29] You can target and gain control of an untapped creature this way.

const TEXT =
  "{3}{R}: Gain control of target creature an opponent controls until end of turn. Untap that creature. It gains haste until end of turn. Activate only as a sorcery.";

export default defineCard({
  name: "Captivating Crew",
  manaCost: "{3}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Pirate"],
  power: 4,
  toughness: 3,
  text: TEXT,
  activated: [
    {
      cost: { mana: "{3}{R}", tap: false },
      targets: ["creature-an-opponent-controls"],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "gain-control", target: 0, untilEndOfTurn: true },
          { kind: "untap", target: 0 },
          { kind: "grant-keyword", target: 0, keyword: "haste", duration: "end-of-turn" },
        ],
      },
      resolve: null,
      text: TEXT,
      sorcerySpeed: true,
    },
  ],
});
