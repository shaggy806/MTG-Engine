import { defineCard } from "../define.js";

// EDHREC rank 4649.
//
// Rulings:
//   [2018-04-27] Once you announce that you’re casting Wizard’s Retort, no player may take other
//     actions until the spell’s been paid for. Notably, players can’t try to raise the spell’s
//     cost by removing your Wizards.

export default defineCard({
  name: "Wizard's Retort",
  manaCost: "{1}{U}{U}",
  colors: ["U"],
  types: ["instant"],
  text: "This spell costs {1} less to cast if you control a Wizard.\nCounter target spell.",
  selfCostReduction: {
    condition: { kind: "controls", filter: { subtype: "Wizard" }, atLeast: 1 },
    reduceGeneric: 1,
  },
  targets: ["spell"],
  effect: { kind: "counter", target: 0 },
});
