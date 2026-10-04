import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

// EDHREC rank 5430.
//
// Rulings:
//   [2021-07-23] If a spell or ability an opponent controls targets Iymrith, Desert Doom while it
//     is tapped, finding a way to untap it in response will not cause its ward ability to trigger.
//   [2021-07-23] If a player casts a spell that targets multiple permanents their opponent
//     controls with ward, each of those ward abilities will trigger. If that player doesn't pay
//     for all of them, the spell will be countered.

export default defineCard({
  name: "Iymrith, Desert Doom",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Dragon"],
  power: 5,
  toughness: 5,
  keywords: ["flying"],
  text: "Flying\nIymrith has ward {4} as long as it's untapped.\nWhenever Iymrith deals combat damage to a player, draw a card. Then if you have fewer than three cards in hand, draw cards equal to the difference.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "draw", amount: { difference: [3, { cardsInHand: "you" }] } },
        ],
      },
      resolve: null,
      text: "Whenever Iymrith deals combat damage to a player, draw a card. Then if you have fewer than three cards in hand, draw cards equal to the difference.",
    },
  ],
  static: [
    {
      // Granted only while untapped, so a target chosen while it's tapped
      // never triggers it, even if it untaps in response (the ruling).
      affects: { scope: "self" },
      condition: { kind: "source", filter: { tapped: false } },
      grantsTriggered: [ward({ mana: "{4}" })],
      text: "Iymrith has ward {4} as long as it's untapped.",
    },
  ],
});
