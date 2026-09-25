import { defineCard } from "../define.js";

export default defineCard({
  name: "Henge of Ramos",
  colors: [],
  types: ["land"],
  text: "{T}: Add {C}.\n{2}, {T}: Add one mana of any color.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "C", amount: 1 },
      resolve: null,
      text: "{T}: Add {C}.",
    },
    {
      cost: { mana: "{2}", tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "any-color", amount: 1 },
      resolve: null,
      text: "{2}, {T}: Add one mana of any color.",
    },
  ],
});
