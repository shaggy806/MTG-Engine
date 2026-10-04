import { defineCard } from "../define.js";

// EDHREC rank 5697.

export default defineCard({
  name: "Mirror of Galadriel",
  manaCost: "{2}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  text: "{5}, {T}: Scry 1, then draw a card. This ability costs {1} less to activate for each legendary creature you control.",
  activated: [
    {
      cost: { mana: "{5}", tap: true },
      targets: [],
      effect: { kind: "scry", amount: 1, then: { kind: "draw", amount: 1 } },
      resolve: null,
      // Eiganjo, Seat of the Empire's reduction.
      costReduction: {
        reduceGeneric: { countOf: { type: "creature", supertype: "legendary", controlledBy: "you" } },
      },
      text: "{5}, {T}: Scry 1, then draw a card. This ability costs {1} less to activate for each legendary creature you control.",
    },
  ],
});
