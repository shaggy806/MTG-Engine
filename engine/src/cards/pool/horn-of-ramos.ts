import { defineCard } from "../define.js";

export default defineCard({
  name: "Horn of Ramos",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {G}.\nSacrifice this artifact: Add {G}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "{T}: Add {G}.",
    },
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "G", amount: 1 },
      resolve: null,
      text: "Sacrifice this artifact: Add {G}.",
    },
  ],
});
