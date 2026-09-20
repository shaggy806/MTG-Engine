import { defineCard } from "../define.js";

export default defineCard({
  name: "Ancient Ziggurat",
  types: ["land"],
  text: "{T}: Add one mana of any color. Spend this mana only to cast a creature spell.",
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
          text: "Spend this mana only to cast a creature spell.",
        },
      },
      resolve: null,
      text: "{T}: Add one mana of any color. Spend this mana only to cast a creature spell.",
    },
  ],
});
