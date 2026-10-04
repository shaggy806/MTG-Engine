import { defineCard } from "../define.js";

// EDHREC rank 5969.
//
// Rulings:
//   [2018-01-19] To choose a creature type, you must choose an existing creature type, such as
//     Vampire or Knight. You can’t choose multiple creature types, such as “Vampire Knight.” Card
//     types such as artifact can’t be chosen, nor can subtypes that aren’t creature types, such as
//     Jace, Vehicle, or Treasure.
//
// Unclaimed Territory's shape: the type is chosen as it enters, and `chosenType`
// folds it into the spend restriction.
export default defineCard({
  name: "Pillar of Origins",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "As this artifact enters, choose a creature type.\n{T}: Add one mana of any color. Spend this mana only to cast a creature spell of the chosen type.",
  chooseCreatureTypeOnEnter: true,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        spendOnly: {
          spell: { type: "creature" },
          chosenType: true,
          text: "Spend this mana only to cast a creature spell of the chosen type.",
        },
      },
      resolve: null,
      text: "{T}: Add one mana of any color. Spend this mana only to cast a creature spell of the chosen type.",
    },
  ],
});
