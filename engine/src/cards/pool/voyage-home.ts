import { defineCard } from "../define.js";

// EDHREC rank 3837.

export default defineCard({
  name: "Voyage Home",
  manaCost: "{5}{W}{U}",
  colors: ["W", "U"],
  types: ["sorcery"],
  text: "Affinity for artifacts (This spell costs {1} less to cast for each artifact you control.)\nYou draw three cards and gain 3 life.",
  selfCostReduction: {
    // Unconditional: the same always-true gate Thought Monitor uses.
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    reduceGeneric: { countOf: { type: "artifact", controlledBy: "you" } },
  },
  effect: {
    kind: "sequence",
    effects: [
      { kind: "draw", amount: 3 },
      { kind: "gain-life", amount: 3 },
    ],
  },
});
