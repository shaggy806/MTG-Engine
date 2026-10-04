import { defineCard } from "../define.js";

// EDHREC rank 3681. Gilanra, Caller of Wirewood's `whenSpent` rider.
//
// Rulings:
//   [2022-06-10] The mana created by Scaled Nurturer can be spent on anything, not just Dragon
//     creature spells.
//   [2022-06-10] If more than one {G} produced by a Scaled Nurturer is spent to cast a single
//     Dragon creature spell, the delayed triggered ability associated with each mana spent will
//     trigger. You will gain 2 life that many times.
//   [2022-06-10] The delayed triggered ability will trigger whether Scaled Nurturer is still on
//     the battlefield or not.

const TEXT = "{T}: Add {G}. When you spend this mana to cast a Dragon creature spell, you gain 2 life.";

export default defineCard({
  name: "Scaled Nurturer",
  manaCost: "{1}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Dragon", "Druid"],
  power: 0,
  toughness: 2,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "G",
        amount: 1,
        whenSpent: {
          spell: { type: "creature", subtype: "Dragon" },
          effect: { kind: "gain-life", amount: 2 },
          text: "When you spend this mana to cast a Dragon creature spell, you gain 2 life.",
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
