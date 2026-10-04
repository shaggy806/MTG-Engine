import { defineCard } from "../define.js";

// EDHREC rank 4216.
//
// Rulings:
//   [2024-09-20] Once you've announced that you're casting Drag to the Roots, players can't take
//     any actions until you've finished doing so. Notably, opponents can't try to remove cards
//     from your graveyard to change the cost of Drag to the Roots.

export default defineCard({
  name: "Drag to the Roots",
  manaCost: "{2}{B}{G}",
  colors: ["B", "G"],
  types: ["instant"],
  text: "Delirium — This spell costs {2} less to cast as long as there are four or more card types among cards in your graveyard.\nDestroy target nonland permanent.",
  selfCostReduction: { condition: { kind: "delirium" }, reduceGeneric: 2 },
  targets: ["nonland-permanent"],
  effect: { kind: "destroy", target: 0 },
});
