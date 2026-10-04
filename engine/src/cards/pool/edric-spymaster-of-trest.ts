import { defineCard } from "../define.js";

// EDHREC rank 3424.
//
// Rulings:
//   [2011-09-22] A creature controlled by an opponent that deals combat damage to another opponent
//     will cause Edric's ability to trigger. The creature's controller chooses whether to draw a
//     card.
//   [2011-09-22] When a creature you control deals combat damage to one of your opponents, you may
//     draw a card.
//   [2015-01-19] Edric, Spymaster of Trest is banned as a commander in Duel Commander format, but
//     it may be part of your deck.
//
// Gix, Yawgmoth Praetor's trigger shape: `toOpponent` with `who: "any"`, and the
// creature's controller (`"trigger-controller"`) is the one asked — what they
// choose is their own draw.

const TEXT = "Whenever a creature deals combat damage to one of your opponents, its controller may draw a card.";

export default defineCard({
  name: "Edric, Spymaster of Trest",
  manaCost: "{1}{G}{U}",
  colors: ["U", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Elf", "Rogue"],
  power: 2,
  toughness: 2,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "any", filter: { type: "creature" }, toOpponent: true },
      targets: [],
      effect: {
        kind: "each-player-may",
        who: "trigger-controller",
        prompt: "Draw a card?",
        effect: { kind: "draw", amount: 1 },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
