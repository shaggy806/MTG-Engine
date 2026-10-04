import { defineCard } from "../define.js";
import { affinity } from "../helpers.js";

// EDHREC rank 4915.
// Makes Sliver → new token "Sliver Token".
//
// Rulings:
//   [2025-07-25] To determine the total cost of a spell, start with the mana cost or alternative
//     cost you're paying, add any cost increases, then apply any cost reductions. The mana value
//     of the spell remains unchanged, no matter what the total cost to cast it was.

const GRANT_TEXT = "Slivers you control have double strike and haste.";
const UPKEEP_TEXT = "At the beginning of your upkeep, create two 1/1 colorless Sliver creature tokens.";

export default defineCard({
  name: "Thrumming Hivepool",
  manaCost: "{6}",
  colors: [],
  types: ["artifact"],
  text: `Affinity for Slivers (This spell costs {1} less to cast for each Sliver you control.)\n${GRANT_TEXT}\n${UPKEEP_TEXT}`,
  selfCostReduction: affinity({ subtype: "Sliver" }),
  static: [
    {
      affects: { scope: "filter", filter: { subtype: "Sliver", controlledBy: "you" } },
      grantKeywords: ["double-strike", "haste"],
      text: GRANT_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "step-begins", step: "upkeep", who: "you" },
      targets: [],
      effect: { kind: "create-token", token: "Sliver Token", count: 2 },
      resolve: null,
      text: UPKEEP_TEXT,
    },
  ],
});
