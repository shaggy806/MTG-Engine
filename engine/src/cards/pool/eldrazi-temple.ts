import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const TEMPLE_TEXT =
  "{T}: Add {C}{C}. Spend this mana only to cast colorless Eldrazi spells or activate abilities of colorless Eldrazi.";
const ELDRAZI = { subtype: "Eldrazi", colorless: true } as const;

export default defineCard({
  name: "Eldrazi Temple",
  types: ["land"],
  text: `{T}: Add {C}.\n${TEMPLE_TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "C",
        amount: 2,
        spendOnly: {
          spell: ELDRAZI,
          abilityOf: ELDRAZI,
          text: "Spend this mana only to cast colorless Eldrazi spells or activate abilities of colorless Eldrazi.",
        },
      },
      resolve: null,
      text: TEMPLE_TEXT,
    },
  ],
});
