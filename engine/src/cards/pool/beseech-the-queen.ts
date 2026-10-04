import { defineCard } from "../define.js";

// EDHREC rank 2999.
//
// Rulings:
//   [2008-05-01] If a cost includes more than one monocolored hybrid mana symbol, you can choose a
//     different way to pay for each symbol. For example, you can pay for Beseech the Queen by
//     spending {B}{B}{B}, {2}{B}{B}, {4}{B}, or {6}.
//   [2008-05-01] A card with monocolored hybrid mana symbols in its mana cost has a mana value
//     equal to the highest possible cost it could be cast for. Its mana value never changes. Thus,
//     Beseech the Queen has a mana value of 6, even if you spend {B}{B}{B} to cast it.
//   [2008-05-01] A card with a monocolored hybrid mana symbol in its mana cost is each of the
//     colors that appears in its mana cost, regardless of what mana was spent to cast it. Thus,
//     Beseech the Queen is black even if you spend six red mana to cast it.
//   [2008-05-01] If an effect reduces the cost to cast a spell by an amount of generic mana, it
//     applies to a monocolored hybrid spell only if you’ve chosen a method of paying for it that
//     includes generic mana.

export default defineCard({
  name: "Beseech the Queen",
  manaCost: "{2/B}{2/B}{2/B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "({2/B} can be paid with any two mana or with {B}. This card's mana value is 6.)\nSearch your library for a card with mana value less than or equal to the number of lands you control, reveal it, put it into your hand, then shuffle.",
  effect: {
    kind: "search-library",
    filter: {
      manaValue: { op: "lte", n: { amount: { countOf: { type: "land", controlledBy: "you" } } } },
    },
    destination: "hand",
    min: 0,
    max: 1,
    reveal: true,
  },
});
