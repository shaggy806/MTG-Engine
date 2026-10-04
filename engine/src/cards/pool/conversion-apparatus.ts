import { defineCard } from "../define.js";

// EDHREC rank 5999.
//
// The energy-cost mana ability is activated by hand (the auto-payer only pays
// costs it can pay by itself — Aether Hub's shape), its mana floating.
export default defineCard({
  name: "Conversion Apparatus",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {C}.\n{3}, {T}: You get {E}{E}{E} (three energy counters).\n{T}, Pay {E}{E}{E}: Add three mana in any combination of colors.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{3}", tap: true },
      targets: [],
      effect: { kind: "get-energy", amount: 3 },
      resolve: null,
      text: "{3}, {T}: You get {E}{E}{E} (three energy counters).",
    },
    {
      cost: { mana: null, tap: true, payEnergy: 3 },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["W", "U", "B", "R", "G"] }, amount: 3 },
      resolve: null,
      text: "{T}, Pay {E}{E}{E}: Add three mana in any combination of colors.",
    },
  ],
});
