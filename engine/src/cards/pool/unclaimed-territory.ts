import { defineCard } from "../define.js";

export default defineCard({
  name: "Unclaimed Territory",
  types: ["land"],
  text:
    "As Unclaimed Territory enters, choose a creature type.\n" +
    "{T}: Add {C}.\n" +
    "{T}: Add one mana of any color. Spend this mana only to cast a creature spell of the chosen type.",
  chooseCreatureTypeOnEnter: true,
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
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        // `chosenType` folds the type named as the land entered into the
        // filter — it isn't printed, so it can't be written here.
        spendOnly: {
          spell: { type: "creature" },
          chosenType: true,
          text: "Spend this mana only to cast a creature spell of the chosen type.",
        },
      },
      resolve: null,
      text:
        "{T}: Add one mana of any color. Spend this mana only to cast a creature spell of the chosen type.",
    },
  ],
});
