import { defineCard } from "../define.js";

// EDHREC rank 5380.
//
// Rulings:
//   [2023-06-16] You must follow all normal timing rules for a card you play using Moria
//     Marauder's last ability and, if it's a spell, you must pay its costs to cast it.

const TEXT =
  "Whenever a Goblin or Orc you control deals combat damage to a player, exile the top card of your library. You may play that card this turn.";

export default defineCard({
  name: "Moria Marauder",
  manaCost: "{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Warrior"],
  power: 1,
  toughness: 1,
  keywords: ["double-strike"],
  text: `Double strike\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { subtypes: ["Goblin", "Orc"] } },
      targets: [],
      effect: { kind: "impulse-exile", amount: 1, duration: "end-of-turn" },
      resolve: null,
      text: TEXT,
    },
  ],
});
