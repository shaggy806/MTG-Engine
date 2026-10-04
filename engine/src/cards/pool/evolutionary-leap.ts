import { defineCard } from "../define.js";

// EDHREC rank 3343.
//
// Rulings:
//   [2021-03-19] If you don't reveal a creature card, you'll reveal all the cards from your
//     library and then put them back in your library in a random order.

const TEXT =
  "{G}, Sacrifice a creature: Reveal cards from the top of your library until you reveal a creature card. Put that card into your hand and the rest on the bottom of your library in a random order.";

export default defineCard({
  name: "Evolutionary Leap",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: TEXT,
  activated: [
    {
      cost: { mana: "{G}", tap: false, sacrifice: "creature-you-control" },
      targets: [],
      effect: { kind: "reveal-until", filter: { type: "creature" }, put: "hand", rest: "bottom-random" },
      resolve: null,
      text: TEXT,
    },
  ],
});
