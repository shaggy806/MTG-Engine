import { defineCard } from "../define.js";

export default defineCard({
  name: "Blasphemous Act",
  manaCost: "{8}{R}",
  colors: ["R"],
  types: ["sorcery"],
  text:
    "This spell costs {1} less to cast for each creature on the battlefield.\n" +
    "Blasphemous Act deals 13 damage to each creature.",
  // The reduction always applies (no real "if" clause) — `atLeast: 0` makes
  // the required StaticCondition trivially true regardless of board state.
  selfCostReduction: {
    condition: { kind: "controls", filter: {}, atLeast: 0 },
    reduceGeneric: { countOf: { type: "creature" } },
  },
  effect: { kind: "damage-all", filter: { type: "creature" }, amount: 13 },
});
