import { defineCard } from "../define.js";

// EDHREC rank 6725. Scaled Nurturer's `whenSpent` rider: a real delayed
// triggered ability, one per {U} spent, that fires whether or not the Orb is
// still around.
//
// Rulings:
//   If more than one {U} produced by a Lapis Orb of Dragonkind is spent to cast a single Dragon
//     creature spell, the delayed triggered ability associated with each mana spent will
//     trigger. You will scry 2 that many times.
//   The mana created by Lapis Orb of Dragonkind can be spent on anything, not just Dragon
//     creature spells.
//   The delayed triggered ability will trigger whether Lapis Orb of Dragonkind is still on the
//     battlefield or not.

const TEXT =
  "{T}: Add {U}. When you spend this mana to cast a Dragon creature spell, scry 2. (Look at the top two cards of your library, then put any number of them on the bottom and the rest on top in any order.)";

export default defineCard({
  name: "Lapis Orb of Dragonkind",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["artifact"],
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "U",
        amount: 1,
        whenSpent: {
          spell: { type: "creature", subtype: "Dragon" },
          effect: { kind: "scry", amount: 2 },
          text: "When you spend this mana to cast a Dragon creature spell, scry 2.",
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
