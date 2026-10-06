import { defineCard } from "../define.js";

// EDHREC rank 6660.
//
// Rulings:
//   [2011-01-01] Stoic Rebuttal's metalcraft ability functions while Stoic Rebuttal is on the
//     stack.
//   [2011-01-01] For the purpose of determining whether the cost reduction applies, the number of
//     artifacts you control is checked as you cast Stoic Rebuttal, before your last chance to
//     activate mana abilities to pay for it.

// Wizard's Retort's shape, on metalcraft.
export default defineCard({
  name: "Stoic Rebuttal",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "Metalcraft — This spell costs {1} less to cast if you control three or more artifacts.\nCounter target spell.",
  selfCostReduction: {
    condition: { kind: "metalcraft" },
    reduceGeneric: 1,
  },
  targets: ["spell"],
  effect: { kind: "counter", target: 0 },
});
