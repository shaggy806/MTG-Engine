import { defineCard } from "../define.js";

// EDHREC rank 4573.
//
// Rulings:
//   [2009-05-01] If the defending player has fewer than ten cards in their library, that player's
//     entire library is put into their graveyard.

// "Defending player" is the player the attack trigger names
// (`"trigger-player"`, Kibo, Uktabi Prince's shape).
export default defineCard({
  name: "Nemesis of Reason",
  manaCost: "{3}{U}{B}",
  colors: ["U", "B"],
  types: ["creature"],
  subtypes: ["Leviathan", "Horror"],
  power: 3,
  toughness: 7,
  text: "Whenever this creature attacks, defending player mills ten cards.",
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "mill", target: "trigger-player", amount: 10 },
      resolve: null,
      text: "Whenever this creature attacks, defending player mills ten cards.",
    },
  ],
});
