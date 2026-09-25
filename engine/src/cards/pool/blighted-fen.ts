import { defineCard } from "../define.js";

export default defineCard({
  name: "Blighted Fen",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{4}{B}, {T}, Sacrifice this land: Target opponent sacrifices a creature of their choice.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{4}{B}", tap: true, sacrifice: "self" },
      targets: ["opponent"],
      effect: { kind: "sacrifice", who: "target", filter: { type: "creature" }, count: 1 },
      resolve: null,
      text: "{4}{B}, {T}, Sacrifice this land: Target opponent sacrifices a creature of their choice.",
    },
  ],
});
