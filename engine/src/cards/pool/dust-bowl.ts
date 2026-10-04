import { defineCard } from "../define.js";

// EDHREC rank 5265.

export default defineCard({
  name: "Dust Bowl",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{3}, {T}, Sacrifice a land: Destroy target nonbasic land.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{3}", tap: true, sacrifice: { filter: { type: "land" } } },
      // Any land you control, Dust Bowl itself included.
      targets: [{ kind: "permanent", filter: { type: "land", notSupertype: "basic" } }],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{3}, {T}, Sacrifice a land: Destroy target nonbasic land.",
    },
  ],
});
