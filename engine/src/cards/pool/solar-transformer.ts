import { defineCard } from "../define.js";

// EDHREC rank 3245.
//
// The energy-cost mana ability is activated by hand (the auto-payer only pays
// costs it can pay by itself — AUTHORING §8), its mana floating.

export default defineCard({
  name: "Solar Transformer",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "This artifact enters tapped.\nWhen this artifact enters, you get {E}{E}{E} (three energy counters).\n{T}: Add {C}.\n{T}, Pay {E}: Add one mana of any color.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: null, tap: true, payEnergy: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}, Pay {E}: Add one mana of any color.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "get-energy", amount: 3 },
      resolve: null,
      text: "When this artifact enters, you get {E}{E}{E} (three energy counters).",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This artifact enters tapped.",
    },
  ],
});
