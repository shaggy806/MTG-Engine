import { defineCard } from "../define.js";

export default defineCard({
  name: "Cavern of Souls",
  types: ["land"],
  text:
    "As Cavern of Souls enters, choose a creature type.\n" +
    "{T}: Add {C}.\n" +
    "{T}: Add one mana of any color. Spend this mana only to cast a creature spell of the chosen " +
    "type, and that spell can't be countered.",
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
        spendOnly: {
          spell: { type: "creature" },
          chosenType: true,
          // "That spell can't be countered" belongs to the spell this mana
          // pays for, not to the land — so it rides on the mana.
          uncounterable: true,
          text:
            "Spend this mana only to cast a creature spell of the chosen type, and that spell " +
            "can't be countered.",
        },
      },
      resolve: null,
      text:
        "{T}: Add one mana of any color. Spend this mana only to cast a creature spell of the " +
        "chosen type, and that spell can't be countered.",
    },
  ],
});
