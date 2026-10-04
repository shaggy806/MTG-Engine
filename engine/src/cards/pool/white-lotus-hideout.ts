import { defineCard } from "../define.js";

// EDHREC rank 5354.
//
// Rulings:
//   [2025-10-02] A "Lesson or Shrine spell" is any spell with the subtype Lesson or Shrine. Mana
//     produced by the second ability can't be spent to pay the costs of abilities of Shrines you
//     control.

export default defineCard({
  name: "White Lotus Hideout",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{T}: Add one mana of any color. Spend this mana only to cast a Lesson or Shrine spell.\n{1}, {T}: Add one mana of any color.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: null, tap: true },
      targets: [],
      // Spells only — not the abilities of Shrines (the ruling).
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        spendOnly: {
          spell: { subtypes: ["Lesson", "Shrine"] },
          text: "Spend this mana only to cast a Lesson or Shrine spell.",
        },
      },
      resolve: null,
      text: "{T}: Add one mana of any color. Spend this mana only to cast a Lesson or Shrine spell.",
    },
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{1}, {T}: Add one mana of any color.",
    },
  ],
});
