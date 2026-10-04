import { defineCard } from "../define.js";

// EDHREC rank 5937.
//
// Rulings:
//   [2010-08-15] The mana value of the revealed card is determined solely by the mana symbols
//     printed in its upper right corner. The mana value is the total amount of mana in that cost,
//     regardless of color. For example, a card with mana cost {3}{U}{U} has mana value 5.
//   [2010-08-15] If the mana cost of the revealed card includes {X}, X is considered to be 0.
//   [2010-08-15] If the revealed card has no mana symbols in its upper right corner (because it's
//     a land card, for example), its mana value is 0.

export default defineCard({
  name: "Dark Tutelage",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: "At the beginning of your upkeep, reveal the top card of your library and put that card into your hand. You lose life equal to its mana value.",
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      // Dark Confidant's shape.
      effect: {
        kind: "look-and-choose",
        zone: "library",
        count: 1,
        min: 1,
        max: 1,
        destination: "hand",
        leftover: "stay",
        reveal: true,
        then: { kind: "lose-life", who: "you", amount: { manaValueOf: 0 } },
      },
      resolve: null,
      text: "At the beginning of your upkeep, reveal the top card of your library and put that card into your hand. You lose life equal to its mana value.",
    },
  ],
});
