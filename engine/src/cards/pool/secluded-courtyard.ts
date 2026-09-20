import { defineCard } from "../define.js";

export default defineCard({
  name: "Secluded Courtyard",
  types: ["land"],
  text:
    "As Secluded Courtyard enters, choose a creature type.\n" +
    "{T}: Add {C}.\n" +
    "{T}: Add one mana of any color. Spend this mana only to cast a creature spell of the chosen " +
    "type or activate an ability of a creature source of the chosen type.",
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
          // The extra half over Unclaimed Territory: this mana also pays for
          // activated abilities of matching creatures.
          abilityOf: { type: "creature" },
          chosenType: true,
          text:
            "Spend this mana only to cast a creature spell of the chosen type or activate an " +
            "ability of a creature source of the chosen type.",
        },
      },
      resolve: null,
      text:
        "{T}: Add one mana of any color. Spend this mana only to cast a creature spell of the " +
        "chosen type or activate an ability of a creature source of the chosen type.",
    },
  ],
});
