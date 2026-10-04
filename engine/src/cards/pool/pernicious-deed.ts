import { defineCard } from "../define.js";

// EDHREC rank 5723.
//
// Rulings:
//   [2018-03-16] If a permanent has {X} in its mana cost, X is considered to be 0.
//   [2018-03-16] A token has a mana value of 0 unless it is copying something else.

export default defineCard({
  name: "Pernicious Deed",
  manaCost: "{1}{B}{G}",
  colors: ["B", "G"],
  types: ["enchantment"],
  text: "{X}, Sacrifice this enchantment: Destroy each artifact, creature, and enchantment with mana value X or less.",
  activated: [
    {
      cost: { mana: "{X}", tap: false, sacrifice: "self" },
      targets: [],
      effect: {
        kind: "destroy-all",
        filter: { typesAnyOf: ["artifact", "creature", "enchantment"], manaValue: { op: "lte", n: "x" } },
      },
      resolve: null,
      text: "{X}, Sacrifice this enchantment: Destroy each artifact, creature, and enchantment with mana value X or less.",
    },
  ],
});
