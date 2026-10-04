import { defineCard } from "../define.js";

// EDHREC rank 3498.
//
// Rulings:
//   [2023-11-10] The five colors are white, blue, black, red, and green. The last ability of Pit
//     of Offerings can't produce {C}.
//   [2023-11-10] If no cards are exiled with Pit of Offerings, its last ability can't add mana.

export default defineCard({
  name: "Pit of Offerings",
  colors: [],
  types: ["land"],
  subtypes: ["Cave"],
  text: "This land enters tapped.\nWhen this land enters, exile up to three target cards from graveyards.\n{T}: Add {C}.\n{T}: Add one mana of any of the exiled cards' colors.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: null, tap: true },
      targets: [],
      // Chrome Mox's shape: the colours of the cards still exiled with this
      // land (rule 607.2a). Never {C}; none exiled, no mana (the rulings).
      effect: { kind: "add-mana", mana: { colorAmong: {}, zone: "exiled-with-source" }, amount: 1 },
      resolve: null,
      text: "{T}: Add one mana of any of the exiled cards' colors.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      // Steward of the Harvest's shape: exiled together, linked to this land.
      targets: [{ kind: "any-number", of: { kind: "card-in-graveyard", whose: "any" }, max: 3 }],
      effect: {
        kind: "for-each-target",
        from: 0,
        effect: { kind: "exile", target: 0, linked: true },
        simultaneous: true,
      },
      resolve: null,
      text: "When this land enters, exile up to three target cards from graveyards.",
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
