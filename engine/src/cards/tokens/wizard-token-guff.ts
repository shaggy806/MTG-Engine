import { defineCard } from "../define.js";

/** Commodore Guff's 1/1 red Wizard with a planeswalker-only mana ability. */
const TEXT = "{T}: Add {R}. Spend this mana only to cast a planeswalker spell.";

export default defineCard({
  name: "Wizard Token (Guff)",
  art: "4de5b65c-00c7-415a-92f3-cd1177372956",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Wizard"],
  power: 1,
  toughness: 1,
  text: TEXT,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "R",
        amount: 1,
        spendOnly: { spell: { type: "planeswalker" }, text: "Spend this mana only to cast a planeswalker spell." },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
