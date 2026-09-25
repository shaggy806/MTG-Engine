import { defineCard } from "../define.js";

export default defineCard({
  name: "Tooth of Ramos",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {W}.\nSacrifice this artifact: Add {W}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "W", amount: 1 },
      resolve: null,
      text: "{T}: Add {W}.",
    },
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "W", amount: 1 },
      resolve: null,
      text: "Sacrifice this artifact: Add {W}.",
    },
  ],
});
