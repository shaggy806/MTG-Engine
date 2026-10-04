import { defineCard } from "../define.js";

// EDHREC rank 2961.

const UPKEEP_TEXT = "At the beginning of your upkeep, put an oil counter on this artifact.";
const REDUCE_TEXT =
  "Instant and sorcery spells you cast cost {1} less to cast for each oil counter on this artifact.";

export default defineCard({
  name: "Mindsplice Apparatus",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["artifact"],
  keywords: ["flash"],
  text: `Flash\n${UPKEEP_TEXT}\n${REDUCE_TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "oil", amount: 1 },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { typesAnyOf: ["instant", "sorcery"] },
        caster: "you",
        reduceGeneric: { countersOnSource: "oil" },
      },
      text: REDUCE_TEXT,
    },
  ],
});
