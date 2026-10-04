import { defineCard } from "../define.js";

// EDHREC rank 3303.
//
// Rulings:
//   [2017-04-18] Desert is a land subtype with no special meaning. It doesn’t grant the land an
//     intrinsic mana ability. Other cards may care about which lands are Deserts.

export default defineCard({
  name: "Sunscorched Desert",
  colors: [],
  types: ["land"],
  subtypes: ["Desert"],
  text: "When this land enters, it deals 1 damage to target player or planeswalker.\n{T}: Add {C}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
  ],
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: ["player-or-planeswalker"],
      effect: { kind: "damage", amount: 1, target: 0 },
      resolve: null,
      text: "When this land enters, it deals 1 damage to target player or planeswalker.",
    },
  ],
});
