import { defineCard } from "../define.js";

// EDHREC rank 5711.
//
// Rulings:
//   [2009-05-01] A permanent card is an artifact, creature, enchantment, land, or planeswalker
//     card.
//   [2009-05-01] You may always find a permanent card with mana value 0. (If X is 0, that's all
//     you can find.) Cards with no mana cost (such as land cards), cards with mana cost {0}, and
//     cards with mana cost {X} all have mana value 0.

export default defineCard({
  name: "Wargate",
  manaCost: "{X}{G}{W}{U}",
  colors: ["W", "U", "G"],
  types: ["sorcery"],
  text: "Search your library for a permanent card with mana value X or less, put it onto the battlefield, then shuffle.",
  // Finale of Devastation's search: the filter reads this spell's X. A search
  // of a hidden zone may fail to find (rule 701.19b), hence `min: 0`.
  effect: {
    kind: "search-library",
    filter: {
      typesAnyOf: ["artifact", "creature", "enchantment", "land", "planeswalker", "battle"],
      manaValue: { op: "lte", n: "x" },
    },
    destination: "battlefield",
    min: 0,
    max: 1,
  },
});
