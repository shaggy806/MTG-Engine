import { defineCard } from "../define.js";

// EDHREC rank 4745.
// Each end step (anyone's), with Ophiomancer's intervening-if: checked as it
// triggers and again as it resolves (rule 603.4).
const SAC_TEXT = "At the beginning of the end step, if you control no artifacts, sacrifice this land.";

export default defineCard({
  name: "Glimmervoid",
  colors: [],
  types: ["land"],
  text: `${SAC_TEXT}\n{T}: Add one mana of any color.`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any color.",
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "any" },
      condition: {
        kind: "not",
        of: { kind: "controls", filter: { type: "artifact" }, atLeast: 1 },
      },
      targets: [],
      effect: { kind: "sacrifice-source" },
      resolve: null,
      text: SAC_TEXT,
    },
  ],
});
