import { defineCard } from "../define.js";

// Affinity for artifact creatures (rule 702.41) is a cost reduction counted
// off the battlefield as the spell is cast. The menace grant reads current
// types, so an artifact animated into a creature gets it too.
export default defineCard({
  name: "Urza, Chief Artificer",
  manaCost: "{3}{W}{U}{B}",
  colors: ["W", "U", "B"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Artificer"],
  power: 4,
  toughness: 5,
  text:
    "Affinity for artifact creatures (This spell costs {1} less to cast for each artifact creature you control.)\n" +
    "Artifact creatures you control have menace.\n" +
    "At the beginning of your end step, create a 0/0 colorless Construct artifact creature token with \"This token gets +1/+1 for each artifact you control.\"",
  selfCostReduction: {
    // Unconditional: the same always-true gate Emry and Blasphemous Act use.
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    reduceGeneric: { countOf: { types: ["artifact", "creature"], controlledBy: "you" } },
  },
  static: [
    {
      affects: {
        scope: "filter",
        filter: { types: ["artifact", "creature"], controlledBy: "you" },
      },
      grantKeywords: ["menace"],
      text: "Artifact creatures you control have menace.",
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Construct Token", count: 1 },
      resolve: null,
      text: "At the beginning of your end step, create a 0/0 colorless Construct artifact creature token with \"This token gets +1/+1 for each artifact you control.\"",
    },
  ],
});
