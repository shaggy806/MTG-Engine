import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const TEXT =
  "{1}, {T}: Add two mana in any combination of colors. Spend this mana only to cast legendary spells.";

export default defineCard({
  name: "Great Hall of the Citadel",
  types: ["land"],
  text: `{T}: Add {C}.\n${TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{1}", tap: true },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: { oneOf: ["W", "U", "B", "R", "G"] },
        amount: 2,
        spendOnly: { spell: { supertype: "legendary" }, text: "Spend this mana only to cast legendary spells." },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
