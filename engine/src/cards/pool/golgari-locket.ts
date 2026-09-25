import { defineCard } from "../define.js";

export default defineCard({
  name: "Golgari Locket",
  manaCost: "{3}",
  colors: [],
  types: ["artifact"],
  text: "{T}: Add {B} or {G}.\n{B/G}{B/G}{B/G}{B/G}, {T}, Sacrifice this artifact: Draw two cards.",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["B", "G"] }, amount: 1 },
      resolve: null,
      text: "{T}: Add {B} or {G}.",
    },
    {
      cost: { mana: "{B/G}{B/G}{B/G}{B/G}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 2 },
      resolve: null,
      text: "{B/G}{B/G}{B/G}{B/G}, {T}, Sacrifice this artifact: Draw two cards.",
    },
  ],
});
