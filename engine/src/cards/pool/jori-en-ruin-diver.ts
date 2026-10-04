import { defineCard } from "../define.js";

// EDHREC rank 4802.
//
// Rulings:
//   [2016-01-22] Jori En’s ability can trigger only once each turn. The ability will resolve
//     before the second spell resolves. It doesn’t matter if the first spell you cast that turn
//     has resolved, was countered, or is still on the stack.
//   [2016-01-22] Jori En must be on the battlefield in order for the ability to function. Notably,
//     the ability won’t trigger if Jori En is the second spell you cast in a turn.

const TEXT = "Whenever you cast your second spell each turn, draw a card.";

export default defineCard({
  name: "Jori En, Ruin Diver",
  manaCost: "{1}{U}{R}",
  colors: ["U", "R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 2,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", nthEachTurn: 2 },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
