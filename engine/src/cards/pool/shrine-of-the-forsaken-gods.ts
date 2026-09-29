import { defineCard } from "../define.js";

const TWO_TEXT =
  "{T}: Add {C}{C}. Spend this mana only to cast colorless spells. Activate only if you control seven or more lands.";

export default defineCard({
  name: "Shrine of the Forsaken Gods",
  colors: [],
  types: ["land"],
  text: `{T}: Add {C}.\n${TWO_TEXT}`,
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
      condition: { kind: "controls", filter: { type: "land" }, atLeast: 7 },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "C",
        amount: 2,
        spendOnly: { spell: { colorless: true }, text: "Spend this mana only to cast colorless spells." },
      },
      resolve: null,
      text: TWO_TEXT,
    },
  ],
});
