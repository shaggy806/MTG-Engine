import { defineCard } from "../define.js";

// EDHREC rank 3631.

export default defineCard({
  name: "Bristling Backwoods",
  colors: [],
  types: ["land"],
  subtypes: ["Desert"],
  text: "This land enters tapped.\nWhen this land enters, it deals 1 damage to target opponent.\n{T}: Add {R} or {G}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["R", "G"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {R} or {G}.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["opponent"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "When this land enters, it deals 1 damage to target opponent.",
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      replacement: { event: "enters-battlefield", tapped: true },
      text: "This land enters tapped.",
    },
  ],
});
