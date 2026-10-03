import { defineCard } from "../define.js";

const UNTAPPED_TEXT = "Gates you control enter untapped.";
const COLOR_TEXT = "{T}: Add one mana of any color that a Gate you control could produce.";

// "Any color" a Gate you control could produce (rule 106.7) — never {C}, and
// not Gond Gate's own colours, which it reads off the other Gates.
export default defineCard({
  name: "Gond Gate",
  types: ["land"],
  subtypes: ["Gate"],
  text: `${UNTAPPED_TEXT}\n{T}: Add {C}.\n${COLOR_TEXT}`,
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
      effect: { kind: "add-mana", mana: { producedBy: "your-lands", filter: { subtype: "Gate" } }, amount: 1 },
      resolve: null,
      text: COLOR_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: {
        event: "others-enter-battlefield",
        filter: { type: "land", subtype: "Gate", controlledBy: "you" },
        untapped: true,
      },
      text: UNTAPPED_TEXT,
    },
  ],
});
