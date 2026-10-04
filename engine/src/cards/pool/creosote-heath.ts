import { defineCard } from "../define.js";

// EDHREC rank 4057.
//
// Rulings:
//   [2024-04-12] Desert is a land subtype with no special meaning. It doesn’t grant the land an
//     intrinsic mana ability. Other cards may care about which lands are Deserts.

export default defineCard({
  name: "Creosote Heath",
  colors: [],
  types: ["land"],
  subtypes: ["Desert"],
  text: "This land enters tapped.\nWhen this land enters, it deals 1 damage to target opponent.\n{T}: Add {G} or {W}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["G", "W"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {G} or {W}.",
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
