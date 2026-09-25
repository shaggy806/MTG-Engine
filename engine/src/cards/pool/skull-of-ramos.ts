import { defineCard } from "../define.js";

export default defineCard({
  name: "Skull of Ramos",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {B}.\nSacrifice this artifact: Add {B}.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "{T}: Add {B}.",
    },
    {
      cost: { mana: null, tap: false, sacrifice: "self" },
      targets: [],
      effect: { kind: "add-mana", mana: "B", amount: 1 },
      resolve: null,
      text: "Sacrifice this artifact: Add {B}.",
    },
  ],
});
