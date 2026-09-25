import { defineCard } from "../define.js";

export default defineCard({
  name: "Heart of Ramos",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {R}.\nSacrifice this artifact: Add {R}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "{T}: Add {R}.",
    },
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "R", amount: 1 },
      resolve: null,
      text: "Sacrifice this artifact: Add {R}.",
    },
  ],
});
