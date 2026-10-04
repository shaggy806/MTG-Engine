import { defineCard } from "../define.js";

// EDHREC rank 4319.
//
// Rulings:
//   [2011-06-01] Any triggered abilities that trigger because a creature was destroyed won't be
//     put onto the stack until after Phyrexian Rebirth finishes resolving. This means the Horror
//     creature token can be targeted by those abilities, if applicable.
//   [2013-07-01] If a creature regenerates or has indestructible, it won't be counted when
//     determining the value of X.

export default defineCard({
  name: "Phyrexian Rebirth",
  manaCost: "{4}{W}{W}",
  colors: ["W"],
  types: ["sorcery"],
  text: "Destroy all creatures, then create an X/X colorless Phyrexian Horror artifact creature token, where X is the number of creatures destroyed this way.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy-all", filter: { type: "creature" } },
      {
        kind: "create-token",
        token: "Phyrexian Horror Token (Phyrexian Rebirth)",
        count: 1,
        basePt: { power: { thisWay: "destroyed" }, toughness: { thisWay: "destroyed" } },
      },
    ],
  },
});
