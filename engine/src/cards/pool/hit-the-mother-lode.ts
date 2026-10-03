import { defineCard } from "../define.js";

const TEXT =
  "Discover 10. If the discovered card's mana value is less than 10, create a number of tapped Treasure tokens equal to the difference. (To discover 10, exile cards from the top of your library until you exile a nonland card with mana value 10 or less. Cast it without paying its mana cost or put it into your hand. Put the rest on the bottom in a random order.)";

// Discover 10 (rule 701.57a) is Breaching Dragonstorm's reveal: exile until a
// nonland card with mana value 10 or less, cast it free if that spell's mana
// value is 10 or less, otherwise (declined, or it can't be cast — the
// rulings) into its owner's hand. The Treasures come once that card has been
// cast or put into the hand, so none can pay its additional cost (the
// ruling); nothing found, nothing discovered, and no Treasures.
export default defineCard({
  name: "Hit the Mother Lode",
  manaCost: "{4}{R}{R}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: TEXT,
  effect: {
    kind: "reveal-until",
    filter: { notTypes: ["land"], manaValue: { op: "lte", n: 10 } },
    exile: true,
    keepFound: true,
    rest: "bottom-random",
    then: {
      kind: "sequence",
      effects: [
        {
          kind: "cast-now",
          target: 0,
          free: true,
          spell: { manaValue: { op: "lte", n: 10 } },
          else: { kind: "return-to-hand", target: 0, from: "exile" },
        },
        {
          kind: "create-token",
          token: "Treasure Token",
          count: { difference: [10, { manaValueOf: 0 }] },
          tapped: true,
        },
      ],
    },
  },
});
