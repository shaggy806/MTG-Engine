import { defineCard } from "../define.js";

const ANTHEM_TEXT = "Creatures you control get +1/+1 and have flying and indestructible.";
const UPKEEP_TEXT = "At the beginning of your upkeep, sacrifice a creature. If you can't, sacrifice this artifact.";

export default defineCard({
  name: "Eldrazi Monument",
  manaCost: "{5}",
  colors: [],
  types: ["artifact"],
  text: `${ANTHEM_TEXT}\n${UPKEEP_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantPt: [1, 1],
      grantKeywords: ["flying", "indestructible"],
      text: ANTHEM_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "sacrifice", who: "you", filter: { type: "creature" }, count: 1 },
          {
            kind: "conditional",
            condition: { kind: "this-way", what: "sacrificed", atMost: 0 },
            then: { kind: "sacrifice-source" },
          },
        ],
      },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
