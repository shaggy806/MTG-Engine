import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

const WORKSHOP_TEXT =
  "Metalcraft — {T}: Add {C} for each Urza's land you control. Activate only if you control three or more artifacts.";

// "Land — Urza's" is the one land type, Urza's (rule 205.3i); the count
// includes this land itself.
export default defineCard({
  name: "Urza's Workshop",
  types: ["land"],
  subtypes: ["Urza's"],
  text: `{T}: Add {C}.\n${WORKSHOP_TEXT}`,
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: null, tap: true },
      condition: { kind: "metalcraft" },
      targets: [],
      effect: {
        kind: "add-mana",
        mana: "C",
        amount: { countOf: { type: "land", subtype: "Urza's", controlledBy: "you" } },
      },
      resolve: null,
      text: WORKSHOP_TEXT,
    },
  ],
});
