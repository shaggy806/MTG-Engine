import { defineCard } from "../define.js";

export default defineCard({
  name: "Thought Monitor",
  manaCost: "{6}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text:
    "Affinity for artifacts (This spell costs {1} less to cast for each artifact you control.)\n" +
    "Flying\n" +
    "When this creature enters, draw two cards.",
  selfCostReduction: {
    // Unconditional: the same always-true gate Emry uses.
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    reduceGeneric: { countOf: { type: "artifact", controlledBy: "you" } },
  },
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "When this creature enters, draw two cards.",
    },
  ],
});
