import { defineCard } from "../define.js";

export default defineCard({
  name: "Golgari Cluestone",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {B} or {G}.\n{B}{G}, {T}, Sacrifice this artifact: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["B", "G"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {B} or {G}.",
    },
    {
      cost: { mana: "{B}{G}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{B}{G}, {T}, Sacrifice this artifact: Draw a card.",
    },
  ],
});
