import { defineCard } from "../define.js";

export default defineCard({
  name: "Archaeological Dig",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{T}, Sacrifice this land: Add one mana of any color.",
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
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{T}, Sacrifice this land: Add one mana of any color.",
    },
  ],
});
