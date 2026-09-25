import { defineCard } from "../define.js";

export default defineCard({
  name: "Crystal Vein",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{T}, Sacrifice this land: Add {C}{C}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: null, tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 2 },
      resolve: null,
      text: "{T}, Sacrifice this land: Add {C}{C}.",
    },
  ],
});
