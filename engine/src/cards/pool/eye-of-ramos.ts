import { defineCard } from "../define.js";

export default defineCard({
  name: "Eye of Ramos",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {U}.\nSacrifice this artifact: Add {U}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "{T}: Add {U}.",
    },
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "U", amount: 1 },
      resolve: null,
      text: "Sacrifice this artifact: Add {U}.",
    },
  ],
});
