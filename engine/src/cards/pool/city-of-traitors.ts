import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const SAC_TEXT = "When you play another land, sacrifice this land.";

// Only a land *played* — not one put onto the battlefield — and not its own
// play (the rulings).
export default defineCard({
  name: "City of Traitors",
  types: ["land"],
  text: `${SAC_TEXT}\n{T}: Add {C}{C}.`,
  triggered: [
    {
      trigger: { on: "plays-land", who: "you", otherOnly: true },
      targets: [],
      effect: { kind: "sacrifice-source" },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
  activated: [addManaAbility({ mana: "C", amount: 2, text: "{T}: Add {C}{C}." })],
});
