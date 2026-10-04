import { defineCard } from "../define.js";

// EDHREC rank 3356.
//
// Rulings:
//   [2021-04-16] To determine the total cost of a spell, start with the mana cost or alternative
//     cost you're paying, add any cost increases, then apply any cost reductions (such as that of
//     Mortality Spear). Mortality Spear's mana value is always 4, no matter what the total cost to
//     cast it was.

export default defineCard({
  name: "Mortality Spear",
  manaCost: "{2}{B}{G}",
  colors: ["B", "G"],
  types: ["instant"],
  text: "This spell costs {2} less to cast if you gained life this turn.\nDestroy target nonland permanent.",
  selfCostReduction: {
    condition: { kind: "turn-stat", stat: "life-gained", who: "you", atLeast: 1 },
    reduceGeneric: 2,
  },
  targets: ["nonland-permanent"],
  effect: { kind: "destroy", target: 0 },
});
