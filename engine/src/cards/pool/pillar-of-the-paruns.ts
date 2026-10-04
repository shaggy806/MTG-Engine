import { defineCard } from "../define.js";

// EDHREC rank 6356.

export default defineCard({
  name: "Pillar of the Paruns",
  colors: [],
  types: ["land"],
  text: "{T}: Add one mana of any color. Spend this mana only to cast a multicolored spell.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "any-color",
        amount: 1,
        spendOnly: { spell: { multicolored: true }, text: "Spend this mana only to cast a multicolored spell." },
      },
      resolve: null,
      text: "{T}: Add one mana of any color. Spend this mana only to cast a multicolored spell.",
    },
  ],
});
