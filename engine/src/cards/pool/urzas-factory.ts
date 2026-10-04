import { defineCard } from "../define.js";
import { addManaAbility } from "../helpers.js";

// EDHREC rank 4464.
// Makes Assembly-Worker → new token "Assembly-Worker Token".
//
// Rulings:
//   [2021-03-19] Urza's is a land subtype that has no inherent rules meaning. Other effects may
//     refer to it.

export default defineCard({
  name: "Urza's Factory",
  colors: [],
  types: ["land"],
  subtypes: ["Urza's"],
  text: "{T}: Add {C}.\n{7}, {T}: Create a 2/2 colorless Assembly-Worker artifact creature token.",
  activated: [
    addManaAbility({ mana: "C", text: "{T}: Add {C}." }),
    {
      cost: { mana: "{7}", tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Assembly-Worker Token", count: 1 },
      resolve: null,
      text: "{7}, {T}: Create a 2/2 colorless Assembly-Worker artifact creature token.",
    },
  ],
});
